import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { SupportTicket, TicketReply, SupportTicketStatus } from '../types/support';

const LOCAL_STORAGE_TICKETS_KEY = 'neurofactory_support_tickets';

// Founder emails who receive and manage tickets
export const FOUNDER_EMAILS = [
  'muhtaraliboc@gmail.com',
  'bochaevmuhtarali@mail.ru',
  'bochaevmuhtarali@gmail.com',
];

export function isFounderEmail(email?: string | null): boolean {
  if (!email) return false;
  return FOUNDER_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Retrieve local tickets cache
 */
export function getLocalTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local support tickets:', e);
    return [];
  }
}

/**
 * Save tickets to localStorage cache
 */
export function saveLocalTickets(tickets: SupportTicket[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.warn('Failed to save support tickets to localStorage:', e);
  }
}

/**
 * Submit a new technical support ticket
 */
export async function submitSupportTicket(
  ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'replies'>
): Promise<SupportTicket> {
  const ticketId = 'ticket-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const newTicket: SupportTicket = {
    ...ticketData,
    id: ticketId,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    replies: [],
  };

  // 1. Immediately persist locally
  const current = getLocalTickets();
  const updated = [newTicket, ...current.filter((t) => t.id !== ticketId)];
  saveLocalTickets(updated);

  // 2. Persist to Firestore if available
  if (db) {
    try {
      const ticketRef = doc(db, 'support_tickets', ticketId);
      await setDoc(ticketRef, newTicket);
    } catch (error) {
      console.warn('Firestore support ticket write deferred or fallback to local:', error);
      try {
        handleFirestoreError(error, OperationType.CREATE, `support_tickets/${ticketId}`, auth);
      } catch {
        // Handled and logged
      }
    }
  }

  return newTicket;
}

/**
 * Fetch all tickets (for Founder/Admin) or user's tickets
 */
export async function fetchTickets(
  userEmail?: string | null,
  userId?: string | null,
  isAdmin: boolean = false
): Promise<SupportTicket[]> {
  const localTickets = getLocalTickets();
  let firestoreTickets: SupportTicket[] = [];

  const currentAuthUser = auth?.currentUser;

  // IMPORTANT: Firestore rules require isSignedIn() for listing tickets.
  // If the user is unauthenticated, return local storage tickets without making an unauthorized network call.
  if (!db || !currentAuthUser) {
    const isFounder = isAdmin || isFounderEmail(userEmail);
    if (!isFounder) {
      return localTickets.filter(
        (t) =>
          (userId && t.userId === userId) ||
          (userEmail && t.userEmail?.toLowerCase() === userEmail?.toLowerCase())
      );
    }
    return localTickets;
  }

  const isFounder =
    isAdmin ||
    isFounderEmail(userEmail) ||
    isFounderEmail(currentAuthUser.email);

  try {
    const ticketsCollection = collection(db, 'support_tickets');
    let q;

    if (isFounder) {
      q = query(ticketsCollection, orderBy('createdAt', 'desc'));
    } else {
      const queryUid = userId || currentAuthUser.uid;
      q = query(ticketsCollection, where('userId', '==', queryUid));
    }

    if (q) {
      const snap = await getDocs(q);
      firestoreTickets = snap.docs.map((d) => d.data() as SupportTicket);
    }
  } catch (error) {
    console.warn('Firestore fetch tickets fallback to local:', error);
    try {
      handleFirestoreError(error, OperationType.LIST, 'support_tickets', auth);
    } catch {
      // logged
    }
  }

  // Merge Firestore tickets with local tickets (avoiding duplicates, prioritizing newest)
  const map = new Map<string, SupportTicket>();
  firestoreTickets.forEach((t) => map.set(t.id, t));
  localTickets.forEach((t) => {
    if (!map.has(t.id) || new Date(t.updatedAt) > new Date(map.get(t.id)!.updatedAt)) {
      map.set(t.id, t);
    }
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Filter if not founder
  if (!isFounder) {
    return merged.filter(
      (t) =>
        (userId && t.userId === userId) ||
        (userEmail && t.userEmail?.toLowerCase() === userEmail?.toLowerCase())
    );
  }

  return merged;
}

/**
 * Add a reply to a ticket (Founder responding to user, or user responding)
 */
export async function addTicketReply(
  ticketId: string,
  replyText: string,
  senderEmail: string,
  senderName: string,
  isFounder: boolean,
  newStatus?: SupportTicketStatus
): Promise<SupportTicket | null> {
  const now = new Date().toISOString();
  const reply: TicketReply = {
    id: 'reply-' + Date.now(),
    senderEmail,
    senderName,
    isFounder,
    message: replyText,
    createdAt: now,
  };

  // 1. Update local cache
  const localList = getLocalTickets();
  let target = localList.find((t) => t.id === ticketId);
  if (!target) {
    // If not found in local, create placeholder from firestore or memory
    target = {
      id: ticketId,
      userId: '',
      userEmail: senderEmail,
      userName: senderName,
      factoryName: 'Предприятие РК',
      category: 'general',
      priority: 'normal',
      subject: 'Заявка #' + ticketId.slice(-6),
      message: '',
      status: newStatus || 'in_progress',
      createdAt: now,
      updatedAt: now,
      replies: [reply],
    };
  } else {
    target.replies = [...(target.replies || []), reply];
    target.updatedAt = now;
    if (newStatus) {
      target.status = newStatus;
    } else if (isFounder && target.status === 'open') {
      target.status = 'in_progress';
    }
  }

  const updatedLocal = localList.map((t) => (t.id === ticketId ? target! : t));
  if (!localList.some((t) => t.id === ticketId)) {
    updatedLocal.unshift(target);
  }
  saveLocalTickets(updatedLocal);

  // 2. Update Firestore
  if (db) {
    try {
      const ticketRef = doc(db, 'support_tickets', ticketId);
      await updateDoc(ticketRef, {
        replies: target.replies,
        updatedAt: now,
        status: target.status,
      });
    } catch (error) {
      console.warn('Firestore addTicketReply fallback to local update:', error);
      try {
        handleFirestoreError(error, OperationType.UPDATE, `support_tickets/${ticketId}`);
      } catch {
        // logged
      }
    }
  }

  return target;
}

/**
 * Update ticket status (e.g. Founder marks as resolved or in_progress)
 */
export async function updateTicketStatus(
  ticketId: string,
  status: SupportTicketStatus
): Promise<void> {
  const now = new Date().toISOString();

  // Update local
  const localList = getLocalTickets();
  const updated = localList.map((t) =>
    t.id === ticketId ? { ...t, status, updatedAt: now } : t
  );
  saveLocalTickets(updated);

  // Update Firestore
  if (db) {
    try {
      const ticketRef = doc(db, 'support_tickets', ticketId);
      await updateDoc(ticketRef, {
        status,
        updatedAt: now,
      });
    } catch (error) {
      console.warn('Firestore updateTicketStatus fallback:', error);
    }
  }
}
