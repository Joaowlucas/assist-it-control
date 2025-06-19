
import { ThemeProvider } from "@/components/theme-provider"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import Tickets from "@/pages/Tickets"
import Equipment from "@/pages/Equipment"
import Assignments from "@/pages/Assignments"
import Settings from "@/pages/Settings"
import Chat from "@/pages/Chat"
import UserDashboard from "@/pages/UserDashboard"
import UserTickets from "@/pages/UserTickets"
import UserAssignments from "@/pages/UserAssignments"
import NotFound from "@/pages/NotFound"
import { AuthGuard } from "@/guards/AuthGuard"
import { AdminGuard } from "@/guards/AdminGuard"
import { AdminLayout } from "@/components/AdminLayout"
import { UserLayout } from "@/components/UserLayout"
import { ChatWithRoleLayout } from "@/components/ChatWithRoleLayout"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <AuthGuard>
                  <AdminGuard>
                    <AdminLayout>
                      <Dashboard />
                    </AdminLayout>
                  </AdminGuard>
                </AuthGuard>
              } />
              <Route path="/tickets" element={
                <AuthGuard>
                  <AdminGuard>
                    <AdminLayout>
                      <Tickets />
                    </AdminLayout>
                  </AdminGuard>
                </AuthGuard>
              } />
              <Route path="/equipment" element={
                <AuthGuard>
                  <AdminGuard>
                    <AdminLayout>
                      <Equipment />
                    </AdminLayout>
                  </AdminGuard>
                </AuthGuard>
              } />
              <Route path="/assignments" element={
                <AuthGuard>
                  <AdminGuard>
                    <AdminLayout>
                      <Assignments />
                    </AdminLayout>
                  </AdminGuard>
                </AuthGuard>
              } />
              <Route path="/settings" element={
                <AuthGuard>
                  <AdminGuard>
                    <AdminLayout>
                      <Settings />
                    </AdminLayout>
                  </AdminGuard>
                </AuthGuard>
              } />
              <Route path="/chat" element={
                <AuthGuard>
                  <ChatWithRoleLayout>
                    <Chat />
                  </ChatWithRoleLayout>
                </AuthGuard>
              } />
              
              {/* User Routes */}
              <Route path="/user-dashboard" element={
                <AuthGuard requiredRole="user">
                  <UserLayout>
                    <UserDashboard />
                  </UserLayout>
                </AuthGuard>
              } />
              <Route path="/user-tickets" element={
                <AuthGuard requiredRole="user">
                  <UserLayout>
                    <UserTickets />
                  </UserLayout>
                </AuthGuard>
              } />
              <Route path="/user-assignments" element={
                <AuthGuard requiredRole="user">
                  <UserLayout>
                    <UserAssignments />
                  </UserLayout>
                </AuthGuard>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
