import type { Card as CardType } from "@/lib/game-utils"

interface CardProps {
  card: CardType
  faceDown?: boolean
}

export default function Card({ card, faceDown = false }: CardProps) {
  if (faceDown) {
    return (
      <div className="aspect-[2.5/3.5] bg-slate-700 rounded-lg border-2 border-slate-600 flex items-center justify-center shadow-md transition-transform hover:scale-105">
        <div className="w-12 h-12 rounded-full bg-slate-600"></div>
      </div>
    )
  }

  // Use the same color for both spades and clubs (monsters)
  const isMonster = card.suit === "spades" || card.suit === "clubs"
  const suitColor = card.suit === "hearts" || card.suit === "diamonds" ? "text-red-500" : "text-slate-900"
  const bgColor = card.suit === "hearts" ? "bg-red-100" : card.suit === "diamonds" ? "bg-yellow-100" : "bg-slate-200" // Same background for both spades and clubs

  const suitSymbol = card.suit === "hearts" ? "♥" : card.suit === "diamonds" ? "♦" : card.suit === "spades" ? "♠" : "♣"

  const cardType = card.suit === "hearts" ? "Potion" : card.suit === "diamonds" ? "Weapon" : "Monster"

  return (
    <div
      className={`aspect-[2.5/3.5] ${bgColor} rounded-lg border-2 border-slate-300 flex flex-col p-2 shadow-md transition-transform hover:scale-105`}
    >
      <div className="flex justify-between items-start">
        <div className={`font-bold ${suitColor}`}>{card.display}</div>
        <div className={`text-xl ${suitColor}`}>{suitSymbol}</div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className={`text-4xl ${suitColor}`}>{suitSymbol}</div>
      </div>
      <div className="text-center text-xs font-semibold text-slate-600">{cardType}</div>
      <div className="flex justify-between items-end">
        <div className={`text-xl ${suitColor}`}>{suitSymbol}</div>
        <div className={`font-bold ${suitColor}`}>{card.display}</div>
      </div>
    </div>
  )
}
