import React from 'react';
import styles from './PlayerInfo.module.css';

// Asegúrate de tener una imagen en la ruta src/assets/avatar.png
import avatarPlaceholder from '../assets/avatar.png';

function PlayerInfo({ playerName, playerScore, isOpponent = false }) {
  // Si la imagen no carga, este onError la oculta para evitar un ícono roto
  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  return (
    <div className={styles.infoContainer}>
      <img 
        src={avatarPlaceholder} 
        alt={`Avatar de ${playerName}`} 
        className={styles.avatar}
        onError={handleImageError} 
      />
      <div className={styles.details}>
        <span className={styles.name}>{playerName}</span>
        <span className={styles.score}>{playerScore} / 100</span>
      </div>
    </div>
  );
}

export default PlayerInfo;