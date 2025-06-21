
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminGuard } from "@/components/AdminGuard"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import Index from "./pages/Index"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Tickets from "./pages/Tickets"
import Equipment from "./pages/Equipment"
import Assignments from "./pages/Assignments"
import Settings from "./pages/Settings"
import UserPortal from "./pages/UserPortal"
import UserDashboard from "./pages/UserDashboard"
import UserTickets from "./pages/UserTickets"
import UserAssignments from "./pages/UserAssignments"
import ChatOptimized from "./pages/ChatOptimized"
import NotFound from "./pages/NotFound"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/user-portal" element={<UserPortal />} />
              
              {/* Protected routes */}
              <Route element={<AuthGuard />}>
                <Route element={<SidebarProvider />}>
                  {/* Admin routes */}
                  <Route element={<AdminGuard />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tickets" element={<Tickets />} />
                    <Route path="/equipment" element={<Equipment />} />
                    <Route path="/assignments" element={<Assignments />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                  
                  {/* User routes */}
                  <Route path="/user-dashboard" element={<UserDashboard />} />
                  <Route path="/user-tickets" element={<UserTickets />} />
                  <Route path="/user-assignments" element={<UserAssignments />} />
                  
                  {/* Chat route - available for all authenticated users */}
                  <Route path="/chat" element={<ChatOptimized />} />
                </Route>
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
)

export default App
