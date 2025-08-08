import React, { useState } from 'react';
import { motion } from 'framer-motion';
import imgBack from '../assets/back.png';

// Mapeo de archivos de cartas
const suitFolderMap = {
  oros: 'OROS',
  copas: 'COPAS',
  espadas: 'ESPADA',
  bastos: 'BASTOS',
};

const cardFileNameMap = {
  oros: {
    1: '1 As de oros.png', 2: '2 de oros.png', 3: '3 de oros.png',
    4: '4 de oros.png', 5: '5 de oros.png', 6: '6 de oros.png',
    7: '7 de oros.png', 10: '10 sota de oros.png', 11: '11 caballero de oros.png',
    12: '12 rey de oros.png',
  },
  copas: {
    1: '1 as de copas.png', 2: '2 de copas.png', 3: '3 de copas.png',
    4: '4 de copas.png', 5: '5 de copas.png', 6: '6 de copas.png',
    7: '7 de copas.png', 10: '10 de copas.png', 11: '11 de copas.png',
    12: '12 de copas.png',
  },
  espadas: {
    1: '1 As de espadas.png', 2: '2 de espadas.png', 3: '3 de espadas.png',
    4: '4 de espadas.png', 5: '5 de espadas.png', 6: '6 de espadas.png',
    7: '7 de espadas.png', 10: '10 sota de espadas.png', 11: '11 caballero de espadas.png',
    12: '12 Rey de espadas.png',
  },
  bastos: {
    1: '1 As de bastos.png', 2: '2 de bastos.png', 3: '3 de bastos.png',
    4: '4 de bastos.png', 5: '5 de bastos.png', 6: '6 de bastos.png',
    7: '7 de bastos.png', 10: '10 sota de bastos.png', 11: '11 caballero de bastos.png',
    12: '12 rey de bastos.png',
  },
};

const getCardImageUrl = (card) => {
  if (!card || !card.suit || !card.value) return '';
  const suit = card.suit.toLowerCase();
  const value = Number(card.value);
  const folder = suitFolderMap[suit];
  const fileName = cardFileNameMap[suit]?.[value];
  if (!folder || !fileName) return '';
  return `/cartasImg/${folder}/${fileName}`;
};

export default function Card({ 
  cardInfo, 
  isSelectable = false,
  isSelected = false,
  isHighlighted = false,
  size = 'md',
  onClick,
  className = ''
}) {
  const [loadError, setLoadError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const imgSrc = cardInfo?.isOpponentCard ? imgBack : getCardImageUrl(cardInfo);
  
  // Tamaños de carta - Mobile First
  const sizeClasses = {
    sm: 'w-8 h-12 sm:w-10 sm:h-14',
    md: 'w-12 h-18 sm:w-14 sm:h-20 md:w-16 md:h-24',
    lg: 'w-16 h-24 sm:w-18 sm:h-26 md:w-20 md:h-30',
    xl: 'w-18 h-26 sm:w-20 sm:h-30 md:w-24 md:h-36'
  };

  return (
    <motion.div
      className={`
        relative ${sizeClasses[size]} cursor-pointer select-none
        ${isSelectable ? 'hover:scale-105' : ''}
        ${className}
      `}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={isSelectable ? { 
        scale: 1.05,
        y: -4,
        transition: { duration: 0.2 }
      } : {}}
      whileTap={isSelectable ? { 
        scale: 0.95,
        transition: { duration: 0.1 }
      } : {}}
      layout
    >
      {/* Glow effect para carta seleccionada/resaltada */}
      {(isSelected || isHighlighted) && (
        <motion.div
          className={`
            absolute inset-0 rounded-lg blur-sm -z-10
            ${isSelected ? 'bg-blue-400/60' : 'bg-green-400/60'}
          `}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Carta principal */}
      <motion.div
        className={`
          relative w-full h-full rounded-lg overflow-hidden
          bg-white shadow-lg hover:shadow-xl transition-all duration-200
          ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent' : ''}
          ${isHighlighted ? 'ring-2 ring-green-400 ring-offset-1 ring-offset-transparent' : ''}
        `}
        style={{
          transform: isHovered && isSelectable ? 'rotateY(3deg) rotateX(3deg)' : 'none',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.2s ease'
        }}
      >
        <img
          src={imgSrc || imgBack}
          alt={cardInfo?.isOpponentCard ? 'Carta del oponente' : `${cardInfo?.value} de ${cardInfo?.suit}`}
          className="w-full h-full object-cover"
          draggable="false"
          onError={(e) => {
            if (e.target.src.endsWith('.png')) {
              e.target.src = e.target.src.replace('.png', '.webp');
            } else {
              e.target.src = imgBack;
              setLoadError(true);
            }
          }}
        />

        {/* Overlay para carta del oponente */}
        {cardInfo?.isOpponentCard && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
        )}

        {/* Error state */}
        {loadError && !cardInfo?.isOpponentCard && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/80">
            <div className="text-center text-white">
              <div className="text-xs font-bold mb-1">❌</div>
              <div className="text-xs">
                {cardInfo?.value} {cardInfo?.suit}
              </div>
            </div>
          </div>
        )}

        {/* Badge de combinación en juego - Mobile optimized */}
        {isHighlighted && !cardInfo?.isOpponentCard && (
          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full font-bold shadow-lg">
            ✓
          </div>
        )}

        {/* Badge de carta seleccionada - Mobile optimized */}
        {isSelected && (
          <div className="absolute -top-1 -left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full font-bold shadow-lg">
            ●
          </div>
        )}
      </motion.div>

      {/* Animación de selección */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none"
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
}