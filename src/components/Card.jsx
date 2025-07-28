import React from 'react';
import styles from './Card.module.css';
import imgFront from '../assets/example.png';
import imgBack from '../assets/back.png';

function Card({ cardInfo }) {
  const imgSrc = cardInfo?.isOpponentCard ? imgBack : imgFront;

  return (
    <div className={styles.card}>
      <img
        src={imgSrc}
        alt="Carta"
        draggable="false"
        onError={(e) => (e.target.src = imgFront)}
      />
    </div>
  );
}

export default Card;
