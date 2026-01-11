
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
    const sessionIds = shuffle(pool.slice(0, 10)).map(q => q.id);
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
      if (!trimmed) return <div key={idx} className="h-1" />;
      
      if (trimmed.startsWith('**记忆口诀**')) {
        return <div key={idx} className="mt-2 mb-4 p-3 bg-red-600 text-white rounded-xl shadow-md font-black italic text-center">
          {trimmed.replace('**记忆口诀**：', '')}
        </div>;
      }

      if (trimmed.startsWith('**核心要点**')) {
        return <h6 key={idx} className="font-black text-slate-800 text-xs uppercase tracking-widest mt-4 mb-2 border-b-2 border-slate-200 pb-1">核心要点梳理</h6>;
      }

      if (trimmed.startsWith('#####')) {
        return <h5 key={idx} className="font-bold text-slate-900 mt-4 mb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-red-600 rounded-full" />
          {trimmed.replace('#####', '').trim()}
        </h5>;
      }

      if (trimmed.startsWith('####')) {
        return <h4 key={idx} className="font-black text-red-700 text-lg mt-6 mb-3 underline decoration-red-200 underline-offset-4">
          {trimmed.replace('####', '').trim()}
        </h4>;
      }

      if (trimmed.startsWith('-')) {
        const parts = trimmed.substring(1).trim().split('**');
        return <div key={idx} className="flex gap-2 mb-1.5 ml-1">
          <span className="text-red-400 font-bold">▶</span>
          <p className="text-sm text-slate-600 leading-snug">
            {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-slate-900 font-bold">{p}</strong> : p)}
          </p>
        </div>;
      }

      const parts = trimmed.split('**');
      return <p key={idx} className="text-sm text-slate-600 leading-relaxed mb-2">
        {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-red-700 font-bold">{p}</strong> : p)}
      </p>;
    });
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col items-center py-6 px-4 font-sans antialiased">
      {/* Dynamic Max Width Container */}
      <div className={`w-full transition-all duration-700 ${isStarted ? 'max-w-6xl pr-0 lg:pr-32' : 'max-w-2xl'}`}>
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-600 flex items-center justify-center rounded-[1.25rem] shadow-2xl shadow-red-200 text-white font-black text-2xl">政</div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">政务通 PRO</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">High Efficient Political Memory System</p>
            </div>
          </div>
          {!isStarted && (
             <button onClick={startSession} className="px-6 py-3 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg">开始今日背诵</button>
          )}
        </div>

        {!isStarted ? (
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: '库量', val: stats.total, sub: '题', color: 'text-slate-900' },
                { label: '达成', val: stats.learned, sub: '精通', color: 'text-emerald-500' },
                { label: '攻坚', val: stats.inProgress, sub: '在研', color: 'text-orange-500' },
                { label: '系数', val: stats.avgProficiency, sub: '熟练', color: 'text-blue-500' }
              ].map((s, i) => (
                <div key={i} className="text-center group">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">{s.label}</p>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className={`text-3xl font-black ${s.color}`}>{s.val}</span>
                    <span className="text-[10px] font-bold text-slate-300">{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
               <ProgressBar current={stats.learned + stats.inProgress} total={stats.total} label="知识点覆盖" />
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
               <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">知识地图</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {allQuestions.map(q => (
                    <div key={q.id} className="group flex items-center justify-between p-5 bg-slate-50 rounded-3xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                       <div className="flex-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-white px-2 py-0.5 rounded-full mb-1 inline-block border border-slate-100">{q.chapter}</span>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-red-700 transition-colors">{q.title}</p>
                       </div>
                       <div className="flex gap-0.5 ml-4">
                          {[1, 2, 3, 4, 5].map(v => (
                            <div key={v} className={`w-1 h-4 rounded-full ${q.proficiency >= v ? 'bg-red-500' : 'bg-slate-200'}`} />
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          /* Session View */
          <div className="relative animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 px-4 gap-4">
              <div className="text-left">
                <span className="text-[11px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-[0.2em] mb-3 inline-block">Chapter {currentQuestion?.chapter}</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{currentQuestion?.title}</h2>
              </div>
              <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-right shadow-xl">
                <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-1">Queue Status</p>
                <p className="text-xl font-black">{currentIndex + 1} <span className="text-slate-500 mx-1">/</span> {sessionQueue.length}</p>
              </div>
            </div>

            {/* Answer Display Area */}
            <div 
              onClick={() => !showAnswer && setShowAnswer(true)}
              className={`min-h-[550px] bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200 border border-slate-100 flex flex-col relative overflow-hidden transition-all duration-500 ${!showAnswer ? 'cursor-pointer hover:scale-[1.01] hover:shadow-red-100' : ''}`}
            >
              {!showAnswer ? (
                <div className="flex-1 flex flex-col items-center justify-center group bg-gradient-to-br from-white to-slate-50">
                  <div className="w-24 h-24 bg-white rounded-[2rem] shadow-lg flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform duration-500">
                     <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm animate-pulse">点击揭晓知识解析</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-2 md:p-1">
                  {/* Close Header Bar */}
                  <div className="h-12 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group rounded-t-[3.5rem]" onClick={() => setShowAnswer(false)}>
                     <div className="w-12 h-1.5 bg-slate-200 group-hover:bg-red-400 rounded-full transition-colors" />
                  </div>

                  {/* Dual Column Content */}
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-1 p-4 pt-0">
                    <div className="bg-orange-50/40 rounded-[2.5rem] p-8 md:p-10 border border-orange-100/50">
                       <h3 className="text-xl font-black text-orange-800 mb-6 flex items-center gap-2">
                         <div className="w-1 h-6 bg-orange-400 rounded-full" /> 记忆要点
                       </h3>
                       <div className="overflow-y-auto max-h-[500px] scrollbar-thin">
                         {currentQuestion && renderMarkdown(currentQuestion.mnemonic)}
                       </div>
                    </div>
                    <div className="bg-slate-50/50 rounded-[2.5rem] p-8 md:p-10 border border-slate-200/50 mt-4 lg:mt-0">
                       <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                         <div className="w-1 h-6 bg-slate-400 rounded-full" /> 完整解析
                       </h3>
                       <div className="overflow-y-auto max-h-[500px] scrollbar-thin">
                         {currentQuestion && renderMarkdown(currentQuestion.fullContent)}
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Control Sidebar */}
            <div className="fixed right-4 lg:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-50">
              {/* Navigation Group */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handlePrevious} 
                  disabled={currentIndex === 0}
                  className={`w-14 h-14 flex items-center justify-center rounded-2xl bg-white shadow-xl border border-slate-100 transition-all ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95 text-slate-600 hover:text-red-500'}`}
                  title="上一题"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
                </button>
              </div>

              {/* Proficiency Group - Only visible when answer is shown or as always available hub */}
              <div className={`flex flex-col gap-2 p-2 bg-white/80 backdrop-blur-md rounded-[2rem] shadow-2xl border border-red-50 transition-all duration-500 ${showAnswer ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-50 scale-90'}`}>
                <ProficiencyButton level={1} label="遗忘" onClick={() => handleProficiency(1)} />
                <ProficiencyButton level={2} label="生疏" onClick={() => handleProficiency(2)} />
                <ProficiencyButton level={3} label="模糊" onClick={() => handleProficiency(3)} />
                <ProficiencyButton level={4} label="掌握" onClick={() => handleProficiency(4)} />
                <ProficiencyButton level={5} label="烂熟" onClick={() => handleProficiency(5)} />
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleNext} 
                  className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl transition-all hover:scale-110 active:scale-95 hover:bg-red-600"
                  title="下一题"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsStarted(false)}
              className="mt-12 w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.5em] hover:text-red-500 transition-all flex items-center justify-center gap-3 group"
            >
              终止本次学习会话
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
