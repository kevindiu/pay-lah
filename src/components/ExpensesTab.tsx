import React, { useState } from 'react';
import type { Expense, Member, Currency, PayerSplit } from '../types';
import { Plus, Receipt, Trash2, Edit2 } from 'lucide-react';
import { formatCurrency } from '../utils/settlement';

interface ExpensesTabProps {
  members: Member[];
  expenses: Expense[];
  currency: Currency;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  members,
  expenses,
  currency,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  t,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [payerMode, setPayerMode] = useState<'single' | 'multi'>('single');
  const [singlePayerId, setSinglePayerId] = useState<string>(members[0]?.id || '');
  const [multiPayers, setMultiPayers] = useState<Record<string, string>>({});
  const [participantIds, setParticipantIds] = useState<string[]>(members.map((m) => m.id));
  const [serviceCharge, setServiceCharge] = useState<number>(0);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgPerPerson = members.length > 0 ? totalSpent / members.length : 0;

  const openAddModal = () => {
    setEditingExpenseId(null);
    setTitle('');
    setAmountStr('');
    setPayerMode('single');
    setSinglePayerId(members[0]?.id || '');
    setMultiPayers({});
    setParticipantIds(members.map((m) => m.id));
    setServiceCharge(0);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setTitle(exp.title);
    setAmountStr(exp.amount.toString());
    if (exp.payers.length === 1 && exp.payers[0].amount === exp.amount) {
      setPayerMode('single');
      setSinglePayerId(exp.payers[0].memberId);
      setMultiPayers({});
    } else {
      setPayerMode('multi');
      const splits: Record<string, string> = {};
      exp.payers.forEach((p) => {
        splits[p.memberId] = p.amount.toString();
      });
      setMultiPayers(splits);
    }
    setParticipantIds(exp.participantIds.length > 0 ? exp.participantIds : members.map((m) => m.id));
    setServiceCharge(exp.serviceChargePercent || 0);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let totalAmt = parseFloat(amountStr) || 0;

    let payers: PayerSplit[] = [];
    if (payerMode === 'single') {
      if (!singlePayerId) return;
      if (serviceCharge > 0) {
        totalAmt = Math.round(totalAmt * (1 + serviceCharge / 100) * 100) / 100;
      }
      if (totalAmt <= 0) return;
      payers = [{ memberId: singlePayerId, amount: totalAmt }];
    } else {
      let sum = 0;
      payers = Object.entries(multiPayers)
        .map(([mId, val]) => {
          const amt = parseFloat(val) || 0;
          sum += amt;
          return { memberId: mId, amount: amt };
        })
        .filter((p) => p.amount > 0);

      totalAmt = sum;
    }

    if (totalAmt <= 0 || payers.length === 0 || participantIds.length === 0) {
      return;
    }

    const payload = {
      title: title.trim() || '消費',
      date: new Date().toISOString(),
      amount: totalAmt,
      payers,
      participantIds,
      serviceChargePercent: serviceCharge > 0 ? serviceCharge : undefined,
    };

    if (editingExpenseId) {
      onEditExpense({ ...payload, id: editingExpenseId });
    } else {
      onAddExpense(payload);
    }

    setIsModalOpen(false);
  };

  const toggleParticipant = (id: string) => {
    if (participantIds.includes(id)) {
      setParticipantIds(participantIds.filter((p) => p !== id));
    } else {
      setParticipantIds([...participantIds, id]);
    }
  };

  const getPayerDisplay = (exp: Expense) => {
    if (exp.payers.length === 1) {
      const p = members.find((m) => m.id === exp.payers[0].memberId);
      return p ? p.name : 'Unknown';
    }
    return exp.payers
      .map((p) => {
        const m = members.find((x) => x.id === p.memberId);
        return `${m ? m.name : '?'}($${p.amount})`;
      })
      .join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl p-4 shadow-md shadow-indigo-100 flex flex-col justify-between">
          <span className="text-xs font-medium text-indigo-100 uppercase tracking-wider">
            {t('totalSpent')}
          </span>
          <span className="text-2xl font-bold tracking-tight mt-1">
            {formatCurrency(totalSpent, currency)}
          </span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {t('avgPerPerson')}
          </span>
          <span className="text-xl font-bold text-slate-800 tracking-tight mt-1">
            {formatCurrency(avgPerPerson, currency)}
          </span>
        </div>
      </div>

      {/* Add Expense Action Button */}
      <button
        type="button"
        onClick={openAddModal}
        disabled={members.length === 0}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-md shadow-indigo-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>{t('addExpenseBtn')}</span>
      </button>

      {/* Expenses List */}
      <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span>{t('expensesCount', { n: expenses.length })}</span>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            {t('noExpensesYet')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-slate-200 transition-all"
            >
              <div className="space-y-1 min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-base truncate">
                    {exp.title}
                  </span>
                  {exp.serviceChargePercent ? (
                    <span className="text-[10px] bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded-full border border-amber-200/60">
                      +{exp.serviceChargePercent}%
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="text-indigo-600 font-medium">
                    {t('paidBy', { payers: getPayerDisplay(exp) })}
                  </span>
                  <span>•</span>
                  <span>{t('splitAmong', { n: exp.participantIds.length })}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900 tracking-tight block">
                    {formatCurrency(exp.amount, currency)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatCurrency(exp.amount / exp.participantIds.length, currency)} /人
                  </span>
                </div>
                <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                  <button
                    onClick={() => openEditModal(exp)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Expense Drawer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity p-0 sm:p-4">
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingExpenseId ? t('modalEditTitle') : t('modalAddTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                {t('cancel')}
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('expenseTitlePlaceholder')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：打邊爐 / 居酒屋 / Uber"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('payersLabel')}
                  </label>
                  <div className="bg-slate-100 p-0.5 rounded-xl flex text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPayerMode('single')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        payerMode === 'single'
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {t('singlePayerMode')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayerMode('multi')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        payerMode === 'multi'
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {t('multiPayerMode')}
                    </button>
                  </div>
                </div>

                {payerMode === 'single' ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        required
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        autoFocus
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                        $
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {members.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSinglePayerId(m.id)}
                          className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                            singlePayerId === m.id
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span>{m.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-slate-400 font-medium">
                        {t('serviceCharge')}:
                      </span>
                      {[0, 10, 15].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setServiceCharge(pct)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            serviceCharge === pct
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {pct === 0 ? '無' : `+${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 bg-white rounded-xl shadow-2xs"
                      >
                        <span className="font-semibold text-sm text-slate-800 truncate">
                          {m.name}
                        </span>
                        <div className="flex items-center gap-1.5 w-32">
                          <span className="text-slate-400 text-xs font-bold">$</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="0"
                            value={multiPayers[m.id] || ''}
                            onChange={(e) =>
                              setMultiPayers({
                                ...multiPayers,
                                [m.id]: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('splitAmongLabel')} ({participantIds.length} 人)
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setParticipantIds(members.map((m) => m.id))}
                      className="text-indigo-600 hover:underline font-semibold"
                    >
                      {t('selectAll')}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setParticipantIds([])}
                      className="text-slate-400 hover:underline font-semibold"
                    >
                      {t('deselectAll')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {members.map((m) => {
                    const selected = participantIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleParticipant(m.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          selected
                            ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-400 font-normal hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate text-sm">{m.name}</span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                            selected
                              ? 'bg-indigo-600 text-white'
                              : 'border border-slate-300'
                          }`}
                        >
                          {selected ? '✓' : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-200 active:scale-[0.99] transition-all"
                >
                  {t('saveExpense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
