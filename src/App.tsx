import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import FindRoom from "./pages/FindRoom";
import FindRoommateChoice from "./pages/FindRoommateChoice";
import RoomDetail from "./pages/RoomDetail";
import Quiz from "./pages/Quiz";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import TenantAIChat from "./pages/tenant/AIChat";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminRooms from "./pages/admin/Rooms";
import AdminUsers from "./pages/admin/Users";
import LandlordDashboard from "./pages/landlord/Dashboard";
import CreatePost from "./pages/landlord/CreatePost";


const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role?: "tenant" | "landlord" | "admin";
}) {
  const auth = useAuth();
  if (auth.loading) return <div className="container py-8">Loading...</div>;
  if (!auth.user) return <Navigate to="/auth/login" replace />;
  if (role && auth.role !== role && auth.role !== "admin") {
    return <div className="container py-8">Không có quyền truy cập</div>;
  }
  return children;
}

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />

            <Route path="/home" element={<Home />} />
            <Route path="/find-room" element={<FindRoom />} />
            <Route path="/find-roommate" element={<FindRoommateChoice />} />
            <Route path="/rooms/:id" element={<RoomDetail />} />

            {/* Tenant routes */}
            <Route
              path="/tenant/ai-chat"
              element={
                <ProtectedRoute role="tenant">
                  <TenantAIChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/find-room"
              element={
                <ProtectedRoute role="tenant">
                  <FindRoom />
                </ProtectedRoute>
              }
            />

            {/* Landlord routes (dashboard + create) */}
            <Route
              path="/landlord/dashboard"
              element={
                <ProtectedRoute role="landlord">
                  <LandlordDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord/post"
              element={
                <ProtectedRoute role="landlord">
                  <CreatePost />
                </ProtectedRoute>
              }
            />
            {/* keep legacy /landlord -> redirect to dashboard */}
            <Route
              path="/landlord"
              element={<Navigate to="/landlord/dashboard" replace />}
            />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rooms"
              element={
                <ProtectedRoute role="admin">
                  <AdminRooms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute role="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            <Route path="/quiz" element={<Quiz />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;


