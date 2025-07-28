import React, { useState, useEffect } from 'react';
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

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }));

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
  
  const handleDragStart = (event) => setDraggingCard(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDraggingCard(null);
    if (!over) return;

    if (over.id === 'discard-area' && turnPhase === 'discard') {
      const cardToDiscard = gameState.player1Hand.find(c => c.id === active.id);
      if (cardToDiscard) {
        setGameState(prev => ({ ...prev, player1Hand: prev.player1Hand.filter(c => c.id !== active.id), discardPile: [cardToDiscard, ...prev.discardPile] }));
        setTurnPhase('draw');
      }
      return;
    }

    if (over.id === 'cut-area' && canPlayerCut) {
      handleCut();
      return;
    }
    
    // Asegurarse de que el reordenamiento solo ocurra dentro de la mano del jugador
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

  const handleDrawFromDeck = () => {
    if (turnPhase !== 'draw' || !gameState || gameState.deck.length === 0) return;
    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.shift();
    setLastDrawnCard(drawnCard);
  };
  
  const handleDrawAnimationComplete = () => {
    setGameState(prev => ({ ...prev, player1Hand: [...prev.player1Hand, lastDrawnCard], deck: prev.deck.slice(1) }));
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

  if (!gameState) return <div>Cargando partida...</div>;

  const isDroppable = draggingCard && turnPhase === 'discard';

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.gameBoard}>

        {/* Zona Superior: Mano del Oponente */}
        <div className={styles.playerZone}>
          <PlayerHand cards={gameState.player2Hand} opponent={true} />
        </div>

        {/* Zona Central: Mesa e Información de Jugadores */}
        <div className={styles.tableContainer}>
          <div className={styles.opponentInfoContainer}>
            <PlayerInfo playerName="Oponente" playerScore={scores.player2} />
          </div>

          <div className={styles.centerArea}>
            <div className={styles.deckArea} onClick={handleDrawFromDeck}>
              <Card cardInfo={{ id: 'deck' }} />
            </div>
            <div id="discard-area" className={`${styles.discardPileSlot} ${isDroppable ? styles.highlightDrop : ''}`} onClick={handleDrawFromPile}>
              {gameState.discardPile.length > 0 
                ? <Card cardInfo={gameState.discardPile[0]} /> 
                : <div className={styles.discardPlaceholder}></div>
              }
            </div>
            <div id="cut-area" className={`${styles.cutSlot} ${isDroppable && canPlayerCut ? styles.highlightDrop : ''}`}>
               Cortar
            </div>
          </div>

          <div className={styles.playerInfoContainer}>
            <PlayerInfo playerName="Tú" playerScore={scores.player1} />
            <button className={styles.sortButton} onClick={handleAutoSort}>🪄</button>
          </div>
        </div>

        {/* Zona Inferior: Mano del Jugador Principal */}
        <div className={styles.playerZone}>
          <PlayerHand cards={gameState.player1Hand} />
        </div>

        {/* Carta que se anima al robar del mazo */}
        <AnimatePresence>
          {lastDrawnCard && ( <motion.div className={styles.tempCard} initial={{ opacity: 0, scale: 0.5, y: -200, x: "-50%" }} animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} onAnimationComplete={handleDrawAnimationComplete}> <Card cardInfo={lastDrawnCard} /> </motion.div> )}
        </AnimatePresence>
        
      </div>
    </DndContext>
  );
}

export default Board;