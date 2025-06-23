
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from "@/components/ui/sidebar"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import Tickets from "@/pages/Tickets"
import Equipment from "@/pages/Equipment"
import Assignments from "@/pages/Assignments"
import Settings from "@/pages/Settings"
import UserDashboard from "@/pages/UserDashboard"
import UserTickets from "@/pages/UserTickets"
import UserAssignments from "@/pages/UserAssignments"
import Announcements from "@/pages/Announcements"
import { AdminLayout } from "@/components/AdminLayout"
import { UserLayout } from "@/components/UserLayout"
import { useAuth } from "@/hooks/useAuth"
import { Landing } from "@/pages/Landing"

const queryClient = new QueryClient()

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  if (profile?.role === 'user') {
    return (
      <SidebarProvider>
        <Routes>
          <Route path="/" element={<UserLayout><UserDashboard /></UserLayout>} />
          <Route path="/user-dashboard" element={<UserLayout><UserDashboard /></UserLayout>} />
          <Route path="/user-tickets" element={<UserLayout><UserTickets /></UserLayout>} />
          <Route path="/user-assignments" element={<UserLayout><UserAssignments /></UserLayout>} />
          <Route path="/announcements" element={<UserLayout><Announcements /></UserLayout>} />
          <Route path="*" element={<UserLayout><UserDashboard /></UserLayout>} />
        </Routes>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <Routes>
        <Route path="/" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/tickets" element={<AdminLayout><Tickets /></AdminLayout>} />
        <Route path="/equipment" element={<AdminLayout><Equipment /></AdminLayout>} />
        <Route path="/assignments" element={<AdminLayout><Assignments /></AdminLayout>} />
        <Route path="/announcements" element={<AdminLayout><Announcements /></AdminLayout>} />
        <Route path="/settings" element={<AdminLayout><Settings /></AdminLayout>} />
        <Route path="*" element={<AdminLayout><Dashboard /></AdminLayout>} />
      </Routes>
    </SidebarProvider>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
        <Toaster />
      </Router>
    </QueryClientProvider>
  )
}

export default App
