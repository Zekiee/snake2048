export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  id: string;
  radius: number;
  color: string;
  value: number; // The 2048 number value
}

export interface Food extends Entity {
  targetSize: number; // For spawn animation
  currentSize: number;
}

export interface Snake extends Entity {
  name: string;
  angle: number;
  speed: number;
  baseSpeed: number;
  turnSpeed: number;
  body: Point[];
  targetAngle: number;
  score: number;
  isBot: boolean;
  isDead: boolean;
  skin: string;
  dashing: boolean;
  killCount: number;
}

export interface Particle extends Point {
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface FloatingText extends Point {
  text: string;
  life: number;
  vy: number;
  color: string;
  size: number;
}

export interface KillEvent {
  killer: string;
  victim: string;
  timestamp: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}