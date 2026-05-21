import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { changePassword } from '../lib/auth'

const S = {
  page: {
    minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
    background:'var(--slate-50)', padding:24,
  },
  card: {
    width:'100%', maxWidth:400, background:'#fff', borderRadius:'var(--radius-lg)',
    padding:'36px', border:'1px solid var(--slate-200)', boxShadow:'var(--shadow-md)',
  },
  title: { fontSize:18, fontWeight:700, color:'var(--slate-900)', marginBottom:6 },
  sub: { fontSize:13, color:'var(--slate-500)', marginBottom:28 },
  field: { marginBottom:16 },
  label: { display:'block', fontSize:13, fontWeight:500, color:'var(--slate-700)', marginBottom:6 },
  input: {
    width:'100%', padding:'10px 12px', border:'1.5px solid var(--slate-200)',
    borderRadius:'var(--radius-md)', fontSize:14, outline:'none', background:'var(--slate-50)',
    transition:'border-color .15s',
  },
  btn: {
    width:'100%', padding:'11px 0', background:'var(--amber-500)', border:'none',
    borderRadius:'var(--radius-md)', color:'var(--slate-900)', fontSize:14, fontWeight:600, cursor:'pointer',
  },
  error: {
    background:'var(--red-50)', border:'1px solid var(--red-100)', borderRadius:'var(--radius-md)',
    padding:'10px 12px', color:'var(--red-700)', fontSize:13, marginBottom:16,
  },
}

export default function TrocarSenha() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [nova, setNova] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (nova.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return }
    if (nova !== confirm) { setError('As senhas não coincidem'); return }
    setLoading(true); setError('')
    try {
      await changePassword(user.id, nova, 'transp_usuarios')
      updateUser({ precisa_trocar_senha: false })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.title}>Definir nova senha</div>
        <div style={S.sub}>É o seu primeiro acesso. Por segurança, defina uma senha pessoal antes de continuar.</div>
        {error && <div style={S.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>Nova senha</label>
            <input style={S.input} type="password" value={nova}
              onChange={e => setNova(e.target.value)} placeholder="Mínimo 6 caracteres"
              onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
              onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Confirmar senha</label>
            <input style={S.input} type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha"
              onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
              onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')} />
          </div>
          <button style={S.btn} type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Definir senha e entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
