import React from 'react';
import styles from './PlayerHand.module.css';
import SortableCard from './SortableCard';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';

function PlayerHand({ cards = [], opponent = false }) {
  const getFanStyle = (index, total, maxAngle = 15) => {
    const mid = (total - 1) / 2;
    const offset = index - mid;
    const angle = (maxAngle / total) * offset;
    const translateX = offset * 28;
    const curveY = Math.abs(offset) * -6;
    return {
      transform: `translateX(${translateX}px) translateY(${curveY}px) rotate(${angle}deg)`,
      zIndex: 10 - Math.abs(offset),
    };
  };

  if (opponent) {
    return (
      <div className={styles.handRow}>
        {cards.map((card, index) => (
          <div
            key={`opponent-${card.id}`}
            className={styles.cardWrapper}
            style={getFanStyle(index, cards.length)}
          >
            <SortableCard card={{ ...card, isOpponentCard: true }} />
          </div>
        ))}
      </div>
    );
  }

  const topRow = cards.slice(0, 4);
  const bottomRow = cards.slice(4);

  const renderRow = (rowCards, isTopRow) => (
    <div className={styles.handRow}>
      <SortableContext items={rowCards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
        {rowCards.map((card, index) => (
          <motion.div
            key={`player-${card.id}`}
            layout
            transition={{ duration: 0.3 }}
            className={styles.cardWrapper}
            style={{
              ...getFanStyle(index, rowCards.length),
              transform: `${getFanStyle(index, rowCards.length).transform} translateY(${isTopRow ? '-8%' : '8%'})`,
            }}
            whileDrag={{
              scale: 1.15,
              rotate: 6,
              zIndex: 999,
              boxShadow: '0 10px 20px rgba(0,0,0,0.35)',
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
