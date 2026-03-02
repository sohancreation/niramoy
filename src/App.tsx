import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { UserProvider } from "@/contexts/UserContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActiveProfileProvider } from "@/contexts/ActiveProfileContext";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import DietPlanPage from "./pages/DietPlanPage";
import ExercisePage from "./pages/ExercisePage";
import RemediesPage from "./pages/RemediesPage";
import FindCarePage from "./pages/FindCarePage";
import TrackerPage from "./pages/TrackerPage";
import QuestsPage from "./pages/QuestsPage";
import PrescriptionPage from "./pages/PrescriptionPage";
import PricingPage from "./pages/PricingPage";
import AdminPage from "./pages/AdminPage";
import MindCarePage from "./pages/MindCarePage";
import FamilyModePage from "./pages/FamilyModePage";
import VoiceConsultPage from "./pages/VoiceConsultPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <UserProvider>
          <ActiveProfileProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/diet" element={<ProtectedRoute><DietPlanPage /></ProtectedRoute>} />
                <Route path="/exercise" element={<ProtectedRoute><ExercisePage /></ProtectedRoute>} />
                <Route path="/remedies" element={<ProtectedRoute><RemediesPage /></ProtectedRoute>} />
                <Route path="/find-care" element={<ProtectedRoute><FindCarePage /></ProtectedRoute>} />
                <Route path="/tracker" element={<ProtectedRoute><TrackerPage /></ProtectedRoute>} />
                <Route path="/prescriptions" element={<ProtectedRoute><PrescriptionPage /></ProtectedRoute>} />
                <Route path="/quests" element={<ProtectedRoute><QuestsPage /></ProtectedRoute>} />
                <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
                <Route path="/mindcare" element={<ProtectedRoute><MindCarePage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                <Route path="/family" element={<ProtectedRoute><FamilyModePage /></ProtectedRoute>} />
                <Route path="/voice-consult" element={<ProtectedRoute><VoiceConsultPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </ActiveProfileProvider>
        </UserProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
