import React from 'react';
import styles from './PlayerHand.module.css';
import SortableCard from './SortableCard';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';

function PlayerHand({ cards = [], opponent = false, draggingCardId }) {
  
  const getFanStyle = (index, total, isTopRow = true) => {
    const mid = (total - 1) / 2;
    const offset = index - mid;

    // Lógica para el oponente (sin cambios)
    if (opponent) {
      const angle = offset * 8;
      const translateX = offset * -20;
      const translateY = Math.abs(offset) * 3; 
      return {
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${angle}deg)`,
        zIndex: 10 - Math.abs(offset),
        position: 'relative', 
      };
    }

    // Lógica del abanico para el jugador (restaurada y funcional)
    const angle = offset * 5;
    const translateY = Math.abs(offset) * 4;
    const finalTranslateY = isTopRow ? -translateY : translateY;

    return {
      transform: `rotate(${angle}deg) translateY(${finalTranslateY}px)`,
      zIndex: 10 - Math.abs(offset),
    };
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: (index) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { type: 'spring', damping: 15, stiffness: 300, delay: index * 0.05 },
    }),
  };

  // --- RENDERIZADO DEL OPONENTE (sin cambios) ---
  if (opponent) {
    return (
      <div className={styles.opponentRow}>
        <SortableContext items={cards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className={styles.cardWrapper}
              style={getFanStyle(index, cards.length, false)}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={{ ...cardVariants, hidden: { opacity: 0, y: -20, scale: 0.98 } }}
            >
              <SortableCard card={{ ...card, isOpponentCard: true }} />
            </motion.div>
          ))}
        </SortableContext>
      </div>
    );
  }

  // --- RENDERIZADO DEL JUGADOR (CORREGIDO CON DOS FILAS Y UN SOLO CONTEXTO) ---
  const topRowCards = cards.slice(0, 4);
  const bottomRowCards = cards.slice(4);

  const renderRow = (rowCards, isTopRow) => (
    <div className={isTopRow ? styles.playerTopRow : styles.playerBottomRow}>
      {rowCards.map((card, index) => {
        const isDragging = draggingCardId === card.id;
        const style = getFanStyle(index, rowCards.length, isTopRow);
        const wrapperStyle = {
          ...style,
          zIndex: isDragging ? 9999 : style.zIndex,
        };
        return (
          <motion.div
            key={card.id}
            className={styles.cardWrapper}
            style={wrapperStyle}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            layout // La propiedad layout es clave para la animación de reordenamiento
          >
            <SortableCard card={card} />
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className={styles.playerHandContainer}>
      {/* El contexto único envuelve ambas filas, permitiendo arrastrar entre ellas */}
      <SortableContext items={cards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
        {renderRow(topRowCards, true)}
        {bottomRowCards.length > 0 && renderRow(bottomRowCards, false)}
      </SortableContext>
    </div>
  );
}

export default React.memo(PlayerHand);