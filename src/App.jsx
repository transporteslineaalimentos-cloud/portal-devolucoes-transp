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
import CobrancaNFD from './pages/admin/CobrancaNFD'
import AnalistaDashboard from './pages/analista/AnalistaDashboard'
import AnalistaDetalhe from './pages/analista/AnalistaDetalhe'

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  if (roles && !roles.includes(user.tipo)) {
    if (user.tipo === 'admin') return <Navigate to="/admin" replace />
    if (user.tipo === 'analista') return <Navigate to="/analista" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={
        user
          ? <Navigate to={user.tipo==='admin'?'/admin':user.tipo==='analista'?'/analista':'/dashboard'} replace />
          : <Login />
      } />
      <Route path="/trocar-senha" element={<TrocarSenha />} />

      {/* Transportador */}
      <Route path="/dashboard" element={<RequireAuth roles={['transportador']}><Dashboard /></RequireAuth>} />
      <Route path="/nova" element={<RequireAuth roles={['transportador']}><NovaOcorrencia /></RequireAuth>} />
      <Route path="/ocorrencia/:id" element={<RequireAuth roles={['transportador']}><DetalheOcorrencia /></RequireAuth>} />

      {/* Analista */}
      <Route path="/analista" element={<RequireAuth roles={['analista','admin']}><AnalistaDashboard /></RequireAuth>} />
      <Route path="/analista/:id" element={<RequireAuth roles={['analista','admin']}><AnalistaDetalhe /></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin" element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/cobranca-nfd" element={<RequireAuth roles={['admin']}><CobrancaNFD /></RequireAuth>} />
      <Route path="/admin/ocorrencia/:id" element={<RequireAuth roles={['admin']}><AdminDetalhe /></RequireAuth>} />
      <Route path="/admin/transportadores" element={<RequireAuth roles={['admin']}><AdminTransportadores /></RequireAuth>} />

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
