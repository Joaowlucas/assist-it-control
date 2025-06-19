
import { Home, Ticket, Wrench, Settings, MessageCircle, User, Building2 } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { useSystemSettings } from "@/hooks/useSystemSettings"
import { Link, useLocation } from "react-router-dom"

const userItems = [
  {
    title: "Dashboard",
    url: "/user-dashboard",
    icon: Home,
  },
  {
    title: "Meus Chamados",
    url: "/user-tickets",
    icon: Ticket,
  },
  {
    title: "Equipamentos",
    url: "/user-assignments",
    icon: Wrench,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageCircle,
  },
  {
    title: "Portal",
    url: "/user-portal",
    icon: User,
  },
]

const adminItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Chamados",
    url: "/tickets",
    icon: Ticket,
  },
  {
    title: "Equipamentos",
    url: "/equipment",
    icon: Wrench,
  },
  {
    title: "Atribuições",
    url: "/assignments",
    icon: Building2,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageCircle,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { profile } = useAuth()
  const { data: systemSettings } = useSystemSettings()
  const location = useLocation()

  const items = profile?.role === 'admin' || profile?.role === 'technician' ? adminItems : userItems

  return (
    <Sidebar className="bg-background/80 backdrop-blur-md border-r border-border/50">
      <SidebarHeader className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={systemSettings?.company_logo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {systemSettings?.company_name?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="font-semibold text-sm truncate text-foreground">
              {systemSettings?.company_name || 'Sistema'}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {systemSettings?.department_name || 'TI'}
            </p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-transparent">
        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground/70">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className="hover:bg-accent/50 data-[active=true]:bg-accent/70 transition-colors"
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
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
