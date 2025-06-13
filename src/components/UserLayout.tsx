
import { ReactNode } from "react"
import { UserProfileDropdown } from "@/components/UserProfileDropdown"
import { useSystemSettings } from "@/hooks/useSystemSettings"

interface UserLayoutProps {
  children: ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  const { data: settings } = useSystemSettings()

  const getLogoUrl = () => {
    if (!settings?.company_logo_url) return undefined
    
    // Se já é uma URL completa, retorna como está
    if (settings.company_logo_url.startsWith('http')) {
      return settings.company_logo_url
    }
    
    // Se é um caminho do Supabase Storage
    return `https://riqievnbraelqrzrovyr.supabase.co/storage/v1/object/public/company-logos/${settings.company_logo_url}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 flex items-center justify-between border-b border-slate-200 bg-slate-100/50 px-6">
        <div className="flex items-center gap-3">
          {settings?.company_logo_url && (
            <img 
              src={getLogoUrl()} 
              alt={settings.company_name}
              className="h-8 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <h1 className="text-xl font-semibold text-slate-700">
            {settings?.company_name || 'Portal do Usuário'} - {settings?.department_name || 'Suporte TI'}
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
