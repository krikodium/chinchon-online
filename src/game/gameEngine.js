/**
 * Motor de juego mejorado para Chinchón
 * Implementa las reglas tradicionales con mejoras en la IA y lógica
 */

// Constantes del juego
export const GAME_CONSTANTS = {
  CARDS_PER_HAND: 7,
  DECK_SIZE: 40,
  MAX_POINTS_50: 50,
  MAX_POINTS_100: 100,
  CUT_THRESHOLD: 5,
  CHINCHON_BONUS: 25, // Bonus por hacer chinchón
  SUITS: ['oros', 'copas', 'espadas', 'bastos'],
  VALUES: [1, 2, 3, 4, 5, 6, 7, 10, 11, 12], // Sota=10, Caballo=11, Rey=12
  CARD_POINTS: {
    1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7,
    10: 10, 11: 10, 12: 10 // Figuras valen 10
  }
};

// Tipos de combinaciones
export const COMBINATION_TYPES = {
  TRIO: 'trio',      // 3 cartas del mismo valor
  CUARTETO: 'cuarteto', // 4 cartas del mismo valor
  ESCALERA: 'escalera'  // 3+ cartas consecutivas del mismo palo
};

/**
 * Crea una baraja española completa
 */
export function createDeck() {
  const deck = [];
  for (const suit of GAME_CONSTANTS.SUITS) {
    for (const value of GAME_CONSTANTS.VALUES) {
      deck.push({
        id: `${value}-${suit}`,
        suit,
        value,
        points: GAME_CONSTANTS.CARD_POINTS[value]
      });
    }
  }
  return deck;
}

/**
 * Baraja el mazo usando algoritmo Fisher-Yates
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Reparte cartas e inicializa el estado del juego
 */
export function dealCards(shuffledDeck, gameMode = 50) {
  const player1Hand = shuffledDeck.slice(0, GAME_CONSTANTS.CARDS_PER_HAND);
  const player2Hand = shuffledDeck.slice(7, 14);
  const deck = shuffledDeck.slice(15);
  const discardPile = [shuffledDeck[14]];

  return {
    player1Hand,
    player2Hand,
    deck,
    discardPile,
    gameMode,
    round: 1,
    turn: 1, // 1 = player1, 2 = player2
    phase: 'draw', // draw, discard
    lastAction: null,
    gameStartTime: Date.now()
  };
}

/**
 * Calcula los puntos de las cartas sobrantes
 */
export function calculatePoints(cards) {
  return cards.reduce((sum, card) => sum + card.points, 0);
}

/**
 * Verifica si una serie de cartas forman una escalera válida
 */
function isValidStraight(cards) {
  if (cards.length < 3) return false;
  
  const sortedCards = cards.sort((a, b) => a.value - b.value);
  
  for (let i = 0; i < sortedCards.length - 1; i++) {
    const current = sortedCards[i].value;
    const next = sortedCards[i + 1].value;
    
    // Manejo especial del salto 7 -> 10 (no hay 8 ni 9 en baraja española)
    const expectedNext = current === 7 ? 10 : current + 1;
    
    if (next !== expectedNext) {
      return false;
    }
  }
  return true;
}

/**
 * Encuentra todas las combinaciones posibles en una mano
 */
export function findAllCombinations(hand) {
  const combinations = [];
  
  // Buscar tríos y cuartetos
  const cardsByValue = {};
  hand.forEach(card => {
    if (!cardsByValue[card.value]) {
      cardsByValue[card.value] = [];
    }
    cardsByValue[card.value].push(card);
  });
  
  Object.values(cardsByValue).forEach(cards => {
    if (cards.length >= 3) {
      if (cards.length === 3) {
        combinations.push({
          type: COMBINATION_TYPES.TRIO,
          cards: [...cards],
          points: 0
        });
      } else if (cards.length === 4) {
        combinations.push({
          type: COMBINATION_TYPES.CUARTETO,
          cards: [...cards],
          points: 0
        });
      }
    }
  });
  
  // Buscar escaleras por palo
  const cardsBySuit = {};
  hand.forEach(card => {
    if (!cardsBySuit[card.suit]) {
      cardsBySuit[card.suit] = [];
    }
    cardsBySuit[card.suit].push(card);
  });
  
  Object.values(cardsBySuit).forEach(suitCards => {
    if (suitCards.length < 3) return;
    
    const sorted = suitCards.sort((a, b) => a.value - b.value);
    
    // Buscar todas las escaleras posibles de 3 o más cartas
    for (let start = 0; start < sorted.length - 2; start++) {
      for (let end = start + 2; end < sorted.length; end++) {
        const potentialStraight = sorted.slice(start, end + 1);
        if (isValidStraight(potentialStraight)) {
          combinations.push({
            type: COMBINATION_TYPES.ESCALERA,
            cards: [...potentialStraight],
            points: 0
          });
        }
      }
    }
  });
  
  return combinations;
}

/**
 * Analiza una mano y encuentra la mejor combinación de juegos
 * Algoritmo mejorado para optimización
 */
export function analyzeHand(hand) {
  const allCombinations = findAllCombinations(hand);
  
  if (allCombinations.length === 0) {
    return {
      combinations: [],
      deadwood: [...hand],
      points: calculatePoints(hand),
      isChinchon: false,
      canCut: false
    };
  }
  
  let bestResult = {
    combinations: [],
    deadwood: [...hand],
    points: calculatePoints(hand),
    isChinchon: false,
    canCut: false
  };
  
  // Probar todas las combinaciones posibles usando programación dinámica
  const totalCombinations = 1 << allCombinations.length;
  
  for (let mask = 1; mask < totalCombinations; mask++) {
    const selectedCombinations = [];
    const usedCardIds = new Set();
    let isValid = true;
    
    // Verificar si la combinación es válida (sin cartas duplicadas)
    for (let i = 0; i < allCombinations.length; i++) {
      if ((mask >> i) & 1) {
        const combination = allCombinations[i];
        
        // Verificar solapamiento
        if (combination.cards.some(card => usedCardIds.has(card.id))) {
          isValid = false;
          break;
        }
        
        selectedCombinations.push(combination);
        combination.cards.forEach(card => usedCardIds.add(card.id));
      }
    }
    
    if (isValid) {
      const deadwood = hand.filter(card => !usedCardIds.has(card.id));
      const points = calculatePoints(deadwood);
      
      // Verificar si es chinchón (todas las cartas en juegos)
      const isChinchon = deadwood.length === 0;
      const canCut = points <= GAME_CONSTANTS.CUT_THRESHOLD;
      
      if (points < bestResult.points || (points === bestResult.points && isChinchon)) {
        bestResult = {
          combinations: selectedCombinations,
          deadwood,
          points,
          isChinchon,
          canCut
        };
      }
    }
  }
  
  return bestResult;
}

/**
 * IA mejorada para el oponente
 */
export class ChichonAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.memory = new Map(); // Recordar cartas descartadas
  }
  
  /**
   * Decide si robar del mazo o del descarte
   */
  shouldDrawFromDiscard(hand, discardCard) {
    if (!discardCard) return false;
    
    // Simular añadir la carta del descarte
    const testHand = [...hand, discardCard];
    const currentAnalysis = analyzeHand(hand);
    const testAnalysis = analyzeHand(testHand);
    
    // Decidir basado en mejora de puntos y posibilidades
    const improvement = currentAnalysis.points - testAnalysis.points;
    
    // Factores de decisión según dificultad
    let threshold = 0;
    switch (this.difficulty) {
      case 'easy': threshold = 1; break;
      case 'medium': threshold = 2; break;
      case 'hard': threshold = 0; break;
    }
    
    return improvement >= threshold;
  }
  
  /**
   * Selecciona qué carta descartar
   */
  selectCardToDiscard(hand) {
    const analysis = analyzeHand(hand);
    
    if (analysis.deadwood.length === 0) {
      // Si no hay deadwood, descartar la carta de menor valor en juegos
      const allCards = analysis.combinations.flat().concat(analysis.deadwood);
      return allCards.sort((a, b) => a.points - b.points)[0];
    }
    
    // Descartar la carta de mayor valor del deadwood
    const sortedDeadwood = analysis.deadwood.sort((a, b) => b.points - a.points);
    
    // Con cierta probabilidad, no descartar la carta más valiosa (estrategia)
    if (this.difficulty === 'hard' && Math.random() < 0.3) {
      return sortedDeadwood[Math.min(1, sortedDeadwood.length - 1)];
    }
    
    return sortedDeadwood[0];
  }
  
  /**
   * Decide si cortar
   */
  shouldCut(hand, opponentPoints = null) {
    const analysis = analyzeHand(hand);
    
    if (analysis.isChinchon) return true;
    if (!analysis.canCut) return false;
    
    // Lógica de corte basada en dificultad y situación
    if (this.difficulty === 'easy') {
      return analysis.points <= 3;
    } else if (this.difficulty === 'medium') {
      return analysis.points <= 4 || (opponentPoints && analysis.points < opponentPoints);
    } else {
      // IA difícil considera más factores
      return analysis.points <= 5 && Math.random() < 0.8;
    }
  }
  
  /**
   * Actualiza la memoria de cartas vistas
   */
  rememberCard(card) {
    this.memory.set(card.id, card);
  }
  
  /**
   * Olvida cartas (para simular memoria limitada)
   */
  forgetOldCards() {
    if (this.memory.size > 20) {
      const entries = Array.from(this.memory.entries());
      const toDelete = entries.slice(0, 5);
      toDelete.forEach(([id]) => this.memory.delete(id));
    }
  }
}

/**
 * Calcula estadísticas del juego
 */
export function calculateGameStats(gameState, playerAnalysis, opponentAnalysis) {
  const stats = {
    round: gameState.round,
    turn: gameState.turn,
    cardsInDeck: gameState.deck.length,
    cardsInDiscard: gameState.discardPile.length,
    player1: {
      cardsInHand: gameState.player1Hand.length,
      points: playerAnalysis.points,
      canCut: playerAnalysis.canCut,
      isChinchon: playerAnalysis.isChinchon,
      combinationsCount: playerAnalysis.combinations.length
    },
    player2: {
      cardsInHand: gameState.player2Hand.length,
      points: opponentAnalysis.points,
      canCut: opponentAnalysis.canCut,
      isChinchon: opponentAnalysis.isChinchon,
      combinationsCount: opponentAnalysis.combinations.length
    },
    gameProgress: (GAME_CONSTANTS.DECK_SIZE - gameState.deck.length) / GAME_CONSTANTS.DECK_SIZE * 100
  };
  
  return stats;
}

/**
 * Valida si un movimiento es legal
 */
export function validateMove(gameState, action, playerId, cardId = null) {
  const validations = {
    isValid: true,
    errors: []
  };
  
  // Verificar turno
  if (gameState.turn !== playerId) {
    validations.isValid = false;
    validations.errors.push('No es tu turno');
    return validations;
  }
  
  // Validaciones específicas por acción
  switch (action) {
    case 'draw':
      if (gameState.phase !== 'draw') {
        validations.isValid = false;
        validations.errors.push('No puedes robar en esta fase');
      }
      break;
      
    case 'discard':
      if (gameState.phase !== 'discard') {
        validations.isValid = false;
        validations.errors.push('No puedes descartar en esta fase');
      }
      if (!cardId) {
        validations.isValid = false;
        validations.errors.push('Debes especificar qué carta descartar');
      }
      break;
      
    case 'cut':
      const hand = playerId === 1 ? gameState.player1Hand : gameState.player2Hand;
      const analysis = analyzeHand(hand);
      if (!analysis.canCut) {
        validations.isValid = false;
        validations.errors.push(`No puedes cortar con ${analysis.points} puntos`);
      }
      break;
  }
  
  return validations;
}

/**
 * Sistema de puntuación mejorado
 */
export function calculateRoundScore(player1Analysis, player2Analysis, winner, chinchonBonus = false) {
  const player1Points = player1Analysis.points;
  const player2Points = player2Analysis.points;
  
  let scoreToAdd = {
    player1: 0,
    player2: 0,
    winner: winner,
    chinchonBonus: false
  };
  
  if (winner === 1) {
    scoreToAdd.player1 = player2Points;
    if (chinchonBonus || player1Analysis.isChinchon) {
      scoreToAdd.player1 += GAME_CONSTANTS.CHINCHON_BONUS;
      scoreToAdd.chinchonBonus = true;
    }
  } else {
    scoreToAdd.player2 = player1Points;
    if (chinchonBonus || player2Analysis.isChinchon) {
      scoreToAdd.player2 += GAME_CONSTANTS.CHINCHON_BONUS;
      scoreToAdd.chinchonBonus = true;
    }
  }
  
  return scoreToAdd;
}

export default {
  createDeck,
  shuffleDeck,
  dealCards,
  calculatePoints,
  findAllCombinations,
  analyzeHand,
  ChichonAI,
  calculateGameStats,
  validateMove,
  calculateRoundScore,
  GAME_CONSTANTS,
  COMBINATION_TYPES
};