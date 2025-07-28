import React from 'react';
import styles from './Card.module.css';
import imgBack from '../assets/back.png';

// --- Función para construir la ruta de la imagen de la carta ---
// Asume que las imágenes están en la carpeta `public/cards/`
// con el formato `{palo}_{valor}.png` (ej: `copas_1.png`).
const getCardImageUrl = (card) => {
  if (!card || !card.suit || !card.value) {
    // Si la información de la carta no es válida, devuelve el dorso por seguridad.
    return imgBack;
  }
  return `/cards/${card.suit}_${card.value}.png`;
};


function Card({ cardInfo }) {
  // Determina qué imagen mostrar:
  // 1. Si es una carta del oponente, muestra el dorso.
  // 2. Si no, construye la URL de la imagen dinámicamente.
  const imgSrc = cardInfo?.isOpponentCard ? imgBack : getCardImageUrl(cardInfo);

  // Fallback por si una imagen específica no se encuentra.
  // Usa el dorso de la carta como fallback universal.
  const fallbackImg = imgBack;

  return (
    <div className={styles.card}>
      <img
        src={imgSrc}
        alt={cardInfo?.isOpponentCard ? "Carta del oponente" : `Carta ${cardInfo?.value} de ${cardInfo?.suit}`}
        draggable="false"
        // Si la imagen no se puede cargar, muestra el fallback.
        onError={(e) => (e.target.src = fallbackImg)}
      />
    </div>
  );
}

export default Card;