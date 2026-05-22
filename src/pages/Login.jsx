import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loginTransportador, loginAdmin } from '../lib/auth'

const S = {
  page: {
    minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
    background:'linear-gradient(135deg, var(--slate-900) 0%, var(--slate-800) 100%)',
    padding:24,
  },
  card: {
    width:'100%', maxWidth:400, background:'#fff', borderRadius:'var(--radius-lg)',
    padding:'40px 36px', boxShadow:'0 25px 50px rgba(0,0,0,.25)',
  },
  logo: { textAlign:'center', marginBottom:32 },
  logoTitle: { fontSize:22, fontWeight:700, color:'var(--slate-900)', letterSpacing:'-.02em' },
  logoSub: { fontSize:13, color:'var(--slate-500)', marginTop:4 },
  field: { marginBottom:16 },
  label: { display:'block', fontSize:13, fontWeight:500, color:'var(--slate-700)', marginBottom:6 },
  input: {
    width:'100%', padding:'10px 12px', border:'1.5px solid var(--slate-200)',
    borderRadius:'var(--radius-md)', fontSize:14, outline:'none', transition:'border-color .15s',
    background:'var(--slate-50)',
  },
  segmentRow: { display:'flex', gap:8, marginBottom:24 },
  segment: {
    flex:1, padding:'8px 0', textAlign:'center', fontSize:13, fontWeight:500,
    border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)',
    background:'transparent', color:'var(--slate-500)', cursor:'pointer', transition:'all .15s',
  },
  segmentActive: {
    background:'var(--slate-900)', borderColor:'var(--slate-900)', color:'#fff',
  },
  btn: {
    width:'100%', padding:'11px 0', background:'var(--amber-500)', border:'none',
    borderRadius:'var(--radius-md)', color:'var(--slate-900)', fontSize:14, fontWeight:600,
    cursor:'pointer', marginTop:8, transition:'background .15s',
  },
  error: {
    padding:'10px 12px', background:'var(--red-50)', border:'1px solid var(--red-100)',
    borderRadius:'var(--radius-md)', color:'var(--red-700)', fontSize:13, marginBottom:16,
  },
}

export default function Login() {
  const [tipo, setTipo] = useState('transportador')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !senha) { setError('Preencha email e senha'); return }
    setLoading(true); setError('')
    try {
      let user
      if (tipo === 'transportador') {
        user = await loginTransportador(email, senha)
      } else {
        user = await loginAdmin(email, senha)
      }
      login(user)
      if (user.tipo === 'admin') navigate('/admin')
      else if (user.tipo === 'analista') navigate('/analista')
      else if (user.precisa_trocar_senha) navigate('/trocar-senha')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={S.logoTitle}>Linea Alimentos</div>
          <div style={S.logoSub}>Portal de Devoluções</div>
        </div>

        <div style={S.segmentRow}>
          <button
            style={{ ...S.segment, ...(tipo === 'transportador' ? S.segmentActive : {}) }}
            onClick={() => setTipo('transportador')}
            type="button"
          >
            Transportador
          </button>
          <button
            style={{ ...S.segment, ...(tipo === 'admin' ? S.segmentActive : {}) }}
            onClick={() => setTipo('admin')}
            type="button"
          >
            Linea
          </button>
        </div>

        {error && <div style={S.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>E-mail</label>
            <input
              style={S.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
              onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
            />
          </div>
          <div style={S.field}>
            <label style={S.label}>Senha</label>
            <input
              style={S.input}
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
              onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
            />
          </div>
          <button style={S.btn} type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
