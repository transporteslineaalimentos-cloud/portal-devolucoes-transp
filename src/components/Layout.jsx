import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const S = {
  shell: { display:'flex', minHeight:'100vh' },
  sidebar: {
    width: 220, background:'var(--slate-900)', color:'#fff', display:'flex',
    flexDirection:'column', flexShrink:0,
  },
  logo: {
    padding:'20px 20px 16px', borderBottom:'1px solid rgba(255,255,255,.08)',
  },
  logoTitle: { fontSize:15, fontWeight:600, color:'#fff', letterSpacing:'.01em' },
  logoSub: { fontSize:11, color:'var(--slate-400)', marginTop:2 },
  nav: { flex:1, padding:'12px 0', overflowY:'auto' },
  section: { padding:'8px 16px 4px', fontSize:10, fontWeight:600, color:'var(--slate-500)', letterSpacing:'.08em', textTransform:'uppercase' },
  navLink: {
    display:'flex', alignItems:'center', gap:10, padding:'8px 16px',
    color:'var(--slate-400)', fontSize:13, fontWeight:400, borderRadius:0,
    transition:'all .15s', cursor:'pointer',
  },
  navLinkActive: { color:'#fff', background:'rgba(255,255,255,.08)', borderLeft:'2px solid var(--amber-500)' },
  icon: { width:16, height:16, flexShrink:0 },
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
    display:'flex', alignItems:'center', padding:'0 24px',
    justifyContent:'space-between', flexShrink:0,
  },
  pageTitle: { fontSize:15, fontWeight:600, color:'var(--slate-800)' },
  content: { flex:1, padding:'24px', overflowY:'auto' },
}

function IconBox(props) {
  return (
    <svg style={S.icon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <rect x={3} y={3} width={14} height={14} rx={2}/>
    </svg>
  )
}
function IconPlus() {
  return (
    <svg style={S.icon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
    </svg>
  )
}
function IconList() {
  return (
    <svg style={S.icon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M4 6h12M4 10h12M4 14h8" strokeLinecap="round"/>
    </svg>
  )
}
function IconGrid() {
  return (
    <svg style={S.icon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x={3} y={3} width={6} height={6} rx={1}/>
      <rect x={11} y={3} width={6} height={6} rx={1}/>
      <rect x={3} y={11} width={6} height={6} rx={1}/>
      <rect x={11} y={11} width={6} height={6} rx={1}/>
    </svg>
  )
}

function LinkStyle({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({ ...S.navLink, ...(isActive ? S.navLinkActive : {}) })}
    >
      <Icon />
      {label}
    </NavLink>
  )
}

export default function Layout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  const isAdmin = user?.tipo === 'admin'

  return (
    <div style={S.shell}>
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoTitle}>Linea Alimentos</div>
          <div style={S.logoSub}>Portal de Devoluções</div>
        </div>

        <nav style={S.nav}>
          {!isAdmin && (
            <>
              <div style={S.section}>Transportador</div>
              <LinkStyle to="/dashboard" icon={IconGrid} label="Minhas Ocorrências" />
              <LinkStyle to="/nova" icon={IconPlus} label="Nova Ocorrência" />
            </>
          )}
          {isAdmin && (
            <>
              <div style={S.section}>Administração</div>
              <LinkStyle to="/admin" icon={IconGrid} label="Todas as Ocorrências" />
              <LinkStyle to="/admin/transportadores" icon={IconList} label="Transportadores" />
            </>
          )}
        </nav>

        <div style={S.footer}>
          <div style={S.userName}>{user?.nome}</div>
          <div style={S.userRole}>
            {isAdmin ? 'Linea — Admin' : user?.transportador_nome || 'Transportador'}
          </div>
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
