import React, { useState } from 'react';
import type { Member } from '../types';
import { Trash2, ArrowRight, UserPlus, Users } from 'lucide-react';

interface MembersTabProps {
  members: Member[];
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
  onNext: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  onAddMember,
  onRemoveMember,
  onNext,
  t,
}) => {
  const [nameInput, setNameInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onAddMember(nameInput.trim());
    setNameInput('');
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Input Bar */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={t('addMemberPlaceholder')}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400 font-medium text-base transition-all"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={!nameInput.trim()}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold rounded-2xl shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <UserPlus className="w-5 h-5" />
          <span>{t('addMemberBtn')}</span>
        </button>
      </form>

      {/* Members Counter Header */}
      <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span>{t('membersCount', { n: members.length })}</span>
      </div>

      {/* Members Grid / List */}
      {members.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            {t('noMembersYet')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="group bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-400 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-slate-800 truncate text-sm">
                  {m.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveMember(m.id)}
                className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                title={t('delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Next Step Button */}
      {members.length >= 2 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onNext}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-2xl shadow-lg shadow-slate-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>{t('nextToExpenses')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
