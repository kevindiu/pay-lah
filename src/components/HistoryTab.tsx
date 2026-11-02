import React, { useState } from 'react';
import type { EventRecord, Currency } from '../types';
import { CURRENCIES } from '../types';
import { Plus, Users, Receipt, Trash2, History as HistoryIcon, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/settlement';

interface HistoryTabProps {
  events: EventRecord[];
  currentEventId: string;
  onSelectEvent: (id: string) => void;
  onCreateEvent: (title: string, currency: Currency, copyMembersFromLast: boolean) => void;
  onDeleteEvent: (id: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  events,
  currentEventId,
  onSelectEvent,
  onCreateEvent,
  onDeleteEvent,
  t,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCurrency, setNewCurrency] = useState<Currency>('HKD');
  const [reuseMembers, setReuseMembers] = useState(true);

  const currentEvent = events.find((e) => e.id === currentEventId);
  const lastEvent = events[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateEvent(newTitle.trim(), newCurrency, reuseMembers);
    setNewTitle('');
    setIsModalOpen(false);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
      .getDate()
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Create New Event Banner Button */}
      <button
        type="button"
        onClick={() => {
          setNewTitle('');
          setNewCurrency(currentEvent?.currency || 'HKD');
          setIsModalOpen(true);
        }}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-md shadow-indigo-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>{t('newEventBtn')}</span>
      </button>

      {/* History Header */}
      <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span>{t('historyTitle')} ({events.length})</span>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            {t('noHistory')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((ev) => {
            const isCurrent = ev.id === currentEventId;
            const total = ev.expenses.reduce((s, x) => s + x.amount, 0);

            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
                  isCurrent
                    ? 'bg-indigo-50/70 border-indigo-200'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base truncate">
                      {ev.title}
                    </span>
                    {isCurrent && (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {t('currentEvent')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(ev.createdAt)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {ev.members.length} 人
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5" />
                      {ev.expenses.length} 筆
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base font-bold text-slate-800">
                    {formatCurrency(total, ev.currency)}
                  </span>

                  {events.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(t('deleteEventConfirm'))) {
                          onDeleteEvent(ev.id);
                        }
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {t('newEventModalTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                {t('cancel')}
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('eventNamePlaceholder')}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例：銅鑼灣打邊爐 / 東京之旅"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('currencySelect')}
                </label>
                <select
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value as Currency)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} - {c.name['zh-HK'] || c.code}
                    </option>
                  ))}
                </select>
              </div>

              {lastEvent && lastEvent.members.length > 0 && (
                <div className="pt-1">
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reuseMembers}
                      onChange={(e) => setReuseMembers(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-indigo-950">
                      {t('reuseLastMembers', { n: lastEvent.members.length })}
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-200 active:scale-[0.99] transition-all"
                >
                  {t('createEvent')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
