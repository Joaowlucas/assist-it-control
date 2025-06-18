
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminLayout } from "@/components/AdminLayout";
import { UserLayout } from "@/components/UserLayout";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import Equipment from "./pages/Equipment";
import Assignments from "./pages/Assignments";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import UserPortal from "./pages/UserPortal";
import Chat from "./pages/Chat";
import Tutorials from "./pages/Tutorials";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 15 * 60 * 1000, // 15 minutos
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      refetchOnReconnect: 'always',
      retry: (failureCount, error) => {
        if (error && 'status' in error && typeof error.status === 'number') {
          if (error.status >= 400 && error.status < 500) return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

// Prefetch system settings para garantir que estejam disponíveis
queryClient.prefetchQuery({
  queryKey: ['system-settings'],
  staleTime: 60 * 60 * 1000, // 1 hora
})

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="assist-it-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Admin/Technician Routes */}
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
              <Route path="/chat" element={
                <AuthGuard requiredRole="admin_tech">
                  <AdminLayout>
                    <Chat />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/tutorials" element={
                <AuthGuard>
                  <AdminLayout>
                    <Tutorials />
                  </AdminLayout>
                </AuthGuard>
              } />
              
              {/* Admin Only Routes */}
              <Route path="/users" element={
                <AuthGuard requiredRole="admin">
                  <AdminLayout>
                    <Users />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/settings" element={
                <AuthGuard requiredRole="admin">
                  <AdminLayout>
                    <Settings />
                  </AdminLayout>
                </AuthGuard>
              } />
              
              {/* User Routes */}
              <Route path="/user-portal" element={
                <AuthGuard requiredRole="user">
                  <UserLayout>
                    <UserPortal />
                  </UserLayout>
                </AuthGuard>
              } />
              <Route path="/user-chat" element={
                <AuthGuard requiredRole="user">
                  <UserLayout>
                    <Chat />
                  </UserLayout>
                </AuthGuard>
              } />
              <Route path="/user-tutorials" element={
                <AuthGuard requiredRole="user">
                  <UserLayout>
                    <Tutorials />
                  </UserLayout>
                </AuthGuard>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
