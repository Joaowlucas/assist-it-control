
import { useState } from "react"
import { Computer, Users, Settings, Calendar, Monitor, FileText, User } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useSystemSettings } from "@/hooks/useSystemSettings"

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

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { data: systemSettings } = useSystemSettings()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"

  const renderHeader = () => {
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
            IT Support
          </h2>
          {state === "collapsed" && (
            <div className="text-center font-bold text-sm">IT</div>
          )}
        </>
      )
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
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
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
    </Sidebar>
  )
}
