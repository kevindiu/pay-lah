import React, { useState } from 'react';
import type { Member, Expense, Currency } from '../types';
import {
  calculateSettlements,
  calculateBalances,
  formatCurrency,
} from '../utils/settlement';
import {
  ArrowRight,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SettlementTabProps {
  eventName: string;
  members: Member[];
  expenses: Expense[];
  currency: Currency;
  t: (key: string, params?: Record<string, any>) => string;
}

export const SettlementTab: React.FC<SettlementTabProps> = ({
  eventName,
  members,
  expenses,
  currency,
  t,
}) => {
  const [copied, setCopied] = useState(false);
  const [showBalances, setShowBalances] = useState(false);
  const [settledMap, setSettledMap] = useState<Record<string, boolean>>({});

  const transfers = calculateSettlements(members, expenses, currency);
  const balances = calculateBalances(members, expenses);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const toggleSettled = (key: string) => {
    const next = !settledMap[key];
    setSettledMap((prev) => ({ ...prev, [key]: next }));
    if (next) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  const generateShareText = () => {
    const lines: string[] = [];
    lines.push(t('shareHeader', { eventName }));
    lines.push(t('shareTotalSpent', { amount: formatCurrency(totalSpent, currency) }));
    lines.push('');
    lines.push(t('shareTransfersTitle'));

    if (transfers.length === 0) {
      lines.push(t('noSettlementNeeded'));
    } else {
      transfers.forEach((tr) => {
        lines.push(
          t('shareTransferItem', {
            from: tr.fromName,
            to: tr.toName,
            amount: formatCurrency(tr.amount, currency),
          })
        );
      });
    }

    lines.push('');
    lines.push(t('shareFooter'));
    return lines.join('\n');
  };

  const handleCopyText = async () => {
    const text = generateShareText();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShare = async () => {
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${eventName} - 比錢啦！找數清單`,
          text: text,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Share */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-teal-100/50 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-100">
              <Sparkles className="w-4 h-4" />
              <span>{t('settlementTitle')}</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              {transfers.length === 0 ? t('noSettlementNeeded') : `${transfers.length} 筆最簡轉帳`}
            </h2>
          </div>
          <span className="text-xs bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full font-medium">
            {formatCurrency(totalSpent, currency)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyText}
            className="py-2.5 px-3 bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{t('copiedAlert')}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t('copyTransferText')}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="py-2.5 px-3 bg-teal-700/80 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span>{t('shareBill')}</span>
          </button>
        </div>
      </div>

      {/* Transfers Flow Cards */}
      <div className="space-y-2.5">
        {transfers.map((tr, idx) => {
          const itemKey = `${tr.fromId}-${tr.toId}-${tr.amount}-${idx}`;
          const isSettled = !!settledMap[itemKey];

          return (
            <div
              key={itemKey}
              onClick={() => toggleSettled(itemKey)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between shadow-2xs ${
                isSettled
                  ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`px-3 py-1.5 rounded-xl font-bold text-sm truncate max-w-[100px] ${
                      isSettled
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 line-through'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50'
                    }`}
                  >
                    {tr.fromName}
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />

                  <div
                    className={`px-3 py-1.5 rounded-xl font-bold text-sm truncate max-w-[100px] ${
                      isSettled
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 line-through'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50'
                    }`}
                  >
                    {tr.toName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-lg font-black tracking-tight ${
                    isSettled ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {formatCurrency(tr.amount, currency)}
                </span>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isSettled
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-slate-200 dark:border-slate-700 text-transparent hover:border-slate-300'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accordion: Individual Balances Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowBalances(!showBalances)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <span>{t('netBalanceTitle')}</span>
          {showBalances ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showBalances && (
          <div className="p-4 pt-1 space-y-2 border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800">
            {balances.map((b) => (
              <div key={b.memberId} className="pt-2 flex items-center justify-between text-sm">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{b.memberName}</span>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    {t('paidTotal')}: {formatCurrency(b.totalPaid, currency)} | {t('owedTotal')}:{' '}
                    {formatCurrency(b.totalOwed, currency)}
                  </div>
                </div>
                <div
                  className={`font-bold text-sm ${
                    b.netBalance > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : b.netBalance < 0
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {b.netBalance > 0
                    ? `+${formatCurrency(b.netBalance, currency)}`
                    : b.netBalance < 0
                    ? `-${formatCurrency(-b.netBalance, currency)}`
                    : `$0`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
