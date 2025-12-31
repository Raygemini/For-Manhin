
import React, { useEffect, useRef, useState } from 'react';
import { GameState } from '../types';

interface StrokePracticeProps {
  character: string;
  gameState: GameState;
  onComplete: () => void;
}

declare const HanziWriter: any;

const StrokePractice: React.FC<StrokePracticeProps> = ({ character, gameState, onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !character) return;

    // Clear previous writer
    containerRef.current.innerHTML = '';
    setIsReady(false);

    const writer = HanziWriter.create(containerRef.current, character, {
      width: 280,
      height: 280,
      padding: 20,
      strokeColor: '#D84315',
      outlineColor: '#EEEEEE',
      drawingColor: '#33691E',
      highlightColor: '#FDD835',
      showOutline: true,
      showCharacter: false, // Don't show full char in quiz
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 300,
    });

    writerRef.current = writer;
    setIsReady(true);

    if (gameState === GameState.LEARNING) {
      writer.animateCharacter();
    } else if (gameState === GameState.QUIZ) {
      writer.quiz({
        onComplete: () => {
          setTimeout(() => {
            onComplete();
          }, 500);
        }
      });
    }

    return () => {
      if (writerRef.current) {
        writerRef.current.cancelQuiz();
      }
    };
  }, [character, gameState, onComplete]);

  const handleAnimate = () => {
    if (writerRef.current) {
      writerRef.current.animateCharacter();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={containerRef} 
        id="writer-container"
        className="relative touch-none cursor-pointer mb-6"
      />
      
      {gameState === GameState.LEARNING && isReady && (
        <button
          onClick={handleAnimate}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition active:scale-95 flex items-center space-x-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>看示範</span>
        </button>
      )}

      {gameState === GameState.QUIZ && (
        <div className="text-teal-700 font-bold animate-pulse text-lg font-kids">
          ★ 請按照正確順序寫一遍 ★
        </div>
      )}
    </div>
  );
};

export default StrokePractice;
