import React, { useState } from 'react';
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

export default function FuturisticCard({ cardInfo, className = '' }) {
  const [loadError, setLoadError] = useState(false);
  
  const imgSrc = cardInfo?.isOpponentCard ? imgBack : getCardImageUrl(cardInfo);

  if (cardInfo?.isOpponentCard) {
    // Cyber card back with geometric pattern
    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="w-full h-full bg-cyber-pattern rounded-lg overflow-hidden">
          {/* Cyber Pattern Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-purple to-dark-purple opacity-90"></div>
          
          {/* Geometric Pattern Overlay */}
          <div className="absolute inset-0 bg-cyber-grid opacity-60"></div>
          
          {/* Central Glow Effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-neon-blue/30 blur-sm animate-pulse"></div>
            <div className="absolute w-4 h-4 rounded-full bg-neon-blue/60 animate-ping"></div>
          </div>
          
          {/* Border Glow */}
          <div className="absolute inset-0 rounded-lg border border-neon-blue/40"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <img
        src={imgSrc || imgBack}
        alt={cardInfo?.isOpponentCard ? 'Carta del oponente' : `${cardInfo?.value} de ${cardInfo?.suit}`}
        className="w-full h-full object-cover rounded-lg"
        draggable="false"
        onError={(e) => {
          if (e.target.src.endsWith('.png')) {
            e.target.src = e.target.src.replace('.png', '.webp');
          } else {
            e.target.src = imgBack;
            setLoadError(true);
          }
        }}
        style={{
          imageRendering: 'crisp-edges',
          filter: 'contrast(1.15) brightness(1.1) saturate(1.25)',
        }}
      />

      {/* Futuristic Border Effect */}
      <div className="absolute inset-0 rounded-lg border border-white/30 pointer-events-none"></div>
      
      {/* Holographic Corner Effect */}
      <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-neon-blue/50 to-transparent rounded-bl-lg pointer-events-none"></div>

      {/* Error state */}
      {loadError && !cardInfo?.isOpponentCard && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-purple/90 rounded-lg border border-neon-blue">
          <div className="text-center text-neon-blue text-xs">
            <div className="font-bold mb-1">⚠️</div>
            <div>{cardInfo?.value} {cardInfo?.suit}</div>
          </div>
        </div>
      )}
    </div>
  );
}