import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CategoryList from './pages/CategoryList';
import CategoryAdd from './pages/CategoryAdd';
import CategoryEdit from './pages/CategoryEdit';
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
          {/* 인증 페이지 (Header 없음) */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 공개 포트폴리오 페이지 (Header 없음, 인증 불필요) */}
          <Route path="/public/:username/:categoryCode" element={<PublicPortfolioList />} />
          <Route
            path="/public/:username/:categoryCode/:portfolioCode"
            element={<PublicProjectDetail />}
          />

          {/* 보호된 페이지 (Header 있음) */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-50">
                  <Header />
                  <CategoryList />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/category/:categoryId"
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
            path="/category/:categoryId/project/add"
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
            path="/category/:categoryId/project/:id"
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
            path="/category/:categoryId/edit"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-50">
                  <Header />
                  <CategoryEdit />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/category/add"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-50">
                  <Header />
                  <CategoryAdd />
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
