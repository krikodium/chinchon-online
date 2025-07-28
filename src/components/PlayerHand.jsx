import React from 'react';
import styles from './PlayerHand.module.css';
import SortableCard from './SortableCard';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';

function PlayerHand({ cards = [], opponent = false }) {
  // Función de estilo sin cambios, ya que el layout es correcto.
  const getFanStyle = (index, total, isTopRow = true) => {
    const mid = (total - 1) / 2;
    const offset = index - mid;
    const angle = offset * 6;
    const translateY = Math.abs(offset) * 4;
    let finalTranslateY = opponent ? translateY : (isTopRow ? -translateY : translateY);

    return {
      transform: `rotate(${angle}deg) translateY(${finalTranslateY}px)`,
      zIndex: 10 - Math.abs(offset),
    };
  };

  // --- CONFIGURACIÓN DE ANIMACIONES PROFESIONALES ---

  // 1. Animación de entrada para cada carta.
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring', // Usamos una animación de resorte para un efecto suave.
        damping: 15,    // Controla la "amortiguación" del resorte.
        stiffness: 300, // Controla la "rigidez" del resorte.
        delay: index * 0.05, // Mantenemos el retraso escalonado.
      },
    }),
  };

  // 2. Animación al arrastrar una carta.
  const whileDragAnimation = {
    scale: 1.12, // Una escala ligeramente más sutil.
    rotate: 3,   // Una rotación menor para más control.
    zIndex: 999,
    boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
  };

  // --- RENDERIZADO DEL COMPONENTE ---

  // LÓGICA PARA EL OPONENTE
  if (opponent) {
    return (
      <div className={styles.opponentRow}>
        <SortableContext items={cards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className={styles.cardWrapper}
              style={getFanStyle(index, cards.length, false)}
              custom={index} // Pasamos el index a las variantes para el delay.
              initial="hidden"
              animate="visible"
              variants={{
                ...cardVariants,
                hidden: { opacity: 0, y: -20, scale: 0.98 } // El oponente entra desde arriba.
              }}
            >
              <SortableCard card={{ ...card, isOpponentCard: true }} />
            </motion.div>
          ))}
        </SortableContext>
      </div>
    );
  }

  // LÓGICA PARA EL JUGADOR
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
            layout // La prop layout es clave para animar cambios de posición automáticamente.
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