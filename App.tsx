import React, { useState, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState, KillEvent } from './types';
import { Trophy, Skull, Play, Zap, RotateCcw } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState('Snake_Player 1');
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number; isMe: boolean }[]>([]);
  const [killFeed, setKillFeed] = useState<KillEvent[]>([]);
  
  // Shared ref for game controls (Dash) to avoid re-renders
  const controlsRef = useRef({ dashing: false });

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setKillFeed([]);
    controlsRef.current.dashing = false;
  };

  // Button Handlers for Mobile Dash
  const startDash = (e: React.BaseSyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      controlsRef.current.dashing = true;
  };
  const endDash = (e: React.BaseSyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      controlsRef.current.dashing = false;
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gray-900 text-white font-sans overflow-hidden select-none touch-none">
      
      {/* Game Layer */}
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState} 
        setScore={setScore}
        setLeaderboard={setLeaderboard}
        setKillFeed={setKillFeed}
        playerName={playerName}
        controlsRef={controlsRef}
      />

      {/* --- HUD (Only visible when playing) --- */}
      {gameState === GameState.PLAYING && (
        <>
          {/* Safe Area Container */}
          <div className="absolute inset-0 pointer-events-none p-safe">
              
              {/* Top Left: Score */}
              <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col gap-2 pointer-events-auto">
                <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg animate-fade-in">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Score</div>
                    <div className="text-3xl font-black text-yellow-400">{Math.floor(score)}</div>
                </div>
                
                {/* Kill Feed */}
                <div className="bg-black/30 backdrop-blur-sm p-2 rounded-lg border border-white/5 max-w-[180px] md:max-w-[200px]">
                   <div className="text-[10px] text-gray-400 mb-1 font-bold">KILL FEED</div>
                   {killFeed.map((k, i) => (
                       <div key={k.timestamp + i} className="text-[10px] md:text-xs text-white mb-1 last:mb-0 animate-pulse truncate">
                           <span className="text-red-400 font-bold">{k.killer}</span>
                           <span className="text-gray-500 mx-1">ate</span>
                           <span className="text-gray-300">{k.victim}</span>
                       </div>
                   ))}
                </div>
              </div>

              {/* Top Right: Leaderboard */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 w-40 md:w-48 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-lg p-3 pointer-events-auto">
                 <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                    <Trophy size={16} className="text-yellow-400" />
                    <span className="font-bold text-sm text-yellow-100">Top 5</span>
                 </div>
                 <div className="flex flex-col gap-1">
                     {leaderboard.map((player, idx) => (
                         <div key={idx} className={`flex justify-between items-center text-xs p-1 rounded ${player.isMe ? 'bg-yellow-500/20 text-yellow-200 font-bold' : 'text-gray-300'}`}>
                             <div className="flex items-center gap-2 w-20 md:w-24 truncate">
                                 <span className="w-4 text-center text-gray-500 font-mono">{idx + 1}</span>
                                 <span className="truncate">{player.name}</span>
                             </div>
                             <span className="font-mono">{player.score}</span>
                         </div>
                     ))}
                 </div>
              </div>

              {/* Bottom Right: Dash Button */}
              <div className="absolute bottom-8 right-8 pointer-events-auto">
                  <button 
                    className="w-20 h-20 md:w-24 md:h-24 bg-yellow-500 hover:bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] border-4 border-yellow-600 flex items-center justify-center transition-transform active:scale-90"
                    onMouseDown={startDash}
                    onMouseUp={endDash}
                    onMouseLeave={endDash}
                    onTouchStart={startDash}
                    onTouchEnd={endDash}
                  >
                      <Zap size={40} className="text-white fill-white animate-pulse" />
                  </button>
                  <div className="text-center mt-2 text-xs font-bold text-white/50 bg-black/20 rounded px-2 py-1 backdrop-blur-sm">
                      DASH
                  </div>
              </div>

              {/* Bottom Center: Controls Hint */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-xs font-medium pointer-events-none hidden md:block">
                Hold <span className="text-yellow-400 font-bold">SPACE</span> or <span className="text-yellow-400 font-bold">CLICK</span> to Dash
              </div>
          </div>
        </>
      )}

      {/* --- Main Menu --- */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-gray-800/90 p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full text-center relative overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

              <h1 className="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 filter drop-shadow-lg">
                SNAKE<br/>2048.io
              </h1>
              <p className="text-gray-400 mb-8 font-medium">Eat numbers. Merge. Dominate.</p>

              <div className="space-y-4">
                  <div className="text-left">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nickname</label>
                      <input 
                        type="text" 
                        value={playerName} 
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-yellow-500 transition-colors"
                        placeholder="Enter Name..."
                        maxLength={12}
                      />
                  </div>

                  <button 
                    onClick={startGame}
                    className="group relative w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white text-xl font-bold py-4 rounded-xl shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Play fill="currentColor" />
                    <span>PLAY NOW</span>
                    <div className="absolute inset-0 rounded-xl bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                  
                  <div className="pt-4 flex justify-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div> 60 Players Online
                      </div>
                      <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div> Moscow Server
                      </div>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* --- Game Over --- */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
           <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl border border-red-500/30 max-w-sm w-full text-center">
              <Skull size={64} className="text-red-500 mx-auto mb-4 animate-bounce" />
              <h2 className="text-4xl font-black text-white mb-1">WASTED</h2>
              <p className="text-gray-400 mb-6">You were eaten by a bigger snake.</p>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
                  <div className="text-xs text-gray-500 uppercase font-bold">Final Score</div>
                  <div className="text-3xl font-mono text-yellow-400">{Math.floor(score)}</div>
              </div>

              <div className="space-y-3">
                  <button 
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    onClick={() => {
                        setGameState(GameState.PLAYING);
                    }}
                  >
                      <Zap size={20} fill="currentColor" className="text-yellow-300" />
                      <span>REVIVE (Watch Ad)</span>
                  </button>
                  
                  <button 
                     onClick={() => setGameState(GameState.MENU)}
                     className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                      <RotateCcw size={20} />
                      <span>Menu</span>
                  </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}