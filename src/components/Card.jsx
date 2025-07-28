import React from 'react';
import styles from './Card.module.css';

// --- NOTA PARA TI ---
// Para que tus imágenes de cartas funcionen, crea la siguiente estructura de carpetas
// dentro de la carpeta `public` de tu proyecto:
// public/
// └── images/
//     └── suits/
//         ├── oros.png
//         ├── copas.png
//         ├── espadas.png
//         └── bastos.png
//
// Vite servirá automáticamente estos archivos desde la raíz.

// Devuelve la ruta de la imagen del palo
function getSuitAsset(suit) {
  switch (suit) {
    case 'oros': return '/images/suits/oros.png';
    case 'copas': return '/images/suits/copas.png';
    case 'espadas': return '/images/suits/espadas.png';
    case 'bastos': return '/images/suits/bastos.png';
    default: return '';
  }
}

// Devuelve el nombre del palo en texto
function getSuitName(suit) {
    switch (suit) {
      case 'oros': return 'oros';
      case 'copas': return 'copas';
      case 'espadas': return 'espadas';
      case 'bastos': return 'bastos';
      default: return '';
    }
}

function Card({ cardInfo }) {
  const isBack = cardInfo.id === 'deck' || cardInfo.isOpponentCard;

  if (isBack) {
    return <div className={`${styles.card} ${styles.cardBack}`}></div>;
  }

  return (
    <div className={styles.card}>
      <span className={styles.valueTop}>{cardInfo.value}</span>
      
      <div className={styles.suitContainer}>
        <img 
          src={getSuitAsset(cardInfo.suit)} 
          alt={cardInfo.suit} 
          className={styles.suitImage} 
        />
        <span className={styles.suitName}>{getSuitName(cardInfo.suit)}</span>
      </div>
      
      <span className={styles.valueBottom}>{cardInfo.value}</span>
    </div>
  );
}

export default Card;