
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
      if (!trimmed) return <div key={idx} className="h-1" />;
      
      if (trimmed.startsWith('**记忆口诀**')) {
        return <div key={idx} className="mt-2 mb-4 p-3 md:p-4 bg-red-600 text-white rounded-xl shadow-lg font-black italic text-center">
          <span className="text-sm md:text-base lg:text-lg">{trimmed.replace('**记忆口诀**：', '')}</span>
        </div>;
      }

      if (trimmed.startsWith('**核心要点**')) {
        return <h6 key={idx} className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] mt-4 mb-2">核心要点</h6>;
      }

      if (trimmed.startsWith('#####')) {
        return <h5 key={idx} className="font-bold text-slate-900 mt-4 mb-2 bg-slate-100/50 p-2 rounded-lg border-l-4 border-red-500 text-xs md:text-sm">
          {trimmed.replace('#####', '').trim()}
        </h5>;
      }

      if (trimmed.startsWith('####')) {
        return <h4 key={idx} className="font-black text-red-700 text-sm md:text-base mt-6 mb-3 border-b border-red-100 pb-2">
          {trimmed.replace('####', '').trim()}
        </h4>;
      }

      if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
        const isNumbered = /^\d+\./.test(trimmed);
        const bulletText = isNumbered ? trimmed.replace(/^\d+\./, '').trim() : trimmed.substring(1).trim();
        const parts = bulletText.split('**');
        
        return <div key={idx} className={`flex gap-3 mb-2 ${isNumbered ? 'ml-0' : 'ml-1'}`}>
          <span className={`flex-shrink-0 font-black text-[10px] h-5 w-5 flex items-center justify-center rounded-md ${isNumbered ? 'bg-slate-900 text-white' : 'text-red-400 bg-red-100'}`}>
            {isNumbered ? trimmed.split('.')[0] : '•'}
          </span>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-slate-900 font-bold underline decoration-yellow-300 decoration-2">{p}</strong> : p)}
          </p>
        </div>;
      }

      const parts = trimmed.split('**');
      return <p key={idx} className="text-sm md:text-base text-slate-500 leading-relaxed mb-3">
        {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-red-700 font-bold">{p}</strong> : p)}
      </p>;
    });
  };

  return (
    <div className="h-screen bg-[#f8fafc] flex flex-col items-center font-sans antialiased overflow-hidden">
      {/* 顶部容器，限制最大宽度并处理内边距 */}
      <div className={`w-full flex flex-col transition-all duration-700 h-full p-4 md:p-6 lg:p-8 ${isStarted ? 'max-w-6xl' : 'max-w-3xl overflow-y-auto'}`}>
        
        {!isStarted ? (
          <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col gap-6">
            {/* 首页页眉 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 flex items-center justify-center rounded-2xl shadow-xl text-white font-black text-2xl">政</div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">政务通 PRO</h1>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Political Memory Assistant</p>
                </div>
              </div>
              <button onClick={startSession} className="px-6 py-3 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-red-600 transition-all shadow-xl hover:scale-105 active:scale-95">开始今日背诵</button>
            </div>

            {/* 统计数据 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: '知识总量', val: stats.total, color: 'text-slate-900' },
                { label: '已精通', val: stats.learned, color: 'text-emerald-500' },
                { label: '攻坚中', val: stats.inProgress, color: 'text-orange-500' },
                { label: '熟练系数', val: stats.avgProficiency, color: 'text-blue-500' }
              ].map((s, i) => (
                <div key={i} className="text-center group">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-tighter">{s.label}</p>
                  <span className={`text-3xl font-black transition-transform group-hover:scale-110 inline-block ${s.color}`}>{s.val}</span>
                </div>
              ))}
            </div>

            {/* 进度 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
               <ProgressBar current={stats.learned + stats.inProgress} total={stats.total} label="知识库覆盖进度" />
            </div>

            {/* 详情列表 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col min-h-0">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-900">知识清单</h2>
                 <span className="text-[10px] font-bold text-slate-300">SCROLL TO EXPLORE</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2 scrollbar-thin">
                  {allQuestions.map(q => (
                    <div key={q.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-red-50">
                       <div className="flex-1 truncate pr-3">
                          <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter bg-red-50 px-2 py-0.5 rounded-md mr-2">{q.chapter}</span>
                          <span className="text-sm font-bold text-slate-700">{q.title}</span>
                       </div>
                       <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(v => (
                            <div key={v} className={`w-1.5 h-4 rounded-full transition-colors duration-700 ${q.proficiency >= v ? 'bg-red-500' : 'bg-slate-200'}`} />
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          /* 复习会话视图 - 锁定高度，一屏展示 */
          <div className="flex-1 flex flex-col min-h-0 relative animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* 题目顶部条 */}
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-black text-red-600 bg-red-50 px-4 py-1.5 rounded-xl uppercase border border-red-100 tracking-widest">{currentQuestion?.chapter}</span>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight transition-all">{currentQuestion?.title}</h2>
              </div>
              <div className="text-sm font-black text-slate-400 bg-white shadow-sm px-4 py-2 rounded-2xl border border-slate-100">
                {currentIndex + 1} <span className="text-slate-200 mx-2">/</span> {sessionQueue.length}
              </div>
            </div>

            {/* 核心内容卡片 - 动态撑开 */}
            <div 
              className={`flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden transition-all duration-500 ${!showAnswer ? 'cursor-pointer hover:bg-slate-50/80 group' : ''}`}
              onClick={() => !showAnswer && setShowAnswer(true)}
            >
              {!showAnswer ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12">
                  <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mb-8 text-red-500 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm animate-pulse">点击揭晓分析</p>
                  <p className="text-slate-300 text-xs mt-4">脑内尝试复述记忆口诀</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 min-h-0 animate-in fade-in">
                  {/* 收起控制条 */}
                  <div className="h-8 flex items-center justify-center cursor-pointer group mb-4" onClick={(e) => { e.stopPropagation(); setShowAnswer(false); }}>
                     <div className="w-16 h-1.5 bg-slate-100 group-hover:bg-red-400 rounded-full transition-all" />
                  </div>

                  {/* 双栏响应式内容区 */}
                  <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
                    {/* 左侧：口诀 */}
                    <div className="flex-1 flex flex-col bg-orange-50/40 rounded-[2rem] p-6 md:p-8 border border-orange-100/50 min-h-0">
                       <h3 className="text-xs font-black text-orange-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
                         <span className="w-1.5 h-4 bg-orange-400 rounded-full" /> 记忆快检
                       </h3>
                       <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                         {currentQuestion && renderMarkdown(currentQuestion.mnemonic)}
                       </div>
                    </div>
                    {/* 右侧：详解 */}
                    <div className="flex-[1.5] flex flex-col bg-slate-50/60 rounded-[2rem] p-6 md:p-8 border border-slate-200/50 min-h-0">
                       <h3 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
                         <span className="w-1.5 h-4 bg-slate-500 rounded-full" /> 逻辑详解
                       </h3>
                       <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                         {currentQuestion && renderMarkdown(currentQuestion.fullContent)}
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 底部控制与退出 */}
            <div className="mt-4 flex items-center justify-between px-2">
              <button 
                onClick={() => setIsStarted(false)}
                className="text-slate-300 font-black text-[10px] uppercase tracking-[0.4em] hover:text-red-500 transition-all px-4 py-2 hover:bg-red-50 rounded-xl"
              >
                退出本次会话
              </button>
              
              <div className="flex items-center gap-6">
                <button 
                  onClick={handlePrevious} 
                  disabled={currentIndex === 0}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-lg border border-slate-100 transition-all ${currentIndex === 0 ? 'opacity-20 pointer-events-none' : 'hover:scale-110 active:scale-95 text-slate-600 hover:text-red-600'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button 
                  onClick={handleNext} 
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl transition-all hover:scale-110 active:scale-95 hover:bg-red-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            </div>

            {/* 侧边评价反馈 - 灵动岛风格 */}
            <div className={`fixed right-6 lg:right-10 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2.5 bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-slate-100/50 transition-all duration-700 ${showAnswer ? 'translate-x-0 opacity-100' : 'translate-x-16 opacity-0 pointer-events-none'}`}>
              <div className="text-[8px] font-black text-slate-400 text-center uppercase tracking-widest mb-1">熟练度评分</div>
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  onClick={(e) => { e.stopPropagation(); handleProficiency(v as Proficiency); }}
                  className="w-11 h-11 flex flex-col items-center justify-center rounded-xl font-black text-sm transition-all hover:scale-110 active:scale-90 shadow-sm border border-transparent hover:border-white"
                  style={{ 
                    backgroundColor: ['','#fef2f2','#fff7ed','#fefce8','#eff6ff','#f0fdf4'][v],
                    color: ['','#dc2626','#ea580c','#ca8a04','#2563eb','#16a34a'][v]
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
