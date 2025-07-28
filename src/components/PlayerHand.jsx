import React from 'react';
import styles from './PlayerHand.module.css';
import SortableCard from './SortableCard';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';

function PlayerHand({ cards = [], opponent = false }) {
  const getFanStyle = (index, total, isTopRow = true) => {
    const mid = (total - 1) / 2;
    const offset = index - mid;
    const angle = offset * 6;
    const translateY = Math.abs(offset) * 3;
    return {
      transform: `rotate(${angle}deg) translateY(${isTopRow ? -translateY : translateY}px)`,
      zIndex: 10 - Math.abs(offset),
    };
  };

  if (opponent) {
    return (
      <div className={styles.opponentRow}>
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className={styles.cardWrapper}
            style={getFanStyle(index, cards.length)}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <SortableCard card={{ ...card, isOpponentCard: true }} />
          </motion.div>
        ))}
      </div>
    );
  }

  const topRow = cards.slice(0, 4);
  const bottomRow = cards.slice(4);

  const renderRow = (rowCards, isTopRow) => (
    <div
      className={isTopRow ? styles.playerTopRow : styles.playerBottomRow}
      style={{ justifyContent: 'space-evenly', width: '100%' }}
    >
      <SortableContext items={rowCards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
        {rowCards.map((card, index) => (
          <motion.div
            key={card.id}
            className={styles.cardWrapper}
            style={getFanStyle(index, rowCards.length, isTopRow)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            layout
            whileDrag={{
              scale: 1.15,
              rotate: 6,
              zIndex: 999,
              boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
            }}
          >
            <SortableCard card={card} />
          </motion.div>
        ))}
      </SortableContext>
    </div>
  );

  return (
    <div className={styles.playerHandContainer}>
      {renderRow(topRow, true)}
      {bottomRow.length > 0 && renderRow(bottomRow, false)}
    </div>
  );
}

export default React.memo(PlayerHand);
