import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NovaOcorrencia from './pages/NovaOcorrencia'
import DetalheOcorrencia from './pages/DetalheOcorrencia'
import TrocarSenha from './pages/TrocarSenha'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminDetalhe from './pages/admin/AdminDetalhe'
import AdminTransportadores from './pages/admin/AdminTransportadores'

function RequireAuth({ children, requireAdmin = false }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  if (requireAdmin && user.tipo !== 'admin') return <Navigate to="/dashboard" replace />
  if (!requireAdmin && user.tipo === 'admin') return <Navigate to="/admin" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={
        user
          ? <Navigate to={user.tipo === 'admin' ? '/admin' : '/dashboard'} replace />
          : <Login />
      } />
      <Route path="/trocar-senha" element={<TrocarSenha />} />

      {/* Transportador routes */}
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/nova" element={<RequireAuth><NovaOcorrencia /></RequireAuth>} />
      <Route path="/ocorrencia/:id" element={<RequireAuth><DetalheOcorrencia /></RequireAuth>} />

      {/* Admin routes */}
      <Route path="/admin" element={<RequireAuth requireAdmin><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/ocorrencia/:id" element={<RequireAuth requireAdmin><AdminDetalhe /></RequireAuth>} />
      <Route path="/admin/transportadores" element={<RequireAuth requireAdmin><AdminTransportadores /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
