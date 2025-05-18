import type { Metadata } from "next"
import Game from "@/components/game"

export const metadata: Metadata = {
  title: "Scoundrel",
  description: "A web version of the single-player card game Scoundrel by Zach Gage and Kurt Bieg",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#1e293b",
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-800 text-white">
      <Game />
    </main>
  )
}
