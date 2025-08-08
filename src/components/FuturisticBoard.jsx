import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

// Game engine imports
import {
  createDeck,
  shuffleDeck,
  dealCards,
  analyzeHand,
  calculatePoints,
  ChichonAI,
  validateMove,
  calculateRoundScore,
  GAME_CONSTANTS
} from '../game/gameEngine';

// Component imports
import FuturisticCard from './FuturisticCard';
import Modal from './ui/Modal';
import Button from './ui/Button';

// Futuristic Board Component
export default function FuturisticBoard() {
  // Game state
  const [gameState, setGameState] = useState(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0, round: 1, gameMode: 50 });
  const [gamePhase, setGamePhase] = useState('loading');
  const [gameMessage, setGameMessage] = useState('');
  
  // Game analysis
  const [player1Analysis, setPlayer1Analysis] = useState(null);
  const [player2Analysis, setPlayer2Analysis] = useState(null);
  
  // UI state
  const [draggingCard, setDraggingCard] = useState(null);
  const [animatingCard, setAnimatingCard] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [highlightedCards, setHighlightedCards] = useState([]);
  
  // Modals
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs for animations
  const deckRef = useRef(null);
  const discardRef = useRef(null);
  
  // AI instance
  const [aiOpponent] = useState(new ChichonAI('medium'));
  
  // Drag and drop sensors - Mobile optimized
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // Initialize game
  const initializeGame = (gameMode = 50) => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    const initialState = dealCards(shuffled, gameMode);
    
    setGameState(initialState);
    setScores(prev => ({ ...prev, gameMode, round: 1 }));
    setGamePhase('draw');
    setGameMessage('Tu turno - Elige una carta');
    setSelectedCards([]);
    setHighlightedCards([]);
    
    // Analyze initial hands
    const p1Analysis = analyzeHand(initialState.player1Hand);
    const p2Analysis = analyzeHand(initialState.player2Hand);
    setPlayer1Analysis(p1Analysis);
    setPlayer2Analysis(p2Analysis);
  };

  // Initial game setup
  useEffect(() => {
    initializeGame();
  }, []);

  // Update analysis when hands change
  useEffect(() => {
    if (gameState?.player1Hand) {
      const p1Analysis = analyzeHand(gameState.player1Hand);
      setPlayer1Analysis(p1Analysis);
      
      // Highlight cards in combinations
      const cardsInCombinations = p1Analysis.combinations.flatMap(combo => combo.cards.map(c => c.id));
      setHighlightedCards(cardsInCombinations);
    }
    
    if (gameState?.player2Hand) {
      const p2Analysis = analyzeHand(gameState.player2Hand);
      setPlayer2Analysis(p2Analysis);
    }
  }, [gameState?.player1Hand, gameState?.player2Hand]);

  // Handle drawing from deck or discard
  const handleDraw = (source) => {
    if (gamePhase !== 'draw' || animatingCard) return;
    
    const isDeck = source === 'deck';
    const sourceCards = isDeck ? gameState.deck : gameState.discardPile;
    
    if (sourceCards.length === 0) {
      toast.error(`No hay cartas en el ${isDeck ? 'mazo' : 'descarte'}`);
      return;
    }

    const drawnCard = sourceCards[0];

    // Update game state immediately
    setGameState(prevState => ({
      ...prevState,
      deck: isDeck ? prevState.deck.slice(1) : prevState.deck,
      discardPile: !isDeck ? prevState.discardPile.slice(1) : prevState.discardPile,
      player1Hand: [...prevState.player1Hand, drawnCard],
    }));
    
    setGamePhase('discard');
    setGameMessage('Selecciona una carta para descartar');
    toast.success(`Carta robada del ${isDeck ? 'mazo' : 'descarte'}`);
  };

  // Handle cutting
  const handleCut = () => {
    if (!player1Analysis?.canCut || animatingCard) return;
    toast.success(player1Analysis.isChinchon ? '¡CHINCHÓN! 🎉' : '¡Bien cortado! ✂️');
  };

  // Handle card clicks
  const handleCardClick = (card) => {
    if (gamePhase === 'discard') {
      handleDiscard(card);
    }
  };

  // Handle discard
  const handleDiscard = (card) => {
    if (gamePhase !== 'discard') return;

    setGameState(prevState => ({
      ...prevState,
      player1Hand: prevState.player1Hand.filter(c => c.id !== card.id),
      discardPile: [card, ...prevState.discardPile]
    }));
    
    setGamePhase('opponent_turn');
    setGameMessage('Turno del oponente');
    
    // Simulate opponent turn
    setTimeout(() => {
      if (gameState?.player2Hand && gameState.deck.length > 0) {
        const drawnCard = gameState.deck[0];
        const newHand = [...gameState.player2Hand, drawnCard];
        const cardToDiscard = newHand[Math.floor(Math.random() * newHand.length)];
        
        setGameState(prevState => ({
          ...prevState,
          deck: prevState.deck.slice(1),
          player2Hand: prevState.player2Hand.filter(c => c.id !== cardToDiscard.id),
          discardPile: [cardToDiscard, ...prevState.discardPile]
        }));
        
        setGamePhase('draw');
        setGameMessage('Tu turno - Elige una carta');
      }
    }, 2000);

    toast.success('Carta descartada');
  };

  // Drag handlers
  const handleDragStart = (event) => {
    setDraggingCard(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDraggingCard(null);
    
    if (!over) return;

    // Handle discard drop
    if (over.id === 'discard-area' && gamePhase === 'discard') {
      const card = gameState.player1Hand.find(c => c.id === active.id);
      if (card) {
        handleDiscard(card);
      }
    }
  };

  // Handle new game
  const handleNewGame = () => {
    setScores({ player1: 0, player2: 0, round: 1, gameMode: scores.gameMode });
    initializeGame(scores.gameMode);
    setShowSettings(false);
  };

  // Loading state
  if (!gameState) {
    return (
      <div className="min-h-screen bg-futuristic flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="neon-pulse w-16 h-16 mx-auto rounded-full border-2 border-neon-blue"></div>
          <div className="text-white text-lg font-medium">Iniciando sistema...</div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Futuristic Container */}
      <div className="min-h-screen bg-futuristic relative overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-radial from-neon-purple/20 via-transparent to-transparent"></div>
        
        {/* Top Section - Mobile First */}
        <div className="relative z-10 p-4 space-y-4">
          
          {/* Header Row */}
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <motion.button
              className="w-12 h-12 rounded-full border-2 border-neon-blue bg-dark-glass backdrop-blur-lg flex items-center justify-center neon-glow-blue"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-neon-blue text-xl font-bold">←</span>
            </motion.button>
            
            {/* Opponent Panel */}
            <div className="flex-1 mx-4">
              <div className="bg-gradient-to-r from-orange-600/80 to-red-600/80 backdrop-blur-xl rounded-2xl p-3 border border-orange-400/30 neon-glow-orange">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 border-2 border-white/20 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">OP</span>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-sm">Oponente</div>
                    <div className="text-orange-200 text-xs">{scores.player2} / {scores.gameMode}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Menu Button */}
            <motion.button
              className="w-12 h-12 rounded-full border-2 border-neon-blue bg-dark-glass backdrop-blur-lg flex items-center justify-center neon-glow-blue"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(true)}
            >
              <span className="text-neon-blue text-lg">≡</span>
            </motion.button>
          </div>

          {/* Opponent Cards - Single Row */}
          <div className="flex justify-center py-4">
            <div className="flex space-x-1">
              {gameState.player2Hand.map((card, index) => (
                <motion.div
                  key={card.id}
                  className="relative"
                  initial={{ scale: 0, rotateY: 180 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ delay: index * 0.1, type: "spring" }}
                >
                  <div className="w-12 h-16 sm:w-14 sm:h-18 rounded-lg bg-cyber-pattern border border-neon-blue/50 neon-glow-subtle">
                    <FuturisticCard cardInfo={{ ...card, isOpponentCard: true }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Game Table */}
        <div className="relative z-10 px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-neon-green/20 to-emerald-600/20 rounded-3xl border-2 border-neon-green/40 backdrop-blur-xl p-6 neon-glow-green">
              
              {/* Cards Row */}
              <div className="flex items-center justify-center space-x-6 mb-6">
                
                {/* Deck */}
                <motion.div
                  ref={deckRef}
                  className="relative cursor-pointer group"
                  onClick={() => handleDraw('deck')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-16 h-22 sm:w-18 sm:h-24 rounded-xl border-2 border-white/20 overflow-hidden bg-cyber-pattern neon-glow-subtle">
                    {gameState.deck.length > 0 && (
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-neon-blue rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                        {gameState.deck.length}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Discard Pile */}
                <motion.div
                  id="discard-area"
                  ref={discardRef}
                  className="relative cursor-pointer group"
                  onClick={() => handleDraw('discard')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-16 h-22 sm:w-18 sm:h-24 rounded-xl border-2 border-white/20 overflow-hidden bg-white neon-glow-subtle">
                    {gameState.discardPile.length > 0 ? (
                      <FuturisticCard cardInfo={gameState.discardPile[0]} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs font-bold">
                        Descarte
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Turn Message */}
              <div className="text-center">
                <motion.div
                  key={gameMessage}
                  className="text-white font-bold text-sm sm:text-base cyber-glow"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {gameMessage}
                </motion.div>
                {player1Analysis?.canCut && (
                  <motion.div
                    className="text-neon-green text-xs mt-2 animate-pulse"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    ¡Puedes cortar con {player1Analysis.points} puntos!
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Player */}
        <div className="relative z-10 p-4 space-y-4">
          
          {/* Player Cards - Two Rows (4 top, 3 bottom) */}
          <div className="space-y-2">
            {/* Top Row - 4 Cards */}
            <div className="flex justify-center">
              <div className="flex space-x-1">
                {gameState.player1Hand.slice(0, 4).map((card, index) => {
                  const isDragging = draggingCard === card.id;
                  const isHighlighted = highlightedCards.includes(card.id);
                  const globalIndex = index;
                  
                  return (
                    <motion.div
                      key={card.id}
                      className={`relative cursor-pointer ${isDragging ? 'z-50' : 'z-auto'}`}
                      style={{
                        transform: `rotate(${(index - 1.5) * 3}deg)`,
                        zIndex: isDragging ? 50 : 10 + index
                      }}
                      initial={{ scale: 0, y: 50 }}
                      animate={{ 
                        scale: isDragging ? 1.1 : 1,
                        y: isHighlighted ? -8 : 0
                      }}
                      transition={{ delay: globalIndex * 0.1, type: "spring" }}
                      whileHover={{ scale: 1.1, y: -12, zIndex: 100 }}
                      onClick={() => handleCardClick(card)}
                    >
                      <div className={`
                        w-14 h-19 sm:w-16 sm:h-22 rounded-lg border-2 overflow-hidden
                        ${isHighlighted ? 'border-neon-green neon-glow-green' : 'border-white/20'}
                        ${isDragging ? 'neon-glow-blue' : ''}
                      `}>
                        <FuturisticCard cardInfo={card} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            {/* Bottom Row - 3 Cards */}
            <div className="flex justify-center">
              <div className="flex space-x-1">
                {gameState.player1Hand.slice(4, 7).map((card, index) => {
                  const isDragging = draggingCard === card.id;
                  const isHighlighted = highlightedCards.includes(card.id);
                  const globalIndex = index + 4;
                  
                  return (
                    <motion.div
                      key={card.id}
                      className={`relative cursor-pointer ${isDragging ? 'z-50' : 'z-auto'}`}
                      style={{
                        transform: `rotate(${(index - 1) * 4}deg)`,
                        zIndex: isDragging ? 50 : 10 + index
                      }}
                      initial={{ scale: 0, y: 50 }}
                      animate={{ 
                        scale: isDragging ? 1.1 : 1,
                        y: isHighlighted ? -8 : 0
                      }}
                      transition={{ delay: globalIndex * 0.1, type: "spring" }}
                      whileHover={{ scale: 1.1, y: -12, zIndex: 100 }}
                      onClick={() => handleCardClick(card)}
                    >
                      <div className={`
                        w-14 h-19 sm:w-16 sm:h-22 rounded-lg border-2 overflow-hidden
                        ${isHighlighted ? 'border-neon-green neon-glow-green' : 'border-white/20'}
                        ${isDragging ? 'neon-glow-blue' : ''}
                      `}>
                        <FuturisticCard cardInfo={card} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Player Panel & Action Button */}
          <div className="flex items-center justify-between">
            {/* Player Panel */}
            <div className="flex-1">
              <div className="bg-gradient-to-r from-cyan-600/80 to-blue-600/80 backdrop-blur-xl rounded-2xl p-3 border border-cyan-400/30 neon-glow-blue mr-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-white/20 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">TU</span>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Jugador</div>
                    <div className="text-cyan-200 text-xs">{scores.player1} / {scores.gameMode}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <motion.button
              className={`
                w-12 h-12 rounded-full border-2 backdrop-blur-lg flex items-center justify-center text-2xl font-bold
                ${player1Analysis?.canCut 
                  ? 'border-neon-green bg-neon-green/20 text-neon-green neon-glow-green animate-pulse' 
                  : 'border-neon-blue/50 bg-dark-glass text-gray-400'
                }
              `}
              whileHover={player1Analysis?.canCut ? { scale: 1.1 } : {}}
              whileTap={player1Analysis?.canCut ? { scale: 0.9 } : {}}
              onClick={handleCut}
              disabled={!player1Analysis?.canCut}
            >
              ⚡
            </motion.button>
          </div>
        </div>

        {/* Settings Modal */}
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Configuración Cyber">
          <div className="space-y-4">
            <Button variant="success" onClick={handleNewGame} className="w-full neon-button">
              Nueva Partida
            </Button>
            <Button variant="secondary" onClick={() => setShowSettings(false)} className="w-full neon-button">
              Continuar Jugando
            </Button>
          </div>
        </Modal>

        {/* Toast notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2000,
            className: 'neon-toast',
            style: {
              background: 'rgba(43, 0, 82, 0.9)',
              color: '#00E1FF',
              border: '1px solid #00E1FF',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
      </div>
    </DndContext>
  );
}