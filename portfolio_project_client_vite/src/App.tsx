import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PortfolioList from './pages/PortfolioList';
import PortfolioAdd from './pages/PortfolioAdd';
import PortfolioEdit from './pages/PortfolioEdit';
import ProjectList from './pages/ProjectList';
import ProjectAdd from './pages/ProjectAdd';
import ProjectDetail from './pages/ProjectDetail';
import PublicPortfolioList from './pages/PublicPortfolioList';
import PublicProjectDetail from './pages/PublicProjectDetail';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          {/* ?몄쬆 ?섏씠吏 (Header ?놁쓬) */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 怨듦컻 ?ы듃?대━???섏씠吏 (Header ?놁쓬, ?몄쬆 遺덊븘?? */}
          <Route path="/public/:username/:portfolioCode" element={<PublicPortfolioList />} />
          <Route
            path="/public/:username/:portfolioCode/:projectCode"
            element={<PublicProjectDetail />}
          />

          {/* 蹂댄샇???섏씠吏 (Header ?덉쓬) */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-50">
                  <Header />
                  <PortfolioList />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio/:portfolioCode"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-50">
                  <Header />
                  <ProjectList />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio/:portfolioCode/project/add"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-50">
                  <Header />
                  <ProjectAdd />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio/:portfolioCode/project/:projectCode"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-50">
                  <Header />
                  <ProjectDetail />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-50">
                  <Header />
                  <Profile />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio/:portfolioCode/edit"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-50">
                  <Header />
                  <PortfolioEdit />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio/add"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-50">
                  <Header />
                  <PortfolioAdd />
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

