import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import PageState from './components/PageState';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const PortfolioList = lazy(() => import('./pages/PortfolioList'));
const PortfolioAdd = lazy(() => import('./pages/PortfolioAdd'));
const PortfolioEdit = lazy(() => import('./pages/PortfolioEdit'));
const ProjectList = lazy(() => import('./pages/ProjectList'));
const ProjectAdd = lazy(() => import('./pages/ProjectAdd'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const PublicPortfolioList = lazy(() => import('./pages/PublicPortfolioList'));
const PublicProjectDetail = lazy(() => import('./pages/PublicProjectDetail'));

function ProtectedPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Header />
        {children}
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Suspense fallback={<PageState loading message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/public/:username/:portfolioCode" element={<PublicPortfolioList />} />
            <Route
              path="/public/:username/:portfolioCode/:projectCode"
              element={<PublicProjectDetail />}
            />

            <Route
              path="/home"
              element={
                <ProtectedPage>
                  <PortfolioList />
                </ProtectedPage>
              }
            />
            <Route
              path="/portfolio/:portfolioCode"
              element={
                <ProtectedPage>
                  <ProjectList />
                </ProtectedPage>
              }
            />
            <Route
              path="/portfolio/:portfolioCode/project/add"
              element={
                <ProtectedPage>
                  <ProjectAdd />
                </ProtectedPage>
              }
            />
            <Route
              path="/portfolio/:portfolioCode/project/:projectCode"
              element={
                <ProtectedPage>
                  <ProjectDetail />
                </ProtectedPage>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedPage>
                  <Profile />
                </ProtectedPage>
              }
            />
            <Route
              path="/portfolio/:portfolioCode/edit"
              element={
                <ProtectedPage>
                  <PortfolioEdit />
                </ProtectedPage>
              }
            />
            <Route
              path="/portfolio/add"
              element={
                <ProtectedPage>
                  <PortfolioAdd />
                </ProtectedPage>
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
