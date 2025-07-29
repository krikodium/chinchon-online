import React, { useState } from 'react';
import styles from './Card.module.css';
import imgBack from '../assets/back.png';

// Carpetas según estructura
const suitFolderMap = {
  oros: 'OROS',
  copas: 'COPAS',
  espadas: 'ESPADA',
  bastos: 'BASTOS',
};

const cardFileNameMap = {
  oros: {
    1: '1 As de oros.png',
    2: '2 de oros.png',
    3: '3 de oros.png',
    4: '4 de oros.png',
    5: '5 de oros.png',
    6: '6 de oros.png',
    7: '7 de oros.png',
    10: '10 sota de oros.png',
    11: '11 caballero de oros.png',
    12: '12 rey de oros.png',
  },
  copas: {
    1: '1 as de copas.png',
    2: '2 de copas.png',
    3: '3 de copas.png',
    4: '4 de copas.png',
    5: '5 de copas.png',
    6: '6 de copas.png',
    7: '7 de copas.png',
    10: '10 de copas.png',
    11: '11 de copas.png',
    12: '12 de copas.png',
  },
  espadas: {
    1: '1 As de espadas.png',
    2: '2 de espadas.png',
    3: '3 de espadas.png',
    4: '4 de espadas.png',
    5: '5 de espadas.png',
    6: '6 de espadas.png',
    7: '7 de espadas.png',
    10: '10 sota de espadas.png',
    11: '11 caballero de espadas.png',
    12: '12 Rey de espadas.png',
  },
  bastos: {
    1: '1 As de bastos.png',
    2: '2 de bastos.png',
    3: '3 de bastos.png',
    4: '4 de bastos.png',
    5: '5 de bastos.png',
    6: '6 de bastos.png',
    7: '7 de bastos.png',
    10: '10 sota de bastos.png',
    11: '11 caballero de bastos.png',
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

function Card({ cardInfo }) {
  const [loadError, setLoadError] = useState(false);
  const imgSrc = cardInfo?.isOpponentCard ? imgBack : getCardImageUrl(cardInfo);

  const cardLabel = `${cardInfo?.value} de ${cardInfo?.suit}`;

  return (
    <div className={styles.card} style={{ position: 'relative', textAlign: 'center' }}>
      <img
        src={imgSrc || imgBack}
        alt={cardInfo?.isOpponentCard ? 'Carta del oponente' : `Carta ${cardInfo?.value} de ${cardInfo?.suit}`}
        draggable="false"
        onError={(e) => {
          if (e.target.src.endsWith('.png')) {
            e.target.src = e.target.src.replace('.png', '.webp');
          } else {
            e.target.src = imgBack;
            setLoadError(true);
          }
        }}
        style={{ width: '100%', display: 'block' }}
      />
      {loadError && !cardInfo?.isOpponentCard && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          ❌ {cardLabel}
        </div>
      )}
    </div>
  );
}

export default Card;
