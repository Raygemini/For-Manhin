
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GameState, Category, WordInfo } from './types';
import { GRADE_1_WORDS } from './constants';
import { fetchWordDetails } from './services/geminiService';
import StrokePractice from './components/StrokePractice';
import InfoCard from './components/InfoCard';

const STORAGE_KEY = 'stroke_order_mastered_words';
const AVATAR_KEY = 'stroke_order_avatar';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [category, setCategory] = useState<Category>('數字');
  const [wordIndex, setWordIndex] = useState(0);
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentWord = useMemo(() => GRADE_1_WORDS[category][wordIndex], [category, wordIndex]);

  useEffect(() => {
    const savedWords = localStorage.getItem(STORAGE_KEY);
    if (savedWords) {
      try {
        setMasteredWords(new Set(JSON.parse(savedWords)));
      } catch (e) { console.error(e); }
    }
    const savedAvatar = localStorage.getItem(AVATAR_KEY);
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(masteredWords)));
  }, [masteredWords]);

  useEffect(() => {
    if (avatar) localStorage.setItem(AVATAR_KEY, avatar);
  }, [avatar]);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAICharacter = async () => {
    if (!avatarPrompt.trim()) return;
    setIsGeneratingAvatar(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A cute, high-quality cartoon character for a kids learning app. Subject: ${avatarPrompt}. Style: 3D render, vibrant colors, white background, simple shape, friendly expression, holding a pencil or brush.` }]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of response.candidates![0].content.parts) {
        if (part.inlineData) {
          setAvatar(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error("Failed to generate avatar:", error);
      alert("召喚失敗了，請稍後再試試看！");
    } finally {
      setIsGeneratingAvatar(false);
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
      <div className="mt-8 relative">
        <div className="w-24 h-24 bg-white rounded-full border-4 border-orange-400 shadow-lg mx-auto mb-2 overflow-hidden flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">👤</span>
          )}
        </div>
        <h1 className="text-4xl font-bold text-orange-600 font-kids mb-1">筆順大冒險</h1>
        <div className={`flex items-center justify-center space-x-2 text-lg font-bold ${masteryLevel.color}`}>
          <span>{masteryLevel.icon}</span>
          <span className="font-kids">{masteryLevel.title}</span>
        </div>
      </div>

      <div className="w-full bg-white/60 p-4 rounded-3xl border-2 border-white shadow-inner grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">總掌握數</span>
          <span className="text-3xl font-bold text-orange-500 font-kids">{masteredWords.size}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">學習進度</span>
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
              onClick={() => { setCategory(cat); setGameState(GameState.SELECT_WORD); }}
              className={`relative bg-white border-4 ${isFinished ? 'border-yellow-400' : 'border-teal-400'} p-4 rounded-3xl shadow-lg hover:bg-teal-50 transform transition active:scale-95 flex flex-col items-center overflow-hidden`}
            >
              <span className="text-2xl font-bold text-teal-800 font-kids">{cat}</span>
              <span className={`text-xs font-bold ${isFinished ? 'text-yellow-600' : 'text-teal-600'}`}>
                {masteredCount} / {words.length}
              </span>
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
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => setGameState(GameState.START)} className="bg-white p-2 rounded-full shadow text-xl">🏠</button>
        <h2 className="text-3xl font-bold text-orange-600 font-kids">我的小天地</h2>
        <div className="w-10"></div>
      </div>

      {/* Avatar Customization */}
      <div className="bg-white/90 p-5 rounded-3xl border-4 border-yellow-400 space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 bg-orange-100 rounded-3xl border-4 border-orange-300 overflow-hidden shadow-inner flex items-center justify-center">
             {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="text-6xl text-orange-300">?</div>}
          </div>
          
          <div className="w-full grid grid-cols-2 gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border-2 border-teal-500 text-teal-700 py-2 rounded-xl font-bold text-sm shadow-sm active:scale-95"
            >
              📂 上傳我的圖標
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              onClick={() => setAvatar(null)}
              className="bg-gray-100 border-2 border-gray-300 text-gray-600 py-2 rounded-xl font-bold text-sm shadow-sm active:scale-95"
            >
              🗑️ 移除圖標
            </button>
          </div>
        </div>

        <div className="border-t-2 border-dashed border-gray-200 pt-4">
          <p className="text-sm font-bold text-teal-700 mb-2">或是讓 AI 幫你變一個：</p>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="輸入如：拿著毛筆的小狗" 
              value={avatarPrompt}
              onChange={(e) => setAvatarPrompt(e.target.value)}
              className="flex-1 text-sm border-2 border-teal-100 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
            />
            <button 
              onClick={generateAICharacter}
              disabled={isGeneratingAvatar || !avatarPrompt}
              className={`px-4 rounded-xl font-bold text-white shadow-md transition transform active:scale-95 ${isGeneratingAvatar ? 'bg-gray-400' : 'bg-teal-500'}`}
            >
              {isGeneratingAvatar ? '...' : '召喚'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-teal-700 mb-3 ml-2">已掌握的生字徽章：</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from(masteredWords).map(word => (
            <div key={word} className="w-12 h-12 bg-white rounded-xl border-2 border-orange-200 flex items-center justify-center text-xl font-bold text-orange-800 shadow-sm">
              {word}
            </div>
          ))}
          {masteredWords.size === 0 && <p className="text-gray-400 italic text-sm ml-2">快去開始你的筆順冒險吧！</p>}
        </div>
      </div>
      
      <button
        onClick={() => { if(confirm('重置所有進度與夥伴嗎？')) { localStorage.clear(); window.location.reload(); } }}
        className="text-xs text-gray-400 underline py-4"
      >
        清除所有資料
      </button>
    </div>
  );

  const renderSelectWordScreen = () => (
    <div className="flex flex-col h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setGameState(GameState.START)} className="bg-white p-2 rounded-full shadow text-xl">🏠</button>
        <h2 className="text-3xl font-bold text-teal-800 font-kids">{category}</h2>
        <div className="w-10"></div>
      </div>
      <div className="grid grid-cols-4 gap-3 overflow-y-auto flex-1 pb-6 px-1">
        {GRADE_1_WORDS[category].map((word, idx) => {
          const isMastered = masteredWords.has(word);
          return (
            <button
              key={word}
              onClick={() => { setWordIndex(idx); setGameState(GameState.LEARNING); }}
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

  const renderGameScreen = () => (
    <div className="flex flex-col items-center justify-between h-full p-4 overflow-hidden">
      <div className="w-full flex justify-between items-center mb-2 shrink-0">
        <button onClick={() => setGameState(GameState.SELECT_WORD)} className="bg-white p-3 rounded-full shadow border-2 border-gray-200 active:scale-90 transition">⬅️</button>
        <div className="flex items-center space-x-2 bg-yellow-400 px-4 py-1 rounded-full shadow border-2 border-yellow-600">
          <span className="font-bold text-yellow-900">{currentWord}</span>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-white">
          {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="text-center text-xl">👤</div>}
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center py-2 space-y-4">
        <StrokePractice character={currentWord} gameState={gameState} onComplete={() => setGameState(GameState.CELEBRATION)} />
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
              onClick={() => {
                setMasteredWords(prev => new Set(prev).add(currentWord));
                const nextIndex = wordIndex + 1;
                if (nextIndex < GRADE_1_WORDS[category].length) { setWordIndex(nextIndex); setGameState(GameState.LEARNING); }
                else { setGameState(GameState.SELECT_WORD); }
              }}
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
      <main className="relative z-10 h-full w-full max-w-md mx-auto bg-[#FFF9C4]">
        {gameState === GameState.START && renderStartScreen()}
        {gameState === GameState.SELECT_WORD && renderSelectWordScreen()}
        {gameState === GameState.ACHIEVEMENTS && renderAchievements()}
        {(gameState === GameState.LEARNING || gameState === GameState.QUIZ || gameState === GameState.CELEBRATION) && renderGameScreen()}
      </main>
      <style>{`
        @keyframes bounce-short { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-short { animation: bounce-short 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
