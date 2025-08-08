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
import PlayerHand from './PlayerHand';
import Card from './Card';
import PlayerInfo from './PlayerInfo';
import GameControls from './GameControls';
import Modal from './ui/Modal';
import Button from './ui/Button';
import GameMessage from './ui/GameMessage';
import ScoreBoard from './ui/ScoreBoard';
import LoadingSpinner from './ui/LoadingSpinner';

// Assets
import imgBack from '../assets/back.png';

// Game modals components
function GameSettingsModal({ isOpen, onClose, gameMode, onGameModeChange, onNewGame }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuración del Juego">
      <div className="space-y-6">
        <div>
          <label className="block text-white font-medium mb-3">Modo de Juego</label>
          <div className="space-y-2">
            <Button
              variant={gameMode === 50 ? "primary" : "outline"}
              onClick={() => onGameModeChange(50)}
              className="w-full justify-start"
            >
              Partida a 50 puntos (Rápida)
            </Button>
            <Button
              variant={gameMode === 100 ? "primary" : "outline"}
              onClick={() => onGameModeChange(100)}
              className="w-full justify-start"
            >
              Partida a 100 puntos (Clásica)
            </Button>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="success" onClick={onNewGame} className="flex-1">
            Nueva Partida
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Continuar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RoundResultModal({ 
  isOpen, 
  onClose, 
  player1Points, 
  player2Points, 
  totalScores,
  winner,
  isGameOver,
  isChinchon,
  onNextRound,
  onNewGame 
}) {
  const isPlayerWinner = winner === 1;
  const winnerName = isPlayerWinner ? 'Tú' : 'Oponente';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isGameOver ? '🏆 Fin del Juego' : '📊 Fin de la Ronda'}>
      <div className="space-y-6">
        {/* Resultado de la ronda */}
        <div className="text-center">
          <div className={`text-2xl font-bold mb-2 ${isPlayerWinner ? 'text-green-400' : 'text-red-400'}`}>
            {isGameOver ? (isPlayerWinner ? '¡Has Ganado!' : 'Has Perdido') : `Gana: ${winnerName}`}
          </div>
          
          {isChinchon && (
            <div className="text-yellow-400 font-semibold mb-2">
              🎉 ¡CHINCHÓN! (+25 puntos bonus)
            </div>
          )}
        </div>

        {/* Puntos de la ronda */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-2">
            <div className="text-white/60 text-sm">Tus Puntos</div>
            <div className="text-2xl font-bold text-white">{player1Points}</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-white/60 text-sm">Oponente</div>
            <div className="text-2xl font-bold text-white">{player2Points}</div>
          </div>
        </div>

        {/* Puntuación total */}
        <div className="border-t border-white/10 pt-4">
          <ScoreBoard
            player1Score={totalScores.player1}
            player2Score={totalScores.player2}
            gameMode={totalScores.gameMode}
            currentRound={totalScores.round}
          />
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          {isGameOver ? (
            <>
              <Button variant="primary" onClick={onNewGame} className="flex-1">
                Jugar de Nuevo
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Ver Juego
              </Button>
            </>
          ) : (
            <>
              <Button variant="success" onClick={onNextRound} className="flex-1">
                Siguiente Ronda
              </Button>
              <Button variant="outline" onClick={onNewGame}>
                Nueva Partida
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Main Board Component
export default function Board() {
  // Game state
  const [gameState, setGameState] = useState(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0, round: 1, gameMode: 50 });
  const [gamePhase, setGamePhase] = useState('loading'); // loading, draw, discard, opponent_turn, round_over
  const [gameMessage, setGameMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  
  // Game analysis
  const [player1Analysis, setPlayer1Analysis] = useState(null);
  const [player2Analysis, setPlayer2Analysis] = useState(null);
  
  // UI state
  const [draggingCard, setDraggingCard] = useState(null);
  const [animatingCard, setAnimatingCard] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [highlightedCards, setHighlightedCards] = useState([]);
  
  // Modals
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastRoundData, setLastRoundData] = useState(null);
  
  // Refs for animations
  const deckRef = useRef(null);
  const discardRef = useRef(null);
  const playerHandRef = useRef(null);
  const opponentHandRef = useRef(null);
  
  // AI instance
  const [aiOpponent] = useState(new ChichonAI('medium'));
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
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
    setMessageType('turn');
    setSelectedCards([]);
    setHighlightedCards([]);
    
    // Analyze initial hands
    const p1Analysis = analyzeHand(initialState.player1Hand);
    const p2Analysis = analyzeHand(initialState.player2Hand);
    setPlayer1Analysis(p1Analysis);
    setPlayer2Analysis(p2Analysis);
    
    toast.success(`Nueva partida iniciada - Meta: ${gameMode} puntos`);
  };

  // Setup new round
  const setupNewRound = () => {
    initializeGame(scores.gameMode);
    setShowRoundResult(false);
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

  // Opponent turn handling
  useEffect(() => {
    if (gamePhase === 'opponent_turn' && gameState) {
      const timer = setTimeout(() => {
        handleOpponentTurn();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [gamePhase, gameState]);

  // Utility function to get element position
  const getElementPosition = (ref) => {
    if (!ref.current) return { top: 0, left: 0, width: 0, height: 0 };
    return ref.current.getBoundingClientRect();
  };

  // Handle drawing from deck or discard
  const handleDraw = (source) => {
    if (gamePhase !== 'draw' || animatingCard) return;
    
    const validation = validateMove(gameState, 'draw', 1);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const isDeck = source === 'deck';
    const sourceCards = isDeck ? gameState.deck : gameState.discardPile;
    
    if (sourceCards.length === 0) {
      toast.error(`No hay cartas en el ${isDeck ? 'mazo' : 'descarte'}`);
      return;
    }

    const drawnCard = sourceCards[0];
    const originRef = isDeck ? deckRef : discardRef;
    
    const originRect = getElementPosition(originRef);
    const destinationRect = getElementPosition(playerHandRef);

    // Update game state immediately
    setGameState(prevState => ({
      ...prevState,
      deck: isDeck ? prevState.deck.slice(1) : prevState.deck,
      discardPile: !isDeck ? prevState.discardPile.slice(1) : prevState.discardPile,
      player1Hand: [...prevState.player1Hand, drawnCard],
    }));
    
    setGamePhase('discard');
    setGameMessage('Selecciona una carta para descartar');
    setMessageType('action');

    // Visual animation
    setAnimatingCard({
      card: drawnCard,
      origin: originRect,
      destination: {
        x: destinationRect.left + destinationRect.width / 2,
        y: destinationRect.top + destinationRect.height / 2,
      },
      onComplete: () => setAnimatingCard(null)
    });

    toast.success(`Carta robada del ${isDeck ? 'mazo' : 'descarte'}`);
  };

  // Handle cutting
  const handleCut = () => {
    if (!player1Analysis?.canCut || animatingCard) return;
    
    const validation = validateMove(gameState, 'cut', 1);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const roundScore = calculateRoundScore(player1Analysis, player2Analysis, 1, player1Analysis.isChinchon);
    
    setLastRoundData({
      player1Points: player1Analysis.points,
      player2Points: player2Analysis.points,
      winner: 1,
      isChinchon: player1Analysis.isChinchon,
      roundScore
    });

    const newScores = {
      player1: scores.player1 + roundScore.player1,
      player2: scores.player2 + roundScore.player2,
      round: scores.round + 1,
      gameMode: scores.gameMode
    };

    setScores(newScores);
    setShowRoundResult(true);
    setGamePhase('round_over');
    
    toast.success(player1Analysis.isChinchon ? '¡CHINCHÓN! 🎉' : '¡Bien cortado! ✂️');
  };

  // Handle opponent turn
  const handleOpponentTurn = async () => {
    if (!gameState) return;
    
    const discardCard = gameState.discardPile[0];
    const shouldDrawFromDiscard = aiOpponent.shouldDrawFromDiscard(gameState.player2Hand, discardCard);
    
    // AI draws
    const sourceCards = shouldDrawFromDiscard ? gameState.discardPile : gameState.deck;
    if (sourceCards.length === 0) {
      setGamePhase('draw');
      setGameMessage('Mazo vacío - Tu turno');
      return;
    }
    
    const drawnCard = sourceCards[0];
    const newHand = [...gameState.player2Hand, drawnCard];
    
    // Update state with drawn card
    setGameState(prevState => ({
      ...prevState,
      deck: shouldDrawFromDiscard ? prevState.deck : prevState.deck.slice(1),
      discardPile: shouldDrawFromDiscard ? prevState.discardPile.slice(1) : prevState.discardPile,
      player2Hand: newHand,
    }));

    // Wait for animation then discard
    setTimeout(() => {
      const cardToDiscard = aiOpponent.selectCardToDiscard(newHand);
      
      setGameState(prevState => ({
        ...prevState,
        player2Hand: prevState.player2Hand.filter(c => c.id !== cardToDiscard.id),
        discardPile: [cardToDiscard, ...prevState.discardPile]
      }));
      
      setGamePhase('draw');
      setGameMessage('Tu turno para robar una carta');
      setMessageType('turn');
      
    }, 1000);
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
    
    const originRect = getElementPosition(playerHandRef);
    const destinationRect = getElementPosition(discardRef);

    setGameState(prevState => ({
      ...prevState,
      player1Hand: prevState.player1Hand.filter(c => c.id !== card.id),
      discardPile: [card, ...prevState.discardPile]
    }));
    
    setGamePhase('opponent_turn');
    setGameMessage('Turno del oponente');
    setMessageType('info');
    
    setAnimatingCard({
      card,
      origin: originRect,
      destination: {
        x: destinationRect.left + destinationRect.width / 2,
        y: destinationRect.top + destinationRect.height / 2,
      },
      onComplete: () => setAnimatingCard(null)
    });

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
    // Handle reordering
    else if (over.id && over.id !== active.id) {
      setGameState(prevState => {
        const oldIndex = prevState.player1Hand.findIndex(c => c.id === active.id);
        const newIndex = prevState.player1Hand.findIndex(c => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prevState;
        
        return {
          ...prevState,
          player1Hand: arrayMove(prevState.player1Hand, oldIndex, newIndex)
        };
      });
    }
  };

  // Handle game mode change
  const handleGameModeChange = (newMode) => {
    setScores(prev => ({ ...prev, gameMode: newMode }));
  };

  // Handle new game
  const handleNewGame = () => {
    setScores({ player1: 0, player2: 0, round: 1, gameMode: scores.gameMode });
    initializeGame(scores.gameMode);
    setShowRoundResult(false);
    setShowSettings(false);
  };

  // Handle next round
  const handleNextRound = () => {
    setupNewRound();
  };

  // Loading state
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="xl" />
          <div className="text-white text-lg">Cargando juego...</div>
        </div>
      </div>
    );
  }

  const isGameOver = scores.player1 >= scores.gameMode || scores.player2 >= scores.gameMode;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20" />
        
        {/* Game message */}
        <GameMessage 
          message={gameMessage} 
          type={messageType}
          show={!!gameMessage}
        />
        
        {/* Main game area */}
        <div className="relative z-10 flex flex-col min-h-screen p-4 space-y-4">
          
          {/* Top section - Opponent */}
          <div className="flex justify-between items-start">
            <PlayerInfo
              playerName="Oponente"
              playerScore={scores.player2}
              isCurrentTurn={gamePhase === 'opponent_turn'}
              canCut={player2Analysis?.canCut}
              isChinchon={player2Analysis?.isChinchon}
              deadwoodPoints={player2Analysis?.points}
            />
            
            <ScoreBoard
              player1Score={scores.player1}
              player2Score={scores.player2}
              gameMode={scores.gameMode}
              currentRound={scores.round}
            />
            
            <GameControls
              onDrawFromDeck={() => handleDraw('deck')}
              onDrawFromDiscard={() => handleDraw('discard')}
              onCut={handleCut}
              onNewGame={handleNewGame}
              onSettings={() => setShowSettings(true)}
              canDrawFromDeck={gameState.deck.length > 0}
              canDrawFromDiscard={gameState.discardPile.length > 0}
              canCut={player1Analysis?.canCut}
              isPlayerTurn={gamePhase === 'draw' || gamePhase === 'discard'}
              gamePhase={gamePhase}
              discardPileSize={gameState.discardPile.length}
              deckSize={gameState.deck.length}
            />
          </div>

          {/* Opponent hand */}
          <div ref={opponentHandRef} className="flex-shrink-0">
            <PlayerHand
              cards={gameState.player2Hand}
              opponent={true}
            />
          </div>

          {/* Center area - Table */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-8">
              {/* Deck */}
              <motion.div
                ref={deckRef}
                className="relative w-24 h-36 cursor-pointer group"
                onClick={() => handleDraw('deck')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {gameState.deck.length > 0 ? (
                  <>
                    <img 
                      src={imgBack} 
                      alt="Mazo" 
                      className="w-full h-full object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                    />
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      {gameState.deck.length}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center">
                    <span className="text-white/50 text-sm">Vacío</span>
                  </div>
                )}
              </motion.div>

              {/* Discard pile */}
              <motion.div
                id="discard-area"
                ref={discardRef}
                className="relative w-24 h-36 cursor-pointer group"
                onClick={() => handleDraw('discard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {gameState.discardPile.length > 0 ? (
                  <>
                    <Card 
                      cardInfo={gameState.discardPile[0]} 
                      size="xl"
                    />
                    {gameState.discardPile.length > 1 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        {gameState.discardPile.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center">
                    <span className="text-white/50 text-sm">Descarte</span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Player hand */}
          <div ref={playerHandRef} className="flex-shrink-0">
            <PlayerHand
              cards={gameState.player1Hand}
              draggingCardId={draggingCard}
              onCardClick={handleCardClick}
              selectedCards={selectedCards}
              highlightedCards={highlightedCards}
            />
          </div>

          {/* Bottom section - Player info */}
          <div className="flex justify-center">
            <PlayerInfo
              playerName="Tú"
              playerScore={scores.player1}
              isCurrentTurn={gamePhase === 'draw' || gamePhase === 'discard'}
              canCut={player1Analysis?.canCut}
              isChinchon={player1Analysis?.isChinchon}
              deadwoodPoints={player1Analysis?.points}
            />
          </div>
        </div>

        {/* Animating card */}
        <AnimatePresence>
          {animatingCard && (
            <motion.div
              className="fixed pointer-events-none z-50"
              initial={{
                top: animatingCard.origin.top,
                left: animatingCard.origin.left,
                width: animatingCard.origin.width,
                height: animatingCard.origin.height,
              }}
              animate={{
                top: animatingCard.destination.y - 50,
                left: animatingCard.destination.x - 40,
                width: 80,
                height: 120,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              onAnimationComplete={animatingCard.onComplete}
            >
              <Card cardInfo={animatingCard.card} size="lg" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <GameSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          gameMode={scores.gameMode}
          onGameModeChange={handleGameModeChange}
          onNewGame={handleNewGame}
        />

        <RoundResultModal
          isOpen={showRoundResult}
          onClose={() => setShowRoundResult(false)}
          player1Points={lastRoundData?.player1Points || 0}
          player2Points={lastRoundData?.player2Points || 0}
          totalScores={scores}
          winner={lastRoundData?.winner}
          isGameOver={isGameOver}
          isChinchon={lastRoundData?.isChinchon}
          onNextRound={handleNextRound}
          onNewGame={handleNewGame}
        />

        {/* Toast notifications */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
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