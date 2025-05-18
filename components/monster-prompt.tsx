"use client"

import type { Card as CardType } from "@/lib/game-utils"
import { Button } from "@/components/ui/button"
import { Sword, FingerprintIcon as Fist } from "lucide-react"

interface MonsterPromptProps {
  monster: CardType
  weapon: CardType | null
  weaponDefeated: CardType[]
  onChoice: (useWeapon: boolean) => void
}

export default function MonsterPrompt({ monster, weapon, weaponDefeated, onChoice }: MonsterPromptProps) {
  // A new weapon (no monsters defeated) can be used against any monster
  const canUseWeapon =
    weapon && (weaponDefeated.length === 0 || monster.value <= Math.max(...weaponDefeated.map((card) => card.value)))

  // Calculate potential damage
  const potentialDamage = weapon ? Math.max(0, monster.value - weapon.value) : monster.value

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-4 max-w-sm w-full">
        <h2 className="text-xl font-bold mb-2 text-center">Monster Encountered!</h2>
        <p className="mb-4 text-center">
          You've selected the {monster.display} of {monster.suit}. How do you want to fight it?
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => onChoice(true)}
            className={`flex items-center justify-center gap-2 ${canUseWeapon ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
            disabled={!weapon || !canUseWeapon}
          >
            <Sword className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span>Use Weapon</span>
              {weapon ? (
                canUseWeapon ? (
                  <span className="text-xs opacity-80">
                    {potentialDamage > 0
                      ? `Will take ${potentialDamage} damage (${monster.value} - ${weapon.value})`
                      : "Will defeat without taking damage"}
                  </span>
                ) : (
                  <span className="text-xs opacity-80">Cannot use weapon against this monster yet</span>
                )
              ) : (
                <span className="text-xs opacity-80">No weapon equipped</span>
              )}
            </div>
          </Button>

          <Button
            onClick={() => onChoice(false)}
            className="bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-2"
          >
            <Fist className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span>Fight Barehanded</span>
              <span className="text-xs opacity-80">Will take {monster.value} damage</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}
