
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { UserProfileDropdown } from "@/components/UserProfileDropdown"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useIsMobile } from "@/hooks/use-mobile"

interface UserLayoutProps {
  children: React.ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 transition-all duration-300 sticky top-0 z-40">
            <div className="flex h-14 items-center justify-between px-3 md:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="h-8 w-8 hover:bg-muted/50 transition-colors duration-200" />
                {isMobile && (
                  <span className="font-semibold text-foreground truncate">Portal do Usuário</span>
                )}
              </div>
              
              {/* Right side: Theme toggle + Profile */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserProfileDropdown />
              </div>
            </div>
          </header>
          <main className="flex-1 p-3 md:p-6 overflow-auto animate-in backdrop-blur-sm">
            <div className="animate-fade-in max-w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
