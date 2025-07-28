import React from 'react';
import styles from './PlayerHand.module.css';
import SortableCard from './SortableCard';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';

function PlayerHand({ cards = [], opponent = false }) {
  // ✅ Mano del oponente (solo visual, sin drag)
  if (opponent) {
    const middleIndex = (cards.length - 1) / 2;
    return (
      <div className={styles.opponentHand}>
        {cards.map((card, index) => {
          const offset = index - middleIndex;
          const style = {
            transform: `rotate(${offset * 6}deg) translateY(-8%)`,
            zIndex: cards.length - Math.abs(offset),
          };
          return (
            <div key={`${card.id}-${index}`} className={styles.cardWrapper} style={style}>
              <SortableCard card={{ ...card, isOpponentCard: true }} />
            </div>
          );
        })}
      </div>
    );
  }

  // ✅ Mano del jugador: dos filas
  const topRowCards = cards.slice(0, 4);
  const bottomRowCards = cards.slice(4);

  const getDynamicMargin = (length) => {
    if (length <= 4) return -36;
    if (length === 5) return -32;
    if (length === 6) return -30;
    return -28; // Para 7 cartas
  };

  const renderRow = (rowCards, isTopRow) => {
    const middleIndex = (rowCards.length - 1) / 2;
    const dynamicMargin = getDynamicMargin(rowCards.length);
    return (
      <div className={styles.handRow}>
        <SortableContext items={rowCards.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          {rowCards.map((card, index) => {
            const offset = index - middleIndex;
            const style = {
              transform: `rotate(${offset * 4}deg) translateY(${isTopRow ? '-6%' : '6%'})`,
              marginLeft: index === 0 ? 0 : dynamicMargin,
              zIndex: 10 - Math.abs(offset),
            };
            return (
              <motion.div
                key={`${card.id}-${index}`}
                layout
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={styles.cardWrapper}
                style={style}
                whileDrag={{ scale: 1.1, rotate: 6, zIndex: 999 }}
              >
                <SortableCard card={card} />
              </motion.div>
            );
          })}
        </SortableContext>
      </div>
    );
  };

  return (
    <div className={styles.playerHandContainer}>
      {renderRow(topRowCards, true)}
      {bottomRowCards.length > 0 && renderRow(bottomRowCards, false)}
    </div>
  );
}

export default PlayerHand;
