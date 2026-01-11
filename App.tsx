
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_QUESTIONS } from './data';
import { Question, Proficiency } from './types';
import { ProgressBar } from './components/ProgressBar';
import { ProficiencyButton } from './components/ProficiencyButton';

// Utility to shuffle array
const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const App: React.FC = () => {
  // Global questions state
  const [allQuestions, setAllQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  
  // Session states
  const [sessionQueue, setSessionQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionResults, setSessionResults] = useState<{id: string, proficiency: Proficiency}[]>([]);

  // Derived states
  const currentQuestionId = sessionQueue[currentIndex];
  const currentQuestion = useMemo(() => 
    allQuestions.find(q => q.id === currentQuestionId),
    [allQuestions, currentQuestionId]
  );

  const stats = useMemo(() => {
    const total = allQuestions.length;
    const learned = allQuestions.filter(q => q.proficiency >= 4).length;
    const inProgress = allQuestions.filter(q => q.proficiency > 0 && q.proficiency < 4).length;
    const avgProficiency = (allQuestions.reduce((acc, q) => acc + q.proficiency, 0) / total).toFixed(1);
    return { total, learned, inProgress, avgProficiency };
  }, [allQuestions]);

  // Start a new session
  const startSession = useCallback(() => {
    // Logic: 
    // 1. Pick unlearned questions (low proficiency)
    // 2. Mix some learned ones for review
    // 3. Shuffle
    const pool = [...allQuestions].sort((a, b) => a.proficiency - b.proficiency);
    const sessionIds = shuffle(pool.slice(0, 10)).map(q => q.id);
    
    setSessionQueue(sessionIds);
    setCurrentIndex(0);
    setIsStarted(true);
    setShowAnswer(false);
    setSessionResults([]);
  }, [allQuestions]);

  const handleProficiency = (level: Proficiency) => {
    if (!currentQuestion) return;

    // Record result for session summary
    setSessionResults(prev => [...prev, { id: currentQuestion.id, proficiency: level }]);

    // Update global questions state
    setAllQuestions(prev => prev.map(q => {
      if (q.id === currentQuestion.id) {
        return {
          ...q,
          proficiency: level,
          attempts: q.attempts + 1
        };
      }
      return q;
    }));

    // If proficiency is very low, we might want to repeat it in the NEXT session
    // But for the current session flow, we just move forward
    if (currentIndex < sessionQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Session finished
      setIsStarted(false);
    }
  };

  const renderContent = (text: string) => {
    // Simple parser for our specific format
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;
      
      // Headers
      if (trimmed.startsWith('#####')) return <h5 key={idx} className="text-slate-800 font-bold mt-4 mb-2">{trimmed.replace('#####', '').trim()}</h5>;
      if (trimmed.startsWith('####')) return <h4 key={idx} className="text-slate-900 font-bold mt-6 mb-3 border-b pb-1 border-red-100">{trimmed.replace('####', '').trim()}</h4>;
      
      // Formatting
      let content = trimmed;
      // Bold items
      const boldParts = content.split('**');
      const elements = boldParts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-red-600 font-bold">{part}</strong> : part);
      
      return <p key={idx} className="text-slate-600 leading-relaxed mb-1">{elements}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 flex items-center justify-center gap-2">
          <span className="bg-red-600 text-white px-3 py-1 rounded-lg">政</span>
          政务通：政治学习系统
        </h1>
        <p className="text-slate-500">科学背诵，高效提分</p>
      </div>

      {!isStarted ? (
        <div className="w-full max-w-2xl space-y-6">
          {/* Stats Dashboard */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">题目总数</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">已精通</p>
              <p className="text-2xl font-bold text-green-600">{stats.learned}</p>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">学习中</p>
              <p className="text-2xl font-bold text-orange-500">{stats.inProgress}</p>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">平均熟练度</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgProficiency}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">学习进度概览</h2>
            <div className="space-y-6">
              <ProgressBar current={stats.learned + stats.inProgress} total={stats.total} label="掌握进度" />
              <div className="flex flex-col gap-3">
                <button 
                  onClick={startSession}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 group"
                >
                  开始随机抽题模式
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                </button>
                <p className="text-xs text-center text-slate-400">系统将根据您的历史熟练度智能分配 10 道题目</p>
              </div>
            </div>
          </div>

          {/* Detailed List */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">知识清单</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {allQuestions.map(q => (
                <div key={q.id} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium uppercase">{q.chapter}</span>
                       <span className="text-xs text-slate-400">尝试次数: {q.attempts}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700">{q.title}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div 
                        key={lvl} 
                        className={`w-1.5 h-4 rounded-full ${q.proficiency >= lvl ? 'bg-red-500' : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Session View */
        <div className="w-full max-w-2xl flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <ProgressBar current={currentIndex + 1} total={sessionQueue.length} label={`题目 ${currentIndex + 1}`} />
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[400px] flex flex-col relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <svg className="w-32 h-32 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>
            </div>

            <div className="relative z-10 flex-1">
              <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
                {currentQuestion?.chapter}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 leading-snug">
                {currentQuestion?.title}
              </h2>

              {showAnswer ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 cursor-pointer" onClick={() => setShowAnswer(false)}>
                   <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 markdown-content overflow-y-auto max-h-[500px] hover:border-red-100 transition-colors relative group">
                      <div className="absolute top-2 right-4 text-[10px] text-slate-300 group-hover:text-red-400 font-bold uppercase">点击卡片收起答案</div>
                      {currentQuestion && renderContent(currentQuestion.content)}
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 group cursor-pointer hover:bg-white hover:border-red-200 transition-all"
                     onClick={() => setShowAnswer(true)}>
                  <p className="text-slate-400 group-hover:text-red-500 font-medium transition-colors">点击查看答案</p>
                </div>
              )}
            </div>

            {showAnswer && (
              <div className="mt-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <p className="text-center text-sm font-semibold text-slate-400 mb-4">本题掌握熟练度评估</p>
                <div className="grid grid-cols-5 gap-3">
                  <ProficiencyButton level={1} label="完全不会" onClick={() => handleProficiency(1)} />
                  <ProficiencyButton level={2} label="比较生疏" onClick={() => handleProficiency(2)} />
                  <ProficiencyButton level={3} label="大致了解" onClick={() => handleProficiency(3)} />
                  <ProficiencyButton level={4} label="基本掌握" onClick={() => handleProficiency(4)} />
                  <ProficiencyButton level={5} label="烂熟于心" onClick={() => handleProficiency(5)} />
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsStarted(false)}
            className="text-slate-400 hover:text-slate-600 font-medium py-2 transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            退出当前会话
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
