import React from 'react';
import { motion } from 'framer-motion';
import { User, Crown, Target } from 'lucide-react';

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
        glass rounded-2xl p-4 border-2 transition-all duration-300
        ${isCurrentTurn ? 'border-blue-400/50 bg-blue-500/10' : 'border-white/10'}
        ${isWinner ? 'border-yellow-400/50 bg-yellow-500/10' : ''}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Avatar y nombre */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`
          relative w-12 h-12 rounded-full overflow-hidden 
          ${isCurrentTurn ? 'ring-2 ring-blue-400' : 'ring-1 ring-white/20'}
        `}>
          {avatar ? (
            <img src={avatar} alt={playerName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          
          {/* Indicador de turno activo */}
          {isCurrentTurn && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm">{playerName}</h3>
            {isWinner && <Crown className="w-4 h-4 text-yellow-400" />}
          </div>
          
          {/* Score */}
          <div className="flex items-center gap-1 mt-1">
            <Target className="w-3 h-3 text-white/60" />
            <span className="text-white/80 text-xs">{playerScore} puntos</span>
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="space-y-2">
        {/* Estado actual */}
        {isCurrentTurn && (
          <motion.div
            className="text-xs text-blue-300 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Es tu turno
          </motion.div>
        )}

        {/* Deadwood points */}
        {deadwoodPoints > 0 && (
          <div className="text-xs text-white/60">
            Puntos sueltos: {deadwoodPoints}
          </div>
        )}

        {/* Estados especiales */}
        <div className="flex flex-wrap gap-1">
          {isChinchon && (
            <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
              Chinchón
            </span>
          )}
          
          {canCut && !isChinchon && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
              Puede cortar
            </span>
          )}
        </div>
      </div>

      {/* Indicador de ganador */}
      {isWinner && (
        <motion.div
          className="mt-3 text-center"
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