
import { ReactNode } from "react"
import { UserProfileDropdown } from "@/components/UserProfileDropdown"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useSystemSettings } from "@/hooks/useSystemSettings"
import { useIsMobile } from "@/hooks/use-mobile"

interface UserLayoutProps {
  children: ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  const { data: systemSettings } = useSystemSettings()
  const isMobile = useIsMobile()

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground animate-fade-in">
      <header className="h-14 md:h-16 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-6 transition-all duration-300 hover:bg-muted/20 sticky top-0 z-40">
        <div className="flex items-center gap-2 md:gap-3 animate-slide-in-left flex-1 min-w-0">
          {systemSettings?.company_logo_url && (
            <img 
              src={systemSettings.company_logo_url} 
              alt="Logo da empresa" 
              className="h-6 md:h-8 w-auto transition-transform duration-300 hover:scale-110 shrink-0"
            />
          )}
          <h1 className="font-semibold text-foreground transition-all duration-300 truncate">
            {isMobile ? (
              <span className="text-sm">Portal do Usuário</span>
            ) : (
              `Portal do Usuário - ${systemSettings?.department_name || 'Suporte TI'}`
            )}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 animate-slide-in-right shrink-0">
          <ThemeToggle />
          <UserProfileDropdown />
        </div>
      </header>
      
      <main className="flex-1 p-3 md:p-6 animate-fade-in overflow-auto">
        <div className="animate-in max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
