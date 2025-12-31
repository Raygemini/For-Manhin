
import { CharacterData, Category } from './types';

export const GRADE_1_WORDS: Record<Category, string[]> = {
  '數字': ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
  '自然': ['天', '地', '日', '月', '山', '水', '火', '風', '雨', '田'],
  '人體': ['口', '耳', '目', '手', '足', '心', '大', '小', '長', '短'],
  '生活': ['工', '人', '王', '力', '又', '寸', '木', '禾', '竹', '米']
};

export const COLORS = {
  primary: '#FF7043', // Orange-ish
  secondary: '#4DB6AC', // Teal
  accent: '#FBC02D', // Yellow
  background: '#FFF9C4', // Light Yellow
  border: '#D84315'
};
