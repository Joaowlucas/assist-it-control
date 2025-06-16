
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { AdminProfileDropdown } from "@/components/AdminProfileDropdown"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useIsMobile } from "@/hooks/use-mobile"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col animate-fade-in">
          <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 sticky top-0 z-40">
            <div className="flex h-14 items-center justify-between px-3 md:px-6">
              {/* Mobile: Sidebar trigger + title */}
              {isMobile ? (
                <div className="flex items-center gap-2 flex-1">
                  <SidebarTrigger className="h-8 w-8 hover:bg-muted transition-colors duration-200 shrink-0" />
                  <span className="font-semibold text-foreground truncate">Menu</span>
                </div>
              ) : (
                <div className="flex-1" />
              )}
              
              {/* Right side: Theme toggle + Profile */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <AdminProfileDropdown />
              </div>
            </div>
          </header>
          <main className="flex-1 p-3 md:p-6 overflow-auto animate-in">
            <div className="animate-fade-in max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
