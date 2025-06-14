
import { ReactNode } from "react"
import { UserProfileDropdown } from "@/components/UserProfileDropdown"
import { useSystemSettings } from "@/hooks/useSystemSettings"

interface UserLayoutProps {
  children: ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  const { data: systemSettings } = useSystemSettings()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 flex items-center justify-between border-b border-slate-200 bg-slate-100/50 px-6">
        <div className="flex items-center gap-3">
          {systemSettings?.company_logo_url && (
            <img 
              src={systemSettings.company_logo_url} 
              alt="Logo da empresa" 
              className="h-8 w-auto"
            />
          )}
          <h1 className="text-xl font-semibold text-slate-700">
            Portal do Usuário - {systemSettings?.department_name || 'Suporte TI'}
          </h1>
        </div>
        <UserProfileDropdown />
      </header>
      
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
