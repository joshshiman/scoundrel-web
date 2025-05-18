export type Suit = "hearts" | "diamonds" | "clubs" | "spades"
export type CardValue = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14
export type CardDisplay = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A"

export interface Card {
  suit: Suit
  value: CardValue
  display: CardDisplay
}

export function createDeck(): Card[] {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
  const values: CardValue[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
  const displays: CardDisplay[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

  const deck: Card[] = []

  suits.forEach((suit) => {
    values.forEach((value, index) => {
      // Skip red face cards (hearts/diamonds JQK) and red aces
      if ((suit === "hearts" || suit === "diamonds") && value >= 11) {
        return
      }

      deck.push({
        suit,
        value,
        display: displays[index],
      })
    })
  })

  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck]

  // Fisher-Yates shuffle algorithm
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
  }

  return newDeck
}
