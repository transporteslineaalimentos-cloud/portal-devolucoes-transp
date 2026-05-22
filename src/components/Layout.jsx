import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const S = {
  shell: { display:'flex', minHeight:'100vh' },
  sidebar: { width:220, background:'var(--slate-900)', color:'#fff', display:'flex', flexDirection:'column', flexShrink:0 },
  logo: { padding:'20px 20px 16px', borderBottom:'1px solid rgba(255,255,255,.08)' },
  logoTitle: { fontSize:15, fontWeight:600, color:'#fff', letterSpacing:'.01em' },
  logoSub: { fontSize:11, color:'var(--slate-400)', marginTop:2 },
  nav: { flex:1, padding:'12px 0', overflowY:'auto' },
  section: { padding:'8px 16px 4px', fontSize:10, fontWeight:600, color:'var(--slate-500)', letterSpacing:'.08em', textTransform:'uppercase' },
  footer: { padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,.08)' },
  userName: { fontSize:13, fontWeight:500, color:'#fff', marginBottom:2 },
  userRole: { fontSize:11, color:'var(--slate-400)', marginBottom:10 },
  btnLogout: {
    width:'100%', padding:'6px 12px', background:'rgba(255,255,255,.06)',
    border:'1px solid rgba(255,255,255,.1)', borderRadius:'var(--radius-sm)',
    color:'var(--slate-300)', fontSize:12, fontWeight:500, cursor:'pointer',
  },
  main: { flex:1, display:'flex', flexDirection:'column', minWidth:0 },
  topbar: {
    height:52, background:'#fff', borderBottom:'1px solid var(--slate-200)',
    display:'flex', alignItems:'center', padding:'0 24px', justifyContent:'space-between', flexShrink:0,
  },
  pageTitle: { fontSize:15, fontWeight:600, color:'var(--slate-800)' },
  content: { flex:1, padding:'24px', overflowY:'auto' },
}

const linkStyle = (isActive) => ({
  display:'flex', alignItems:'center', gap:10, padding:'8px 16px',
  color: isActive ? '#fff' : 'var(--slate-400)', fontSize:13, fontWeight: isActive ? 500 : 400,
  background: isActive ? 'rgba(255,255,255,.08)' : 'transparent',
  borderLeft: isActive ? '2px solid var(--amber-500)' : '2px solid transparent',
  transition:'all .15s', cursor:'pointer', textDecoration:'none',
})

function NavItem({ to, label, icon }) {
  return (
    <NavLink to={to} style={({ isActive }) => linkStyle(isActive)}>
      <svg width={16} height={16} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
        {icon}
      </svg>
      {label}
    </NavLink>
  )
}

const icons = {
  grid: <><rect x={3} y={3} width={6} height={6} rx={1}/><rect x={11} y={3} width={6} height={6} rx={1}/><rect x={3} y={11} width={6} height={6} rx={1}/><rect x={11} y={11} width={6} height={6} rx={1}/></>,
  plus: <><path d="M10 4v12M4 10h12" strokeLinecap="round"/></>,
  list: <><path d="M4 6h12M4 10h12M4 14h8" strokeLinecap="round"/></>,
  users: <><path d="M16 17v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1"/><circle cx={10} cy={7} r={4}/></>,
  bill: <><path d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x={9} y={3} width={4} height={4} rx={1}/><path d="M7 13h6M7 10h4" strokeLinecap="round"/></>,
  inbox: <><path d="M3 13l4-4 3 3 4-5 3 3"/><rect x={3} y={3} width={14} height={14} rx={2}/></>,
}

export default function Layout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/') }

  const tipo = user?.tipo

  const roleLabel = tipo === 'admin' ? 'Linea — Admin' : tipo === 'analista' ? 'Linea — Analista' : user?.transportador_nome || 'Transportador'

  return (
    <div style={S.shell}>
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoTitle}>Linea Alimentos</div>
          <div style={S.logoSub}>Portal de Devoluções</div>
        </div>
        <nav style={S.nav}>
          {tipo === 'transportador' && (
            <>
              <div style={S.section}>Transportador</div>
              <NavItem to="/dashboard" label="Minhas Ocorrências" icon={icons.grid} />
              <NavItem to="/nova" label="Nova Ocorrência" icon={icons.plus} />
            </>
          )}
          {tipo === 'analista' && (
            <>
              <div style={S.section}>Analista</div>
              <NavItem to="/analista" label="Ocorrências" icon={icons.inbox} />
            </>
          )}
          {tipo === 'admin' && (
            <>
              <div style={S.section}>Administração</div>
              <NavItem to="/admin" label="Todas as Ocorrências" icon={icons.grid} />
              <NavItem to="/admin/cobranca-nfd" label="Cobrança NFD" icon={icons.bill} />
              <NavItem to="/admin/transportadores" label="Transportadores" icon={icons.users} />
            </>
          )}
        </nav>
        <div style={S.footer}>
          <div style={S.userName}>{user?.nome}</div>
          <div style={S.userRole}>{roleLabel}</div>
          <button style={S.btnLogout} onClick={handleLogout}>Sair</button>
        </div>
      </aside>
      <div style={S.main}>
        <header style={S.topbar}>
          <span style={S.pageTitle}>{title}</span>
        </header>
        <main style={S.content}>{children}</main>
      </div>
    </div>
  )
}
