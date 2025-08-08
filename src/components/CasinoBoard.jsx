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
import CasinoCard from './CasinoCard';
import Modal from './ui/Modal';
import Button from './ui/Button';

// Assets
import imgBack from '../assets/back.png';

// Casino Table Component
export default function CasinoBoard() {
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
  const cutRef = useRef(null);
  
  // AI instance
  const [aiOpponent] = useState(new ChichonAI('medium'));
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // Initialize game
  const initializeGame = (gameMode = 50) => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    const initialState = dealCards(shuffled, gameMode);
    
    setGameState(initialState);
    setScores(prev => ({ ...prev, gameMode, round: 1 }));
    setGamePhase('draw');
    setGameMessage('Tu turno para robar una carta');
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
      // Simple opponent AI
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
        setGameMessage('Tu turno para robar una carta');
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
  };

  // Loading state
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-900">
        <div className="text-center space-y-4">
          <div className="text-white text-lg">Cargando mesa...</div>
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
      {/* Casino Table Container */}
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 relative overflow-hidden">
        
        {/* Table Background */}
        <div className="absolute inset-0 bg-gradient-radial from-green-800 via-green-700 to-green-900 opacity-60"></div>
        
        {/* Casino Table Layout */}
        <div className="relative z-10 min-h-screen flex flex-col">
          
          {/* Top Section - Opponent Cards in Arc */}
          <div className="flex-1 flex items-start justify-center pt-4 sm:pt-8">
            <div className="relative">
              {/* Opponent Avatar */}
              <div className="absolute -left-16 top-1/2 transform -translate-y-1/2">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-3 border-yellow-400">
                    <span className="text-white font-bold text-sm sm:text-lg">OP</span>
                  </div>
                  <div className="text-center">
                    <div className="text-pink-300 font-bold text-sm">Oponente</div>
                    <div className="text-white text-xs">{scores.player2} / {scores.gameMode}</div>
                  </div>
                </div>
              </div>
              
              {/* Opponent Cards - Curved Layout */}
              <div className="flex items-center justify-center">
                <div className="relative" style={{ width: '400px', height: '100px' }}>
                  {gameState.player2Hand.map((card, index) => {
                    const totalCards = gameState.player2Hand.length;
                    const angle = ((index - (totalCards - 1) / 2) * 15); // 15 degrees between cards
                    const radius = 150;
                    const x = Math.sin((angle * Math.PI) / 180) * radius;
                    const y = Math.cos((angle * Math.PI) / 180) * radius * 0.3;
                    
                    return (
                      <motion.div
                        key={card.id}
                        className="absolute"
                        style={{
                          left: `50%`,
                          top: `50%`,
                          transform: `translate(${x - 30}px, ${-y - 40}px) rotate(${angle}deg)`,
                          zIndex: index
                        }}
                        initial={{ scale: 0, rotate: angle }}
                        animate={{ scale: 1, rotate: angle }}
                        transition={{ delay: index * 0.1, type: "spring" }}
                      >
                        <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded border border-blue-300 flex items-center justify-center shadow-lg">
                          <div className="text-white text-xs">🂠</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Center Table - Game Area */}
          <div className="flex-none">
            <div className="mx-4 sm:mx-8 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl border-4 border-yellow-600 shadow-2xl p-4 sm:p-8">
              <div className="flex items-center justify-center space-x-4 sm:space-x-12">
                
                {/* Deck */}
                <motion.div
                  ref={deckRef}
                  className="relative cursor-pointer group"
                  onClick={() => handleDraw('deck')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-16 h-24 sm:w-20 sm:h-30 bg-gradient-to-br from-red-800 to-red-900 rounded-lg border-2 border-yellow-400 flex items-center justify-center shadow-xl">
                    {gameState.deck.length > 0 ? (
                      <>
                        <img src={imgBack} alt="Mazo" className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold border border-white">
                          {gameState.deck.length}
                        </div>
                      </>
                    ) : (
                      <div className="text-yellow-300 text-xs font-bold">Vacío</div>
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
                  <div className="w-16 h-24 sm:w-20 sm:h-30 bg-white rounded-lg border-2 border-yellow-400 shadow-xl overflow-hidden">
                    {gameState.discardPile.length > 0 ? (
                      <>
                        <CasinoCard cardInfo={gameState.discardPile[0]} />
                        {gameState.discardPile.length > 1 && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold border border-white">
                            {gameState.discardPile.length}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        Descarte
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Cut Button */}
                <motion.div
                  ref={cutRef}
                  className={`
                    w-16 h-24 sm:w-20 sm:h-30 rounded-lg border-2 flex items-center justify-center cursor-pointer shadow-xl font-bold text-2xl
                    ${player1Analysis?.canCut 
                      ? 'bg-gradient-to-br from-green-400 to-green-600 border-yellow-400 text-white hover:from-green-500 hover:to-green-700' 
                      : 'bg-gradient-to-br from-gray-600 to-gray-800 border-gray-500 text-gray-400 cursor-not-allowed'
                    }
                  `}
                  onClick={handleCut}
                  whileHover={player1Analysis?.canCut ? { scale: 1.05 } : {}}
                  whileTap={player1Analysis?.canCut ? { scale: 0.95 } : {}}
                  animate={player1Analysis?.canCut ? {
                    boxShadow: [
                      "0 0 10px rgba(34, 197, 94, 0.5)",
                      "0 0 20px rgba(34, 197, 94, 0.8)",
                      "0 0 10px rgba(34, 197, 94, 0.5)"
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ×
                </motion.div>
              </div>

              {/* Game Status */}
              <div className="text-center mt-4">
                <div className="text-yellow-100 font-bold text-sm sm:text-base">
                  {gamePhase === 'draw' && 'Tu turno - Elige una carta'}
                  {gamePhase === 'discard' && 'Tu turno - Descarta una carta'}
                  {gamePhase === 'opponent_turn' && 'Turno del oponente...'}
                </div>
                {player1Analysis?.canCut && (
                  <div className="text-green-300 text-xs mt-1 animate-pulse">
                    ¡Puedes cortar con {player1Analysis.points} puntos!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section - Player Cards in Arc */}
          <div className="flex-1 flex items-end justify-center pb-4 sm:pb-8">
            <div className="relative">
              {/* Player Avatar */}
              <div className="absolute -left-16 top-1/2 transform -translate-y-1/2">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center border-3 border-yellow-400">
                    <span className="text-white font-bold text-sm sm:text-lg">TÚ</span>
                  </div>
                  <div className="text-center">
                    <div className="text-cyan-300 font-bold text-sm">Jugador</div>
                    <div className="text-white text-xs">{scores.player1} / {scores.gameMode}</div>
                  </div>
                </div>
              </div>
              
              {/* Player Cards - Curved Layout */}
              <div className="flex items-center justify-center">
                <div className="relative" style={{ width: '400px', height: '120px' }}>
                  {gameState.player1Hand.map((card, index) => {
                    const totalCards = gameState.player1Hand.length;
                    const angle = ((index - (totalCards - 1) / 2) * -15); // Negative for upward curve
                    const radius = 150;
                    const x = Math.sin((angle * Math.PI) / 180) * radius;
                    const y = Math.cos((angle * Math.PI) / 180) * radius * 0.3;
                    
                    const isDragging = draggingCard === card.id;
                    const isHighlighted = highlightedCards.includes(card.id);
                    
                    return (
                      <motion.div
                        key={card.id}
                        className={`absolute cursor-pointer ${isDragging ? 'z-50' : 'z-auto'}`}
                        style={{
                          left: `50%`,
                          top: `50%`,
                          transform: `translate(${x - 30}px, ${y - 60}px) rotate(${angle}deg)`,
                          zIndex: isDragging ? 50 : totalCards - Math.abs(index - (totalCards - 1) / 2)
                        }}
                        initial={{ scale: 0, rotate: angle }}
                        animate={{ 
                          scale: isDragging ? 1.1 : 1, 
                          rotate: angle,
                          y: isHighlighted ? -10 : 0
                        }}
                        transition={{ delay: index * 0.1, type: "spring" }}
                        whileHover={{ scale: 1.1, y: -10 }}
                        onClick={() => handleCardClick(card)}
                      >
                        <div className={`
                          w-14 h-20 sm:w-16 sm:h-24 rounded-lg shadow-lg border-2 overflow-hidden
                          ${isHighlighted ? 'border-green-400 ring-2 ring-green-400' : 'border-yellow-400'}
                        `}>
                          <CasinoCard cardInfo={card} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Settings Modal */}
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Configuración">
          <div className="space-y-4">
            <Button variant="success" onClick={handleNewGame} className="w-full">
              Nueva Partida
            </Button>
            <Button variant="secondary" onClick={() => setShowSettings(false)} className="w-full">
              Continuar Jugando
            </Button>
          </div>
        </Modal>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="fixed top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          ⚙️
        </button>

        {/* Toast notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
            },
          }}
        />
      </div>
    </DndContext>
  );
}