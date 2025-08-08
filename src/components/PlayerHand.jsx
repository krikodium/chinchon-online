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
  highlightedCards = []
}) {

  // Animaciones para las cartas
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: opponent ? -20 : 20, 
      scale: 0.9
    },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 300,
        delay: index * 0.03,
      },
    }),
    exit: {
      opacity: 0,
      scale: 0.9,
      y: opponent ? -20 : 20,
      transition: { duration: 0.2 }
    }
  };

  // RENDERIZADO DEL OPONENTE - SIN INTERACCIÓN
  if (opponent) {
    return (
      <motion.div
        className="flex justify-center items-center gap-1 px-2 sm:gap-2 sm:px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex gap-1 sm:gap-2">
          <AnimatePresence mode="popLayout">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                className="relative pointer-events-none" // CLAVE: Sin interacción
                style={{ 
                  zIndex: index,
                  transform: `translateX(${index * -8}px)` // Superposición sutil
                }}
                custom={index}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={cardVariants}
                layout
              >
                <div className="w-10 h-14 sm:w-12 sm:h-18 md:w-14 md:h-20 bg-red-900 rounded border border-yellow-600 flex items-center justify-center shadow-lg">
                  <div className="text-yellow-200 text-xs font-bold">🂠</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Contador de cartas del oponente */}
        <motion.div
          className="ml-2 sm:ml-4 glass rounded-full px-2 py-1 text-xs sm:text-sm font-medium text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {cards.length} cartas
        </motion.div>
      </motion.div>
    );
  }

  // DISTRIBUCIÓN JUGADOR: 4 ARRIBA, 3 ABAJO
  const topRowCards = cards.slice(0, 4);
  const bottomRowCards = cards.slice(4, 7);

  // Función para calcular el estilo de abanico (más sutil en mobile)
  const getFanStyle = (index, total, isMobile = false) => {
    const mid = (total - 1) / 2;
    const offset = index - mid;
    const angle = isMobile ? offset * 3 : offset * 5; // Menos rotación en mobile
    const translateY = Math.abs(offset) * (isMobile ? 2 : 3);
    const translateX = offset * (isMobile ? -1 : -2);

    return {
      transform: `rotate(${angle}deg) translateY(-${translateY}px) translateX(${translateX}px)`,
      zIndex: total - Math.abs(offset),
      position: 'relative',
    };
  };

  const renderRow = (rowCards, rowIndex) => (
    <div className="flex justify-center items-end" key={rowIndex}>
      <AnimatePresence mode="popLayout">
        {rowCards.map((card, cardIndex) => {
          const globalIndex = rowIndex * 4 + cardIndex;
          const isDragging = draggingCardId === card.id;
          const isSelected = selectedCards.includes(card.id);
          const isHighlighted = highlightedCards.includes(card.id);
          
          return (
            <motion.div
              key={card.id}
              className={`
                relative cursor-pointer transition-all duration-200
                ${isDragging ? 'opacity-50 scale-110 z-50' : ''}
                ${isSelected ? 'z-40' : ''}
              `}
              style={getFanStyle(cardIndex, rowCards.length, window.innerWidth < 768)}
              custom={globalIndex}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={cardVariants}
              layout
              whileHover={{ 
                y: -12, 
                scale: 1.05,
                zIndex: 100,
                transition: { duration: 0.2 }
              }}
              whileTap={{
                scale: 0.95,
                transition: { duration: 0.1 }
              }}
            >
              <SortableCard
                card={card}
                size="md"
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isSelectable={true}
                onClick={() => onCardClick?.(card)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="space-y-2 px-2 sm:space-y-3 sm:px-4">
      <SortableContext items={cards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
        
        {/* Fila superior - 4 cartas */}
        {topRowCards.length > 0 && (
          <motion.div
            className="min-h-[60px] sm:min-h-[80px] md:min-h-[100px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {renderRow(topRowCards, 0)}
          </motion.div>
        )}
        
        {/* Fila inferior - 3 cartas */}
        {bottomRowCards.length > 0 && (
          <motion.div
            className="min-h-[60px] sm:min-h-[80px] md:min-h-[100px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {renderRow(bottomRowCards, 1)}
          </motion.div>
        )}

      </SortableContext>

      {/* Información de la mano - Mobile optimized */}
      <motion.div
        className="flex justify-center items-center gap-2 text-xs sm:text-sm text-white/70 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span className="bg-white/10 px-2 py-1 rounded-full">
          {cards.length} cartas
        </span>
        {selectedCards.length > 0 && (
          <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">
            {selectedCards.length} seleccionadas
          </span>
        )}
        {highlightedCards.length > 0 && (
          <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30">
            {highlightedCards.length} en juego
          </span>
        )}
      </motion.div>
    </div>
  );
}