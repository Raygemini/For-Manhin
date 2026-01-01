
export interface WordInfo {
  word: string;
  meaning: string;
  pinyin: string;
  exampleSentence: string;
}

export interface CharacterData {
  char: string;
  category: string;
}

export enum GameState {
  START = 'START',
  SELECT_WORD = 'SELECT_WORD',
  LEARNING = 'LEARNING',
  QUIZ = 'QUIZ',
  CELEBRATION = 'CELEBRATION',
  ACHIEVEMENTS = 'ACHIEVEMENTS'
}

export type Category = '數字' | '自然' | '人體' | '生活';
