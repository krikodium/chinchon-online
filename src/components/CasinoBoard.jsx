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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
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
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-600/10 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,69,19,0.1)_0%,transparent_70%)]"></div>
        </div>

        {/* Corner Icons - Top */}
        <div className="absolute top-4 left-4 z-20">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center cursor-pointer hover:bg-cyan-500/30 transition-all">
            <span className="text-cyan-300 text-xl">←</span>
          </div>
        </div>
        
        <div className="absolute top-4 right-4 z-20">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center cursor-pointer hover:bg-cyan-500/30 transition-all" onClick={() => setShowSettings(true)}>
            <span className="text-cyan-300 text-xl">≡</span>
          </div>
        </div>

        {/* Side Chips */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 space-y-2 z-10">
          <div className="w-8 h-8 rounded-full bg-green-500 shadow-lg border-2 border-green-300"></div>
          <div className="w-8 h-8 rounded-full bg-green-600 shadow-lg border-2 border-green-400"></div>
          <div className="w-8 h-8 rounded-full bg-green-700 shadow-lg border-2 border-green-500"></div>
        </div>

        {/* Casino Table Layout */}
        <div className="relative z-10 min-h-screen flex flex-col justify-between">
          
          {/* Top Section - Opponent */}
          <div className="flex-none pt-4 px-4">
            <div className="flex justify-center items-start relative">
              
              {/* Opponent Avatar - Top Right */}
              <div className="absolute top-0 right-8">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-pink-900/80 to-red-900/80 backdrop-blur-sm rounded-full px-4 py-2 border border-pink-500/30">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center border-2 border-orange-300 shadow-lg">
                    <span className="text-white font-bold text-sm">👤</span>
                  </div>
                  <div className="text-right">
                    <div className="text-pink-300 font-bold text-sm">Oponente</div>
                    <div className="text-white text-xs">{scores.player2} / {scores.gameMode}</div>
                  </div>
                </div>
              </div>
              
              {/* Opponent Cards - Curved Arc */}
              <div className="mt-16">
                <div className="relative flex justify-center" style={{ width: '600px', height: '120px' }}>
                  {gameState.player2Hand.map((card, index) => {
                    const totalCards = gameState.player2Hand.length;
                    const angle = ((index - (totalCards - 1) / 2) * 12); // 12 degrees between cards
                    const radius = 200;
                    const x = Math.sin((angle * Math.PI) / 180) * radius;
                    const y = Math.cos((angle * Math.PI) / 180) * radius * 0.2;
                    
                    return (
                      <motion.div
                        key={card.id}
                        className="absolute"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `translate(${x - 35}px, ${-y - 50}px) rotate(${angle}deg)`,
                          zIndex: 10 + index
                        }}
                        initial={{ scale: 0, rotate: angle + 180 }}
                        animate={{ scale: 1, rotate: angle }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 150, damping: 12 }}
                      >
                        <div className="w-16 h-22 rounded-lg shadow-xl border border-white/20 overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800">
                          <div className="w-full h-full bg-blue-gradient-pattern flex items-center justify-center">
                            <div className="text-white text-xs opacity-80">🂠</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Center Table - Game Area */}
          <div className="flex-none px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl border-4 border-yellow-500 shadow-2xl p-6 relative">
                
                {/* Table Inner Shadow */}
                <div className="absolute inset-2 rounded-2xl border border-green-400/30 pointer-events-none"></div>
                
                <div className="flex items-center justify-center space-x-8 relative z-10">
                  
                  {/* Deck */}
                  <motion.div
                    ref={deckRef}
                    className="relative cursor-pointer group"
                    onClick={() => handleDraw('deck')}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-20 h-28 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl border-3 border-white shadow-2xl overflow-hidden">
                      {gameState.deck.length > 0 ? (
                        <>
                          <div className="w-full h-full bg-blue-gradient-pattern opacity-90"></div>
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-sm px-2 py-1 rounded-full font-bold border-2 border-white shadow-lg">
                            {gameState.deck.length}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-white/50 text-xs font-bold">
                          Vacío
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
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-20 h-28 bg-white rounded-xl border-3 border-white shadow-2xl overflow-hidden">
                      {gameState.discardPile.length > 0 ? (
                        <>
                          <CasinoCard cardInfo={gameState.discardPile[0]} />
                          {gameState.discardPile.length > 1 && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-400 to-red-600 text-white text-sm px-2 py-1 rounded-full font-bold border-2 border-white shadow-lg">
                              {gameState.discardPile.length}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs font-bold">
                          Descarte
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Cut Button */}
                  <motion.div
                    ref={cutRef}
                    className={`
                      w-20 h-28 rounded-xl border-3 flex items-center justify-center cursor-pointer shadow-2xl font-bold text-3xl
                      ${player1Analysis?.canCut 
                        ? 'bg-gradient-to-br from-green-400 to-green-600 border-white text-white hover:from-green-500 hover:to-green-700' 
                        : 'bg-gradient-to-br from-gray-600 to-gray-800 border-gray-400 text-gray-300 cursor-not-allowed'
                      }
                    `}
                    onClick={handleCut}
                    whileHover={player1Analysis?.canCut ? { scale: 1.05, y: -5 } : {}}
                    whileTap={player1Analysis?.canCut ? { scale: 0.95 } : {}}
                    animate={player1Analysis?.canCut ? {
                      boxShadow: [
                        "0 0 20px rgba(34, 197, 94, 0.6)",
                        "0 0 30px rgba(34, 197, 94, 0.9)",
                        "0 0 20px rgba(34, 197, 94, 0.6)"
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ×
                  </motion.div>
                </div>

                {/* Game Status */}
                <div className="text-center mt-6">
                  <div className="text-yellow-100 font-bold text-lg">
                    {gamePhase === 'draw' && 'Tu turno - Elige una carta'}
                    {gamePhase === 'discard' && 'Tu turno - Descarta una carta'}
                    {gamePhase === 'opponent_turn' && 'Turno del oponente...'}
                  </div>
                  {player1Analysis?.canCut && (
                    <div className="text-green-300 text-sm mt-2 animate-pulse">
                      ¡Puedes cortar con {player1Analysis.points} puntos!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Player */}
          <div className="flex-none pb-4 px-4">
            <div className="flex justify-center items-end relative">
              
              {/* Player Avatar - Bottom Left */}
              <div className="absolute bottom-0 left-8">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 backdrop-blur-sm rounded-full px-4 py-2 border border-cyan-500/30">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center border-2 border-cyan-300 shadow-lg">
                    <span className="text-white font-bold text-sm">👤</span>
                  </div>
                  <div>
                    <div className="text-cyan-300 font-bold text-sm">Jugador</div>
                    <div className="text-white text-xs">{scores.player1} / {scores.gameMode}</div>
                  </div>
                </div>
              </div>
              
              {/* Player Cards - Curved Arc */}
              <div className="mb-16">
                <div className="relative flex justify-center" style={{ width: '600px', height: '140px' }}>
                  {gameState.player1Hand.map((card, index) => {
                    const totalCards = gameState.player1Hand.length;
                    const angle = ((index - (totalCards - 1) / 2) * -12); // Negative for upward curve
                    const radius = 200;
                    const x = Math.sin((angle * Math.PI) / 180) * radius;
                    const y = Math.cos((angle * Math.PI) / 180) * radius * 0.2;
                    
                    const isDragging = draggingCard === card.id;
                    const isHighlighted = highlightedCards.includes(card.id);
                    
                    return (
                      <motion.div
                        key={card.id}
                        className={`absolute cursor-pointer ${isDragging ? 'z-50' : 'z-auto'}`}
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `translate(${x - 35}px, ${y - 70}px) rotate(${angle}deg)`,
                          zIndex: isDragging ? 50 : 20 + (totalCards - Math.abs(index - (totalCards - 1) / 2))
                        }}
                        initial={{ scale: 0, rotate: angle - 180 }}
                        animate={{ 
                          scale: isDragging ? 1.15 : 1, 
                          rotate: angle,
                          y: isHighlighted ? -15 : 0
                        }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 150, damping: 12 }}
                        whileHover={{ scale: 1.1, y: -20, zIndex: 100 }}
                        onClick={() => handleCardClick(card)}
                      >
                        <div className={`
                          w-16 h-22 rounded-lg shadow-2xl border-2 overflow-hidden
                          ${isHighlighted ? 'border-green-400 ring-2 ring-green-400/50' : 'border-white'}
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

        {/* Bottom Navigation */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center cursor-pointer hover:bg-purple-500/30 transition-all">
            <span className="text-purple-300 text-xl">📊</span>
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