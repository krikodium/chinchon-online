import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import SortableCard from './SortableCard';

export default function PlayerHand({ 
  cards = [], 
  opponent = false, 
  draggingCardId,
  onCardClick,
  selectedCards = [],
  highlightedCards = [],
  maxCardsPerRow = 6
}) {

  // Animaciones para las cartas
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: opponent ? -30 : 30, 
      scale: 0.8,
      rotateY: 90
    },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotateY: 0,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 300,
        delay: index * 0.05,
      },
    }),
    exit: {
      opacity: 0,
      scale: 0.8,
      y: opponent ? -30 : 30,
      transition: { duration: 0.2 }
    }
  };

  // Función para calcular el estilo de abanico
  const getFanStyle = (index, total, rowSize) => {
    if (opponent) return { zIndex: index };
    
    const mid = (rowSize - 1) / 2;
    const offset = index - mid;
    const angle = offset * 6; // Ángulo de rotación
    const translateY = Math.abs(offset) * 4; // Elevación para formar arco
    const translateX = offset * -2; // Ligera superposición

    return {
      transform: `rotate(${angle}deg) translateY(-${translateY}px) translateX(${translateX}px)`,
      zIndex: rowSize - Math.abs(offset),
      position: 'relative',
    };
  };

  // Renderizado para oponente (cartas ocultas en fila)
  if (opponent) {
    return (
      <motion.div
        className="flex justify-center items-center gap-2 px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                className="relative"
                style={{ zIndex: index }}
                custom={index}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={cardVariants}
                layout
              >
                <SortableCard 
                  card={{ ...card, isOpponentCard: true }}
                  size="md"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Contador de cartas del oponente */}
        <motion.div
          className="ml-4 glass rounded-full px-3 py-1 text-sm font-medium text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {cards.length} cartas
        </motion.div>
      </motion.div>
    );
  }

  // Dividir cartas del jugador en filas
  const rows = [];
  for (let i = 0; i < cards.length; i += maxCardsPerRow) {
    rows.push(cards.slice(i, i + maxCardsPerRow));
  }

  return (
    <div className="space-y-4 px-4">
      <SortableContext items={cards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
        {rows.map((rowCards, rowIndex) => (
          <motion.div
            key={rowIndex}
            className="flex justify-center items-end min-h-[120px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rowIndex * 0.1 }}
          >
            <AnimatePresence mode="popLayout">
              {rowCards.map((card, cardIndex) => {
                const globalIndex = rowIndex * maxCardsPerRow + cardIndex;
                const isDragging = draggingCardId === card.id;
                const isSelected = selectedCards.includes(card.id);
                const isHighlighted = highlightedCards.includes(card.id);
                
                return (
                  <motion.div
                    key={card.id}
                    className={`
                      relative cursor-pointer transition-all duration-200
                      ${isDragging ? 'opacity-50 scale-110' : ''}
                      ${isSelected ? 'z-50' : ''}
                    `}
                    style={getFanStyle(cardIndex, rowCards.length, rowCards.length)}
                    custom={globalIndex}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={cardVariants}
                    layout
                    whileHover={{ 
                      y: -20, 
                      scale: 1.05,
                      zIndex: 100,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <SortableCard
                      card={card}
                      size="lg"
                      isSelected={isSelected}
                      isHighlighted={isHighlighted}
                      isSelectable={true}
                      onClick={() => onCardClick?.(card)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ))}
      </SortableContext>

      {/* Información de la mano del jugador */}
      <motion.div
        className="flex justify-center items-center gap-4 text-sm text-white/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span>{cards.length} cartas</span>
        {selectedCards.length > 0 && (
          <span className="text-blue-300">
            {selectedCards.length} seleccionadas
          </span>
        )}
        {highlightedCards.length > 0 && (
          <span className="text-green-300">
            {highlightedCards.length} en juego
          </span>
        )}
      </motion.div>
    </div>
  );
}