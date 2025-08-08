import React from 'react';
import { motion } from 'framer-motion';
import { User, Crown, Target, Clock } from 'lucide-react';

export default function PlayerInfo({ 
  playerName, 
  playerScore = 0, 
  avatar, 
  isCurrentTurn = false,
  canCut = false,
  isChinchon = false,
  deadwoodPoints = 0,
  isWinner = false
}) {
  return (
    <motion.div
      className={`
        glass rounded-xl p-2 sm:p-4 border-2 transition-all duration-300 w-full max-w-[140px] sm:max-w-[180px]
        ${isCurrentTurn ? 'border-blue-400/50 bg-blue-500/10' : 'border-white/10'}
        ${isWinner ? 'border-yellow-400/50 bg-yellow-500/10' : ''}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Avatar y nombre - Mobile optimized */}
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className={`
          relative w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden 
          ${isCurrentTurn ? 'ring-2 ring-blue-400' : 'ring-1 ring-white/20'}
        `}>
          {avatar ? (
            <img src={avatar} alt={playerName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
            </div>
          )}
          
          {/* Indicador de turno activo */}
          {isCurrentTurn && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded-full border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <h3 className="text-white font-semibold text-xs sm:text-sm truncate">
              {playerName}
            </h3>
            {isWinner && <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />}
          </div>
          
          {/* Score */}
          <div className="flex items-center gap-1 mt-1">
            <Target className="w-2 h-2 sm:w-3 sm:h-3 text-white/60" />
            <span className="text-white/80 text-xs">{playerScore} pts</span>
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales - Mobile */}
      <div className="space-y-1 sm:space-y-2">
        {/* Estado actual */}
        {isCurrentTurn && (
          <motion.div
            className="flex items-center gap-1 text-xs text-blue-300 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Clock className="w-3 h-3" />
            <span>Tu turno</span>
          </motion.div>
        )}

        {/* Deadwood points - Solo mostrar si hay */}
        {deadwoodPoints > 0 && (
          <div className="text-xs text-white/60">
            Sueltas: {deadwoodPoints}
          </div>
        )}

        {/* Estados especiales - Mobile layout */}
        <div className="flex flex-wrap gap-1">
          {isChinchon && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
              Chinchón
            </span>
          )}
          
          {canCut && !isChinchon && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
              Puede cortar
            </span>
          )}
        </div>
      </div>

      {/* Indicador de ganador */}
      {isWinner && (
        <motion.div
          className="mt-2 sm:mt-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-yellow-400 text-xs font-bold">
            🏆 GANADOR
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}