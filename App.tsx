
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, Category, WordInfo } from './types';
import { GRADE_1_WORDS } from './constants';
import { fetchWordDetails } from './services/geminiService';
import StrokePractice from './components/StrokePractice';
import InfoCard from './components/InfoCard';

const STORAGE_KEY = 'stroke_order_mastered_words';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [category, setCategory] = useState<Category>('數字');
  const [wordIndex, setWordIndex] = useState(0);
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());

  const currentWord = useMemo(() => GRADE_1_WORDS[category][wordIndex], [category, wordIndex]);

  // 載入進度
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMasteredWords(new Set(parsed));
      } catch (e) {
        console.error('Failed to load progress', e);
      }
    }
  }, []);

  // 儲存進度
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(masteredWords)));
  }, [masteredWords]);

  const updateWordInfo = useCallback(async (word: string) => {
    setLoading(true);
    const details = await fetchWordDetails(word);
    setWordInfo(details);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (gameState === GameState.LEARNING || gameState === GameState.QUIZ) {
      updateWordInfo(currentWord);
    }
  }, [currentWord, gameState, updateWordInfo]);

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    setGameState(GameState.SELECT_WORD);
  };

  const handleWordSelect = (index: number) => {
    setWordIndex(index);
    setGameState(GameState.LEARNING);
  };

  const handleQuizComplete = () => {
    setMasteredWords(prev => {
      const next = new Set(prev);
      next.add(currentWord);
      return next;
    });
    setGameState(GameState.CELEBRATION);
  };

  const handleNext = () => {
    const nextIndex = wordIndex + 1;
    if (nextIndex < GRADE_1_WORDS[category].length) {
      setWordIndex(nextIndex);
      setGameState(GameState.LEARNING);
    } else {
      setGameState(GameState.SELECT_WORD);
    }
  };

  const handleClearProgress = () => {
    if (confirm('確定要清除所有學習進度嗎？這無法還原喔！')) {
      setMasteredWords(new Set());
      setGameState(GameState.START);
    }
  };

  const masteryLevel = useMemo(() => {
    const count = masteredWords.size;
    if (count >= 30) return { title: '筆順大宗師', icon: '👑', color: 'text-purple-600' };
    if (count >= 20) return { title: '高級狀元公', icon: '📜', color: 'text-red-600' };
    if (count >= 10) return { title: '中級小書生', icon: '🖋️', color: 'text-blue-600' };
    return { title: '初級小學徒', icon: '🌱', color: 'text-green-600' };
  }, [masteredWords.size]);

  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-start h-full p-6 text-center space-y-6 overflow-y-auto">
      <div className="mt-8">
        <h1 className="text-5xl font-bold text-orange-600 font-kids mb-2">筆順大冒險</h1>
        <div className={`flex items-center justify-center space-x-2 text-xl font-bold ${masteryLevel.color}`}>
          <span>{masteryLevel.icon}</span>
          <span className="font-kids">{masteryLevel.title}</span>
        </div>
      </div>

      {/* Progress Dashboard */}
      <div className="w-full bg-white/60 p-4 rounded-3xl border-2 border-white shadow-inner grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-500 font-bold">總掌握數</span>
          <span className="text-3xl font-bold text-orange-500 font-kids">{masteredWords.size}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-500 font-bold">學習進度</span>
          <span className="text-3xl font-bold text-teal-500 font-kids">
            {Math.round((masteredWords.size / 40) * 100)}%
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {(Object.keys(GRADE_1_WORDS) as Category[]).map(cat => {
          const words = GRADE_1_WORDS[cat];
          const masteredCount = words.filter(w => masteredWords.has(w)).length;
          const isFinished = masteredCount === words.length;
          
          return (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`relative bg-white border-4 ${isFinished ? 'border-yellow-400' : 'border-teal-400'} p-4 rounded-3xl shadow-lg hover:bg-teal-50 transform transition active:scale-95 flex flex-col items-center overflow-hidden`}
            >
              <span className="text-2xl font-bold text-teal-800 font-kids">{cat}</span>
              <span className={`text-xs font-bold ${isFinished ? 'text-yellow-600' : 'text-teal-600'}`}>
                {masteredCount} / {words.length}
              </span>
              {isFinished && <div className="absolute top-1 right-1 text-xs">🏆</div>}
            </button>
          );
        })}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => setGameState(GameState.ACHIEVEMENTS)}
          className="bg-orange-500 text-white px-6 py-2 rounded-full font-bold shadow-md active:scale-95 flex items-center space-x-2"
        >
          <span>🏆</span><span>我的成就</span>
        </button>
        <button
          onClick={handleClearProgress}
          className="bg-gray-200 text-gray-500 px-6 py-2 rounded-full font-bold shadow-md active:scale-95 text-xs"
        >
          重置
        </button>
      </div>
    </div>
  );

  const renderSelectWordScreen = () => (
    <div className="flex flex-col h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setGameState(GameState.START)} className="bg-white p-2 rounded-full shadow text-xl">🏠</button>
        <h2 className="text-3xl font-bold text-teal-800 font-kids">{category} 類別</h2>
        <div className="w-10"></div>
      </div>
      
      <div className="grid grid-cols-4 gap-3 overflow-y-auto flex-1 pb-6 px-1">
        {GRADE_1_WORDS[category].map((word, idx) => {
          const isMastered = masteredWords.has(word);
          return (
            <button
              key={word}
              onClick={() => handleWordSelect(idx)}
              className={`aspect-square rounded-2xl border-4 flex flex-col items-center justify-center text-2xl font-bold relative transition active:scale-90
                ${isMastered ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white border-teal-100 text-teal-800 shadow-sm'}
              `}
            >
              {word}
              {isMastered && <span className="absolute -top-1 -right-1 text-xs">⭐</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <button onClick={() => setGameState(GameState.START)} className="bg-white p-2 rounded-full shadow text-xl">🏠</button>
        <h2 className="text-3xl font-bold text-orange-600 font-kids">成就獎章</h2>
        <div className="w-10"></div>
      </div>

      <div className="bg-white/80 p-6 rounded-3xl border-4 border-yellow-400 text-center space-y-2">
        <div className="text-6xl">{masteryLevel.icon}</div>
        <div className="text-2xl font-bold font-kids">{masteryLevel.title}</div>
        <p className="text-sm text-gray-600">你已經成功掌握了 {masteredWords.size} 個生字！</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h3 className="font-bold text-teal-700 mb-3 ml-2">已學會的字：</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from(masteredWords).map(word => (
            <div key={word} className="w-12 h-12 bg-white rounded-xl border-2 border-orange-200 flex items-center justify-center text-xl font-bold text-orange-800 shadow-sm">
              {word}
            </div>
          ))}
          {masteredWords.size === 0 && <p className="text-gray-400 italic text-sm ml-2">還沒有學會任何字，加油喔！</p>}
        </div>
      </div>
    </div>
  );

  const renderGameScreen = () => (
    <div className="flex flex-col items-center justify-between h-full p-4 overflow-hidden">
      <div className="w-full flex justify-between items-center mb-2 shrink-0">
        <button 
          onClick={() => setGameState(GameState.SELECT_WORD)}
          className="bg-white p-3 rounded-full shadow border-2 border-gray-200 active:scale-90 transition"
        >
          ⬅️
        </button>
        <div className="flex items-center space-x-2 bg-yellow-400 px-4 py-1 rounded-full shadow border-2 border-yellow-600">
          <span className="font-bold text-yellow-900">{currentWord}</span>
          <span className="text-yellow-700 font-medium text-xs">({wordIndex + 1}/{GRADE_1_WORDS[category].length})</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xl">{masteredWords.has(currentWord) ? '✅' : '⭐'}</span>
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center py-2 space-y-4">
        <StrokePractice 
          character={currentWord} 
          gameState={gameState} 
          onComplete={handleQuizComplete}
        />
        <div className="w-full flex justify-center px-2">
          <InfoCard info={wordInfo} loading={loading} />
        </div>
      </div>

      <div className="w-full flex justify-center py-4 shrink-0">
        {gameState === GameState.LEARNING && (
          <button
            onClick={() => setGameState(GameState.QUIZ)}
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 px-10 rounded-full shadow-xl transform transition active:scale-95 text-xl font-kids"
          >
            我學會了，去測驗！
          </button>
        )}
      </div>

      {gameState === GameState.CELEBRATION && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl border-8 border-yellow-400 max-w-xs transform animate-bounce-short">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-orange-600 font-kids mb-2">太棒了！</h2>
            <p className="text-teal-700 font-medium mb-6">你正確寫出了「{currentWord}」！</p>
            <button
              onClick={handleNext}
              className="w-full bg-orange-500 text-white font-bold py-3 rounded-full shadow-lg text-xl active:scale-95"
            >
              繼續挑戰
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#FFF9C4] relative overflow-hidden select-none">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/30 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 -right-10 w-60 h-60 bg-teal-200/20 rounded-full blur-3xl"></div>
      
      <main className="relative z-10 h-full w-full max-w-md mx-auto bg-[#FFF9C4]">
        {gameState === GameState.START && renderStartScreen()}
        {gameState === GameState.SELECT_WORD && renderSelectWordScreen()}
        {gameState === GameState.ACHIEVEMENTS && renderAchievements()}
        {(gameState === GameState.LEARNING || gameState === GameState.QUIZ || gameState === GameState.CELEBRATION) && renderGameScreen()}
      </main>

      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-short {
          animation: bounce-short 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
