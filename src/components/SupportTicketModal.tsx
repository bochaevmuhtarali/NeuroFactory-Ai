import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import {
  SupportTicket,
  SupportTicketCategory,
  SupportTicketPriority,
} from '../types/support';
import {
  submitSupportTicket,
  fetchTickets,
  addTicketReply,
} from '../services/supportService';
import { CompanyLogo } from './CompanyLogo';
import {
  X,
  LifeBuoy,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Clock,
  ShieldAlert,
  Loader2,
  Building,
  User,
  Mail,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  defaultCategory?: SupportTicketCategory;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  onClose,
  language,
  defaultCategory = 'general',
}) => {
  const { currentUser, profile, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Form states
  const [category, setCategory] = useState<SupportTicketCategory>(defaultCategory);
  const [priority, setPriority] = useState<SupportTicketPriority>('normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [phone, setPhone] = useState('');

  // Submit feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User tickets list
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Reply form in ticket view
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Initialize form with logged in user data
  useEffect(() => {
    if (currentUser) {
      setUserEmail(currentUser.email || '');
      setUserName(profile?.contactPerson || currentUser.displayName || 'Инженер предприятия');
      setFactoryName(profile?.factoryName || 'Промышленное предприятие РК');
      setPhone(profile?.contactPhone || '');
    } else {
      setUserEmail('');
      setUserName('');
      setFactoryName('');
      setPhone('');
    }
  }, [currentUser, profile, isOpen]);

  // Load user tickets when switching to history tab
  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadTickets();
    }
  }, [isOpen, activeTab, currentUser]);

  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const tickets = await fetchTickets(
        currentUser?.email || userEmail,
        currentUser?.uid,
        isAdmin
      );
      setUserTickets(tickets);
    } catch (e) {
      console.warn('Error fetching tickets:', e);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !userEmail.trim()) {
      setErrorMsg(
        language === 'kz'
          ? 'Тақырып, хабарлама және email өрістерін толтырыңыз'
          : 'Пожалуйста, заполните тему, описание проблемы и email для связи'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await submitSupportTicket({
        userId: currentUser?.uid || 'guest-' + Date.now(),
        userEmail: userEmail.trim(),
        userName: userName.trim() || 'Инженер предприятия',
        factoryName: factoryName.trim() || 'Промышленный объект',
        phone: phone.trim() || undefined,
        category,
        priority,
        subject: subject.trim(),
        message: message.trim(),
      });

      setSuccessTicketId(created.id);
      setSubject('');
      setMessage('');
      // Reload tickets
      loadTickets();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ошибка отправки заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendUserReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const updated = await addTicketReply(
        selectedTicket.id,
        replyMessage.trim(),
        userEmail || currentUser?.email || 'user@neurofactory.ai',
        userName || 'Инженер',
        false
      );
      if (updated) {
        setSelectedTicket(updated);
        setUserTickets((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
      }
      setReplyMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const categories = [
    { id: 'safevision', label: 'SafeVision (Камеры и СИЗ)', icon: '🛡️' },
    { id: 'ecopredict', label: 'EcoPredict (Газоанализ и ПДК)', icon: '🍃' },
    { id: 'failpredict', label: 'FailPredict (Вибродиагностика)', icon: '⚡' },
    { id: 'hardware', label: 'Edge-шлюзы и датчики (RTSP/Modbus)', icon: '🔌' },
    { id: 'integration', label: 'Интеграция с АСУ ТП / SCADA / 1С', icon: '🔗' },
    { id: 'general', label: 'Общий вопрос / Консультация', icon: '💬' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <CompanyLogo size="sm" withText={false} glow={true} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  {language === 'kz' ? 'Техникалық қолдау орталығы' : 'Техническая поддержка'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  NeuroFactory AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'kz'
                  ? 'Өтініштер тікелей жоба негізін қалаушының профиліне жіберіледі'
                  : 'Заявки поступают напрямую в профиль основателя платформы (Бочаев Мухтарали)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-5">
          <button
            onClick={() => {
              setActiveTab('create');
              setSelectedTicket(null);
            }}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'create' && !selectedTicket
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LifeBuoy className="h-4 w-4" />
            <span>{language === 'kz' ? 'Жаңа өтініш жіберу' : 'Подать заявку'}</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history' || selectedTicket
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{language === 'kz' ? 'Менің өтініштерім' : 'Мои заявки'}</span>
            {userTickets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                {userTickets.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {/* Detail View of a Selected Ticket */}
          {selectedTicket ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{language === 'kz' ? 'Тізімге оралу' : 'Назад к списку заявок'}</span>
              </button>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-mono text-cyan-400">
                      ID: {selectedTicket.id}
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      {selectedTicket.subject}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                        selectedTicket.status === 'resolved'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                          : selectedTicket.status === 'in_progress'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                          : 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
                      }`}
                    >
                      {selectedTicket.status === 'resolved'
                        ? 'Решено'
                        : selectedTicket.status === 'in_progress'
                        ? 'В работе'
                        : 'Открыта заявка'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.message}
                </div>

                <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span>{new Date(selectedTicket.createdAt).toLocaleString('ru-RU')}</span>
                  <span>{selectedTicket.factoryName}</span>
                </div>
              </div>

              {/* Replies Thread */}
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Переписка и ответы</span>
                </h5>

                {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    {language === 'kz'
                      ? 'Основатель жауап берген кезде хабарлама осында пайда болады'
                      : 'Основатель платформы получил заявку. Как только он ответит, сообщение появится здесь.'}
                  </div>
                ) : (
                  selectedTicket.replies.map((rep) => (
                    <div
                      key={rep.id}
                      className={`p-3.5 rounded-xl border ${
                        rep.isFounder
                          ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 border-cyan-500/40 ml-4'
                          : 'bg-slate-950/80 border-slate-800 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {rep.senderName}
                          </span>
                          {rep.isFounder && (
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5" />
                              Основатель проекта
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(rep.createdAt).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {rep.message}
                      </div>
                    </div>
                  ))
                )}

                {/* Reply box */}
                <form onSubmit={handleSendUserReply} className="mt-3 space-y-2">
                  <textarea
                    rows={2}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Написать дополнение к заявке..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSendingReply || !replyMessage.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-sm"
                    >
                      {isSendingReply ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>Отправить</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            /* My Tickets List */
            <div className="space-y-3">
              {isLoadingTickets ? (
                <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                  <span className="text-xs">Загрузка ваших заявок...</span>
                </div>
              ) : userTickets.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                    <LifeBuoy className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-300">
                    У вас пока нет активных заявок
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Если возникли сложности с подключением камер, газоанализаторов или расчетом ресурса, создайте обращение.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
                  >
                    Создать обращение
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {userTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-cyan-500/40 hover:bg-slate-950 cursor-pointer transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-cyan-400">
                            {t.id.slice(-8)}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-full border ${
                              t.status === 'resolved'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                : t.status === 'in_progress'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                                : 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
                            }`}
                          >
                            {t.status === 'resolved'
                              ? 'Решено'
                              : t.status === 'in_progress'
                              ? 'В работе'
                              : 'Открыта заявка'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">
                          {t.subject}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {t.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {t.replies && t.replies.length > 0 && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {t.replies.length} ответ(а)
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : successTicketId ? (
            /* Success confirmation */
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white font-display">
                  {language === 'kz' ? 'Өтініш сәтті қабылданды!' : 'Заявка успешно зарегистрирована!'}
                </h4>
                <p className="text-xs text-cyan-400 font-mono">
                  Номер обращения: {successTicketId}
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto pt-2">
                  {language === 'kz'
                    ? 'Жоба негізін қалаушы Бочаев Мухтарали өтінішті жеке кабинетінен қарап, жедел көмек көрсетеді.'
                    : 'Основатель проекта (Бочаев Мухтарали) получил уведомление на свой профиль. Ответ поступит в этот раздел и на вашу почту.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setSuccessTicketId(null);
                    setActiveTab('history');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Посмотреть мои заявки
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          ) : (
            /* Create Ticket Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl border border-red-500/40 bg-red-950/20 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Founder Notice Banner */}
              <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <User className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-cyan-200">
                    Прямой канал связи с основателем платформы
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Бочаев Мухтарали (ведущий архитектор NeuroFactory AI) лично курирует внедрение, подключение цехов и решение инцидентов.
                  </div>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Категория вопроса / модуля
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id as SupportTicketCategory)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 ${
                        category === c.id
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base">{c.icon}</span>
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Тема обращения *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Например: Не удается подключить RTSP поток цеха №2"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Приоритет инцидента
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'low', label: 'Низкий', color: 'text-slate-300' },
                    { id: 'normal', label: 'Обычный', color: 'text-cyan-300' },
                    { id: 'high', label: 'Высокий', color: 'text-amber-300' },
                    { id: 'urgent', label: 'Срочный', color: 'text-red-300' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id as SupportTicketPriority)}
                      className={`p-2 rounded-lg border text-center text-xs font-medium transition-all ${
                        priority === p.id
                          ? 'border-cyan-400 bg-cyan-950/60 font-bold ' + p.color
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Information (email, name, factory) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">
                    Ваш Email для связи *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="engineer@plant.kz"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">
                    Название предприятия
                  </label>
                  <div className="relative">
                    <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={factoryName}
                      onChange={(e) => setFactoryName(e.target.value)}
                      placeholder="АО «КазМеталлПром»"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Message Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Подробное описание проблемы или вопроса *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Опишите технический вопрос, сбои детектирования, параметры Modbus или требуемую помощь интегратора..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-lg shadow-cyan-600/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Отправить основателю проекта</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
