/**
 * [cite_start]Crea una baraja española de 40 cartas. [cite: 20]
 * @returns {Array} Un array de objetos, donde cada objeto es una carta.
 */
export function createDeck() {
  const suits = ['oros', 'copas', 'espadas', 'bastos'];
  const values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]; // Sota, Caballo, Rey
  let deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ id: `${value}-${suit}`, suit, value });
    }
  }
  return deck;
}

/**
 * Baraja un mazo de cartas de forma aleatoria.
 * @param {Array} deck - El mazo a barajar.
 * @returns {Array} El mazo barajado.
 */
export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * [cite_start]Reparte 7 cartas a cada jugador y prepara la mesa. [cite: 21]
 * @param {Array} shuffledDeck - El mazo ya barajado.
 * @returns {Object} El estado inicial del juego.
 */
export function dealCards(shuffledDeck) {
  const player1Hand = shuffledDeck.slice(0, 7);
  const player2Hand = shuffledDeck.slice(7, 14);
  const deck = shuffledDeck.slice(15);
  const discardPile = [shuffledDeck[14]]; // La primera carta del pozo

  return {
    player1Hand,
    player2Hand,
    deck,
    discardPile,
  };
}

/**
 * [cite_start]Calcula los puntos de las cartas sobrantes (deadwood). [cite: 28]
 * Las cartas con valor 10, 11 o 12 (Sota, Caballo, Rey) valen 10 puntos.
 * El resto de cartas valen su propio valor.
 * @param {Array} deadwood - Las cartas que no forman parte de ninguna combinación.
 * @returns {number} El total de puntos.
 */
export function calculatePoints(deadwood) {
  return deadwood.reduce((sum, card) => {
    return sum + (card.value >= 10 ? 10 : card.value);
  }, 0);
}

/**
 * [cite_start]Analiza una mano para encontrar la mejor combinación posible de juegos. [cite: 26]
 * Esta función es el corazón de la IA del juego. Intenta minimizar los puntos
 * de las cartas sobrantes (deadwood).
 * @param {Array} hand - Un array de 7 u 8 cartas.
 * @returns {{combinations: Array, deadwood: Array}} Objeto con los juegos y las cartas sobrantes.
 */
export function analyzeHand(hand) {
  const allSets = findAllSets(hand);
  const allStraights = findAllStraights(hand);
  const allPossibleMelds = [...allSets, ...allStraights];

  if (allPossibleMelds.length === 0) {
    return { combinations: [], deadwood: hand };
  }

  let bestCombinationSet = [];
  let minDeadwoodPoints = 100;

  // Itera a través de todas las combinaciones posibles de juegos (melds)
  for (let i = 1; i < (1 << allPossibleMelds.length); i++) {
    let currentCombinationSet = [];
    let usedCardIds = new Set();
    let isValid = true;

    for (let j = 0; j < allPossibleMelds.length; j++) {
      if ((i >> j) & 1) { // Si el j-ésimo bit está encendido, incluimos este juego
        const currentMeld = allPossibleMelds[j];
        
        // Comprueba si alguna carta de este juego ya ha sido usada
        if (currentMeld.some(card => usedCardIds.has(card.id))) {
          isValid = false;
          break;
        }
        
        currentCombinationSet.push(currentMeld);
        currentMeld.forEach(card => usedCardIds.add(card.id));
      }
    }

    if (isValid) {
      const deadwood = hand.filter(card => !usedCardIds.has(card.id));
      const points = calculatePoints(deadwood);

      if (points < minDeadwoodPoints) {
        minDeadwoodPoints = points;
        bestCombinationSet = currentCombinationSet;
      }
    }
  }

  const finalUsedCardIds = new Set(bestCombinationSet.flat().map(c => c.id));
  const finalDeadwood = hand.filter(card => !finalUsedCardIds.has(card.id));

  return {
    combinations: bestCombinationSet,
    deadwood: finalDeadwood,
  };
}


// --- FUNCIONES AUXILIARES ---

/**
 * Encuentra todos los tríos o piernas posibles en una mano.
 * @param {Array} hand - La mano del jugador.
 * @returns {Array<Array>} Un array que contiene todos los juegos de tríos/piernas.
 */
function findAllSets(hand) {
  const sets = [];
  const cardsByValue = hand.reduce((acc, card) => {
    acc[card.value] = (acc[card.value] || []).concat(card);
    return acc;
  }, {});

  for (const value in cardsByValue) {
    if (cardsByValue[value].length >= 3) {
      sets.push(cardsByValue[value]);
    }
  }
  return sets;
}

/**
 * Encuentra todas las escaleras posibles en una mano.
 * @param {Array} hand - La mano del jugador.
 * @returns {Array<Array>} Un array que contiene todas las escaleras posibles.
 */
function findAllStraights(hand) {
  const straights = [];
  const cardsBySuit = hand.reduce((acc, card) => {
    acc[card.suit] = (acc[card.suit] || []).concat(card);
    return acc;
  }, {});

  for (const suit in cardsBySuit) {
    if (cardsBySuit[suit].length < 3) continue;
    
    // Ordena las cartas por valor y elimina duplicados
    const uniqueSortedCards = [...new Map(cardsBySuit[suit].map(c => [c.value, c])).values()]
      .sort((a, b) => a.value - b.value);

    if (uniqueSortedCards.length < 3) continue;

    // Busca secuencias de 3 o más
    for (let i = 0; i <= uniqueSortedCards.length - 3; i++) {
      for (let j = i + 2; j < uniqueSortedCards.length; j++) {
        const potentialStraight = uniqueSortedCards.slice(i, j + 1);
        if (isConsecutive(potentialStraight)) {
          straights.push(potentialStraight);
        }
      }
    }
  }
  return straights;
}

/**
 * Comprueba si un array de cartas ordenadas son consecutivas.
 * @param {Array} cards - Un array de cartas ordenado por valor.
 * @returns {boolean}
 */
function isConsecutive(cards) {
  for (let i = 0; i < cards.length - 1; i++) {
    const currentCardValue = cards[i].value;
    const nextCardValue = cards[i+1].value;
    
    // Maneja el salto del 7 a la sota (10)
    const expectedNextValue = currentCardValue === 7 ? 10 : currentCardValue + 1;
    
    if (nextCardValue !== expectedNextValue) {
      return false;
    }
  }
  return true;
}