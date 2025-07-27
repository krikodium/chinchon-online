import React from 'react';
import styles from './PlayerHand.module.css';
import SortableCard from './SortableCard';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import Card from './Card';

function PlayerHand({ cards = [], opponent = false }) {
  if (opponent) {
    const middleIndex = (cards.length - 1) / 2;
    return (
      <div className={styles.handRow}>
        {cards.map((card, index) => {
          const offset = index - middleIndex;
          const style = {
            transform: `rotate(${offset * 5}deg) translateY(-15%)`,
            zIndex: cards.length - Math.abs(offset),
          };
          return (
            <div key={card.id || index} className={styles.cardWrapper} style={style}>
              <Card cardInfo={{ ...card, isOpponentCard: true }} />
            </div>
          );
        })}
      </div>
    );
  }

  const topRowCards = cards.slice(0, 4);
  const bottomRowCards = cards.slice(4);

  const renderRow = (rowCards, isTopRow) => {
    const middleIndex = (rowCards.length - 1) / 2;
    return (
      <div className={styles.handRow}>
        <SortableContext items={rowCards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          {rowCards.map((card, index) => {
            const offset = index - middleIndex;
            const style = {
              transform: `rotate(${offset * 6}deg) translateY(${isTopRow ? '-10%' : '10%'})`,
              zIndex: 10 - Math.abs(offset),
            };
            return (
              <div key={card.id} className={styles.cardWrapper} style={style}>
                <SortableCard card={card} />
              </div>
            );
          })}
        </SortableContext>
      </div>
    );
  };

  return (
    <div className={styles.playerHandContainer}>
      {renderRow(topRowCards, true)}
      {renderRow(bottomRowCards, false)}
    </div>
  );
}

export default PlayerHand;