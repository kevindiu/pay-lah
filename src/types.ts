export type Language = 'zh-HK' | 'zh-TW' | 'zh-CN' | 'en' | 'ja';

export type Currency = 'HKD' | 'TWD' | 'CNY' | 'USD' | 'EUR' | 'JPY' | 'GBP' | 'SGD' | 'AUD' | 'KRW' | 'THB';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: Record<Language, string>;
  decimals: number;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  HKD: { code: 'HKD', symbol: 'HK$', decimals: 1, name: { 'zh-HK': '港幣 (HKD)', 'zh-TW': '港幣 (HKD)', 'zh-CN': '港币 (HKD)', en: 'Hong Kong Dollar (HKD)', ja: '香港ドル (HKD)' } },
  TWD: { code: 'TWD', symbol: 'NT$', decimals: 0, name: { 'zh-HK': '新台幣 (TWD)', 'zh-TW': '新台幣 (TWD)', 'zh-CN': '新台币 (TWD)', en: 'New Taiwan Dollar (TWD)', ja: '台湾ドル (TWD)' } },
  CNY: { code: 'CNY', symbol: '¥', decimals: 1, name: { 'zh-HK': '人民幣 (CNY)', 'zh-TW': '人民幣 (CNY)', 'zh-CN': '人民币 (CNY)', en: 'Chinese Yuan (CNY)', ja: '人民元 (CNY)' } },
  USD: { code: 'USD', symbol: '$', decimals: 2, name: { 'zh-HK': '美元 (USD)', 'zh-TW': '美元 (USD)', 'zh-CN': '美元 (USD)', en: 'US Dollar (USD)', ja: '米ドル (USD)' } },
  JPY: { code: 'JPY', symbol: '¥', decimals: 0, name: { 'zh-HK': '日圓 (JPY)', 'zh-TW': '日圓 (JPY)', 'zh-CN': '日元 (JPY)', en: 'Japanese Yen (JPY)', ja: '日本円 (JPY)' } },
  EUR: { code: 'EUR', symbol: '€', decimals: 2, name: { 'zh-HK': '歐元 (EUR)', 'zh-TW': '歐元 (EUR)', 'zh-CN': '欧元 (EUR)', en: 'Euro (EUR)', ja: 'ユーロ (EUR)' } },
  GBP: { code: 'GBP', symbol: '£', decimals: 2, name: { 'zh-HK': '英鎊 (GBP)', 'zh-TW': '英鎊 (GBP)', 'zh-CN': '英镑 (GBP)', en: 'British Pound (GBP)', ja: 'イギリスポンド (GBP)' } },
  SGD: { code: 'SGD', symbol: 'S$', decimals: 2, name: { 'zh-HK': '新加坡幣 (SGD)', 'zh-TW': '新加坡幣 (SGD)', 'zh-CN': '新加坡元 (SGD)', en: 'Singapore Dollar (SGD)', ja: 'シンガポールドル (SGD)' } },
  AUD: { code: 'AUD', symbol: 'A$', decimals: 2, name: { 'zh-HK': '澳元 (AUD)', 'zh-TW': '澳元 (AUD)', 'zh-CN': '澳元 (AUD)', en: 'Australian Dollar (AUD)', ja: '豪ドル (AUD)' } },
  KRW: { code: 'KRW', symbol: '₩', decimals: 0, name: { 'zh-HK': '韓圜 (KRW)', 'zh-TW': '韓圜 (KRW)', 'zh-CN': '韩元 (KRW)', en: 'Korean Won (KRW)', ja: '韓国ウォン (KRW)' } },
  THB: { code: 'THB', symbol: '฿', decimals: 0, name: { 'zh-HK': '泰銖 (THB)', 'zh-TW': '泰銖 (THB)', 'zh-CN': '泰铢 (THB)', en: 'Thai Baht (THB)', ja: 'タイバーツ (THB)' } },
};

export interface Member {
  id: string;
  name: string;
}

export interface PayerSplit {
  memberId: string;
  amount: number;
}

export interface Expense {
  id: string;
  title: string;
  date: string;
  amount: number;
  payers: PayerSplit[]; // Supports multiple payers
  participantIds: string[]; // Who shares the bill
  serviceChargePercent?: number; // Optional service charge
}

export interface EventRecord {
  id: string;
  title: string;
  createdAt: number;
  currency: Currency;
  members: Member[];
  expenses: Expense[];
  settledTransfers?: SettlementTransfer[];
}

export interface SettlementTransfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  settled?: boolean;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = should receive, negative = should pay
}
