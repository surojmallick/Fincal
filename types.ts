
export enum CalculatorType {
  EMI = 'EMI',
  INTEREST = 'INTEREST',
  ADVANCED = 'ADVANCED'
}

export enum InterestType {
  SIMPLE = 'SIMPLE',
  COMPOUND = 'COMPOUND',
  REDUCING = 'REDUCING'
}

export enum OptimizeTarget {
  TENURE = 'TENURE',
  INTEREST_RATE = 'INTEREST_RATE'
}

export interface AmortizationRow {
  month: number;
  principalPaid: number;
  interestPaid: number;
  totalPayment: number;
  remainingBalance: number;
}

export interface CalculationResult {
  totalAmount: number;
  totalInterest: number;
  monthlyPayment?: number;
  principal: number;
  tenureMonths?: number;
  error?: string;
  breakdown: {
    name: string;
    value: number;
    color: string;
  }[];
  schedule?: AmortizationRow[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  type: CalculatorType;
  label: string;
  principal: number;
  rate: number;
  tenure?: number;
  emi?: number;
  result: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
