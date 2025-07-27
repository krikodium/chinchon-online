import React from 'react';
import styles from './GameActions.module.css';

function GameActions({ onDrawFromDeck, onDrawFromPile, onDiscard, onCut, canDraw, canDiscard, canCut }) {
  return (
    <div className={styles.actionsContainer}>
      <button
        className={`${styles.actionButton} ${styles.drawButton}`}
        onClick={onDrawFromDeck}
        disabled={!canDraw}
      >
        Robar Mazo
      </button>
      <button
        className={`${styles.actionButton} ${styles.drawButton}`}
        onClick={onDrawFromPile}
        disabled={!canDraw}
      >
        Robar Pozo
      </button>
      <button
        className={`${styles.actionButton} ${styles.discardButton}`}
        onClick={onDiscard}
        disabled={!canDiscard}
      >
        Descartar
      </button>
      <button
        className={`${styles.actionButton} ${styles.cutButton}`}
        onClick={onCut}
        disabled={!canCut}
      >
        Cortar
      </button>
    </div>
  );
}

export default GameActions;
