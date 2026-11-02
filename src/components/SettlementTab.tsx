import React, { useState } from 'react';
import type { EventRecord } from '../types';
import {
  calculateSettlements,
  calculateBalances,
  formatCurrency,
} from '../utils/settlement';
import { encodeEventToUrlHash } from '../utils/urlSharing';
import {
  ArrowRight,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SettlementTabProps {
  currentEvent: EventRecord;
  t: (key: string, params?: Record<string, any>) => string;
}

export const SettlementTab: React.FC<SettlementTabProps> = ({
  currentEvent,
  t,
}) => {
  const { title: eventName, members, expenses, currency } = currentEvent;
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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
    const shareUrl = encodeEventToUrlHash(currentEvent);
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
    lines.push(`🔗 開入 App 查閱完整帳目明細：`);
    lines.push(shareUrl);
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
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyText}
            className="py-2.5 px-2 bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>已複製</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>複製清單</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={async () => {
              const url = encodeEventToUrlHash(currentEvent);
              try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(url);
                }
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              } catch (e) {}
            }}
            className="py-2.5 px-2 bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>已複製</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>複製連結</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="py-2.5 px-2 bg-teal-700/80 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>分享</span>
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
                  ? 'bg-slate-50/70 border-slate-200 opacity-60'
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`px-3 py-1.5 rounded-xl font-bold text-sm truncate max-w-[100px] ${
                      isSettled
                        ? 'bg-slate-200 text-slate-500 line-through'
                        : 'bg-rose-50 text-rose-600 border border-rose-200/50'
                    }`}
                  >
                    {tr.fromName}
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

                  <div
                    className={`px-3 py-1.5 rounded-xl font-bold text-sm truncate max-w-[100px] ${
                      isSettled
                        ? 'bg-slate-200 text-slate-500 line-through'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
                    }`}
                  >
                    {tr.toName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-lg font-black tracking-tight ${
                    isSettled ? 'text-slate-400 line-through' : 'text-slate-900'
                  }`}
                >
                  {formatCurrency(tr.amount, currency)}
                </span>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isSettled
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-slate-200 text-transparent hover:border-slate-300'
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
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowBalances(!showBalances)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-50/50 transition-colors"
        >
          <span>{t('netBalanceTitle')}</span>
          {showBalances ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showBalances && (
          <div className="p-4 pt-1 space-y-2 border-t border-slate-100 divide-y divide-slate-50">
            {balances.map((b) => (
              <div key={b.memberId} className="pt-2 flex items-center justify-between text-sm">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800">{b.memberName}</span>
                  <div className="text-[11px] text-slate-400">
                    {t('paidTotal')}: {formatCurrency(b.totalPaid, currency)} | {t('owedTotal')}:{' '}
                    {formatCurrency(b.totalOwed, currency)}
                  </div>
                </div>
                <div
                  className={`font-bold text-sm ${
                    b.netBalance > 0
                      ? 'text-emerald-600'
                      : b.netBalance < 0
                      ? 'text-rose-500'
                      : 'text-slate-400'
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
