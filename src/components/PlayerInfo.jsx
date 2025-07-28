import React from 'react';
import styles from './Board.module.css';

function PlayerInfo({ playerName, playerScore }) {
  return (
    <div>
      <span>{playerName}</span>
      <span className="score">Puntos: {playerScore}</span>
    </div>
  );
}

export default PlayerInfo;
