
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { AdminProfileDropdown } from "@/components/AdminProfileDropdown"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col animate-fade-in">
          <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
            <div className="flex h-14 items-center justify-between px-4 md:px-6">
              {/* Mobile sidebar trigger - always visible on mobile */}
              {isMobile && (
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="h-8 w-8 hover:bg-muted transition-colors duration-200" />
                  <span className="font-semibold text-foreground">Menu</span>
                </div>
              )}
              
              {/* Desktop: empty space, Mobile: centered, Desktop: right aligned */}
              <div className={`flex items-center ${isMobile ? 'ml-auto' : 'ml-auto'}`}>
                <AdminProfileDropdown />
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto animate-in">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
