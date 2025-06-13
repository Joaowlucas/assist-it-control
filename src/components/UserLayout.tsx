
import { ReactNode } from "react"
import { UserProfileDropdown } from "@/components/UserProfileDropdown"

interface UserLayoutProps {
  children: ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 flex items-center justify-between border-b border-slate-200 bg-slate-100/50 px-6">
        <h1 className="text-xl font-semibold text-slate-700">Portal do Usuário - Suporte TI</h1>
        <UserProfileDropdown />
      </header>
      
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
