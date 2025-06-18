
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminLayout } from "@/components/AdminLayout"
import { UserLayout } from "@/components/UserLayout"
import Index from "./pages/Index"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Equipment from "./pages/Equipment"
import Assignments from "./pages/Assignments"
import Tickets from "./pages/Tickets"
import Chat from "./pages/Chat"
import Users from "./pages/Users"
import Settings from "./pages/Settings"
import UserPortal from "./pages/UserPortal"
import LandingPage from "./pages/LandingPage"
import NotFound from "./pages/NotFound"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/landing" element={<LandingPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <AuthGuard requiredRole="admin">
                <AdminLayout>
                  <Routes>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="equipment" element={<Equipment />} />
                    <Route path="assignments" element={<Assignments />} />
                    <Route path="tickets" element={<Tickets />} />
                    <Route path="chat" element={<Chat />} />
                    <Route path="users" element={<Users />} />
                    <Route path="settings" element={<Settings />} />
                  </Routes>
                </AdminLayout>
              </AuthGuard>
            }>
            </Route>

            {/* User Routes */}
            <Route path="/portal" element={
              <AuthGuard requiredRole="user">
                <UserLayout>
                  <UserPortal />
                </UserLayout>
              </AuthGuard>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
