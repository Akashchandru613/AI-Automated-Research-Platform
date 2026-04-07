import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PageWrapper from './components/Layout/PageWrapper';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ExperimentPage from './pages/ExperimentPage';
import ComparePage from './pages/ComparePage';
import LiteratureSearchPage from './pages/LiteratureSearchPage';
import BookmarksPage from './pages/BookmarksPage';
import './App.css';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupPage />} />
      <Route path="/" element={<ProtectedRoute><PageWrapper><DashboardPage /></PageWrapper></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><PageWrapper><ProjectDetailPage /></PageWrapper></ProtectedRoute>} />
      <Route path="/experiments/:id" element={<ProtectedRoute><PageWrapper><ExperimentPage /></PageWrapper></ProtectedRoute>} />
      <Route path="/compare" element={<ProtectedRoute><PageWrapper><ComparePage /></PageWrapper></ProtectedRoute>} />
      <Route path="/literature" element={<ProtectedRoute><PageWrapper><LiteratureSearchPage /></PageWrapper></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute><PageWrapper><BookmarksPage /></PageWrapper></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
