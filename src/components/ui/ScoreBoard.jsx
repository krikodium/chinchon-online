import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Target, TrendingUp } from 'lucide-react';

export default function ScoreBoard({ 
  player1Score, 
  player2Score, 
  gameMode, 
  currentRound = 1,
  player1Name = "Tú",
  player2Name = "Oponente"
}) {
  const maxScore = gameMode || 50;
  const player1Progress = (player1Score / maxScore) * 100;
  const player2Progress = (player2Score / maxScore) * 100;
  
  const isPlayer1Leading = player1Score > player2Score;
  const isPlayer2Leading = player2Score > player1Score;

  return (
    <motion.div
      className="glass rounded-xl p-2 sm:p-4 space-y-2 sm:space-y-4 w-full max-w-xs sm:max-w-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Header - Mobile optimized */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          <Target className="w-3 h-3 sm:w-5 sm:h-5 text-blue-400" />
          <span className="text-xs sm:text-sm font-medium text-white/80">
            Ronda {currentRound}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/60">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Meta:</span> {maxScore}
        </div>
      </div>

      {/* Scores - Mobile layout */}
      <div className="space-y-2 sm:space-y-3">
        {/* Player 1 */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              {isPlayer1Leading && <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />}
              <span className="text-xs sm:text-sm font-medium text-white">
                {player1Name}
              </span>
            </div>
            <span className="text-sm sm:text-lg font-bold text-white">
              {player1Score}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(player1Progress, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Player 2 */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              {isPlayer2Leading && <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />}
              <span className="text-xs sm:text-sm font-medium text-white">
                {player2Name}
              </span>
            </div>
            <span className="text-sm sm:text-lg font-bold text-white">
              {player2Score}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(player2Progress, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Game Mode Indicator - Mobile */}
      <div className="text-center pt-1 sm:pt-2 border-t border-white/10">
        <span className="text-xs text-white/60 font-medium">
          Partida a {maxScore} puntos
        </span>
      </div>
    </motion.div>
  );
}