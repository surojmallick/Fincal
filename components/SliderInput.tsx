
import React from 'react';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
}

export const SliderInput: React.FC<SliderInputProps> = ({ 
  label, value, min, max, step = 1, onChange, prefix = '₹', suffix = '' 
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-8 group/slider">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <label className="text-sm sm:text-base font-extrabold text-slate-700 uppercase tracking-widest leading-none group-hover/slider:text-blue-600 transition-colors">
          {label}
        </label>
        <div className="relative w-full sm:w-auto">
          {prefix && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none">
              {prefix}
            </span>
          )}
          <input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className={`w-full sm:w-56 ${prefix ? 'pl-10' : 'pl-5'} ${suffix ? 'pr-24' : 'pr-5'} py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-right text-base sm:text-lg font-black text-blue-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm appearance-none`}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 pointer-events-none uppercase tracking-tighter">
              {suffix}
            </span>
          )}
        </div>
      </div>
      <div className="px-1 relative h-8 flex items-center">
        <div className="absolute w-full h-3 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 transition-all duration-500 ease-out" 
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-10 bg-transparent appearance-none cursor-pointer touch-pan-y z-10"
          style={{
            WebkitAppearance: 'none',
            outline: 'none',
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: `
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 26px;
            width: 26px;
            border-radius: 50%;
            background: #ffffff;
            border: 4px solid #1d4ed8;
            box-shadow: 0 4px 8px rgba(29, 78, 216, 0.2);
            cursor: pointer;
            margin-top: -1px;
            transition: all 0.2s ease;
          }
          input[type=range]::-webkit-slider-thumb:active {
            transform: scale(1.15);
            background: #1d4ed8;
            border-color: #ffffff;
          }
        `}} />
      </div>
      <div className="flex justify-between mt-3 px-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {prefix}{min.toLocaleString()}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {prefix}{max.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
