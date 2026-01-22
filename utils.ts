
import { CalculationResult, InterestType, AmortizationRow } from './types';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const calculateAmortizationSchedule = (
  principal: number,
  annualRate: number,
  tenureMonths: number,
  emi: number
): AmortizationRow[] => {
  const schedule: AmortizationRow[] = [];
  let remainingBalance = principal;
  const monthlyRate = annualRate / (12 * 100);

  for (let i = 1; i <= tenureMonths; i++) {
    const interestPaid = remainingBalance * monthlyRate;
    const principalPaid = Math.min(emi - interestPaid, remainingBalance);
    remainingBalance = Math.max(0, remainingBalance - principalPaid);

    schedule.push({
      month: i,
      principalPaid,
      interestPaid,
      totalPayment: principalPaid + interestPaid,
      remainingBalance
    });

    if (remainingBalance <= 0) break;
  }
  return schedule;
};

export const calculateEMI = (principal: number, rate: number, tenureMonths: number): CalculationResult => {
  if (principal <= 0 || rate < 0 || tenureMonths <= 0) {
    return {
      principal,
      totalAmount: 0,
      totalInterest: 0,
      error: "Please enter positive values for all fields.",
      breakdown: []
    };
  }

  const monthlyRate = rate / (12 * 100);
  
  if (monthlyRate === 0) {
    const emi = principal / tenureMonths;
    return {
      totalAmount: principal,
      totalInterest: 0,
      monthlyPayment: emi,
      principal,
      tenureMonths: tenureMonths,
      breakdown: [
        { name: 'Principal', value: principal, color: '#1e40af' },
        { name: 'Interest', value: 0, color: '#60a5fa' }
      ],
      schedule: calculateAmortizationSchedule(principal, rate, tenureMonths, emi)
    };
  }

  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  const totalAmount = emi * tenureMonths;
  const totalInterest = totalAmount - principal;

  return {
    totalAmount,
    totalInterest,
    monthlyPayment: emi,
    principal,
    tenureMonths: tenureMonths,
    breakdown: [
      { name: 'Principal', value: principal, color: '#1e40af' },
      { name: 'Interest', value: totalInterest, color: '#60a5fa' }
    ],
    schedule: calculateAmortizationSchedule(principal, rate, tenureMonths, emi)
  };
};

export const calculateRateForTargetEMI = (principal: number, tenureMonths: number, targetEMI: number): number => {
  let low = 0;
  let high = 500; // Allow high range for solve
  let iterations = 40; 
  
  while (iterations > 0) {
    const mid = (low + high) / 2;
    const r = mid / (12 * 100);
    const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
    
    if (emi > targetEMI) high = mid;
    else low = mid;
    iterations--;
  }
  return Number(low.toFixed(2));
};

export const calculateInterest = (
  principal: number, 
  rate: number, 
  tenureMonths: number, 
  type: InterestType
): CalculationResult => {
  let totalAmount: number;
  let totalInterest: number;
  const tenureYears = tenureMonths / 12;

  if (type === InterestType.SIMPLE) {
    totalInterest = (principal * rate * tenureYears) / 100;
    totalAmount = principal + totalInterest;
  } else if (type === InterestType.COMPOUND) {
    totalAmount = principal * Math.pow(1 + rate / 100, tenureYears);
    totalInterest = totalAmount - principal;
  } else {
    const res = calculateEMI(principal, rate, tenureMonths);
    if (res.error) return res;
    totalAmount = res.totalAmount;
    totalInterest = res.totalInterest;
  }

  return {
    totalAmount,
    totalInterest,
    principal,
    tenureMonths: tenureMonths,
    breakdown: [
      { name: 'Principal', value: principal, color: '#1e40af' },
      { name: 'Interest', value: totalInterest, color: '#60a5fa' }
    ]
  };
};

export const calculateAdvanced = (
  principal: number,
  rate: number,
  emi: number
): CalculationResult => {
  const monthlyRate = rate / (12 * 100);
  
  if (emi <= principal * monthlyRate) {
    return {
      totalAmount: 0,
      totalInterest: 0,
      principal,
      error: "EMI is too low. It must cover at least the monthly interest interest.",
      breakdown: []
    };
  }

  const n = Math.log(emi / (emi - principal * monthlyRate)) / Math.log(1 + monthlyRate);
  const totalMonths = Math.ceil(n);
  const totalAmount = emi * totalMonths;
  const totalInterest = totalAmount - principal;

  return {
    totalAmount,
    totalInterest,
    monthlyPayment: emi,
    principal,
    tenureMonths: totalMonths,
    breakdown: [
      { name: 'Principal', value: principal, color: '#1e40af' },
      { name: 'Interest', value: totalInterest, color: '#60a5fa' }
    ],
    schedule: calculateAmortizationSchedule(principal, rate, totalMonths, emi)
  };
};
