export type SupportTicketCategory =
  | 'safevision'
  | 'ecopredict'
  | 'failpredict'
  | 'hardware'
  | 'integration'
  | 'general';

export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved';

export interface TicketReply {
  id: string;
  senderEmail: string;
  senderName: string;
  isFounder: boolean;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  factoryName: string;
  phone?: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  replies?: TicketReply[];
}
