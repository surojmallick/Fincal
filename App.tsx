
import React, { useState, useEffect, useCallback } from 'react';
import { CalculatorType, InterestType, CalculationResult, OptimizeTarget, HistoryItem } from './types';
import { calculateEMI, calculateInterest, calculateAdvanced, formatCurrency, calculateRateForTargetEMI } from './utils';
import { getFinancialAdvice } from './services/geminiService';
import { SliderInput } from './components/SliderInput';
import { ChartDisplay } from './components/ChartDisplay';
import { ScheduleTable } from './components/ScheduleTable';

const STORAGE_KEY = 'fincal_suroj_history';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CalculatorType>(CalculatorType.EMI);
  const [optimizeMode, setOptimizeMode] = useState<boolean>(false);
  const [optimizeTarget, setOptimizeTarget] = useState<OptimizeTarget>(OptimizeTarget.TENURE);
  const [showFullSchedule, setShowFullSchedule] = useState<boolean>(false);
  
  const [principal, setPrincipal] = useState<number>(10000);
  const [interestRate, setInterestRate] = useState<number>(18);
  const [tenure, setTenure] = useState<number>(24);
  const [emiInput, setEmiInput] = useState<number>(1000);
  const [targetEmi, setTargetEmi] = useState<number>(1200);
  
  const [interestType, setInterestType] = useState<InterestType>(InterestType.COMPOUND);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [advice, setAdvice] = useState<string>('');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const performCalculation = useCallback(() => {
    let res: CalculationResult;
    
    if (activeTab === CalculatorType.EMI) {
      if (optimizeMode) {
        if (optimizeTarget === OptimizeTarget.TENURE) {
          res = calculateAdvanced(principal, interestRate, targetEmi);
        } else {
          const calculatedRate = calculateRateForTargetEMI(principal, tenure, targetEmi);
          res = calculateEMI(principal, calculatedRate, tenure);
          res.monthlyPayment = targetEmi;
        }
      } else {
        res = calculateEMI(principal, interestRate, tenure);
      }
    } else if (activeTab === CalculatorType.INTEREST) {
      res = calculateInterest(principal, interestRate, tenure, interestType);
    } else {
      res = calculateAdvanced(principal, interestRate, emiInput);
    }
    setResult(res);
    setAdvice(''); 
  }, [activeTab, principal, interestRate, tenure, emiInput, targetEmi, interestType, optimizeMode, optimizeTarget]);

  useEffect(() => {
    performCalculation();
  }, [performCalculation]);

  const saveToHistory = () => {
    if (!result || result.error || result.totalAmount === Infinity) return;
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: activeTab,
      label: activeTab === CalculatorType.ADVANCED ? 'Tenure Solve' : activeTab === CalculatorType.EMI ? 'EMI Plan' : `${interestType} Plan`,
      principal,
      rate: interestRate,
      tenure: activeTab === CalculatorType.ADVANCED ? result.tenureMonths : tenure,
      emi: activeTab === CalculatorType.INTEREST ? undefined : (result.monthlyPayment || emiInput),
      result: activeTab === CalculatorType.ADVANCED ? (result.tenureMonths || 0) : result.totalAmount
    };

    const updated = [newItem, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const loadFromHistory = (item: HistoryItem) => {
    setActiveTab(item.type);
    setPrincipal(item.principal);
    setInterestRate(item.rate);
    if (item.tenure) {
      if (item.type === CalculatorType.ADVANCED) setEmiInput(item.emi || 1000);
      else setTenure(item.tenure);
    }
    if (item.emi && item.type !== CalculatorType.ADVANCED) setEmiInput(item.emi);
    setOptimizeMode(false);
  };

  const handleGetAdvice = async () => {
    if (!result || result.error) return;
    setIsGeneratingAdvice(true);
    const aiAdvice = await getFinancialAdvice(result, activeTab);
    setAdvice(aiAdvice);
    setIsGeneratingAdvice(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50 pb-36 md:pb-16 transition-all duration-500">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-700 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white">
              <span className="text-white font-black text-xl italic">₹</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tighter text-slate-900">
              FinCal <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">By Suroj</span>
            </h1>
          </div>
          <nav className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            {[
              { id: CalculatorType.EMI, label: 'EMI' },
              { id: CalculatorType.INTEREST, label: 'Yield' },
              { id: CalculatorType.ADVANCED, label: 'Solver' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setOptimizeMode(false); setShowFullSchedule(false); }}
                className={`px-3 sm:px-5 py-2 rounded-lg text-[10px] sm:text-xs font-black transition-all ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Loan Input Section */}
        <section className="lg:col-span-6 space-y-6">
          <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-200 group/card relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
                  Loan Engine
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Input Parameters</p>
              </div>
              <button 
                onClick={saveToHistory}
                disabled={!result || !!result.error}
                className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-md disabled:opacity-30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <SliderInput 
                label="Capital Requested" 
                value={principal} 
                min={1000} 
                max={5000000} 
                step={1000} 
                onChange={setPrincipal} 
              />

              {(!optimizeMode || (optimizeMode && optimizeTarget === OptimizeTarget.TENURE)) && (
                <SliderInput 
                  label="Annual Rate" 
                  value={interestRate} 
                  min={0.1} 
                  max={45} 
                  step={0.1} 
                  suffix="%"
                  onChange={setInterestRate} 
                />
              )}

              {activeTab !== CalculatorType.ADVANCED && (!optimizeMode || (optimizeMode && optimizeTarget === OptimizeTarget.INTEREST_RATE)) && (
                <SliderInput 
                  label="Tenure Plan"
                  value={tenure} 
                  min={1} 
                  max={360} 
                  step={1} 
                  suffix="MONTHS"
                  onChange={setTenure} 
                />
              )}

              {activeTab === CalculatorType.ADVANCED && (
                <SliderInput 
                  label="Monthly Target"
                  value={emiInput} 
                  min={100} 
                  max={200000} 
                  step={100} 
                  onChange={setEmiInput} 
                />
              )}

              {activeTab === CalculatorType.EMI && (
                <button 
                  onClick={() => setOptimizeMode(!optimizeMode)}
                  className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${optimizeMode ? 'bg-indigo-700 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                >
                  {optimizeMode ? 'Close Optimizer' : 'Launch Goal Optimizer'}
                </button>
              )}

              {optimizeMode && activeTab === CalculatorType.EMI && (
                <div className="mt-6 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-100 rounded-[2rem] animate-in fade-in zoom-in duration-300">
                  <div className="flex gap-2 mb-6">
                    <button 
                      onClick={() => setOptimizeTarget(OptimizeTarget.TENURE)}
                      className={`flex-1 py-2.5 rounded-lg text-[10px] font-black transition-all ${optimizeTarget === OptimizeTarget.TENURE ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                    >
                      SOLVE TENURE
                    </button>
                    <button 
                      onClick={() => setOptimizeTarget(OptimizeTarget.INTEREST_RATE)}
                      className={`flex-1 py-2.5 rounded-lg text-[10px] font-black transition-all ${optimizeTarget === OptimizeTarget.INTEREST_RATE ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                    >
                      SOLVE RATE
                    </button>
                  </div>
                  <SliderInput 
                    label="Target EMI" 
                    value={targetEmi} 
                    min={Math.ceil(principal * 0.005)} 
                    max={Math.ceil(principal * 0.4)} 
                    step={100} 
                    onChange={setTargetEmi} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Result Summary - Optimized Size */}
          <div className={`bg-gradient-to-br from-slate-900 to-blue-900 p-8 sm:p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden transition-all duration-500 ${result?.error ? 'grayscale opacity-75' : ''}`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative z-10">
              <h3 className="text-blue-200/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                {activeTab === CalculatorType.ADVANCED || (optimizeMode && optimizeTarget === OptimizeTarget.TENURE) ? 'Optimal Horizon' : 'Projected Aggregate'}
              </h3>
              
              {result?.error ? (
                <div className="py-4 text-center space-y-3">
                  <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <p className="text-base font-bold text-white uppercase tracking-tight">{result.error}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-3 mb-8">
                    <p className="text-4xl sm:text-5xl font-black tracking-tighter drop-shadow-xl">
                      {activeTab === CalculatorType.ADVANCED || (optimizeMode && optimizeTarget === OptimizeTarget.TENURE) 
                        ? `${result?.tenureMonths || 0}` 
                        : result ? formatCurrency(result.totalAmount) : '₹0'}
                    </p>
                    <span className="text-blue-300/40 font-black text-lg sm:text-xl uppercase">
                      {activeTab === CalculatorType.ADVANCED || (optimizeMode && optimizeTarget === OptimizeTarget.TENURE) ? 'Months' : ''}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-white/20 text-[9px] font-bold uppercase mb-1 tracking-widest">Base Capital</p>
                      <p className="text-lg font-bold truncate">{formatCurrency(principal)}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-white/20 text-[9px] font-bold uppercase mb-1 tracking-widest">Total Interest</p>
                      <p className="text-lg font-bold text-sky-300 truncate">{formatCurrency(result?.totalInterest || 0)}</p>
                    </div>
                  </div>

                  {(activeTab === CalculatorType.EMI || activeTab === CalculatorType.ADVANCED || optimizeMode) && (
                    <div className="mt-6 bg-gradient-to-r from-white/10 to-transparent p-5 rounded-2xl border-l-4 border-blue-400">
                      <p className="text-blue-100/60 text-[9px] font-bold uppercase mb-1 tracking-widest">Monthly Commitment</p>
                      <p className="text-2xl sm:text-3xl font-black text-white">{formatCurrency(result?.monthlyPayment || 0)}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Right: Insights & Data */}
        <section className="lg:col-span-6 space-y-6">
          
          {/* AI Advisor Card */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl border border-slate-200 relative group/ai overflow-hidden">
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                AI Advisor
              </h2>
              <button 
                onClick={handleGetAdvice}
                disabled={isGeneratingAdvice || !result || !!result.error}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isGeneratingAdvice ? 'bg-slate-50 text-slate-300' : 'bg-indigo-600 text-white shadow-md active:scale-95 hover:bg-indigo-700'}`}
              >
                {isGeneratingAdvice ? 'Analyzing...' : 'Get Analysis'}
              </button>
            </div>
            <div className="min-h-[120px] flex items-center justify-center">
              {advice ? (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-in fade-in duration-500">
                  <p className="text-slate-700 text-sm leading-relaxed font-bold italic">"{advice}"</p>
                </div>
              ) : (
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Perform calculation to unlock insights</p>
              )}
            </div>
          </div>

          {/* Capital Mix Visualization */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl border border-slate-200 flex flex-col relative group/chart">
            <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-4">Capital Mix Analysis</h2>
            <div className="flex-1 min-h-[320px]">
              {result && !result.error ? (
                <ChartDisplay data={result.breakdown} />
              ) : (
                <div className="h-full flex items-center justify-center opacity-20 italic font-black text-2xl uppercase tracking-widest">Locked</div>
              )}
            </div>
          </div>

          {/* Archive / History */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">History</h2>
              {history.length > 0 && <button onClick={clearHistory} className="text-[9px] font-bold text-red-400 hover:text-red-600 uppercase">Clear All</button>}
            </div>
            {history.length > 0 ? (
              <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar snap-x">
                {history.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="flex-shrink-0 w-44 bg-slate-50/80 border border-slate-100 p-4 rounded-2xl text-left hover:bg-white hover:border-blue-300 transition-all snap-start"
                  >
                    <p className="text-[9px] font-black text-blue-600 uppercase mb-1">{item.label}</p>
                    <p className="text-base font-black text-slate-900 mb-1 truncate">
                      {item.type === CalculatorType.ADVANCED ? `${item.result} Mo` : formatCurrency(item.result)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">₹{item.principal.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-slate-200 text-xs font-bold uppercase italic">No records found</p>
            )}
          </div>
        </section>
      </main>

      {/* Mobile Sticky Result HUD */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-200 p-6 lg:hidden z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Impact Projection</p>
            <p className="text-2xl font-black text-blue-900">
              {optimizeMode && optimizeTarget === OptimizeTarget.TENURE ? `${result?.tenureMonths || 0} Mo` : result && !result.error ? formatCurrency(result.totalAmount) : '₹0'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Installment</p>
            <p className="text-2xl font-black text-slate-800">{result?.monthlyPayment ? formatCurrency(result.monthlyPayment) : 'Lump Sum'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
