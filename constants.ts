export const MAP_SIZE = 3000;
export const INITIAL_SNAKE_VALUE = 2;
export const BASE_RADIUS = 20;
export const VIEWPORT_PADDING = 100;

export const BOT_NAMES = [
  "Dmitry", "Ivan", "Anastasia", "Boris", "Katya", 
  "Sergei", "Vladimir", "Olga", "Yuri", "Natasha",
  "Igor", "Svetlana", "Viktor", "Tatiana", "Mishka",
  "SnakeKing", "ProGamer", "NoobSlayer", "IO_Master"
];

// Colors for the 2048 values
export const VALUE_COLORS: Record<number, string> = {
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e',
  4096: '#3c3a32',
};

export const DEFAULT_COLOR = '#3c3a32';

export const getSnakeColor = (value: number): string => {
  return VALUE_COLORS[value] || DEFAULT_COLOR;
};

// Text color for the number on the snake/food
export const getTextColor = (value: number): string => {
  return value >= 8 ? '#f9f6f2' : '#776e65';
};

export const INITIAL_BOT_COUNT = 15;
export const FOOD_COUNT = 100;