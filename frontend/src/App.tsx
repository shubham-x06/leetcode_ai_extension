import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardLayout from './pages/DashboardLayout';
import HomePage from './pages/HomePage';
import ProblemsPage from './pages/ProblemsPage';
import ProgressPage from './pages/ProgressPage';
import ContestPage from './pages/ContestPage';
import AIMentorPage from './pages/AIMentorPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient();

function App() {
  const { token, user } = useAuthStore();

  if (!token) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );
  }

  if (!user?.leetcodeUsername) {
    return (
      <QueryClientProvider client={queryClient}>
        <OnboardingPage />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<HomePage />} />
            <Route path="problems" element={<ProblemsPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="contest" element={<ContestPage />} />
            <Route path="ai" element={<AIMentorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/onboard" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
