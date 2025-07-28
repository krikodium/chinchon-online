import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { createDeck, shuffleDeck, dealCards, analyzeHand, calculatePoints } from '../game/engine';
import styles from './Board.module.css';

import PlayerHand from './PlayerHand';
import Card from './Card';
import PlayerInfo from './PlayerInfo';

function Board() {
  const [gameState, setGameState] = useState(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [turnPhase, setTurnPhase] = useState('draw');
  const [canPlayerCut, setCanPlayerCut] = useState(false);
  const [draggingCard, setDraggingCard] = useState(null);
  const [lastDrawnCard, setLastDrawnCard] = useState(null);
  const [lastPlayedCardPlayer, setLastPlayedCardPlayer] = useState(null);
  const [lastPlayedCardOpponent, setLastPlayedCardOpponent] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

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
      setTimeout(() => setShowInfo(true), 300);
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

  const handleDragStart = (event) => setDraggingCard(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDraggingCard(null);
    if (!over) return;

    if (over.id === 'discard-area' && turnPhase === 'discard') {
      const cardToDiscard = gameState.player1Hand.find(c => c.id === active.id);
      if (cardToDiscard) {
        animateCardThrow(cardToDiscard, "player");
        setGameState(prev => ({
          ...prev,
          player1Hand: prev.player1Hand.filter(c => c.id !== active.id),
          discardPile: [cardToDiscard, ...prev.discardPile]
        }));
        setTurnPhase('draw');
      }
      return;
    }

    if (over.id === 'cut-area' && canPlayerCut) {
      handleCut();
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

  const animateCardThrow = (card, who) => {
    if (who === "player") setLastPlayedCardPlayer(card);
    if (who === "opponent") setLastPlayedCardOpponent(card);
    setTimeout(() => {
      if (who === "player") setLastPlayedCardPlayer(null);
      if (who === "opponent") setLastPlayedCardOpponent(null);
    }, 700);
  };

  const handleDrawFromDeck = () => {
    if (turnPhase !== 'draw' || !gameState || gameState.deck.length === 0) return;
    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.shift();
    setLastDrawnCard(drawnCard);
  };

  const handleDrawAnimationComplete = () => {
    setGameState(prev => ({
      ...prev,
      player1Hand: [...prev.player1Hand, lastDrawnCard],
      deck: prev.deck.slice(1)
    }));
    setLastDrawnCard(null);
    setTurnPhase('discard');
  };

  const handleDrawFromPile = () => {
    if (turnPhase !== 'draw' || !gameState || gameState.discardPile.length === 0) return;
    const newPile = [...gameState.discardPile];
    const drawnCard = newPile.shift();
    setGameState(prev => ({ ...prev, player1Hand: [...prev.player1Hand, drawnCard], discardPile: newPile }));
    setTurnPhase('discard');
  };

  const handleCut = () => {
    if (!canPlayerCut) return;
    alert(`¡Cortaste la partida!`);
  };

  const handleAutoSort = () => {
    setGameState(prev => {
      const { combinations, deadwood } = analyzeHand(prev.player1Hand);
      const sortedHand = [...combinations.flat(), ...deadwood];
      return { ...prev, player1Hand: sortedHand };
    });
  };

  const getDiscardPosition = () => {
    if (!discardRef.current) return { x: 0, y: 0 };
    const rect = discardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2 - window.innerWidth / 2;
    const centerY = rect.top + rect.height / 2 - window.innerHeight / 2;
    return { x: centerX, y: centerY };
  };

  const discardTarget = getDiscardPosition();

  if (!gameState) return <div>Cargando partida...</div>;

  const isDroppable = draggingCard && turnPhase === 'discard';

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.gameBoard}>

        {/* Mano del Oponente */}
        <div className={styles.playerZone}>
          <PlayerHand cards={gameState.player2Hand} opponent={true} />
        </div>

        {/* Mesa Central */}
        <div className={styles.tableContainer}>
          <div className={`${styles.opponentInfo} ${showInfo ? styles.showInfo : ''}`}>
            <PlayerInfo playerName="Oponente" playerScore={scores.player2} />
          </div>

          <div className={`${styles.playerInfo} ${showInfo ? styles.showInfo : ''}`}>
            <PlayerInfo playerName="Tú" playerScore={scores.player1} />
          </div>

          <div className={styles.centerArea}>
            {/* Mazo con vibración */}
            <motion.div
              className={styles.deckArea}
              whileTap={{ scale: 0.95 }}
              animate={{ rotate: [0, 2, -2, 1, -1, 0] }}
              transition={{ duration: 0.4 }}
              onClick={handleDrawFromDeck}
            >
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className={styles.deckCard}
                  initial={{ rotate: 0, y: i * 2 }}
                  animate={{ rotate: i % 2 === 0 ? i * 1.5 : -i * 1.5 }}
                  style={{ zIndex: i }}
                >
                  <img src="/assets/cards/back.png" alt="Carta" />
                </motion.div>
              ))}
            </motion.div>

            <div
              id="discard-area"
              ref={discardRef}
              className={`${styles.discardPileSlot} ${isDroppable ? styles.highlightDrop : ''}`}
              onClick={handleDrawFromPile}
            >
              {gameState.discardPile.length > 0
                ? <Card cardInfo={gameState.discardPile[0]} />
                : <div className={styles.discardPlaceholder}></div>
              }
            </div>

            <div
              id="cut-area"
              className={`${styles.cutSlot} ${canPlayerCut ? styles.activeCut : ''}`}
            >
              Cortar
            </div>
          </div>

          <div className={styles.sortContainer}>
            <button className={styles.sortButton} onClick={handleAutoSort}>🪄</button>
          </div>
        </div>

        {/* Mano del Jugador */}
        <div className={styles.playerZone}>
          <PlayerHand cards={gameState.player1Hand} />
        </div>

        {/* Animación al robar */}
        <AnimatePresence>
          {lastDrawnCard && (
            <motion.div
              className={styles.tempCard}
              initial={{ opacity: 1, scale: 1, y: -150, x: 0 }}
              animate={{
                x: [0, 30, 0],
                y: [-150, -50, 0],
                rotate: [0, 8, 4],
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 2px 4px rgba(0,0,0,0.2)",
                  "0 10px 20px rgba(0,0,0,0.4)",
                  "0 2px 4px rgba(0,0,0,0.2)"
                ]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              onAnimationComplete={handleDrawAnimationComplete}
            >
              <Card cardInfo={lastDrawnCard} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animación al tirar carta del jugador */}
        <AnimatePresence>
          {lastPlayedCardPlayer && (
            <motion.div
              className={styles.tempCard}
              initial={{ opacity: 1, scale: 1, y: 200, x: 0 }}
              animate={{
                x: [0, discardTarget.x],
                y: [200, discardTarget.y],
                rotate: [0, 10, 5],
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 2px 4px rgba(0,0,0,0.2)",
                  "0 8px 16px rgba(0,0,0,0.4)",
                  "0 2px 4px rgba(0,0,0,0.2)"
                ]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <Card cardInfo={lastPlayedCardPlayer} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animación al tirar carta del oponente */}
        <AnimatePresence>
          {lastPlayedCardOpponent && (
            <motion.div
              className={styles.tempCard}
              initial={{ opacity: 1, scale: 1, y: -200, x: 0 }}
              animate={{
                x: [0, discardTarget.x],
                y: [-200, discardTarget.y],
                rotate: [0, -10, -5],
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 2px 4px rgba(0,0,0,0.2)",
                  "0 8px 16px rgba(0,0,0,0.4)",
                  "0 2px 4px rgba(0,0,0,0.2)"
                ]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <Card cardInfo={lastPlayedCardOpponent} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndContext>
  );
}

export default Board;
