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
import { APP_VERSION } from './version';
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
  Sun,
  Moon,
} from 'lucide-react';

export function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('paylah_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('paylah_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('paylah_theme', 'light');
      }
    } catch (e) {}
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

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

  const [hasUpdate, setHasUpdate] = useState<boolean>(false);

  // Check for app updates with throttle (at most once every 30 minutes)
  useEffect(() => {
    const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
    const lastCheckStr = localStorage.getItem('paylah_last_update_check');
    const now = Date.now();

    if (lastCheckStr && now - parseInt(lastCheckStr, 10) < CHECK_INTERVAL_MS) {
      return;
    }

    localStorage.setItem('paylah_last_update_check', now.toString());

    fetch(`./version.json?t=${now}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch version');
        return res.json();
      })
      .then((data) => {
        if (data && data.version && data.version !== APP_VERSION) {
          setHasUpdate(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdateApp = () => {
    localStorage.removeItem('paylah_last_update_check');
    window.location.reload();
  };

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
    } else {
      // If deleted the very last event, create a fresh empty one
      const emptyEv: EventRecord = {
        id: 'ev_' + Math.random().toString(36).substring(2, 9),
        title: '新聚會',
        createdAt: Date.now(),
        currency: 'HKD',
        members: [],
        expenses: [],
      };
      setEvents([emptyEv]);
      setCurrentEventId(emptyEv.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl overflow-hidden transition-colors">
      {/* Top App Header */}
      {hasUpdate && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between z-50 sticky top-0 shadow-md">
          <span>🎉 發現新版本！立即更新以體驗最新功能</span>
          <button
            type="button"
            onClick={handleUpdateApp}
            className="bg-white text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold active:scale-95 transition-all shadow-xs"
          >
            立即更新
          </button>
        </div>
      )}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                {t('appName')}
              </span>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded-md">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
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
                className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold pl-2.5 pr-6 py-1.5 rounded-xl cursor-pointer focus:outline-none transition-all"
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
                className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold pl-2.5 pr-6 py-1.5 rounded-xl cursor-pointer focus:outline-none transition-all"
              >
                <option value="zh-HK">繁中 (HK)</option>
                <option value="zh-TW">繁中 (TW)</option>
                <option value="zh-CN">简体 (CN)</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
              <Globe className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title="切換深色模式"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            </button>
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
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 px-3 py-2 z-40 shadow-lg">
        <div className="grid grid-cols-4 gap-1 text-center">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
              activeTab === 'members'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600 dark:hover:text-slate-300'
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
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600 dark:hover:text-slate-300'
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
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600 dark:hover:text-slate-300'
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
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600 dark:hover:text-slate-300'
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
