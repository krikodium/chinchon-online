import React from 'react';
import styles from './PlayerInfo.module.css';

function PlayerInfo({ playerName, playerScore, maxScore = 50, avatar }) {
  // Ya no necesitamos la prop 'position' aquí

  return (
    <div className={styles.playerInfoContainer}>
      {/* Avatar del jugador */}
      <div className={styles.playerAvatar}>
        <img src={avatar} alt="Avatar" />
      </div>

      {/* Div para agrupar el texto */}
      <div className={styles.textContainer}>
        <span className={styles.playerName}>{playerName}</span>
        <span className={styles.playerScore}>
          {playerScore} / {maxScore}
        </span>
      </div>
    </div>
  );
}

export default PlayerInfo;