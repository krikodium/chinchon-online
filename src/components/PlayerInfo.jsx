import React from 'react';
import styles from './PlayerInfo.module.css';

function PlayerInfo({ playerName, playerScore, maxScore = 50, avatar, position }) {
  // Determinar clase dinámica según la posición
  const positionClass = position === 'opponent' ? styles.opponentPosition : styles.playerPosition;

  return (
    <div className={`${styles.playerInfoContainer} ${positionClass}`}>
      {/* Avatar del jugador */}
      <div className={styles.playerAvatar}>
        <img src={avatar} alt="Avatar" />
      </div>

      {/* Nombre del jugador */}
      <span className={styles.playerName}>{playerName}</span>

      {/* Puntos */}
      <span className={styles.playerScore}>
        {playerScore} / {maxScore}
      </span>
    </div>
  );
}

export default PlayerInfo;
