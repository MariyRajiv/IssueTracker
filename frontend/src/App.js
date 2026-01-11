import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Toaster } from '@/components/ui/sonner';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import IssuesPage from '@/pages/IssuesPage';
import IssueDetailPage from '@/pages/IssueDetailPage';
import CreateIssuePage from '@/pages/CreateIssuePage';
import BulkOperationsPage from '@/pages/BulkOperationsPage';
import ReportsPage from '@/pages/ReportsPage';
import CSVImportPage from '@/pages/CSVImportPage';
import Layout from '@/components/Layout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/auth" replace />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="issues" element={<IssuesPage />} />
            <Route path="issues/new" element={<CreateIssuePage />} />
            <Route path="issues/:id" element={<IssueDetailPage />} />
            <Route path="bulk-operations" element={<BulkOperationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="import" element={<CSVImportPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
