
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
  LEARNING = 'LEARNING',
  QUIZ = 'QUIZ',
  CELEBRATION = 'CELEBRATION'
}

export type Category = '數字' | '自然' | '人體' | '生活';
