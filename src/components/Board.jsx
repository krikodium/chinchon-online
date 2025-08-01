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
  
  useEffect(() => {
    if (turnPhase === 'opponent_turn') {
      setGameMessage('Turno del Oponente');
      const timer = setTimeout(() => runOpponentDraw(), 1000);
      return () => clearTimeout(timer);
    }
  }, [turnPhase, gameState]);

  const getElementPosition = (ref) => {
    if (!ref.current) return { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 };
    return ref.current.getBoundingClientRect();
  };

  const handleDraw = (source) => {
    if (turnPhase !== 'draw' || animatingCard) return;
    const isDeck = source === 'deck';

    if ((isDeck && gameState.deck.length === 0) || (!isDeck && gameState.discardPile.length === 0)) return;

    const drawnCard = isDeck ? gameState.deck[0] : gameState.discardPile[0];
    const originRef = isDeck ? deckRef : discardRef;
    
    const originRect = getElementPosition(originRef);
    const destinationRect = getElementPosition(playerHandRef);

    // *** CORRECCIÓN CLAVE: Actualizamos el estado INMEDIATAMENTE ***
    setGameState(prevState => {
        const newPlayerHand = [...prevState.player1Hand, drawnCard];
        const newDeck = isDeck ? prevState.deck.filter(c => c.id !== drawnCard.id) : prevState.deck;
        const newDiscardPile = !isDeck ? prevState.discardPile.filter(c => c.id !== drawnCard.id) : prevState.discardPile;
        return {
            ...prevState,
            deck: newDeck,
            discardPile: newDiscardPile,
            player1Hand: newPlayerHand,
        };
    });
    setTurnPhase('discard');
    setGameMessage('Tu turno para descartar');

    // La animación ahora es puramente visual
    setAnimatingCard({
      card: drawnCard,
      origin: originRect,
      destination: {
          x: destinationRect.left + destinationRect.width / 2,
          y: destinationRect.top + destinationRect.height / 2,
      },
      // El onComplete solo limpia la animación, ya no modifica el estado
      onComplete: () => {
        setAnimatingCard(null);
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
    
    const originRect = getElementPosition(sourceRef);
    const destinationRect = getElementPosition(opponentHandRef);

    // *** MISMA CORRECCIÓN APLICADA AQUÍ ***
    setGameState(prevState => ({
        ...prevState,
        deck: willDrawFromDiscard ? prevState.deck.filter(c => c.id !== cardToDraw.id) : prevState.deck.filter(c => c.id !== cardToDraw.id),
        discardPile: willDrawFromDiscard ? prevState.discardPile.filter(c => c.id !== cardToDraw.id) : prevState.discardPile,
        player2Hand: [...prevState.player2Hand, cardToDraw]
    }));

    setAnimatingCard({
      card: cardToDraw,
      origin: originRect,
      destination: {
          x: destinationRect.left + destinationRect.width / 2,
          y: destinationRect.top + destinationRect.height / 2,
      },
      onComplete: () => {
        setAnimatingCard(null);
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

      const originRect = getElementPosition(opponentHandRef);
      const destinationRect = getElementPosition(discardRef);

      setAnimatingCard({
          card: cardToDiscard,
          origin: originRect,
          destination: {
              x: destinationRect.left + destinationRect.width / 2,
              y: destinationRect.top + destinationRect.height / 2,
          },
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

      const originRect = getElementPosition(playerHandRef);
      const destinationRect = getElementPosition(discardRef);

      // *** MISMA CORRECCIÓN APLICADA AQUÍ ***
      setGameState(prevState => {
        const newPlayerHand = prevState.player1Hand.filter(card => card.id !== discardedCard.id);
        const newDiscardPile = [discardedCard, ...prevState.discardPile];
        return { ...prevState, player1Hand: newPlayerHand, discardPile: newDiscardPile };
      });
      setTurnPhase('opponent_turn');
      
      setAnimatingCard({
        card: discardedCard,
        origin: originRect,
        destination: {
            x: destinationRect.left + destinationRect.width / 2,
            y: destinationRect.top + destinationRect.height / 2,
        },
        onComplete: () => {
          setAnimatingCard(null);
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
        
        <div className={styles.topNav}>
            <div className={styles.hamburgerMenu}><span></span><span></span><span></span></div>
        </div>
        
        {gameMessage && <div className={styles.gameMessage}>{gameMessage}</div>}

        <div ref={opponentHandRef} className={styles.opponentHandArea}>
          <PlayerHand cards={gameState.player2Hand} opponent={true} />
        </div>

        <div className={styles.tableWrapper}>
          <div className={`${styles.infoContainer} ${styles.opponentInfo}`}>
              <PlayerInfo playerName="Oponente" playerScore={scores.player2} avatar={playerAvatarImg} />
          </div>
          <div className={`${styles.infoContainer} ${styles.playerInfo}`}>
              <PlayerInfo playerName="Tú" playerScore={scores.player1} avatar={playerAvatarImg} />
          </div>
          <div className={styles.centerArea}>
              <motion.div ref={deckRef} className={styles.deckArea} whileTap={{ scale: 0.95 }} onClick={() => handleDraw('deck')}>
                  {gameState.deck.length > 0 && <img src={imgBack} alt="Mazo" />}
              </motion.div>
              <div id="discard-area" ref={discardRef} className={styles.discardPileSlot} onClick={() => handleDraw('discard')}>
                  {gameState.discardPile.length > 0 ? <Card cardInfo={gameState.discardPile[0]} /> : null}
              </div>
              <div id="cut-area" className={`${styles.cutSlot} ${canPlayerCut ? styles.activeCut : ''}`} onClick={handleCut}>X</div>
          </div>
        </div>

        <div ref={playerHandRef} className={styles.playerHandArea}>
          <PlayerHand cards={gameState.player1Hand} draggingCardId={draggingCard} />
        </div>

        <AnimatePresence>
          {animatingCard && (
            <motion.div
              className={styles.animatingCard}
              key={animatingCard.card.id}
              initial={{
                top: animatingCard.origin.top,
                left: animatingCard.origin.left,
                width: animatingCard.origin.width,
                height: animatingCard.origin.height,
              }}
              animate={{
                top: [animatingCard.origin.top, animatingCard.destination.y - 100, animatingCard.destination.y],
                left: [animatingCard.origin.left, animatingCard.destination.x, animatingCard.destination.x],
                width: [animatingCard.origin.width, animatingCard.origin.width * 1.2, animatingCard.origin.width * 0.8],
                height: [animatingCard.origin.height, animatingCard.origin.height * 1.2, animatingCard.origin.height * 0.8],
                rotate: [0, 15, 0],
                transition: {
                  duration: 0.6,
                  ease: "easeInOut",
                  times: [0, 0.5, 1]
                }
              }}
              exit={{
                  opacity: 0,
                  scale: 0,
                  transition: { duration: 0.2 }
              }}
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