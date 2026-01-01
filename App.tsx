
import React, { useState, useEffect, useCallback } from 'react';
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
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const currentWord = GRADE_1_WORDS[category][wordIndex];

  // 初始化：載入進度與安裝提示
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

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
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
    if (gameState !== GameState.START) {
      updateWordInfo(currentWord);
    }
  }, [currentWord, gameState, updateWordInfo]);

  const handleStart = (cat: Category) => {
    setCategory(cat);
    setGameState(GameState.LEARNING);
    setWordIndex(0);
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
      setGameState(GameState.START);
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const getCategoryProgress = (cat: Category) => {
    const words = GRADE_1_WORDS[cat];
    const masteredCount = words.filter(w => masteredWords.has(w)).length;
    return {
      count: masteredCount,
      total: words.length,
      percent: (masteredCount / words.length) * 100
    };
  };

  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8">
      <div className="animate-bounce">
        <h1 className="text-5xl font-bold text-orange-600 font-kids mb-2">筆順大冒險</h1>
        <p className="text-teal-700 font-bold text-xl">一邊玩一邊學寫字！</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {(Object.keys(GRADE_1_WORDS) as Category[]).map(cat => {
          const prog = getCategoryProgress(cat);
          const isFinished = prog.count === prog.total;
          return (
            <button
              key={cat}
              onClick={() => handleStart(cat)}
              className={`relative bg-white border-4 ${isFinished ? 'border-yellow-400' : 'border-teal-400'} p-4 rounded-3xl shadow-lg hover:bg-teal-50 transform transition active:scale-95 flex flex-col items-center overflow-hidden`}
            >
              {/* Progress Bar Background */}
              <div 
                className="absolute bottom-0 left-0 h-1 bg-teal-400 transition-all duration-500" 
                style={{ width: `${prog.percent}%` }}
              />
              
              <span className="text-2xl font-bold text-teal-800 font-kids">{cat}</span>
              <div className="flex items-center space-x-1 mt-1">
                <span className={`text-xs font-bold ${isFinished ? 'text-yellow-600' : 'text-teal-600'}`}>
                  {prog.count} / {prog.total}
                </span>
                {isFinished && <span className="text-xs">🏆</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-white/50 rounded-full flex items-center space-x-2 border-2 border-white/80">
          <span className="text-3xl">⭐</span>
          <span className="text-2xl font-bold text-orange-600 font-kids">
            已學會 {masteredWords.size} 個字
          </span>
        </div>

        {installPrompt && (
          <button
            onClick={handleInstall}
            className="bg-orange-100 text-orange-700 border-2 border-orange-400 px-6 py-2 rounded-full text-sm font-bold flex items-center space-x-2 animate-pulse"
          >
            <span>📥 安裝到手機桌面</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderGameScreen = () => (
    <div className="flex flex-col items-center justify-between h-full p-4 overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-2 shrink-0">
        <button 
          onClick={() => setGameState(GameState.START)}
          className="bg-white p-3 rounded-full shadow border-2 border-gray-200 active:scale-90 transition"
        >
          🏠
        </button>
        <div className="flex items-center space-x-2 bg-yellow-400 px-4 py-1 rounded-full shadow border-2 border-yellow-600">
          <span className="font-bold text-yellow-900">{category}</span>
          <span className="text-yellow-700 font-medium text-xs">({wordIndex + 1}/{GRADE_1_WORDS[category].length})</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xl">{masteredWords.has(currentWord) ? '✅' : '⭐'}</span>
          <span className="font-bold text-orange-600">{masteredWords.size}</span>
        </div>
      </div>

      {/* Main Content Area */}
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

      {/* Footer Controls */}
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

      {/* Celebration Overlay */}
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
              下一個字
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
        {gameState === GameState.START ? renderStartScreen() : renderGameScreen()}
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
