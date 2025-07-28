import React from 'react';
import styles from './Card.module.css';

function Card({ cardInfo }) {
  const { suit, value, isOpponentCard } = cardInfo;

  const cardImage = isOpponentCard
    ? '/assets/cards/back.png' // Imagen reverso
    : `/assets/cards/${suit}_${value}.png`; // Imagen frontal

  return (
    <div className={styles.card}>
      <img src={cardImage} alt={isOpponentCard ? "Dorso" : `${value} de ${suit}`} />
    </div>
  );
}

export default Card;
