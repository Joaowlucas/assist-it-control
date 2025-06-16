
import { useState } from "react"
import { Computer, Users, Settings, Calendar, Monitor, FileText, User } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useSystemSettings } from "@/hooks/useSystemSettings"
import { useAuth } from "@/hooks/useAuth"
import { useIsMobile } from "@/hooks/use-mobile"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const adminItems = [
  { title: "Dashboard", url: "/", icon: Monitor },
  { title: "Chamados", url: "/tickets", icon: FileText },
  { title: "Equipamentos", url: "/equipment", icon: Computer },
  { title: "Atribuições", url: "/assignments", icon: Users },
  { title: "Usuários", url: "/users", icon: User },
  { title: "Configurações", url: "/settings", icon: Settings },
]

const technicianItems = [
  { title: "Dashboard", url: "/", icon: Monitor },
  { title: "Chamados", url: "/tickets", icon: FileText },
  { title: "Equipamentos", url: "/equipment", icon: Computer },
  { title: "Atribuições", url: "/assignments", icon: Users },
]

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar()
  const location = useLocation()
  const { data: systemSettings, isLoading: settingsLoading } = useSystemSettings()
  const { profile } = useAuth()
  const isMobile = useIsMobile()
  const currentPath = location.pathname

  // Determinar quais itens mostrar baseado no role
  const getNavigationItems = () => {
    if (profile?.role === 'technician') {
      return technicianItems
    }
    return adminItems
  }

  const navigationItems = getNavigationItems()

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `transition-all duration-200 ${isActive ? "bg-muted text-primary font-medium shadow-sm" : "hover:bg-muted/50 hover:translate-x-1"}`

  // Fechar sidebar no mobile após clique em item
  const handleItemClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const renderHeader = () => {
    // Mostrar placeholder com animação enquanto carrega
    if (settingsLoading) {
      if (state === "collapsed") {
        return (
          <div className="flex justify-center">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse shimmer"></div>
          </div>
        )
      } else {
        return (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-8 w-8 bg-gray-200 rounded shimmer"></div>
            <div className="h-5 w-32 bg-gray-200 rounded shimmer"></div>
          </div>
        )
      }
    }

    if (systemSettings?.company_logo_url) {
      if (state === "collapsed" && !isMobile) {
        return (
          <div className="flex justify-center animate-scale-in">
            <img 
              src={systemSettings.company_logo_url} 
              alt="Logo" 
              className="h-8 w-8 object-contain transition-transform duration-300 hover:scale-110"
              onError={(e) => {
                console.error('Erro ao carregar logo:', systemSettings.company_logo_url)
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        )
      } else {
        return (
          <div className="flex items-center gap-3 animate-fade-in">
            <img 
              src={systemSettings.company_logo_url} 
              alt="Logo da Empresa" 
              className="h-8 w-8 object-contain transition-transform duration-300 hover:scale-110"
              onError={(e) => {
                console.error('Erro ao carregar logo:', systemSettings.company_logo_url)
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <span className={`font-bold transition-all duration-300 ${isMobile ? 'text-lg' : 'text-lg'}`}>
              {systemSettings.company_name || "IT Support"}
            </span>
          </div>
        )
      }
    } else {
      return (
        <div className="animate-fade-in">
          <h2 className={`font-bold transition-all duration-300 ${state === "collapsed" && !isMobile ? "hidden" : "block text-lg"}`}>
            {systemSettings?.company_name || "IT Support"}
          </h2>
          {state === "collapsed" && !isMobile && (
            <div className="text-center font-bold text-sm transition-all duration-300 animate-scale-in">
              {systemSettings?.company_name ? systemSettings.company_name.substring(0, 2).toUpperCase() : "IT"}
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <Sidebar collapsible="icon" className="transition-all duration-300 ease-smooth">
      <div className="p-4 border-b transition-all duration-300 hover:bg-muted/30">
        {renderHeader()}
      </div>

      {/* Desktop sidebar trigger - only show on desktop */}
      {!isMobile && (
        <SidebarTrigger className="m-2 self-end hover:bg-muted transition-all duration-200 hover:scale-105" />
      )}

      <SidebarContent className="animate-fade-in">
        <SidebarGroup>
          <SidebarGroupLabel className="transition-all duration-200">
            {profile?.role === 'technician' ? 'Técnico' : 'Administração'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item, index) => (
                <SidebarMenuItem key={item.title} className="animate-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                      onClick={handleItemClick}
                    >
                      <item.icon className="mr-2 h-4 w-4 transition-all duration-200" />
                      {(state !== "collapsed" || isMobile) && (
                        <span className="transition-all duration-200 hover:text-primary">
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
