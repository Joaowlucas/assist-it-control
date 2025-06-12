
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { UserLayout } from "@/components/UserLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import Equipment from "./pages/Equipment";
import Assignments from "./pages/Assignments";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import UserPortal from "./pages/UserPortal";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/tickets" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <Tickets />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/equipment" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <Equipment />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/assignments" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <Assignments />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          {/* User Routes */}
          <Route path="/user-portal" element={
            <ProtectedRoute requiredRole="user">
              <UserLayout>
                <UserPortal />
              </UserLayout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
