import React from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Target, RotateCcw, Settings } from 'lucide-react';
import Button from './ui/Button';

export default function GameControls({
  onDrawFromDeck,
  onDrawFromDiscard,
  onCut,
  onNewGame,
  onSettings,
  canDrawFromDeck = true,
  canDrawFromDiscard = true,
  canCut = false,
  isPlayerTurn = false,
  gamePhase = 'draw', // 'draw' | 'discard' | 'waiting'
  discardPileSize = 0,
  deckSize = 0
}) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="glass rounded-2xl p-4 space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Estado del juego */}
      <div className="text-center">
        <motion.h3 
          className="text-white font-semibold text-lg mb-1"
          variants={itemVariants}
        >
          {!isPlayerTurn ? 'Turno del Oponente' : 
           gamePhase === 'draw' ? 'Tu Turno - Robar Carta' :
           gamePhase === 'discard' ? 'Tu Turno - Descartar Carta' :
           'Esperando...'}
        </motion.h3>
        
        <motion.p 
          className="text-white/60 text-sm"
          variants={itemVariants}
        >
          {gamePhase === 'draw' && isPlayerTurn ? 'Elige de dónde robar una carta' :
           gamePhase === 'discard' && isPlayerTurn ? 'Arrastra una carta al descarte' :
           !isPlayerTurn ? 'El oponente está jugando...' :
           'Procesando movimiento...'}
        </motion.p>
      </div>

      {/* Controles principales */}
      {isPlayerTurn && gamePhase === 'draw' && (
        <motion.div 
          className="grid grid-cols-2 gap-3"
          variants={itemVariants}
        >
          {/* Robar del mazo */}
          <Button
            variant="primary"
            onClick={onDrawFromDeck}
            disabled={!canDrawFromDeck || deckSize === 0}
            className="flex flex-col items-center p-4 h-auto"
          >
            <Shuffle className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Mazo</span>
            <span className="text-xs opacity-75">{deckSize} cartas</span>
          </Button>

          {/* Robar del descarte */}
          <Button
            variant="secondary"
            onClick={onDrawFromDiscard}
            disabled={!canDrawFromDiscard || discardPileSize === 0}
            className="flex flex-col items-center p-4 h-auto"
          >
            <RotateCcw className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Descarte</span>
            <span className="text-xs opacity-75">{discardPileSize} cartas</span>
          </Button>
        </motion.div>
      )}

      {/* Botón de cortar */}
      {isPlayerTurn && canCut && (
        <motion.div variants={itemVariants}>
          <Button
            variant="success"
            onClick={onCut}
            className="w-full flex items-center justify-center gap-2 p-3"
          >
            <Target className="w-5 h-5" />
            <span className="font-bold">¡CORTAR!</span>
          </Button>
          <p className="text-center text-green-300 text-xs mt-2">
            Tienes 5 puntos o menos
          </p>
        </motion.div>
      )}

      {/* Controles secundarios */}
      <motion.div 
        className="flex gap-2 pt-3 border-t border-white/10"
        variants={itemVariants}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={onNewGame}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Nueva Partida
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onSettings}
          className="px-3"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Información adicional */}
      <motion.div 
        className="text-xs text-white/50 text-center space-y-1"
        variants={itemVariants}
      >
        <div>Arrastra las cartas para reorganizar tu mano</div>
        {gamePhase === 'discard' && (
          <div className="text-yellow-300">
            Arrastra una carta al área de descarte
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}