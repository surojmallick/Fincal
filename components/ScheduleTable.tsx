
import React from 'react';
import { AmortizationRow } from '../types';
import { formatCurrency } from '../utils';

interface ScheduleTableProps {
  schedule: AmortizationRow[];
  showFull?: boolean;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ schedule, showFull = false }) => {
  const displayedSchedule = showFull ? schedule : schedule.slice(0, 12);

  return (
    <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-inner bg-slate-50/20">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="bg-slate-100/80 text-slate-500 font-black uppercase tracking-[0.15em] border-b border-slate-100">
          <tr>
            <th className="px-6 py-5">Month</th>
            <th className="px-6 py-5 text-center">Principal</th>
            <th className="px-6 py-5 text-center">Interest</th>
            <th className="px-6 py-5 text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {displayedSchedule.map((row) => (
            <tr key={row.month} className="hover:bg-white hover:shadow-lg transition-all group">
              <td className="px-6 py-5 font-black text-slate-900 group-hover:text-blue-700">{row.month}</td>
              <td className="px-6 py-5 text-center font-bold text-blue-800">{formatCurrency(row.principalPaid)}</td>
              <td className="px-6 py-5 text-center font-bold text-sky-500">{formatCurrency(row.interestPaid)}</td>
              <td className="px-6 py-5 text-right font-black text-slate-400 group-hover:text-slate-900 transition-colors">{formatCurrency(row.remainingBalance)}</td>
            </tr>
          ))}
          {!showFull && schedule.length > 12 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center bg-white/50">
                <div className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="w-8 h-[1px] bg-slate-200"></div>
                  Showing first 12 months
                  <div className="w-8 h-[1px] bg-slate-200"></div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
