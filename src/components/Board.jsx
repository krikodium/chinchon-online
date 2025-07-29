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

function Board() {
  // --- ESTADOS Y HOOKS (LÓGICA ORIGINAL COMPLETA) ---
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

  // --- LÓGICA DEL JUEGO (FUNCIONES ORIGINALES) ---
  const getDiscardPosition = () => {
    if (!discardRef.current) return { x: 0, y: 0 };
    const rect = discardRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
    };
  };
  const handleDragStart = (event) => setDraggingCard(event.active.id);
  const handleDragEnd = (event) => { /* ... lógica de drag and drop ... */ };
  const animateCardThrow = (card) => { /* ... lógica de animación ... */ };
  const handleDrawFromDeck = () => { /* ... lógica de robar carta ... */ };
  const handleDrawAnimationComplete = () => { /* ... lógica post-animación ... */ };

  if (!gameState) {
    return <div>Cargando partida...</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.gameBoard}>

        {/* --- MENÚ HAMBURGUESA (POSICIÓN FIJA EN LA ESQUINA) --- */}
        <div className={styles.hamburgerMenu}>
            <span></span>
            <span></span>
            <span></span>
        </div>

        {/* --- MANO DEL OPONENTE --- */}
        <PlayerHand cards={gameState.player2Hand} opponent={true} />

        {/* --- ZONA DE JUEGO CENTRAL (ESTRUCTURA VERTICAL) --- */}
        <div className={styles.tableWrapper}>

          {/* INFO DEL OPONENTE (Wrapper añadido con clase específica) */}
          <div className={`${styles.infoContainer} ${styles.opponentInfo}`}>
            <PlayerInfo playerName="Oponente" playerScore={scores.player2} avatar={playerAvatarImg} />
          </div>

          {/* MESA DE CARTAS */}
          <div className={styles.centerArea}>
            <motion.div className={styles.deckArea} whileTap={{ scale: 0.95 }} onClick={handleDrawFromDeck}>
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className={styles.deckCard}
                  style={{ zIndex: i }}
                  animate={{ rotate: i % 2 === 0 ? i * 1.5 : -i * 1.5 }}
                >
                  <img src={imgBack} alt="Mazo de cartas" />
                </motion.div>
              ))}
            </motion.div>
            <div
              id="discard-area"
              ref={discardRef}
              className={`${styles.discardPileSlot} ${discardImpact ? styles.activeImpact : ''}`}
            >
              {gameState.discardPile.length > 0 ? (
                <Card cardInfo={gameState.discardPile[0]} />
              ) : (
                <div className={styles.discardPlaceholder}></div>
              )}
            </div>
            <div
              id="cut-area"
              className={`${styles.cutSlot} ${canPlayerCut ? styles.activeCut : ''}`}
            >
              <span className={styles.cutSlotSymbol}>X</span>
            </div>
          </div>

          {/* INFO DEL JUGADOR (Wrapper añadido con clase específica) */}
          <div className={`${styles.infoContainer} ${styles.playerInfo}`}>
           <PlayerInfo playerName="Tú" playerScore={scores.player1} avatar={playerAvatarImg} />
          </div>

        </div>

        {/* --- MANO DEL JUGADOR --- */}
        <PlayerHand cards={gameState.player1Hand} />

        {/* --- ANIMACIONES DE CARTAS (SIN CAMBIOS) --- */}
        <AnimatePresence>
          {/* ... Aquí irían los componentes de Motion para animar cartas ... */}
        </AnimatePresence>

      </div>
    </DndContext>
  );
}

export default Board;