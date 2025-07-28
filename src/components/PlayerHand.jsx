import React from 'react';
import styles from './PlayerHand.module.css';
import SortableCard from './SortableCard';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';

function PlayerHand({ cards = [], opponent = false }) {
  
  // --- FUNCIÓN DE ESTILO DEL ABANICO (AJUSTE DE PRECISIÓN) ---
  const getFanStyle = (index, total, isTopRow = true) => {
    const mid = (total - 1) / 2;
    const offset = index - mid;

    // Lógica específica para el oponente
    if (opponent) {
      const angle = offset * 8; // 2. Ángulo ligeramente más suave
      const translateX = offset * -20; // 1. Abanico más compacto para que entren las 7 cartas
      const translateY = Math.abs(offset) * 3; 

      return {
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${angle}deg)`,
        zIndex: 10 - Math.abs(offset),
        position: 'relative', 
      };
    }

    // Lógica para el jugador (sin cambios)
    const angle = offset * 6;
    const translateY = Math.abs(offset) * 4;
    let finalTranslateY = isTopRow ? -translateY : translateY;

    return {
      transform: `rotate(${angle}deg) translateY(${finalTranslateY}px)`,
      zIndex: 10 - Math.abs(offset),
    };
  };

  // --- CONFIGURACIÓN DE ANIMACIONES (Sin cambios) ---
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 300,
        delay: index * 0.05,
      },
    }),
  };

  const whileDragAnimation = {
    scale: 1.12,
    rotate: 3,
    zIndex: 999,
    boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
  };

  // --- RENDERIZADO DEL OPONENTE ---
  if (opponent) {
    return (
      <div className={styles.opponentRow}>
        <SortableContext items={cards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className={styles.cardWrapper}
              style={getFanStyle(index, cards.length, false)} // La magia ocurre aquí
              custom={index}
              initial="hidden"
              animate="visible"
              variants={{
                ...cardVariants,
                hidden: { opacity: 0, y: -20, scale: 0.98 }
              }}
            >
              <SortableCard card={{ ...card, isOpponentCard: true }} />
            </motion.div>
          ))}
        </SortableContext>
      </div>
    );
  }

  // --- RENDERIZADO DEL JUGADOR (Sin cambios) ---
  const topRow = cards.slice(0, 4);
  const bottomRow = cards.slice(4);

  const renderRow = (rowCards, isTopRow) => (
    <div
      className={isTopRow ? styles.playerTopRow : styles.playerBottomRow}
    >
      <SortableContext items={rowCards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
        {rowCards.map((card, index) => (
          <motion.div
            key={card.id}
            className={styles.cardWrapper}
            style={getFanStyle(index, rowCards.length, isTopRow)}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            layout
            whileDrag={whileDragAnimation}
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