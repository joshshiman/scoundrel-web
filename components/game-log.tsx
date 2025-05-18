import { forwardRef } from "react"

interface GameLogProps {
  logs: string[]
}

const GameLog = forwardRef<HTMLDivElement, GameLogProps>(({ logs }, ref) => {
  return (
    <div ref={ref} className="bg-slate-900 text-green-400 font-mono text-xs p-2 rounded-md h-24 overflow-y-auto">
      {logs.map((log, index) => (
        <div key={index} className="mb-1">
          <span className="text-slate-500">[{index + 1}]</span> {log}
        </div>
      ))}
    </div>
  )
})

GameLog.displayName = "GameLog"

export default GameLog
