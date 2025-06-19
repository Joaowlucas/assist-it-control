
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
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
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
  const location = useLocation()

  const items = profile?.role === 'admin' || profile?.role === 'technician' ? adminItems : userItems

  return (
    <Sidebar className="bg-background/80 backdrop-blur-md border-r border-border/50">
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
