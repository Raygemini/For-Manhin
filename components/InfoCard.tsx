
import React from 'react';
import { WordInfo } from '../types';

interface InfoCardProps {
  info: WordInfo | null;
  loading: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ info, loading }) => {
  if (loading) {
    return (
      <div className="bg-white/80 p-6 rounded-3xl shadow-md border-4 border-white animate-pulse w-full max-w-sm">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="bg-white/90 p-6 rounded-3xl shadow-xl border-4 border-teal-200 w-full max-w-sm transform hover:scale-105 transition-transform duration-300">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-4xl font-bold text-teal-800 font-kids">{info.word}</h2>
        <span className="bg-teal-100 text-teal-800 text-sm px-3 py-1 rounded-full font-bold">
          {info.pinyin}
        </span>
      </div>
      <p className="text-gray-700 text-lg mb-3 font-medium leading-tight">
        {info.meaning}
      </p>
      <div className="bg-orange-50 p-3 rounded-2xl border-2 border-orange-100 italic text-orange-800">
        「{info.exampleSentence}」
      </div>
    </div>
  );
};

export default InfoCard;
