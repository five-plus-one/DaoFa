
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
    // 取前 15 题作为一组学习
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
      
      // 记忆口诀 - 大色块显示
      if (trimmed.startsWith('**记忆口诀**')) {
        return <div key={idx} className="mt-2 mb-6 p-4 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-100 font-black italic text-center">
          <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1 not-italic font-bold">Mnemonic Device</div>
          <span className="text-lg">{trimmed.replace('**记忆口诀**：', '')}</span>
        </div>;
      }

      // 核心要点标题
      if (trimmed.startsWith('**核心要点**')) {
        return <h6 key={idx} className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em] mt-6 mb-4 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-slate-200" />
          核心要点梳理
          <span className="w-8 h-[1px] bg-slate-200" />
        </h6>;
      }

      // H5 - 小节标题
      if (trimmed.startsWith('#####')) {
        return <h5 key={idx} className="font-black text-slate-900 mt-6 mb-3 flex items-center gap-2 bg-white p-2 rounded-lg border-l-4 border-red-500 shadow-sm text-sm">
          {trimmed.replace('#####', '').trim()}
        </h5>;
      }

      // H4 - 重要标题
      if (trimmed.startsWith('####')) {
        return <h4 key={idx} className="font-black text-red-700 text-lg mt-8 mb-4 border-b-2 border-red-50 pb-2">
          {trimmed.replace('####', '').trim()}
        </h4>;
      }

      // 列表项渲染
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
        const isNumbered = /^\d+\./.test(trimmed);
        const bulletText = isNumbered ? trimmed.replace(/^\d+\./, '').trim() : trimmed.substring(1).trim();
        const parts = bulletText.split('**');
        
        return <div key={idx} className={`flex gap-3 mb-2.5 ${isNumbered ? 'ml-0' : 'ml-1'}`}>
          <span className={`flex-shrink-0 font-black text-xs h-5 w-5 flex items-center justify-center rounded-md ${isNumbered ? 'bg-slate-900 text-white' : 'text-red-400 bg-red-50'}`}>
            {isNumbered ? trimmed.split('.')[0] : '•'}
          </span>
          <p className="text-sm text-slate-600 leading-relaxed pt-0.5">
            {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-slate-900 font-black bg-yellow-50 px-0.5">{p}</strong> : p)}
          </p>
        </div>;
      }

      // 普通段落，支持 ** 加粗
      const parts = trimmed.split('**');
      return <p key={idx} className="text-sm text-slate-500 leading-loose mb-3">
        {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-red-700 font-bold">{p}</strong> : p)}
      </p>;
    });
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col items-center py-6 px-4 font-sans antialiased overflow-x-hidden">
      {/* 动态宽度容器 */}
      <div className={`w-full transition-all duration-700 ${isStarted ? 'max-w-6xl pr-0 lg:pr-32' : 'max-w-3xl'}`}>
        
        {/* 页眉 */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-red-600 flex items-center justify-center rounded-[1.5rem] shadow-2xl shadow-red-200 text-white font-black text-3xl">政</div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">政务通 PRO</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">High Efficient Political Memory System</p>
              </div>
            </div>
          </div>
          {!isStarted && (
             <button onClick={startSession} className="px-8 py-4 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95 shadow-2xl">开始今日冲刺</button>
          )}
        </div>

        {!isStarted ? (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {/* 统计看板 */}
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: '知识总量', val: stats.total, sub: 'POINTS', color: 'text-slate-900' },
                { label: '已达成', val: stats.learned, sub: 'MASTERED', color: 'text-emerald-500' },
                { label: '在攻坚', val: stats.inProgress, sub: 'WORKING', color: 'text-orange-500' },
                { label: '当前熟练度', val: stats.avgProficiency, sub: 'INDEX', color: 'text-blue-500' }
              ].map((s, i) => (
                <div key={i} className="text-center group border-r border-slate-50 last:border-0 pr-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-widest">{s.label}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-black ${s.color}`}>{s.val}</span>
                  </div>
                  <p className="text-[8px] font-bold text-slate-200 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* 进度条 */}
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
               <ProgressBar current={stats.learned + stats.inProgress} total={stats.total} label="全考点覆盖率" />
            </div>

            {/* 列表试图 */}
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">知识图谱详单</h2>
                  <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-400">TOTAL {allQuestions.length} ITEMS</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin">
                  {allQuestions.map(q => (
                    <div key={q.id} className="group flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all border border-transparent hover:border-red-100">
                       <div className="flex-1">
                          <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md mb-2 inline-block border border-red-100/30">{q.chapter}</span>
                          <p className="text-base font-bold text-slate-800 group-hover:text-red-700 transition-colors leading-tight">{q.title}</p>
                       </div>
                       <div className="flex gap-1 ml-4 bg-white p-2 rounded-xl border border-slate-100">
                          {[1, 2, 3, 4, 5].map(v => (
                            <div key={v} className={`w-1.5 h-6 rounded-full transition-all duration-500 ${q.proficiency >= v ? 'bg-red-500' : 'bg-slate-100'}`} />
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          /* 学习会话视图 */
          <div className="relative animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {/* 题目头部 */}
            <div className="flex flex-col md:flex-row justify-between items-start lg:items-end mb-10 px-4 gap-6">
              <div className="text-left flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-black text-red-600 bg-red-50 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-red-100">CHAPTER: {currentQuestion?.chapter}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  <span className="text-[11px] font-black text-slate-400">政治思想道德与法治</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">{currentQuestion?.title}</h2>
              </div>
              <div className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] text-right shadow-2xl flex flex-col items-end">
                <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-2">Session Progress</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{currentIndex + 1}</span>
                  <span className="text-slate-600 text-sm font-bold">/ {sessionQueue.length}</span>
                </div>
              </div>
            </div>

            {/* 内容卡片 */}
            <div 
              onClick={() => !showAnswer && setShowAnswer(true)}
              className={`min-h-[650px] bg-white rounded-[4rem] shadow-2xl shadow-slate-200 border border-slate-100 flex flex-col relative overflow-hidden transition-all duration-500 ${!showAnswer ? 'cursor-pointer hover:scale-[1.01] hover:shadow-red-200' : ''}`}
            >
              {!showAnswer ? (
                <div className="flex-1 flex flex-col items-center justify-center group bg-gradient-to-br from-white to-slate-50">
                  <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-10 group-hover:rotate-12 transition-transform duration-700">
                     <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-900 font-black text-xl mb-2">脑内回忆答案...</p>
                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Click to Reveal Analysis</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-4 animate-in fade-in duration-500">
                  {/* 收起条 */}
                  <div className="h-10 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group rounded-t-[4rem] mb-2" onClick={() => setShowAnswer(false)}>
                     <div className="w-16 h-1.5 bg-slate-100 group-hover:bg-red-400 rounded-full transition-colors" />
                  </div>

                  {/* 分栏内容区域 */}
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-2 lg:p-4 pt-0">
                    {/* 左侧：要点 (橙) */}
                    <div className="bg-orange-50/30 rounded-[3rem] p-8 lg:p-12 border border-orange-100/50 shadow-inner overflow-hidden flex flex-col">
                       <h3 className="text-2xl font-black text-orange-800 mb-8 flex items-center gap-3">
                         <span className="w-1.5 h-8 bg-orange-400 rounded-full" /> 记忆快检
                       </h3>
                       <div className="overflow-y-auto pr-4 scrollbar-thin flex-1">
                         {currentQuestion && renderMarkdown(currentQuestion.mnemonic)}
                       </div>
                    </div>
                    {/* 右侧：详细 (蓝) */}
                    <div className="bg-slate-50/50 rounded-[3rem] p-8 lg:p-12 border border-slate-200/50 shadow-inner mt-4 lg:mt-0 overflow-hidden flex flex-col">
                       <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                         <span className="w-1.5 h-8 bg-slate-500 rounded-full" /> 逻辑详解
                       </h3>
                       <div className="overflow-y-auto pr-4 scrollbar-thin flex-1">
                         {currentQuestion && renderMarkdown(currentQuestion.fullContent)}
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧悬浮控制中枢 */}
            <div className="fixed right-6 lg:right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-8 z-50">
              {/* 导航按钮组 */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handlePrevious} 
                  disabled={currentIndex === 0}
                  className={`w-16 h-16 flex items-center justify-center rounded-3xl bg-white shadow-2xl border border-slate-100 transition-all ${currentIndex === 0 ? 'opacity-20 cursor-not-allowed scale-90' : 'hover:scale-110 active:scale-95 text-slate-600 hover:text-red-500 hover:border-red-100'}`}
                  title="PREV ITEM"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
                </button>
              </div>

              {/* 核心评价区 */}
              <div className={`flex flex-col gap-2 p-2.5 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-red-50/50 transition-all duration-700 ${showAnswer ? 'translate-x-0 opacity-100 rotate-0' : 'translate-x-6 opacity-30 rotate-12 scale-90'}`}>
                <div className="text-[8px] font-black text-slate-400 text-center uppercase tracking-widest mb-2 px-2">Skill Rating</div>
                <ProficiencyButton level={1} label="遗忘" onClick={() => handleProficiency(1)} />
                <ProficiencyButton level={2} label="生疏" onClick={() => handleProficiency(2)} />
                <ProficiencyButton level={3} label="模糊" onClick={() => handleProficiency(3)} />
                <ProficiencyButton level={4} label="掌握" onClick={() => handleProficiency(4)} />
                <ProficiencyButton level={5} label="烂熟" onClick={() => handleProficiency(5)} />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleNext} 
                  className="w-16 h-16 flex items-center justify-center rounded-3xl bg-slate-900 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 hover:bg-red-600 hover:rotate-3"
                  title="NEXT ITEM"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            </div>

            {/* 会话退出 */}
            <div className="mt-12 mb-20 flex justify-center">
              <button 
                onClick={() => setIsStarted(false)}
                className="px-8 py-3 bg-white border border-slate-100 rounded-full text-slate-300 font-black text-[10px] uppercase tracking-[0.5em] hover:text-red-500 hover:bg-red-50 transition-all"
              >
                End Current Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
