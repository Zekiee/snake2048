import React, { useRef, useEffect } from 'react';
import { GameState, Snake, Food, Particle, FloatingText, KillEvent, Point } from '../types';
import { MAP_SIZE, INITIAL_SNAKE_VALUE, BASE_RADIUS, BOT_NAMES, getSnakeColor, getTextColor, INITIAL_BOT_COUNT, FOOD_COUNT } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setLeaderboard: (data: { name: string; score: number; isMe: boolean }[]) => void;
  setKillFeed: (feed: KillEvent[]) => void;
  playerName: string;
  controlsRef: React.MutableRefObject<{ dashing: boolean }>;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  setGameState, 
  setScore, 
  setLeaderboard,
  setKillFeed,
  playerName,
  controlsRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs
  const playerRef = useRef<Snake | null>(null);
  const botsRef = useRef<Snake[]>([]);
  const foodsRef = useRef<Food[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const killFeedRef = useRef<KillEvent[]>([]);
  const attractModeTargetIndex = useRef<number>(0);
  
  // State tracking for Loop
  const gameStateRef = useRef(gameState);
  const initializedRef = useRef(false);

  // Inputs
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  // Sync prop to ref
  useEffect(() => {
    // If transitioning TO playing from MENU/GAMEOVER, we might want to respawn player
    if (gameState === GameState.PLAYING && gameStateRef.current !== GameState.PLAYING) {
       startPlayerRun();
    }
    gameStateRef.current = gameState;
  }, [gameState, playerName]);

  // --- Helper Functions ---

  const randomPoint = (): Point => ({
    x: Math.random() * MAP_SIZE - MAP_SIZE / 2,
    y: Math.random() * MAP_SIZE - MAP_SIZE / 2,
  });

  const createFood = (): Food => {
    const r = Math.random();
    let valExp = 1;
    if (r > 0.95) valExp = 4;       
    else if (r > 0.85) valExp = 3;  
    else if (r > 0.60) valExp = 2;  
    else valExp = 1;                

    const value = Math.pow(2, valExp); 
    
    return {
      ...randomPoint(),
      id: Math.random().toString(36).substr(2, 9),
      radius: BASE_RADIUS * 0.8,
      color: getSnakeColor(value),
      value,
      targetSize: BASE_RADIUS * 0.8,
      currentSize: 0,
    };
  };

  const createSnake = (isBot: boolean, name: string): Snake => {
    const startPos = randomPoint();
    return {
      ...startPos,
      id: Math.random().toString(36).substr(2, 9),
      radius: BASE_RADIUS,
      color: getSnakeColor(INITIAL_SNAKE_VALUE),
      value: INITIAL_SNAKE_VALUE,
      name,
      angle: Math.random() * Math.PI * 2,
      targetAngle: 0,
      speed: 0,
      baseSpeed: 3,
      turnSpeed: 0.08,
      body: Array(10).fill(startPos),
      score: 0,
      isBot,
      isDead: false,
      skin: '',
      dashing: false,
      killCount: 0,
    };
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 5 + 2,
      });
    }
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
    textsRef.current.push({
      x, y,
      text,
      life: 1.0,
      vy: -1,
      color,
      size: 20,
    });
  };

  const addKillLog = (killer: string, victim: string) => {
    const newEvent = { killer, victim, timestamp: Date.now() };
    killFeedRef.current = [newEvent, ...killFeedRef.current].slice(0, 5);
    setKillFeed([...killFeedRef.current]);
  };

  // --- Game Logic ---

  const initWorld = () => {
    botsRef.current = Array.from({ length: INITIAL_BOT_COUNT }).map(() => 
      createSnake(true, BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)])
    );
    foodsRef.current = Array.from({ length: FOOD_COUNT }).map(createFood);
    particlesRef.current = [];
    textsRef.current = [];
    killFeedRef.current = [];
    initializedRef.current = true;
  };

  const startPlayerRun = () => {
      // Re-initialize bots/food if world is empty, otherwise just add player
      if (!initializedRef.current) initWorld();
      
      playerRef.current = createSnake(false, playerName || "You");
      setScore(0);
      setKillFeed([]);
  };

  const updateSnake = (snake: Snake, dt: number) => {
    if (snake.isDead) return;

    if (snake.isBot) {
      let nearestFood: Food | null = null;
      let minDist = 300;
      
      for (const f of foodsRef.current) {
        const dx = f.x - snake.x;
        const dy = f.y - snake.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist && f.value <= snake.value) { 
          minDist = dist;
          nearestFood = f;
        }
      }

      if (nearestFood) {
        snake.targetAngle = Math.atan2(nearestFood.y - snake.y, nearestFood.x - snake.x);
        snake.dashing = true; 
      } else {
         snake.dashing = false;
         if (Math.random() < 0.02) {
           snake.targetAngle += (Math.random() - 0.5) * 2;
         }
      }
    } else {
      const dx = mouseRef.current.x - window.innerWidth / 2;
      const dy = mouseRef.current.y - window.innerHeight / 2;
      snake.targetAngle = Math.atan2(dy, dx);
      snake.dashing = mouseRef.current.isDown || controlsRef.current.dashing;
    }

    let diff = snake.targetAngle - snake.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    snake.angle += diff * snake.turnSpeed;

    const currentSpeed = snake.dashing ? snake.baseSpeed * 1.8 : snake.baseSpeed;
    
    snake.x += Math.cos(snake.angle) * currentSpeed;
    snake.y += Math.sin(snake.angle) * currentSpeed;

    const limit = MAP_SIZE / 2;
    if (snake.x < -limit || snake.x > limit || snake.y < -limit || snake.y > limit) {
       snake.isDead = true; 
       return;
    }

    const distToLast = Math.hypot(snake.x - snake.body[0].x, snake.y - snake.body[0].y);
    if (distToLast > 10) { 
        snake.body.unshift({ x: snake.x, y: snake.y });
        const maxBodyLength = 10 + Math.floor(snake.score / 10) + Math.log2(snake.value) * 5;
        if (snake.body.length > maxBodyLength) {
            snake.body.pop();
        }
    }

    snake.color = getSnakeColor(snake.value);
    
    if (snake.dashing && !snake.isBot && snake.score > 2) {
        snake.score -= 0.1;
        if (Math.random() < 0.2) {
            spawnParticles(snake.body[snake.body.length-1].x, snake.body[snake.body.length-1].y, snake.color, 1);
        }
        setScore(Math.floor(snake.score));
    }
  };

  const checkCollisions = () => {
    const allSnakes = [playerRef.current, ...botsRef.current].filter(s => s && !s.isDead) as Snake[];

    allSnakes.forEach(snake => {
        // Food Collision
        for (let i = foodsRef.current.length - 1; i >= 0; i--) {
            const f = foodsRef.current[i];
            const dist = Math.hypot(snake.x - f.x, snake.y - f.y);
            
            if (dist < snake.radius + f.radius) {
                if (f.value <= snake.value) {
                    snake.score += f.value;
                    if (f.value === snake.value) {
                        snake.value *= 2;
                        spawnFloatingText(snake.x, snake.y, "UPGRADE!", "#fff");
                        spawnParticles(snake.x, snake.y, "#fff", 10);
                    } else {
                        spawnFloatingText(snake.x, snake.y, `+${f.value}`, f.color);
                    }
                    if (!snake.isBot) setScore(snake.score);
                    foodsRef.current.splice(i, 1);
                    foodsRef.current.push(createFood()); 
                } else {
                    const angle = Math.atan2(snake.y - f.y, snake.x - f.x);
                    const force = 5;
                    snake.x += Math.cos(angle) * force;
                    snake.y += Math.sin(angle) * force;
                }
            }
        }

        // Snake vs Snake
        allSnakes.forEach(other => {
            if (snake.id === other.id) return;
            
            const distHeads = Math.hypot(snake.x - other.x, snake.y - other.y);
            if (distHeads < snake.radius + other.radius) {
                if (snake.value > other.value) {
                    other.isDead = true;
                    snake.score += other.score / 2;
                    spawnParticles(other.x, other.y, other.color, 20);
                    addKillLog(snake.name, other.name);
                    snake.killCount++;
                } else if (snake.value < other.value) {
                    snake.isDead = true;
                    other.score += snake.score / 2;
                    spawnParticles(snake.x, snake.y, snake.color, 20);
                    addKillLog(other.name, snake.name);
                    other.killCount++;
                } else {
                    const angle = Math.atan2(snake.y - other.y, snake.x - other.x);
                    snake.x += Math.cos(angle) * 10;
                    snake.y += Math.sin(angle) * 10;
                    other.x -= Math.cos(angle) * 10;
                    other.y -= Math.sin(angle) * 10;
                }
            }

            for (let k = 0; k < other.body.length; k+=3) {
                const b = other.body[k];
                const distBody = Math.hypot(snake.x - b.x, snake.y - b.y);
                if (distBody < snake.radius + BASE_RADIUS * 0.8) { 
                    snake.isDead = true;
                    for(let f=0; f<5; f++) {
                        const dropped = createFood();
                        dropped.x = snake.x + (Math.random()-0.5)*50;
                        dropped.y = snake.y + (Math.random()-0.5)*50;
                        dropped.value = Math.max(2, snake.value / 2); 
                        dropped.color = getSnakeColor(dropped.value);
                        foodsRef.current.push(dropped);
                    }
                    other.score += 50; 
                    addKillLog(other.name, snake.name);
                    other.killCount++;
                    break;
                }
            }
        });
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const player = playerRef.current;
    const isPlaying = gameStateRef.current === GameState.PLAYING;
    const isMenu = gameStateRef.current === GameState.MENU;

    // Clear Screen
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Camera Logic
    let camTarget = { x: 0, y: 0 };
    
    if (isPlaying && player && !player.isDead) {
        camTarget = { x: player.x, y: player.y };
    } else if (isMenu) {
        // Follow a random bot in Menu to make it look alive
        if (botsRef.current.length > 0) {
            const index = attractModeTargetIndex.current % botsRef.current.length;
            const bot = botsRef.current[index];
            if (bot && !bot.isDead) {
              camTarget = { x: bot.x, y: bot.y };
            } else {
              // If target dead, switch
              attractModeTargetIndex.current++;
            }
        }
    } else if (player && player.isDead) {
        camTarget = { x: player.x, y: player.y };
    }

    cameraRef.current.x += (camTarget.x - cameraRef.current.x) * 0.1;
    cameraRef.current.y += (camTarget.y - cameraRef.current.y) * 0.1;

    
    ctx.save();
    ctx.translate(width / 2 - cameraRef.current.x, height / 2 - cameraRef.current.y);

    // 1. Draw Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; 
    ctx.lineWidth = 2;
    const gridSize = 100;
    const startX = Math.floor((cameraRef.current.x - width/2) / gridSize) * gridSize;
    const endX = startX + width + gridSize;
    const startY = Math.floor((cameraRef.current.y - height/2) / gridSize) * gridSize;
    const endY = startY + height + gridSize;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, -MAP_SIZE/2);
        ctx.lineTo(x, MAP_SIZE/2);
    }
    for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(-MAP_SIZE/2, y);
        ctx.lineTo(MAP_SIZE/2, y);
    }
    ctx.stroke();

    // Map Borders
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 10;
    ctx.strokeRect(-MAP_SIZE/2, -MAP_SIZE/2, MAP_SIZE, MAP_SIZE);

    // 2. Draw Food
    foodsRef.current.forEach(f => {
        if (f.currentSize < f.targetSize) f.currentSize += 0.5;
        ctx.fillStyle = f.color;
        const r = f.currentSize;
        ctx.beginPath();
        ctx.roundRect(f.x - r, f.y - r, r*2, r*2, 4);
        ctx.fill();

        ctx.fillStyle = getTextColor(f.value);
        ctx.font = `bold ${Math.floor(r)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.value.toString(), f.x, f.y);
    });

    // 3. Draw Snakes
    const allSnakes = [...botsRef.current];
    if (player) allSnakes.push(player);
    
    allSnakes.forEach(snake => {
        if (snake.isDead) return;

        // Draw Body
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = snake.radius * 1.8;
        ctx.strokeStyle = snake.color;
        
        if (snake.body.length > 0) {
            ctx.beginPath();
            ctx.moveTo(snake.x, snake.y);
            for (const p of snake.body) {
                ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
            
            ctx.lineWidth = snake.radius * 1.0;
            ctx.strokeStyle = `${snake.color}88`; 
            ctx.stroke();
        }

        // Draw Head
        ctx.fillStyle = snake.color;
        ctx.beginPath();
        ctx.arc(snake.x, snake.y, snake.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Value
        ctx.fillStyle = getTextColor(snake.value);
        ctx.font = `bold ${Math.floor(snake.radius)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(snake.value.toString(), snake.x, snake.y);

        // Name Tag
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(snake.name, snake.x, snake.y - snake.radius - 15);
        ctx.shadowBlur = 0;
    });

    // 4. Particles
    particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // 5. Floating Text
    textsRef.current.forEach(t => {
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.font = `bold ${t.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
        ctx.globalAlpha = 1.0;
    });

    ctx.restore();
  };

  // --- Main Loop ---

  useEffect(() => {
    // Force init world immediately
    if (!initializedRef.current) initWorld();
    
    // Initial resize
    if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
    }

    let lastTime = performance.now();
    const loop = (time: number) => {
        const dt = (time - lastTime) / 16.66; 
        lastTime = time;

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const isPlaying = gameStateRef.current === GameState.PLAYING;

                // Update Player
                if (isPlaying && playerRef.current) {
                    if (!playerRef.current.isDead) {
                        updateSnake(playerRef.current, dt);
                    } else {
                        // Player Died
                        setGameState(GameState.GAME_OVER);
                    }
                }

                // Update Bots (ALWAYS update bots for attract mode background)
                botsRef.current.forEach((bot, index) => {
                    if (bot.isDead) {
                         botsRef.current[index] = createSnake(true, BOT_NAMES[Math.floor(Math.random()*BOT_NAMES.length)]);
                    } else {
                        updateSnake(bot, dt);
                    }
                });

                // Periodic bot switch for attract mode
                if (animationFrameRef.current % 300 === 0) {
                     attractModeTargetIndex.current = Math.floor(Math.random() * botsRef.current.length);
                }

                // Update Particles
                for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                    const p = particlesRef.current[i];
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.life -= 0.02 * dt;
                    if (p.life <= 0) particlesRef.current.splice(i, 1);
                }

                // Update Text
                for (let i = textsRef.current.length - 1; i >= 0; i--) {
                    const t = textsRef.current[i];
                    t.y += t.vy * dt;
                    t.life -= 0.01 * dt;
                    if (t.life <= 0) textsRef.current.splice(i, 1);
                }

                checkCollisions();

                // Periodic Updates (Leaderboard)
                if (animationFrameRef.current % 30 === 0) {
                    const all = [...botsRef.current];
                    if (playerRef.current && !playerRef.current.isDead) all.push(playerRef.current);
                    
                    const sorted = all.sort((a, b) => b.score - a.score).slice(0, 5);
                    setLeaderboard(sorted.map(s => ({ 
                        name: s.name, 
                        score: Math.floor(s.score), 
                        isMe: !s.isBot && s.id === playerRef.current?.id
                    })));
                }

                draw(ctx);
            }
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, []); // Run once! State accessed via refs.

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // call immediately
    // Safety check for mobile URL bar resize
    setTimeout(handleResize, 100);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Input
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
    };
    const handleMouseDown = () => { mouseRef.current.isDown = true; };
    const handleMouseUp = () => { mouseRef.current.isDown = false; };
    
    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            mouseRef.current.x = e.touches[0].clientX;
            mouseRef.current.y = e.touches[0].clientY;
        }
    };
    const handleTouchStart = (e: TouchEvent) => {
         // Only track touch if on canvas to allow UI buttons
         if (e.target === canvasRef.current) {
             e.preventDefault();
             if (e.touches.length > 0) {
                mouseRef.current.x = e.touches[0].clientX;
                mouseRef.current.y = e.touches[0].clientY;
             }
         }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') mouseRef.current.isDown = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') mouseRef.current.isDown = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Add to window/document to catch drags outside canvas
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none outline-none" />;
};

export default GameCanvas;