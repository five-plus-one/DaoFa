
import React, { useState, useMemo, useCallback } from 'react';
import { INITIAL_QUESTIONS } from './data';
import { Question, Proficiency } from './types';
import { ProgressBar } from './components/ProgressBar';
import { ProficiencyButton } from './components/ProficiencyButton';

const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const App: React.FC = () => {
  const [allQuestions, setAllQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [sessionQueue, setSessionQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const currentQuestion = useMemo(() => 
    allQuestions.find(q => q.id === sessionQueue[currentIndex]),
    [allQuestions, sessionQueue, currentIndex]
  );

  const stats = useMemo(() => {
    const total = allQuestions.length;
    const learned = allQuestions.filter(q => q.proficiency >= 4).length;
    const inProgress = allQuestions.filter(q => q.proficiency > 0 && q.proficiency < 4).length;
    const avgProficiency = (allQuestions.reduce((acc, q) => acc + q.proficiency, 0) / (total || 1)).toFixed(1);
    return { total, learned, inProgress, avgProficiency };
  }, [allQuestions]);

  const startSession = useCallback(() => {
    const pool = [...allQuestions].sort((a, b) => a.proficiency - b.proficiency);
    const sessionIds = shuffle(pool.slice(0, 15)).map(q => q.id);
    setSessionQueue(sessionIds);
    setCurrentIndex(0);
    setIsStarted(true);
    setShowAnswer(false);
  }, [allQuestions]);

  const handleProficiency = (level: Proficiency) => {
    if (!currentQuestion) return;
    setAllQuestions(prev => prev.map(q => 
      q.id === currentQuestion.id ? { ...q, proficiency: level, attempts: q.attempts + 1 } : q
    ));
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < sessionQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setIsStarted(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-0.5" />;
      
      if (trimmed.startsWith('**记忆口诀**')) {
        return <div key={idx} className="mt-1 mb-3 p-3 bg-red-600 text-white rounded-xl shadow-md font-black italic text-center">
          <span className="text-sm">{trimmed.replace('**记忆口诀**：', '')}</span>
        </div>;
      }

      if (trimmed.startsWith('**核心要点**')) {
        return <h6 key={idx} className="font-black text-slate-400 text-[9px] uppercase tracking-[0.2em] mt-3 mb-2 flex items-center gap-2">核心要点</h6>;
      }

      if (trimmed.startsWith('#####')) {
        return <h5 key={idx} className="font-bold text-slate-900 mt-3 mb-1.5 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-md border-l-2 border-red-500 text-xs">
          {trimmed.replace('#####', '').trim()}
        </h5>;
      }

      if (trimmed.startsWith('####')) {
        return <h4 key={idx} className="font-black text-red-700 text-sm mt-4 mb-2 border-b border-red-50 pb-1">
          {trimmed.replace('####', '').trim()}
        </h4>;
      }

      if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
        const isNumbered = /^\d+\./.test(trimmed);
        const bulletText = isNumbered ? trimmed.replace(/^\d+\./, '').trim() : trimmed.substring(1).trim();
        const parts = bulletText.split('**');
        
        return <div key={idx} className={`flex gap-2 mb-1.5 ${isNumbered ? 'ml-0' : 'ml-1'}`}>
          <span className={`flex-shrink-0 font-black text-[10px] h-4 w-4 flex items-center justify-center rounded ${isNumbered ? 'bg-slate-900 text-white' : 'text-red-400 bg-red-50'}`}>
            {isNumbered ? trimmed.split('.')[0] : '•'}
          </span>
          <p className="text-[13px] text-slate-600 leading-snug">
            {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-slate-900 font-bold underline decoration-yellow-300 decoration-2">{p}</strong> : p)}
          </p>
        </div>;
      }

      const parts = trimmed.split('**');
      return <p key={idx} className="text-[13px] text-slate-500 leading-snug mb-2">
        {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-red-700 font-bold">{p}</strong> : p)}
      </p>;
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-4 px-4 font-sans antialiased overflow-x-hidden">
      <div className={`w-full transition-all duration-500 ${isStarted ? 'max-w-5xl pr-0 lg:pr-24' : 'max-w-2xl'}`}>
        
        {!isStarted ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {/* Header - Only visible in home screen to save space during study */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 flex items-center justify-center rounded-xl shadow-lg text-white font-black text-xl">政</div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">政务通 PRO</h1>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Political Memory Assistant</p>
                </div>
              </div>
              <button onClick={startSession} className="px-5 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-red-600 transition-all shadow-md">开始背诵</button>
            </div>

            <div className="space-y-4">
              {/* Stats - Grid layout more compact */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 grid grid-cols-4 gap-4">
                {[
                  { label: '库量', val: stats.total, color: 'text-slate-900' },
                  { label: '精通', val: stats.learned, color: 'text-emerald-500' },
                  { label: '攻坚', val: stats.inProgress, color: 'text-orange-500' },
                  { label: '系数', val: stats.avgProficiency, color: 'text-blue-500' }
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1">{s.label}</p>
                    <span className={`text-xl font-black ${s.color}`}>{s.val}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                 <ProgressBar current={stats.learned + stats.inProgress} total={stats.total} label="知识覆盖" />
              </div>

              {/* List View - Tighter spacing */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                 <h2 className="text-lg font-black text-slate-900 mb-4">知识清单</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                    {allQuestions.map(q => (
                      <div key={q.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-red-100">
                         <div className="flex-1 truncate pr-2">
                            <span className="text-[7px] font-black text-red-500 uppercase tracking-tighter bg-red-50 px-1.5 py-0.5 rounded mr-2">{q.chapter}</span>
                            <span className="text-xs font-bold text-slate-700">{q.title}</span>
                         </div>
                         <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(v => (
                              <div key={v} className={`w-1 h-3 rounded-sm ${q.proficiency >= v ? 'bg-red-500' : 'bg-slate-200'}`} />
                            ))}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        ) : (
          /* Session View - Global branding hidden for focus and space */
          <div className="relative animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Session Info - Horizontal and sleek */}
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg uppercase border border-red-100">{currentQuestion?.chapter}</span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{currentQuestion?.title}</h2>
              </div>
              <div className="text-[11px] font-black text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                {currentIndex + 1} <span className="text-slate-200 mx-1">/</span> {sessionQueue.length}
              </div>
            </div>

            {/* Main Question Card - Dynamic height but capped */}
            <div 
              onClick={() => !showAnswer && setShowAnswer(true)}
              className={`min-h-[450px] bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col relative overflow-hidden transition-all duration-300 ${!showAnswer ? 'cursor-pointer hover:bg-slate-50' : ''}`}
            >
              {!showAnswer ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10">
                  <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6 text-red-500">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">点击查看解析</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-4 animate-in fade-in">
                  {/* Top Bar Handle */}
                  <div className="h-6 flex items-center justify-center cursor-pointer group mb-2" onClick={() => setShowAnswer(false)}>
                     <div className="w-10 h-1 bg-slate-100 group-hover:bg-red-300 rounded-full transition-all" />
                  </div>

                  {/* Two Column Layout - Use max-h to prevent card from growing too long */}
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                    <div className="bg-orange-50/30 rounded-2xl p-5 border border-orange-100/50 flex flex-col overflow-hidden">
                       <h3 className="text-xs font-black text-orange-800 mb-3 flex items-center gap-2">记忆口诀</h3>
                       <div className="overflow-y-auto pr-2 scrollbar-thin max-h-[350px]">
                         {currentQuestion && renderMarkdown(currentQuestion.mnemonic)}
                       </div>
                    </div>
                    <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/50 flex flex-col overflow-hidden">
                       <h3 className="text-xs font-black text-slate-800 mb-3 flex items-center gap-2">逻辑详解</h3>
                       <div className="overflow-y-auto pr-2 scrollbar-thin max-h-[350px]">
                         {currentQuestion && renderMarkdown(currentQuestion.fullContent)}
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Side Control - Smaller scale */}
            <div className="fixed right-4 lg:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-50">
              <button 
                onClick={handlePrevious} 
                disabled={currentIndex === 0}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-lg border border-slate-100 transition-all ${currentIndex === 0 ? 'opacity-20 scale-90' : 'hover:scale-110 active:scale-95 text-slate-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
              </button>

              <div className={`flex flex-col gap-1.5 p-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 transition-all duration-500 ${showAnswer ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'}`}>
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    onClick={() => handleProficiency(v as Proficiency)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm transition-all hover:scale-110 active:scale-90"
                    style={{ 
                      backgroundColor: ['','#fef2f2','#fff7ed','#fefce8','#eff6ff','#f0fdf4'][v],
                      color: ['','#dc2626','#ea580c','#ca8a04','#2563eb','#16a34a'][v]
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleNext} 
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg transition-all hover:scale-110 active:scale-95 hover:bg-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>

            {/* Exit Session - Smaller */}
            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => setIsStarted(false)}
                className="text-slate-300 font-black text-[9px] uppercase tracking-widest hover:text-red-500 transition-all"
              >
                Exit Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
