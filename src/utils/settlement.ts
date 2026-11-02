import type {
  Member,
  Expense,
  SettlementTransfer,
  MemberBalance,
  Currency,
} from '../types';
import { CURRENCIES } from '../types';

export function calculateBalances(
  members: Member[],
  expenses: Expense[]
): MemberBalance[] {
  const memberMap: Record<string, { totalPaid: number; totalOwed: number }> = {};

  members.forEach((m) => {
    memberMap[m.id] = { totalPaid: 0, totalOwed: 0 };
  });

  for (const exp of expenses) {
    if (exp.payers && exp.payers.length > 0) {
      for (const p of exp.payers) {
        if (memberMap[p.memberId]) {
          memberMap[p.memberId].totalPaid += p.amount;
        }
      }
    }

    const participants =
      exp.participantIds && exp.participantIds.length > 0
        ? exp.participantIds
        : members.map((m) => m.id);

    if (participants.length > 0) {
      const share = exp.amount / participants.length;
      for (const pId of participants) {
        if (memberMap[pId]) {
          memberMap[pId].totalOwed += share;
        }
      }
    }
  }

  return members.map((m) => {
    const data = memberMap[m.id] || { totalPaid: 0, totalOwed: 0 };
    const net = data.totalPaid - data.totalOwed;
    return {
      memberId: m.id,
      memberName: m.name,
      totalPaid: data.totalPaid,
      totalOwed: data.totalOwed,
      netBalance: Math.round(net * 100) / 100,
    };
  });
}

export function calculateSettlements(
  members: Member[],
  expenses: Expense[],
  currency: Currency
): SettlementTransfer[] {
  const balances = calculateBalances(members, expenses);
  const decimals = CURRENCIES[currency]?.decimals ?? 1;

  interface Party {
    id: string;
    name: string;
    amount: number;
  }

  const debtors: Party[] = [];
  const creditors: Party[] = [];

  for (const b of balances) {
    if (b.netBalance < -0.01) {
      debtors.push({ id: b.memberId, name: b.memberName, amount: -b.netBalance });
    } else if (b.netBalance > 0.01) {
      creditors.push({ id: b.memberId, name: b.memberName, amount: b.netBalance });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      const rounded =
        decimals === 0 ? Math.round(amount) : Number(amount.toFixed(decimals));
      transfers.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amount: rounded,
        settled: false,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount <= 0.01) {
      i++;
    }
    if (creditor.amount <= 0.01) {
      j++;
    }
  }

  return transfers;
}

export function formatCurrency(amount: number, currency: Currency): string {
  const conf = CURRENCIES[currency] || CURRENCIES.HKD;
  const val =
    conf.decimals === 0
      ? Math.round(amount).toLocaleString()
      : amount.toFixed(conf.decimals);
  return `${conf.symbol} ${val}`;
}
