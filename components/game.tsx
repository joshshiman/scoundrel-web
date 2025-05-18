"use client"

import { useState, useEffect, useRef } from "react"
import { type Card as CardType, createDeck, shuffleDeck } from "@/lib/game-utils"
import Card from "@/components/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { AlertCircle, Heart, RefreshCw, Shield, Sword, Terminal } from "lucide-react"
import MonsterPrompt from "@/components/monster-prompt"
import GameLog from "@/components/game-log"

export default function Game() {
  const [deck, setDeck] = useState<CardType[]>([])
  const [room, setRoom] = useState<CardType[]>([])
  const [discard, setDiscard] = useState<CardType[]>([])
  const [health, setHealth] = useState(20)
  const [weapon, setWeapon] = useState<CardType | null>(null)
  const [weaponDefeated, setWeaponDefeated] = useState<CardType[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [potionUsedThisTurn, setPotionUsedThisTurn] = useState(false)
  const [avoidedLastTurn, setAvoidedLastTurn] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedCards, setSelectedCards] = useState<number[]>([])
  const [processingTurn, setProcessingTurn] = useState(false)
  const { toast } = useToast()
  const isMobile = useMobile()

  // Add state for visual feedback
  const [damageEffect, setDamageEffect] = useState(false)
  const [roomTransition, setRoomTransition] = useState(false)
  const [retainedCardIndex, setRetainedCardIndex] = useState<number | null>(null)
  const [processingCardIndex, setProcessingCardIndex] = useState<number | null>(null)

  // Add state for monster interaction
  const [monsterPromptOpen, setMonsterPromptOpen] = useState(false)
  const [currentMonster, setCurrentMonster] = useState<{ card: CardType; index: number } | null>(null)
  const [pendingActions, setPendingActions] = useState<{ card: CardType; index: number; useWeapon?: boolean }[]>([])

  // Add state for tracking previous weapon state when selecting/deselecting weapons
  const [previousWeaponState, setPreviousWeaponState] = useState<{
    weapon: CardType | null
    weaponDefeated: CardType[]
  } | null>(null)

  // Add state for game log
  const [gameLog, setGameLog] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  // Add ref for current health to ensure we always have the latest value
  const currentHealthRef = useRef(health)

  // Update the ref whenever health changes
  useEffect(() => {
    currentHealthRef.current = health
  }, [health])

  // Initialize game
  useEffect(() => {
    if (gameStarted) {
      startNewGame()
    }
  }, [gameStarted])

  // Add log entry
  const addLog = (message: string) => {
    setGameLog((prev) => [...prev, message])

    // Scroll to bottom of log
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight
      }
    }, 100)
  }

  // Get the strongest monster defeated by the current weapon
  const getStrongestDefeated = (): number => {
    if (weaponDefeated.length === 0) return 0
    return Math.max(...weaponDefeated.map((card) => card.value))
  }

  // Check if the weapon can be used against a monster
  const canUseWeaponAgainst = (monsterValue: number): boolean => {
    // A new weapon (no monsters defeated) can be used against any monster
    if (weaponDefeated.length === 0) return true

    // Otherwise, can only be used against monsters with values less than or equal to
    // the strongest monster defeated
    return monsterValue <= getStrongestDefeated()
  }

  const startNewGame = () => {
    const newDeck = shuffleDeck(createDeck())
    setDeck(newDeck)
    setRoom([])
    setDiscard([])
    setHealth(20)
    currentHealthRef.current = 20
    setWeapon(null)
    setWeaponDefeated([])
    setPreviousWeaponState(null)
    setGameOver(false)
    setScore(0)
    setPotionUsedThisTurn(false)
    setAvoidedLastTurn(false)
    setSelectedCards([])
    setProcessingTurn(false)
    setPendingActions([])

    // Reset all visual feedback states
    setDamageEffect(false)
    setRoomTransition(false)
    setRetainedCardIndex(null)
    setProcessingCardIndex(null)
    setMonsterPromptOpen(false)
    setCurrentMonster(null)

    setGameLog(["Game started. Good luck!"])
    dealRoom(newDeck)
  }

  const dealRoom = (currentDeck: CardType[] = deck) => {
    if (currentDeck.length === 0) {
      endGame(true)
      return
    }

    const newDeck = [...currentDeck]
    const newRoom: CardType[] = []

    // Fill room to 4 cards
    while (newRoom.length < 4 && newDeck.length > 0) {
      newRoom.push(newDeck.shift()!)
    }

    setDeck(newDeck)
    setRoom(newRoom)
    setPotionUsedThisTurn(false)

    addLog(`Entered a new room with ${newRoom.length} cards.`)

    // Check if game is over due to empty deck
    if (newDeck.length === 0 && newRoom.length < 4) {
      // Let player finish the last room first
      if (newRoom.length === 0) {
        endGame(true)
      }
    }
  }

  // Update the avoidRoom function to show transition
  const avoidRoom = () => {
    if (avoidedLastTurn) {
      toast({
        title: "Cannot avoid",
        description: "You cannot avoid rooms twice in a row",
        variant: "destructive",
      })
      addLog("Cannot avoid rooms twice in a row.")
      return
    }

    setRoomTransition(true)
    addLog("Avoiding this room...")

    setTimeout(() => {
      const newDeck = [...deck, ...room]
      setDeck(newDeck)
      setRoom([])
      setAvoidedLastTurn(true)

      setTimeout(() => {
        dealRoom(newDeck)
        setRoomTransition(false)

        toast({
          title: "Room Avoided",
          description: "You avoided this room. All cards were placed at the bottom of the deck.",
        })
        addLog("Room avoided. All cards were placed at the bottom of the deck.")
      }, 500)
    }, 300)
  }

  const selectCard = (index: number) => {
    if (processingTurn) return

    // Check if the card is a monster (spades or clubs)
    const card = room[index]

    // If the card is already selected, handle deselection
    if (selectedCards.includes(index)) {
      // If this is a weapon card that was equipped when selected, restore previous weapon state
      if (card.suit === "diamonds") {
        if (previousWeaponState) {
          setWeapon(previousWeaponState.weapon)
          setWeaponDefeated(previousWeaponState.weaponDefeated)
          setPreviousWeaponState(null)
          addLog(`Deselected: ${card.display} of ${card.suit}. Previous weapon restored.`)
        } else {
          addLog(`Deselected: ${card.display} of ${card.suit}.`)
        }
      } else if (card.suit === "hearts") {
        addLog(`Deselected: ${card.display} of ${card.suit} (Health Potion).`)
      } else {
        // Find the pending action to see if they were using a weapon
        const action = pendingActions.find((a) => a.index === index)
        if (action) {
          addLog(
            `Deselected: ${card.display} of ${card.suit} (Monster) - ${action.useWeapon ? "Was using weapon" : "Was fighting barehanded"}.`,
          )
        } else {
          addLog(`Deselected: ${card.display} of ${card.suit} (Monster).`)
        }
      }

      setSelectedCards(selectedCards.filter((i) => i !== index))
      // Remove from pending actions if it exists
      setPendingActions(pendingActions.filter((action) => action.index !== index))
      return
    }

    // Handle new card selection
    if (selectedCards.length < 3) {
      // Special handling for weapon cards - equip immediately
      if (card.suit === "diamonds") {
        // Save current weapon state before changing it
        setPreviousWeaponState({
          weapon,
          weaponDefeated,
        })

        // Equip the new weapon immediately
        setWeapon(card)
        setWeaponDefeated([]) // Reset defeated monsters for new weapon

        toast({
          title: "Weapon Equipped",
          description: `Equipped ${card.display} of ${card.suit}`,
        })
        addLog(`Selected: ${card.display} of ${card.suit} as your weapon.`)
      }

      // If it's a monster, open the prompt
      if (card.suit === "spades" || card.suit === "clubs") {
        // Open monster prompt
        setCurrentMonster({ card, index })
        setMonsterPromptOpen(true)
        return
      }

      // For all other cards, add to selected cards
      setSelectedCards([...selectedCards, index])

      // Add to pending actions
      setPendingActions([...pendingActions, { card, index }])

      if (card.suit === "hearts") {
        addLog(`Selected: ${card.display} of ${card.suit} (Health Potion)`)
      }
    }
  }

  // Handle monster choice
  const handleMonsterChoice = (useWeapon: boolean) => {
    if (!currentMonster) return

    const { card, index } = currentMonster

    // Add to selected cards
    if (!selectedCards.includes(index)) {
      setSelectedCards([...selectedCards, index])
    }

    // Add to pending actions with the weapon choice
    setPendingActions([...pendingActions, { card, index, useWeapon }])

    addLog(`Selected: ${card.display} of ${card.suit} (Monster) - ${useWeapon ? "Using weapon" : "Barehanded"}`)

    // Close the prompt
    setMonsterPromptOpen(false)
    setCurrentMonster(null)
  }

  // Update confirmSelection to process cards in the exact order they were selected
  const confirmSelection = async () => {
    if (selectedCards.length !== 3) {
      toast({
        title: "Select 3 cards",
        description: "You must select 3 cards to proceed",
        variant: "destructive",
      })
      return
    }

    setProcessingTurn(true)
    addLog("Processing turn...")

    // Find the unselected card index
    const remainingCardIndex = [0, 1, 2, 3].find((i) => !selectedCards.includes(i))

    // Highlight the retained card
    if (remainingCardIndex !== undefined) {
      setRetainedCardIndex(remainingCardIndex)
      addLog(
        `Card ${room[remainingCardIndex].display} of ${room[remainingCardIndex].suit} will be retained for the next room.`,
      )
    }

    // Clear the previous weapon state as we're committing the changes
    setPreviousWeaponState(null)

    // Process each action in the order they were added to pendingActions
    for (const action of pendingActions) {
      setProcessingCardIndex(action.index)
      await processCard(action.card, action.useWeapon)

      // Check if game is over after each card
      if (gameOver) {
        return
      }

      setProcessingCardIndex(null)
    }

    // Create a new room with just the unselected card
    const newRoom = remainingCardIndex !== undefined ? [room[remainingCardIndex]] : []

    // Show room transition effect
    setRoomTransition(true)

    setTimeout(() => {
      // Update the room state with just the retained card
      setRoom(newRoom)
      setSelectedCards([])
      setPendingActions([])
      setAvoidedLastTurn(false)
      setRetainedCardIndex(null)

      // Deal new cards to fill the room, but keep the retained card
      setTimeout(() => {
        // Deal new cards from the deck to fill the room to 4 cards
        const newDeck = [...deck]
        const updatedRoom = [...newRoom]

        while (updatedRoom.length < 4 && newDeck.length > 0) {
          updatedRoom.push(newDeck.shift()!)
        }

        setDeck(newDeck)
        setRoom(updatedRoom)
        setRoomTransition(false)
        setProcessingTurn(false)

        if (newRoom.length > 0) {
          toast({
            title: "New Room",
            description: `Entered a new room with ${updatedRoom.length} cards, including 1 retained card`,
          })
        } else {
          toast({
            title: "New Room",
            description: `Entered a new room with ${updatedRoom.length} cards`,
          })
        }

        // Check if game is over due to empty deck
        if (newDeck.length === 0 && updatedRoom.length < 4 && updatedRoom.length === newRoom.length) {
          // Let player finish the last room first if there are cards
          if (updatedRoom.length === 0) {
            endGame(true)
          }
        }
      }, 500)
    }, 800)
  }

  // Update the processCard function to handle weapon choice for monsters and fix health calculation
  const processCard = async (card: CardType, useWeapon?: boolean): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newDiscard = [...discard, card]
        setDiscard(newDiscard)

        if (card.suit === "hearts") {
          // Health potion
          if (!potionUsedThisTurn) {
            const healAmount = card.value
            // Use the ref to get the current health value
            const newHealth = Math.min(20, currentHealthRef.current + healAmount)
            setHealth(newHealth)
            currentHealthRef.current = newHealth
            setPotionUsedThisTurn(true)
            toast({
              title: "Health Potion",
              description: `Restored ${healAmount} health. Health: ${newHealth}`,
            })
            addLog(`Used ${card.display} of ${card.suit} - Restored ${healAmount} health. Health: ${newHealth}/20`)
          } else {
            toast({
              title: "Potion Discarded",
              description: "You can only use one potion per turn",
              variant: "destructive",
            })
            addLog(`Discarded ${card.display} of ${card.suit} - You can only use one potion per turn.`)
          }
        } else if (card.suit === "diamonds") {
          // Weapon - already equipped when selected, just add to log for confirmation
          addLog(`Confirmed ${card.display} of ${card.suit} as your weapon.`)
        } else {
          // Monster (spades or clubs)
          const monsterValue = card.value

          // Handle based on weapon choice
          if (useWeapon && weapon) {
            // Check if weapon can be used against this monster
            if (canUseWeaponAgainst(monsterValue)) {
              // Calculate damage (monster value - weapon value)
              const damage = Math.max(0, monsterValue - weapon.value)

              // Use the ref to get the current health value
              const newHealth = currentHealthRef.current - damage
              setHealth(newHealth)
              currentHealthRef.current = newHealth

              // Add this monster to the weapon's defeated list ONLY if it was successfully defeated
              // Fix: Only add to weaponDefeated if the monster value is greater than any previously defeated
              if (monsterValue > getStrongestDefeated()) {
                setWeaponDefeated([...weaponDefeated, card])
                addLog(`Your weapon can now defeat monsters up to value ${monsterValue}.`)
              }

              // Show damage effect if damage was taken
              if (damage > 0) {
                setDamageEffect(true)
                setTimeout(() => setDamageEffect(false), 500)
              }

              toast({
                title: "Monster Defeated",
                description: `Used weapon to defeat ${card.display} of ${card.suit}. Took ${damage} damage. Health: ${newHealth}`,
              })
              addLog(
                `Used weapon to defeat ${card.display} of ${card.suit}. Took ${damage} damage. Health: ${newHealth}/20`,
              )

              // Check if player died
              if (newHealth <= 0) {
                endGame(false)
                return
              }
            } else {
              // Weapon cannot be used against this monster
              toast({
                title: "Weapon Ineffective",
                description: `Your weapon can't be used against the ${card.display} of ${card.suit}. You must fight barehanded.`,
                variant: "destructive",
              })
              addLog(
                `Your weapon can't be used against the ${card.display} of ${card.suit}. You must fight barehanded.`,
              )

              // Fight barehanded instead
              const damage = monsterValue
              const newHealth = currentHealthRef.current - damage
              setHealth(newHealth)
              currentHealthRef.current = newHealth

              // Show damage effect
              setDamageEffect(true)
              setTimeout(() => setDamageEffect(false), 500)

              toast({
                title: "Fought Barehanded",
                description: `Fought ${card.display} of ${card.suit} barehanded. Took ${damage} damage. Health: ${newHealth}`,
                variant: "destructive",
              })
              addLog(
                `Fought ${card.display} of ${card.suit} barehanded. Took ${damage} damage. Health: ${newHealth}/20`,
              )

              // Check if player died
              if (newHealth <= 0) {
                endGame(false)
                return
              }
            }
          } else if (useWeapon === false) {
            // Fighting barehanded by choice
            const damage = monsterValue
            const newHealth = currentHealthRef.current - damage
            setHealth(newHealth)
            currentHealthRef.current = newHealth

            // Show damage effect
            setDamageEffect(true)
            setTimeout(() => setDamageEffect(false), 500)

            toast({
              title: "Fought Barehanded",
              description: `Fought ${card.display} of ${card.suit} barehanded. Took ${damage} damage. Health: ${newHealth}`,
              variant: "destructive",
            })
            addLog(`Fought ${card.display} of ${card.suit} barehanded. Took ${damage} damage. Health: ${newHealth}/20`)

            // Check if player died
            if (newHealth <= 0) {
              endGame(false)
              return
            }
          } else {
            // Default behavior (for backward compatibility)
            // This should not be reached with the new UI, but keeping it for safety
            if (weapon) {
              if (canUseWeaponAgainst(monsterValue)) {
                // Calculate damage (monster value - weapon value)
                const damage = Math.max(0, monsterValue - weapon.value)

                // Use the ref to get the current health value
                const newHealth = currentHealthRef.current - damage
                setHealth(newHealth)
                currentHealthRef.current = newHealth

                // Add this monster to the weapon's defeated list ONLY if it was successfully defeated
                // Fix: Only add to weaponDefeated if the monster value is greater than any previously defeated
                if (monsterValue > getStrongestDefeated()) {
                  setWeaponDefeated([...weaponDefeated, card])
                  addLog(`Your weapon can now defeat monsters up to value ${monsterValue}.`)
                }

                // Show damage effect if damage was taken
                if (damage > 0) {
                  setDamageEffect(true)
                  setTimeout(() => setDamageEffect(false), 500)
                }

                toast({
                  title: "Monster Defeated",
                  description: `Used weapon to defeat ${card.display} of ${card.suit}. Took ${damage} damage. Health: ${newHealth}`,
                })
                addLog(
                  `Used weapon to defeat ${card.display} of ${card.suit}. Took ${damage} damage. Health: ${newHealth}/20`,
                )
              } else {
                // Weapon cannot be used against this monster
                const damage = monsterValue
                const newHealth = currentHealthRef.current - damage
                setHealth(newHealth)
                currentHealthRef.current = newHealth

                // Show damage effect
                setDamageEffect(true)
                setTimeout(() => setDamageEffect(false), 500)

                toast({
                  title: "Fought Barehanded",
                  description: `Weapon ineffective. Fought ${card.display} of ${card.suit} barehanded. Took ${damage} damage. Health: ${newHealth}`,
                  variant: "destructive",
                })
                addLog(
                  `Weapon ineffective. Fought ${card.display} of ${card.suit} barehanded. Took ${damage} damage. Health: ${newHealth}/20`,
                )
              }
            } else {
              // No weapon
              const damage = monsterValue
              const newHealth = currentHealthRef.current - damage
              setHealth(newHealth)
              currentHealthRef.current = newHealth

              // Show damage effect
              setDamageEffect(true)
              setTimeout(() => setDamageEffect(false), 500)

              toast({
                title: "Fought Barehanded",
                description: `No weapon! Took ${damage} damage. Health: ${newHealth}`,
              })
              addLog(
                `No weapon! Fought ${card.display} of ${card.suit} barehanded. Took ${damage} damage. Health: ${newHealth}/20`,
              )
            }

            // Check if player died
            if (currentHealthRef.current <= 0) {
              endGame(false)
              return
            }
          }
        }

        resolve()
      }, 300)
    })
  }

  const endGame = (survived: boolean) => {
    let finalScore = 0

    if (survived) {
      finalScore = health

      // Check if last card was a potion
      const lastCard = discard[discard.length - 1]
      if (lastCard && lastCard.suit === "hearts") {
        finalScore += lastCard.value
      }

      toast({
        title: "Victory!",
        description: `You survived the dungeon with ${health} health. Final score: ${finalScore}`,
      })
      addLog(`Victory! You survived the dungeon with ${health} health. Final score: ${finalScore}`)
    } else {
      // Calculate negative score from remaining monsters
      let monsterPenalty = 0
      deck.forEach((card) => {
        if (card.suit === "spades" || card.suit === "clubs") {
          monsterPenalty += card.value
        }
      })
      room.forEach((card) => {
        if (card.suit === "spades" || card.suit === "clubs") {
          monsterPenalty += card.value
        }
      })

      finalScore = -monsterPenalty

      toast({
        title: "Game Over",
        description: `You died! Final score: ${finalScore}`,
        variant: "destructive",
      })
      addLog(`Game Over! You died! Final score: ${finalScore}`)
    }

    setScore(finalScore)
    setGameOver(true)
  }

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto text-center min-h-screen bg-slate-800">
        <h1 className="text-4xl font-bold mb-6">Scoundrel</h1>
        <p className="mb-4">A single-player card game by Zach Gage and Kurt Bieg</p>
        <div className="bg-slate-700 p-4 rounded-lg mb-6 text-left">
          <h2 className="text-xl font-semibold mb-2">How to Play:</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Sword className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                Defeat monsters with weapons. Weapons reduce damage by their value. A new weapon can fight any monster.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                After defeating a monster, a weapon can only be used against monsters of equal or lesser value.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Heart className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>Health potions restore HP (max 20). Only one potion per turn.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>Choose 3 of 4 cards each turn. The 4th card stays for the next turn.</span>
            </li>
          </ul>
        </div>
        <Button onClick={() => setGameStarted(true)} className="w-full bg-emerald-600 hover:bg-emerald-700">
          Start Game
        </Button>
      </div>
    )
  }

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto text-center min-h-screen bg-slate-800">
        <h1 className="text-3xl font-bold mb-4">Game Over</h1>
        <p className="text-xl mb-2">Final Score: {score}</p>
        <p className="mb-6">{score >= 0 ? "You survived the dungeon!" : "You were defeated!"}</p>
        <Button onClick={startNewGame} className="w-full bg-emerald-600 hover:bg-emerald-700">
          Play Again
        </Button>

        {/* Game Log in Game Over screen */}
        <div className="mt-6 w-full">
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Game Log</h3>
          </div>
          <GameLog logs={gameLog} ref={logRef} />
        </div>
      </div>
    )
  }

  // Update the return statement to include monster prompt and game log
  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto p-4 bg-slate-800">
      {/* Damage effect overlay */}
      {damageEffect && <div className="fixed inset-0 bg-red-900 opacity-50 pointer-events-none z-10"></div>}

      {/* Game Stats */}
      <div className="flex justify-between items-center mb-4 relative z-20">
        <div className="flex items-center gap-1">
          <Heart className={`h-5 w-5 ${health < 5 ? "text-red-500 animate-pulse" : "text-red-500"}`} />
          <span className={`font-bold ${health < 5 ? "text-red-500" : ""}`}>{health}/20</span>
        </div>
        {weapon && (
          <div className="flex items-center gap-1">
            <Sword className="h-5 w-5 text-yellow-500" />
            <span className="font-bold">
              {getStrongestDefeated() > 0 ? `${getStrongestDefeated()}/${weapon.value}` : weapon.value} of {weapon.suit}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="text-sm">Cards: {deck.length}</span>
        </div>
      </div>

      {/* Room */}
      <div
        className={`flex-1 flex flex-col transition-opacity duration-500 relative z-20 ${roomTransition ? "opacity-0" : "opacity-100"}`}
      >
        <h2 className="text-center mb-2 font-semibold">Current Room</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {room.map((card, index) => (
            <div
              key={`${card.suit}-${card.value}-${index}`}
              className={`relative transition-all duration-300 ${
                selectedCards.includes(index)
                  ? `ring-2 ${
                      processingCardIndex === index
                        ? "ring-blue-500 bg-blue-100 rounded-lg transform scale-105"
                        : "ring-yellow-400 rounded-lg transform scale-105"
                    }`
                  : retainedCardIndex === index
                    ? "ring-2 ring-emerald-400 rounded-lg animate-pulse"
                    : ""
              }`}
              onClick={() => selectCard(index)}
            >
              <Card card={card} />
              {selectedCards.includes(index) && (
                <div className="absolute top-1 right-1 bg-yellow-400 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {selectedCards.indexOf(index) + 1}
                </div>
              )}
              {retainedCardIndex === index && (
                <div className="absolute top-1 left-1 bg-emerald-400 text-black rounded-full px-2 py-1 text-xs font-bold">
                  Kept
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mt-4 relative z-20">
        <Button
          onClick={avoidRoom}
          disabled={avoidedLastTurn || processingTurn || room.length === 0}
          className={`flex-1 ${avoidedLastTurn ? "bg-slate-500" : "bg-slate-600 hover:bg-slate-700"}`}
        >
          Avoid Room
        </Button>
        <Button
          onClick={confirmSelection}
          disabled={selectedCards.length !== 3 || processingTurn || room.length < 4}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          Confirm ({selectedCards.length}/3)
        </Button>
      </div>

      {/* Game Log */}
      <div className="mt-4 relative z-20">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Game Log</h3>
        </div>
        <GameLog logs={gameLog} ref={logRef} />
      </div>

      {/* Restart button */}
      <Button onClick={startNewGame} className="mt-4 bg-slate-700 hover:bg-slate-800 relative z-20" variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Restart Game
      </Button>

      {/* Monster Prompt */}
      {monsterPromptOpen && currentMonster && (
        <MonsterPrompt
          monster={currentMonster.card}
          weapon={weapon}
          weaponDefeated={weaponDefeated}
          onChoice={handleMonsterChoice}
        />
      )}
    </div>
  )
}
