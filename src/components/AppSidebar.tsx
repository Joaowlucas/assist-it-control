
import { Home, Ticket, Wrench, Settings, User, Building2, Megaphone, MessageSquare, Kanban } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { Link, useLocation } from "react-router-dom"
import { TechnicianSidebar } from "./TechnicianSidebar"

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
    url: "/chats",
    icon: MessageSquare,
  },
  {
    title: "Comunicados",
    url: "/announcements",
    icon: Megaphone,
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
    title: "Kanban",
    url: "/kanban",
    icon: Kanban,
  },
  {
    title: "Comunicados",
    url: "/announcements",
    icon: Megaphone,
  },
  {
    title: "Chat",
    url: "/chats",
    icon: MessageSquare,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { profile } = useAuth()
  const location = useLocation()

  // Se for técnico, usar o sidebar específico
  if (profile?.role === 'technician') {
    return <TechnicianSidebar />
  }

  const items = profile?.role === 'admin' ? adminItems : userItems

  return (
    <Sidebar className="bg-white/90 dark:bg-black/20 backdrop-blur-xl border-r border-border/40 shadow-sm dark:shadow-none">
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
