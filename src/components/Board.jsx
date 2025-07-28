import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { createDeck, shuffleDeck, dealCards, analyzeHand, calculatePoints } from '../game/engine';
import styles from './Board.module.css';

import PlayerHand from './PlayerHand';
import Card from './Card';
import PlayerInfo from './PlayerInfo';

// --- IMPORTACIÓN DE ASSETS ---
import imgBack from '../assets/back.png';
import playerAvatarImg from '../assets/avatar.png'; // 1. Avatar importado

function Board() {
  // (El resto de los estados y hooks permanecen sin cambios)
  const [gameState, setGameState] = useState(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [turnPhase, setTurnPhase] = useState('draw');
  const [canPlayerCut, setCanPlayerCut] = useState(false);
  const [draggingCard, setDraggingCard] = useState(null);
  const [lastDrawnCard, setLastDrawnCard] = useState(null);
  const [lastPlayedCardPlayer, setLastPlayedCardPlayer] = useState(null);
  const [discardImpact, setDiscardImpact] = useState(false);
  const discardRef = useRef(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  useEffect(() => {
    const setupGame = () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      setGameState(dealCards(shuffled));
      setTurnPhase('draw');
    };
    setupGame();
  }, []);

  useEffect(() => {
    if (gameState?.player1Hand && turnPhase === 'discard') {
      const analysis = analyzeHand(gameState.player1Hand);
      const points = calculatePoints(analysis.deadwood);
      setCanPlayerCut(points <= 5);
    } else {
      setCanPlayerCut(false);
    }
  }, [gameState?.player1Hand, turnPhase]);

  const getDiscardPosition = () => {
    if (!discardRef.current) return { x: 0, y: 0 };
    const rect = discardRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
    };
  };

  const handleDragStart = (event) => setDraggingCard(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDraggingCard(null);
    if (!over) return;

    if (over.id === 'discard-area' && turnPhase === 'discard') {
      const cardToDiscard = gameState.player1Hand.find(c => c.id === active.id);
      if (cardToDiscard) {
        animateCardThrow(cardToDiscard);
        setGameState(prev => ({
          ...prev,
          player1Hand: prev.player1Hand.filter(c => c.id !== active.id),
          discardPile: [cardToDiscard, ...prev.discardPile],
        }));
        setTurnPhase('draw');
      }
      return;
    }

    if (over.id === 'cut-area' && canPlayerCut) {
      alert(`¡Cortaste la partida!`);
      // Aquí iría la lógica para finalizar la ronda
      return;
    }

    if (active.id !== over.id && over.data.current?.sortable) {
      setGameState(prev => {
        const oldIndex = prev.player1Hand.findIndex(c => c.id === active.id);
        const newIndex = prev.player1Hand.findIndex(c => c.id === over.id);
        if (oldIndex > -1 && newIndex > -1) {
          return { ...prev, player1Hand: arrayMove(prev.player1Hand, oldIndex, newIndex) };
        }
        return prev;
      });
    }
  };

  const animateCardThrow = (card) => {
    setLastPlayedCardPlayer(card);
    setDiscardImpact(true);
    setTimeout(() => setDiscardImpact(false), 300);
    setTimeout(() => setLastPlayedCardPlayer(null), 700);
  };

  const handleDrawFromDeck = () => {
    if (turnPhase !== 'draw' || !gameState || gameState.deck.length === 0) return;
    const drawnCard = gameState.deck[0];
    setLastDrawnCard(drawnCard);
  };

  const handleDrawAnimationComplete = () => {
    setGameState(prev => ({
      ...prev,
      player1Hand: [...prev.player1Hand, lastDrawnCard],
      deck: prev.deck.slice(1),
    }));
    setLastDrawnCard(null);
    setTurnPhase('discard');
  };
  
  if (!gameState) return <div>Cargando partida...</div>;

  const discardTarget = getDiscardPosition();

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.gameBoard}>

        {/* --- ZONA OPONENTE (REESTRUCTURADA) --- */}
        <div className={`${styles.playerZone} ${styles.opponentZone}`}>
          <PlayerHand cards={gameState.player2Hand} opponent={true} />
          <div className={styles.opponentInfo}>
            <PlayerInfo 
              playerName="Oponente" 
              playerScore={scores.player2} 
              avatar={playerAvatarImg} // 2. Avatar pasado como prop
            />
          </div>
        </div>

        {/* --- MESA CENTRAL (SIN CAMBIOS) --- */}
        <div className={styles.centerArea}>
          <motion.div
            className={styles.deckArea}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: [0, 2, -2, 1, 0] }}
            transition={{ duration: 0.4 }}
            onClick={handleDrawFromDeck}
          >
            {[...Array(4)].map((_, i) => (
              <motion.div key={i} className={styles.deckCard} style={{ zIndex: i }} animate={{ rotate: i % 2 === 0 ? i * 1.5 : -i * 1.5 }}>
                <img src={imgBack} alt="Carta" />
              </motion.div>
            ))}
          </motion.div>
          <div id="discard-area" ref={discardRef} className={`${styles.discardPileSlot} ${discardImpact ? styles.activeImpact : ''}`}>
            {gameState.discardPile.length > 0 ? <Card cardInfo={gameState.discardPile[0]} /> : <div className={styles.discardPlaceholder}></div>}
          </div>
          <div id="cut-area" className={`${styles.cutSlot} ${canPlayerCut ? styles.activeCut : ''}`}>
            <span className={styles.cutSlotSymbol}>X</span>
          </div>
        </div>

        {/* --- ZONA JUGADOR (REESTRUCTURADA) --- */}
        <div className={`${styles.playerZone} ${styles.mainPlayerZone}`}>
           <div className={styles.playerInfo}>
            <PlayerInfo 
              playerName="Tú" 
              playerScore={scores.player1} 
              avatar={playerAvatarImg} // 2. Avatar pasado como prop
            />
          </div>
          <PlayerHand cards={gameState.player1Hand} />
        </div>

        {/* --- ANIMACIONES DE CARTAS (SIN CAMBIOS) --- */}
        <AnimatePresence>
          {lastDrawnCard && (
            <motion.div className={styles.tempCard} initial={{ opacity: 1, scale: 0.8, y: -100 }} animate={{ x: [0, 20, 0], y: [-100, -40, 0], rotate: [0, 8, 4], scale: [0.8, 1.05, 1] }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }} onAnimationComplete={handleDrawAnimationComplete}>
              <Card cardInfo={lastDrawnCard} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {lastPlayedCardPlayer && (
            <motion.div className={styles.tempCard} initial={{ opacity: 1, scale: 1, y: 150 }} animate={{ x: [0, discardTarget.x], y: [150, discardTarget.y], rotate: [0, 10, 5], scale: [1, 1.05, 1] }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
              <Card cardInfo={lastPlayedCardPlayer} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </DndContext>
  );
}

export default Board;