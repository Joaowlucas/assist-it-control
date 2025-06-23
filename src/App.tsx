
import { ThemeProvider } from "@/components/theme-provider"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import Tickets from "@/pages/Tickets"
import Equipment from "@/pages/Equipment"
import Assignments from "@/pages/Assignments"
import Settings from "@/pages/Settings"
import Chat from "@/pages/Chat"
import Announcements from "@/pages/Announcements"
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
                <AuthGuard requiredRole="admin_tech">
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/tickets" element={
                <AuthGuard requiredRole="admin_tech">
                  <AdminLayout>
                    <Tickets />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/equipment" element={
                <AuthGuard requiredRole="admin_tech">
                  <AdminLayout>
                    <Equipment />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/assignments" element={
                <AuthGuard requiredRole="admin_tech">
                  <AdminLayout>
                    <Assignments />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/announcements" element={
                <AuthGuard>
                  <AdminLayout>
                    <Announcements />
                  </AdminLayout>
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
                  <ChatWithRoleLayout />
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
              <Route path="/user-announcements" element={
                <AuthGuard requiredRole="user">
                  <UserLayout>
                    <Announcements />
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
