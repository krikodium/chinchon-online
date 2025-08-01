import React from 'react';
import styles from './PlayerHand.module.css';
import SortableCard from './SortableCard';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';

function PlayerHand({ cards = [], opponent = false, draggingCardId }) {
  
  // --- LÓGICA DEL ABANICO MÁS PRONUNCIADO ---
  const getCardStyle = (index, total) => {
    const mid = (total - 1) / 2;
    const offset = index - mid;
    // Aumentamos los valores para un abanico más notable
    const angle = offset * 8; // Mayor rotación para cada carta
    const translateY = Math.abs(offset) * 6; // Mayor elevación para formar el arco

    return {
      transform: `rotate(${angle}deg) translateY(-${translateY}px)`,
      zIndex: total - Math.abs(offset), // Las cartas del centro quedan por encima
      position: 'relative',
    };
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: (index) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { type: 'spring', damping: 15, stiffness: 300, delay: index * 0.05 },
    }),
  };

  // --- RENDERIZADO DEL OPONENTE (Sin cambios) ---
  if (opponent) {
    return (
      <div className={styles.opponentRow}>
        <SortableContext items={cards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className={styles.cardWrapper}
              style={{ zIndex: index }}
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

  // --- LÓGICA DE DOS FILAS PARA EL JUGADOR ---
  const topRowCards = cards.slice(0, 4);
  const bottomRowCards = cards.slice(4);

  const renderRow = (rowCards) => (
      rowCards.map((card, index) => {
        const isDragging = draggingCardId === card.id;
        const style = getCardStyle(index, rowCards.length);
        
        return (
          <motion.div
            key={card.id}
            className={`${styles.cardWrapper} ${isDragging ? styles.dragging : ''}`}
            style={style}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            layout
          >
            <SortableCard card={card} />
          </motion.div>
        );
      })
  );

  return (
    <div className={styles.playerHandContainer}>
      {/* El contexto único envuelve ambas filas para permitir arrastrar entre ellas */}
      <SortableContext items={cards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
        
        <div className={styles.playerTopRow}>
            {renderRow(topRowCards)}
        </div>
        
        {bottomRowCards.length > 0 && (
            <div className={styles.playerBottomRow}>
                {renderRow(bottomRowCards)}
            </div>
        )}

      </SortableContext>
    </div>
  );
}

export default React.memo(PlayerHand);