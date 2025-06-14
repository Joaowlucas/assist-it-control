
import { useState } from "react"
import { Computer, Users, Settings, Calendar, Monitor, FileText, User } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useSystemSettings } from "@/hooks/useSystemSettings"
import { useAuth } from "@/hooks/useAuth"
import { AdminProfileDropdown } from "@/components/AdminProfileDropdown"
import { TechnicianProfileDropdown } from "@/components/TechnicianProfileDropdown"
import { UserProfileDropdown } from "@/components/UserProfileDropdown"

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
  const { state } = useSidebar()
  const location = useLocation()
  const { data: systemSettings, isLoading: settingsLoading } = useSystemSettings()
  const { profile } = useAuth()
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
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"

  const renderHeader = () => {
    if (settingsLoading) {
      return (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-slate-200 rounded animate-pulse" />
          {state !== "collapsed" && (
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          )}
        </div>
      )
    }

    if (systemSettings?.company_logo_url) {
      if (state === "collapsed") {
        return (
          <div className="flex justify-center">
            <img 
              src={systemSettings.company_logo_url} 
              alt="Logo" 
              className="h-8 w-8 object-contain"
            />
          </div>
        )
      } else {
        return (
          <div className="flex items-center gap-3">
            <img 
              src={systemSettings.company_logo_url} 
              alt="Logo da Empresa" 
              className="h-8 w-8 object-contain"
            />
            <span className="font-bold text-lg">
              {systemSettings.company_name || "IT Support"}
            </span>
          </div>
        )
      }
    } else {
      return (
        <>
          <h2 className={`font-bold text-lg ${state === "collapsed" ? "hidden" : "block"}`}>
            {systemSettings?.company_name || "IT Support"}
          </h2>
          {state === "collapsed" && (
            <div className="text-center font-bold text-sm">
              {systemSettings?.company_name?.slice(0, 2) || "IT"}
            </div>
          )}
        </>
      )
    }
  }

  const renderProfileDropdown = () => {
    if (profile?.role === 'admin') {
      return <AdminProfileDropdown />
    } else if (profile?.role === 'technician') {
      return <TechnicianProfileDropdown />
    } else {
      return <UserProfileDropdown />
    }
  }

  return (
    <Sidebar collapsible="icon">
      <div className="p-4 border-b">
        {renderHeader()}
      </div>

      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {profile?.role === 'technician' ? 'Técnico' : 'Administração'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer com perfil do usuário - apenas um componente */}
      <div className="border-t p-4">
        {renderProfileDropdown()}
      </div>
    </Sidebar>
  )
}
