import { useState, useEffect } from 'react';
import type {
  EventRecord,
  Member,
  Expense,
  Currency,
  Language,
} from './types';
import { CURRENCIES } from './types';
import { TRANSLATIONS } from './i18n';
import {
  loadAllEvents,
  saveAllEvents,
  getCurrentEventId,
  saveCurrentEventId,
  getSavedLanguage,
  saveLanguage,
} from './utils/storage';
import { MembersTab } from './components/MembersTab';
import { ExpensesTab } from './components/ExpensesTab';
import { SettlementTab } from './components/SettlementTab';
import { HistoryTab } from './components/HistoryTab';
import {
  Users,
  Receipt,
  Scale,
  History as HistoryIcon,
  Globe,
  Coins,
} from 'lucide-react';

export function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = getSavedLanguage();
    if (saved && saved in TRANSLATIONS) return saved as Language;
    return 'zh-HK';
  });

  const [events, setEvents] = useState<EventRecord[]>(() => {
    const saved = loadAllEvents();
    if (saved.length > 0) return saved;

    const defaultEv: EventRecord = {
      id: 'default-1',
      title: '週末聚會',
      createdAt: Date.now(),
      currency: 'HKD',
      members: [
        { id: 'm1', name: 'Kevin' },
        { id: 'm2', name: 'David' },
        { id: 'm3', name: 'Mary' },
      ],
      expenses: [],
    };
    return [defaultEv];
  });

  const [currentEventId, setCurrentEventId] = useState<string>(() => {
    const savedId = getCurrentEventId();
    return savedId || 'default-1';
  });

  const [activeTab, setActiveTab] = useState<
    'members' | 'expenses' | 'settlement' | 'history'
  >('members');

  useEffect(() => {
    saveAllEvents(events);
  }, [events]);

  useEffect(() => {
    saveCurrentEventId(currentEventId);
  }, [currentEventId]);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    saveLanguage(newLang);
  };

  const t = (key: string, params?: Record<string, any>) => {
    let str = TRANSLATIONS[lang]?.[key] || TRANSLATIONS['zh-HK']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  };

  const currentEvent =
    events.find((e) => e.id === currentEventId) || events[0] || {
      id: 'default-empty',
      title: '新聚會',
      createdAt: Date.now(),
      currency: 'HKD' as Currency,
      members: [],
      expenses: [],
    };

  const updateCurrentEvent = (updater: (prev: EventRecord) => EventRecord) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => (ev.id === currentEvent.id ? updater(ev) : ev))
    );
  };

  const handleCurrencyChange = (newCur: Currency) => {
    updateCurrentEvent((prev) => ({ ...prev, currency: newCur }));
  };

  const handleAddMember = (name: string) => {
    const newMember: Member = {
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      name,
    };
    updateCurrentEvent((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
  };

  const handleRemoveMember = (id: string) => {
    updateCurrentEvent((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
      expenses: prev.expenses
        .map((exp) => ({
          ...exp,
          payers: exp.payers.filter((p) => p.memberId !== id),
          participantIds: exp.participantIds.filter((pId) => pId !== id),
        }))
        .filter((exp) => exp.payers.length > 0 && exp.participantIds.length > 0),
    }));
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expenseData,
      id: 'e_' + Math.random().toString(36).substring(2, 9),
    };
    updateCurrentEvent((prev) => ({
      ...prev,
      expenses: [newExp, ...prev.expenses],
    }));
  };

  const handleEditExpense = (updated: Expense) => {
    updateCurrentEvent((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === updated.id ? updated : e)),
    }));
  };

  const handleDeleteExpense = (id: string) => {
    updateCurrentEvent((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const handleCreateEvent = (
    title: string,
    currency: Currency,
    copyMembersFromLast: boolean
  ) => {
    const newId = 'ev_' + Math.random().toString(36).substring(2, 9);
    const membersToCopy =
      copyMembersFromLast && currentEvent ? currentEvent.members : [];

    const newEv: EventRecord = {
      id: newId,
      title,
      createdAt: Date.now(),
      currency,
      members: membersToCopy.map((m) => ({ ...m })),
      expenses: [],
    };

    setEvents((prev) => [newEv, ...prev]);
    setCurrentEventId(newId);
    setActiveTab('members');
  };

  const handleDeleteEvent = (id: string) => {
    const remaining = events.filter((e) => e.id !== id);
    if (remaining.length > 0) {
      setEvents(remaining);
      if (currentEventId === id) {
        setCurrentEventId(remaining[0].id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl overflow-hidden">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                {t('appName')}
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {currentEvent?.title || t('appTagline')}
            </p>
          </div>

          {/* Quick Selectors: Currency & Language */}
          <div className="flex items-center gap-1.5">
            {/* Currency Selector */}
            <div className="relative">
              <select
                value={currentEvent?.currency || 'HKD'}
                onChange={(e) =>
                  handleCurrencyChange(e.target.value as Currency)
                }
                className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold pl-2.5 pr-6 py-1.5 rounded-xl cursor-pointer focus:outline-none transition-all"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
              <Coins className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Language Selector */}
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold pl-2.5 pr-6 py-1.5 rounded-xl cursor-pointer focus:outline-none transition-all"
              >
                <option value="zh-HK">繁中 (HK)</option>
                <option value="zh-TW">繁中 (TW)</option>
                <option value="zh-CN">简体 (CN)</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
              <Globe className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-4 pb-28 overflow-y-auto">
        {activeTab === 'members' && (
          <MembersTab
            members={currentEvent?.members || []}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onNext={() => setActiveTab('expenses')}
            t={t}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            members={currentEvent?.members || []}
            expenses={currentEvent?.expenses || []}
            currency={currentEvent?.currency || 'HKD'}
            onAddExpense={handleAddExpense}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            t={t}
          />
        )}

        {activeTab === 'settlement' && (
          <SettlementTab
            eventName={currentEvent?.title || '聚會'}
            members={currentEvent?.members || []}
            expenses={currentEvent?.expenses || []}
            currency={currentEvent?.currency || 'HKD'}
            t={t}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            events={events}
            currentEventId={currentEventId}
            onSelectEvent={(id) => {
              setCurrentEventId(id);
              setActiveTab('expenses');
            }}
            onCreateEvent={handleCreateEvent}
            onDeleteEvent={handleDeleteEvent}
            t={t}
          />
        )}
      </main>

      {/* Modern iOS Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-100 px-3 py-2 z-40 shadow-lg">
        <div className="grid grid-cols-4 gap-1 text-center">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
              activeTab === 'members'
                ? 'text-indigo-600 font-bold bg-indigo-50/70'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">{t('tabMembers')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
              activeTab === 'expenses'
                ? 'text-indigo-600 font-bold bg-indigo-50/70'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">{t('tabExpenses')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settlement')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all relative ${
              activeTab === 'settlement'
                ? 'text-indigo-600 font-bold bg-indigo-50/70'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <Scale className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">{t('tabSettlement')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
              activeTab === 'history'
                ? 'text-indigo-600 font-bold bg-indigo-50/70'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <HistoryIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">{t('tabHistory')}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
export default App;
