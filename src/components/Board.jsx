import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { createDeck, shuffleDeck, dealCards, analyzeHand, calculatePoints } from '../game/engine';
import styles from './Board.module.css';

import PlayerHand from './PlayerHand';
import Card from './Card';
import PlayerInfo from './PlayerInfo';

import imgBack from '../assets/back.png';
import playerAvatarImg from '../assets/avatar.png';

// --- Componente para el modal de fin de ronda y fin de juego ---
function RoundResultModal({ scores, lastRound, onNext, isGameOver }) {
  const didWin = scores.player1 >= 50 && scores.player1 > scores.player2;
  const winnerText = didWin ? '¡Has Ganado!' : '¡Has Perdido!';
  
  return (
    <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className={styles.modalContent} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <h2>{isGameOver ? winnerText : 'Fin de la Ronda'}</h2>
        {!isGameOver && (
          <div className={styles.scoreSummary}>
            <p>Puntos del Oponente: <span>{lastRound.opponentPoints}</span></p>
            <p>Tus Puntos: <span>{lastRound.playerPoints}</span></p>
          </div>
        )}
        <div className={styles.totalScores}>
          <h3>Marcador Total</h3>
          <p>Oponente: {scores.player2}</p>
          <p>Tú: {scores.player1}</p>
        </div>
        <button onClick={onNext}>{isGameOver ? 'Jugar de Nuevo' : 'Siguiente Ronda'}</button>
      </motion.div>
    </motion.div>
  );
}

function Board() {
  const [gameState, setGameState] = useState(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [turnPhase, setTurnPhase] = useState('loading');
  const [canPlayerCut, setCanPlayerCut] = useState(false);
  const [draggingCard, setDraggingCard] = useState(null);
  const [animatingCard, setAnimatingCard] = useState(null);
  const [gameMessage, setGameMessage] = useState('');
  const [lastRoundData, setLastRoundData] = useState({ playerPoints: 0, opponentPoints: 0 });

  const deckRef = useRef(null);
  const discardRef = useRef(null);
  const playerHandRef = useRef(null);
  const opponentHandRef = useRef(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const setupNewRound = () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    setGameState(dealCards(shuffled));
    setTurnPhase('draw');
    setGameMessage('Tu turno para robar');
  };

  useEffect(() => {
    setupNewRound();
  }, []);

  useEffect(() => {
    if (gameState?.player1Hand && (turnPhase === 'discard' || turnPhase === 'draw')) {
      const analysis = analyzeHand(gameState.player1Hand);
      const points = calculatePoints(analysis.deadwood);
      setCanPlayerCut(points <= 5);
    } else {
      setCanPlayerCut(false);
    }
  }, [gameState?.player1Hand, turnPhase]);
  
  // --- useEffect MODIFICADO para un flujo de IA más robusto ---
  useEffect(() => {
    if (turnPhase === 'opponent_turn') {
      setGameMessage('Turno del Oponente');
      const timer = setTimeout(() => runOpponentDraw(), 1000); // Inicia con el robo
      return () => clearTimeout(timer);
    }
  }, [turnPhase]);

  const getElementPosition = (ref) => {
    if (!ref.current) return { top: 0, left: 0, width: 0, height: 0 };
    return ref.current.getBoundingClientRect();
  };

  const handleDraw = (source) => {
    if (turnPhase !== 'draw' || animatingCard) return;
    const isDeck = source === 'deck';

    if (isDeck && gameState.deck.length === 0) return;
    if (!isDeck && gameState.discardPile.length === 0) return;

    const drawnCard = isDeck ? gameState.deck[0] : gameState.discardPile[0];
    const originRef = isDeck ? deckRef : discardRef;
    
    setAnimatingCard({
      card: drawnCard,
      origin: getElementPosition(originRef),
      destination: getElementPosition(playerHandRef),
      onComplete: () => {
        setGameState(prevState => {
          const sourcePile = isDeck ? prevState.deck : prevState.discardPile;
          if (sourcePile.length === 0) return prevState;
          const cardToAdd = sourcePile[0];
          const newSourcePile = sourcePile.slice(1);
          const newPlayerHand = [...prevState.player1Hand, cardToAdd];
          return {
            ...prevState,
            deck: isDeck ? newSourcePile : prevState.deck,
            discardPile: !isDeck ? newSourcePile : prevState.discardPile,
            player1Hand: newPlayerHand,
          };
        });
        setAnimatingCard(null);
        setTurnPhase('discard');
        setGameMessage('Tu turno para descartar');
      }
    });
  };

  const handleCut = () => {
    if (!canPlayerCut || animatingCard) return;
    
    const playerAnalysis = analyzeHand(gameState.player1Hand);
    const playerPoints = calculatePoints(playerAnalysis.deadwood);
    const opponentAnalysis = analyzeHand(gameState.player2Hand);
    const opponentPoints = calculatePoints(opponentAnalysis.deadwood);

    setLastRoundData({ playerPoints, opponentPoints });
    setScores(prevScores => ({
      player1: prevScores.player1 + opponentPoints,
      player2: prevScores.player2 + playerPoints,
    }));
    setTurnPhase('round_over');
    setGameMessage(`Fin de la ronda.`);
  };

  // --- LÓGICA DE IA MODIFICADA Y SEPARADA EN DOS PASOS ---

  const runOpponentDraw = () => {
    const { player2Hand, deck, discardPile } = gameState;
    const topDiscardCard = discardPile.length > 0 ? discardPile[0] : null;
    const pointsBefore = calculatePoints(analyzeHand(player2Hand).deadwood);
    const pointsAfter = topDiscardCard ? calculatePoints(analyzeHand([...player2Hand, topDiscardCard]).deadwood) : Infinity;

    const willDrawFromDiscard = topDiscardCard && pointsAfter < pointsBefore;
    const sourceRef = willDrawFromDiscard ? discardRef : deckRef;
    const cardToDraw = willDrawFromDiscard ? topDiscardCard : deck[0];

    if (!cardToDraw) { 
        setTurnPhase('draw'); 
        setGameMessage('Mazo vacío. Tu turno.');
        return; 
    }

    setAnimatingCard({
      card: cardToDraw,
      origin: getElementPosition(sourceRef),
      destination: getElementPosition(opponentHandRef),
      onComplete: () => {
        setGameState(prevState => ({
          ...prevState,
          deck: willDrawFromDiscard ? prevState.deck : prevState.deck.slice(1),
          discardPile: willDrawFromDiscard ? prevState.discardPile.slice(1) : prevState.discardPile,
          player2Hand: [...prevState.player2Hand, cardToDraw]
        }));
        setAnimatingCard(null);
        // Una vez termina el robo, se inicia el descarte tras un breve instante
        setTimeout(() => runOpponentDiscard(), 500);
      }
    });
  };

  const runOpponentDiscard = () => {
      const { player2Hand } = gameState;
      const analysis = analyzeHand(player2Hand);
      let cardToDiscard;
      if (analysis.deadwood.length > 0) {
          cardToDiscard = analysis.deadwood.reduce((a, b) => (calculatePoints([a]) > calculatePoints([b]) ? a : b));
      } else {
          cardToDiscard = player2Hand.sort((a,b) => a.value - b.value)[0];
      }

      setAnimatingCard({
          card: cardToDiscard,
          origin: getElementPosition(opponentHandRef),
          destination: getElementPosition(discardRef),
          onComplete: () => {
              setGameState(prevState => ({
                  ...prevState,
                  player2Hand: prevState.player2Hand.filter(c => c.id !== cardToDiscard.id),
                  discardPile: [cardToDiscard, ...prevState.discardPile]
              }));
              setAnimatingCard(null);
              setTurnPhase('draw');
              setGameMessage('Tu turno para robar');
          }
      });
  };


  const handleDragStart = (event) => setDraggingCard(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDraggingCard(null);
    if (!over) return;

    if (over.id === 'discard-area' && turnPhase === 'discard') {
      const discardedCard = gameState.player1Hand.find(card => card.id === active.id);
      if (!discardedCard) return;

      setAnimatingCard({
        card: discardedCard,
        origin: getElementPosition(playerHandRef),
        destination: getElementPosition(discardRef),
        onComplete: () => {
          setGameState(prevState => {
            const cardToDiscard = prevState.player1Hand.find(c => c.id === active.id);
            if (!cardToDiscard) return prevState;
            const newPlayerHand = prevState.player1Hand.filter(card => card.id !== active.id);
            const newDiscardPile = [cardToDiscard, ...prevState.discardPile];
            return { ...prevState, player1Hand: newPlayerHand, discardPile: newDiscardPile };
          });
          setAnimatingCard(null);
          setTurnPhase('opponent_turn');
        }
      });
    } else if (over.id && over.id !== active.id) {
      setGameState(prevState => {
        const oldIndex = prevState.player1Hand.findIndex(c => c.id === active.id);
        const newIndex = prevState.player1Hand.findIndex(c => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prevState;
        return { ...prevState, player1Hand: arrayMove(prevState.player1Hand, oldIndex, newIndex) };
      });
    }
  };

  const handleNextRound = () => {
      const isGameOver = scores.player1 >= 50 || scores.player2 >= 50;
      if (isGameOver) {
          setScores({ player1: 0, player2: 0 });
      }
      setupNewRound();
  }

  if (!gameState) {
    return <div className={styles.gameBoard}><div>Cargando...</div></div>;
  }
  
  const isGameOver = scores.player1 >= 50 || scores.player2 >= 50;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.gameBoard}>
        <div className={styles.hamburgerMenu}>
            <span></span>
            <span></span>
            <span></span>
        </div>
        
        {gameMessage && <div className={styles.gameMessage}>{gameMessage}</div>}

        <div ref={opponentHandRef}>
          <PlayerHand cards={gameState.player2Hand} opponent={true} />
        </div>

        <div className={styles.tableWrapper}>
          <div className={`${styles.infoContainer} ${styles.opponentInfo} ${turnPhase === 'opponent_turn' ? styles.activeTurn : ''}`}>
            <PlayerInfo playerName="Oponente" playerScore={scores.player2} avatar={playerAvatarImg} />
          </div>
          <div className={styles.centerArea}>
            <motion.div ref={deckRef} className={styles.deckArea} whileTap={{ scale: 0.95 }} onClick={() => handleDraw('deck')}>
              {gameState.deck.slice(0, 4).map((_, i) => (
                <motion.div key={i} className={styles.deckCard} style={{ zIndex: i, position: 'absolute' }} animate={{ rotate: i % 2 === 0 ? i * 1.5 : -i * 1.5 }}>
                  <img src={imgBack} alt="Mazo de cartas" />
                </motion.div>
              ))}
            </motion.div>
            <div id="discard-area" ref={discardRef} className={styles.discardPileSlot} onClick={() => handleDraw('discard')}>
              {gameState.discardPile.length > 0 ? <Card cardInfo={gameState.discardPile[0]} /> : <div className={styles.discardPlaceholder}></div>}
            </div>
            <div id="cut-area" className={`${styles.cutSlot} ${canPlayerCut ? styles.activeCut : ''}`} onClick={handleCut}>
              <span className={styles.cutSlotSymbol}>X</span>
            </div>
          </div>
          <div className={`${styles.infoContainer} ${styles.playerInfo} ${(turnPhase === 'draw' || turnPhase === 'discard') ? styles.activeTurn : ''}`}>
           <PlayerInfo playerName="Tú" playerScore={scores.player1} avatar={playerAvatarImg} />
          </div>
        </div>

        <div ref={playerHandRef}>
          <PlayerHand cards={gameState.player1Hand} draggingCardId={draggingCard} />
        </div>

        <AnimatePresence>
          {animatingCard && (
            <motion.div
              className={styles.animatingCard}
              key={animatingCard.card.id}
              initial={{
                top: animatingCard.origin.y,
                left: animatingCard.origin.x,
                width: animatingCard.origin.width,
                height: animatingCard.origin.height,
              }}
              animate={{
                top: animatingCard.destination.y,
                left: animatingCard.destination.x,
                width: animatingCard.origin.width,
                height: animatingCard.origin.height,
                transition: { 
                  type: 'spring', 
                  damping: 12,
                  stiffness: 100,
                  duration: 0.5
                }
              }}
              exit={{ opacity: 0 }}
              onAnimationComplete={animatingCard.onComplete}
            >
               <Card cardInfo={animatingCard.card} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
            {(turnPhase === 'round_over' || isGameOver) && (
                <RoundResultModal 
                    scores={scores} 
                    lastRound={lastRoundData}
                    onNext={handleNextRound}
                    isGameOver={isGameOver}
                />
            )}
        </AnimatePresence>
      </div>
    </DndContext>
  );
}

export default Board;