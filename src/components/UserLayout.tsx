
import { ReactNode } from "react"
import { UserProfileDropdown } from "@/components/UserProfileDropdown"
import { useSystemSettings } from "@/hooks/useSystemSettings"
import { useIsMobile } from "@/hooks/use-mobile"

interface UserLayoutProps {
  children: ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  const { data: systemSettings } = useSystemSettings()
  const isMobile = useIsMobile()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 animate-fade-in">
      <header className="h-16 flex items-center justify-between border-b border-slate-200 bg-slate-100/50 px-4 md:px-6 transition-all duration-300 hover:bg-slate-100/70">
        <div className="flex items-center gap-3 animate-slide-in-left">
          {systemSettings?.company_logo_url && (
            <img 
              src={systemSettings.company_logo_url} 
              alt="Logo da empresa" 
              className="h-8 w-auto transition-transform duration-300 hover:scale-110"
            />
          )}
          <h1 className={`font-semibold text-slate-700 transition-all duration-300 ${
            isMobile 
              ? 'text-sm sm:text-lg' 
              : 'text-xl'
          }`}>
            {isMobile ? (
              <>
                <span className="block sm:hidden">Portal</span>
                <span className="hidden sm:block">
                  Portal do Usuário - {systemSettings?.department_name || 'Suporte TI'}
                </span>
              </>
            ) : (
              `Portal do Usuário - ${systemSettings?.department_name || 'Suporte TI'}`
            )}
          </h1>
        </div>
        <div className="animate-slide-in-right">
          <UserProfileDropdown />
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-6 animate-fade-in">
        <div className="animate-in">
          {children}
        </div>
      </main>
    </div>
  )
}
