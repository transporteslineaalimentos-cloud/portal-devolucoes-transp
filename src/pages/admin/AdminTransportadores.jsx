import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { hashPassword } from '../../lib/auth'

const S = {
  toolbar: { display:'flex', gap:10, marginBottom:16, alignItems:'center' },
  btnPrimary: {
    padding:'8px 18px', background:'var(--slate-900)', border:'none',
    borderRadius:'var(--radius-md)', color:'#fff', fontSize:13, fontWeight:600,
    cursor:'pointer', marginLeft:'auto',
  },
  search: {
    padding:'8px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)',
    fontSize:13, outline:'none', width:240, background:'var(--slate-50)',
  },
  tableWrap: {
    background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)',
    overflow:'hidden',
  },
  table: { width:'100%', borderCollapse:'collapse' },
  th: {
    padding:'10px 16px', background:'var(--slate-50)', fontSize:11, fontWeight:600,
    color:'var(--slate-500)', textAlign:'left', borderBottom:'1px solid var(--slate-200)',
    textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap',
  },
  td: { padding:'12px 16px', fontSize:13, borderBottom:'1px solid var(--slate-100)', color:'var(--slate-700)' },
  tag: {
    display:'inline-block', padding:'2px 9px', borderRadius:99, fontSize:11,
    fontWeight:500, background:'var(--slate-100)', color:'var(--slate-600)', marginRight:4,
  },
  tagActive: { background:'var(--green-100)', color:'var(--green-700)' },
  tagInactive: { background:'var(--red-100)', color:'var(--red-700)' },
  btnEdit: {
    padding:'5px 12px', background:'transparent', border:'1px solid var(--slate-200)',
    borderRadius:'var(--radius-sm)', fontSize:12, color:'var(--slate-600)', cursor:'pointer',
    marginRight:6,
  },
  btnDeact: {
    padding:'5px 12px', background:'transparent', border:'1px solid var(--red-200)',
    borderRadius:'var(--radius-sm)', fontSize:12, color:'var(--red-600)', cursor:'pointer',
  },
  empty: { padding:'48px 0', textAlign:'center', color:'var(--slate-400)', fontSize:14 },

  // Modal
  overlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex',
    alignItems:'center', justifyContent:'center', zIndex:1000, padding:16,
  },
  modal: {
    background:'#fff', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:520,
    padding:'28px 32px', boxShadow:'0 25px 50px rgba(0,0,0,.25)',
    maxHeight:'90vh', overflowY:'auto',
  },
  modalTitle: { fontSize:16, fontWeight:700, color:'var(--slate-900)', marginBottom:4 },
  modalSub: { fontSize:13, color:'var(--slate-500)', marginBottom:24 },
  field: { marginBottom:16 },
  label: { display:'block', fontSize:13, fontWeight:500, color:'var(--slate-700)', marginBottom:6 },
  sublabel: { fontSize:11, color:'var(--slate-400)', marginBottom:6, display:'block' },
  input: {
    width:'100%', padding:'10px 12px', border:'1.5px solid var(--slate-200)',
    borderRadius:'var(--radius-md)', fontSize:14, outline:'none', background:'var(--slate-50)',
    transition:'border-color .15s',
  },
  btnRow: { display:'flex', gap:10, justifyContent:'flex-end', marginTop:24 },
  btnCancel: {
    padding:'9px 20px', background:'transparent', border:'1.5px solid var(--slate-200)',
    borderRadius:'var(--radius-md)', fontSize:13, fontWeight:500, color:'var(--slate-600)', cursor:'pointer',
  },
  btnSave: {
    padding:'9px 24px', background:'var(--slate-900)', border:'none',
    borderRadius:'var(--radius-md)', fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer',
  },
  error: {
    background:'var(--red-50)', border:'1px solid var(--red-100)', borderRadius:'var(--radius-md)',
    padding:'10px 12px', color:'var(--red-700)', fontSize:13, marginBottom:16,
  },
  success: {
    background:'var(--green-50)', border:'1px solid var(--green-100)', borderRadius:'var(--radius-md)',
    padding:'10px 12px', color:'var(--green-700)', fontSize:13, marginBottom:16,
  },
  cnpjRow: {
    display:'flex', gap:8, alignItems:'center', padding:'8px 10px',
    background:'var(--slate-50)', border:'1px solid var(--slate-200)',
    borderRadius:'var(--radius-md)', marginBottom:6,
  },
  cnpjRemove: {
    background:'none', border:'none', color:'var(--red-500)', cursor:'pointer',
    fontSize:16, lineHeight:1, padding:'0 2px', marginLeft:'auto',
  },
  addCnpjRow: { display:'flex', gap:8 },
  btnAddCnpj: {
    padding:'9px 14px', background:'var(--slate-100)', border:'1px solid var(--slate-200)',
    borderRadius:'var(--radius-md)', fontSize:13, color:'var(--slate-700)', cursor:'pointer',
    whiteSpace:'nowrap',
  },
  divider: { borderTop:'1px solid var(--slate-200)', margin:'20px 0' },
}

function InputFocus({ style, ...props }) {
  return (
    <input
      style={{ ...S.input, ...style }}
      onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
      onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
      {...props}
    />
  )
}

const EMPTY_FORM = {
  nome: '', email: '', telefone: '', cargo: '',
  senha: '', confirma_senha: '',
  cnpjs: [{ cnpj: '', nome: '' }],
}

export default function AdminTransportadores() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState({ type:'', text:'' })

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null) // null = novo
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: us } = await supabase
      .from('transp_usuarios')
      .select('id, nome, email, telefone, cargo, ativo, precisa_trocar_senha, ultimo_acesso, created_at')
      .order('created_at', { ascending: false })

    if (!us) { setLoading(false); return }

    // Load CNPJs for all users
    const { data: cnpjs } = await supabase
      .from('transp_usuario_cnpjs')
      .select('usuario_id, transportador_cnpj, transportador_nome')

    const merged = us.map(u => ({
      ...u,
      cnpjs: (cnpjs || []).filter(c => c.usuario_id === u.id),
    }))

    setUsers(merged)
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  function openEdit(user) {
    setEditing(user)
    setForm({
      nome: user.nome,
      email: user.email,
      telefone: user.telefone || '',
      cargo: user.cargo || '',
      senha: '',
      confirma_senha: '',
      cnpjs: user.cnpjs.length > 0
        ? user.cnpjs.map(c => ({ cnpj: c.transportador_cnpj, nome: c.transportador_nome || '' }))
        : [{ cnpj: '', nome: '' }],
    })
    setFormError('')
    setShowModal(true)
  }

  function setField(key, val) {
    setForm(p => ({ ...p, [key]: val }))
  }

  function setCnpjField(idx, key, val) {
    setForm(p => {
      const cnpjs = [...p.cnpjs]
      cnpjs[idx] = { ...cnpjs[idx], [key]: val }
      return { ...p, cnpjs }
    })
  }

  function addCnpj() {
    setForm(p => ({ ...p, cnpjs: [...p.cnpjs, { cnpj: '', nome: '' }] }))
  }

  function removeCnpj(idx) {
    setForm(p => ({ ...p, cnpjs: p.cnpjs.filter((_, i) => i !== idx) }))
  }

  async function save() {
    if (!form.nome.trim() || !form.email.trim()) {
      setFormError('Nome e e-mail são obrigatórios'); return
    }
    if (!editing && (!form.senha || form.senha.length < 6)) {
      setFormError('Defina uma senha de pelo menos 6 caracteres para o novo usuário'); return
    }
    if (form.senha && form.senha !== form.confirma_senha) {
      setFormError('As senhas não coincidem'); return
    }
    const validCnpjs = form.cnpjs.filter(c => c.cnpj.trim())
    if (validCnpjs.length === 0) {
      setFormError('Informe pelo menos um CNPJ da transportadora'); return
    }

    setSaving(true); setFormError('')
    try {
      let userId = editing?.id

      const userData = {
        nome: form.nome.trim(),
        email: form.email.toLowerCase().trim(),
        telefone: form.telefone.trim() || null,
        cargo: form.cargo.trim() || null,
        ativo: true,
      }

      if (!editing) {
        // New user
        const hash = await hashPassword(form.senha)
        const { data: newUser, error: insErr } = await supabase
          .from('transp_usuarios')
          .insert({ ...userData, senha_hash: hash, precisa_trocar_senha: true })
          .select('id')
          .single()
        if (insErr) throw new Error(insErr.message)
        userId = newUser.id
      } else {
        // Update user
        const updates = { ...userData }
        if (form.senha) {
          updates.senha_hash = await hashPassword(form.senha)
          updates.precisa_trocar_senha = true
        }
        const { error: updErr } = await supabase
          .from('transp_usuarios')
          .update(updates)
          .eq('id', userId)
        if (updErr) throw new Error(updErr.message)

        // Remove existing CNPJs
        await supabase.from('transp_usuario_cnpjs').delete().eq('usuario_id', userId)
      }

      // Insert CNPJs
      const cnpjInserts = validCnpjs.map(c => ({
        usuario_id: userId,
        transportador_cnpj: c.cnpj.trim().replace(/\D/g, ''),
        transportador_nome: c.nome.trim() || null,
      }))
      await supabase.from('transp_usuario_cnpjs').insert(cnpjInserts)

      setShowModal(false)
      setMsg({ type:'success', text: editing ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!' })
      await load()
      setTimeout(() => setMsg({ type:'', text:'' }), 4000)
    } catch (err) {
      setFormError('Erro: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo(user) {
    const { error } = await supabase
      .from('transp_usuarios')
      .update({ ativo: !user.ativo })
      .eq('id', user.id)
    if (!error) {
      setMsg({ type: !user.ativo ? 'success' : 'success', text: `Usuário ${!user.ativo ? 'ativado' : 'desativado'}.` })
      await load()
      setTimeout(() => setMsg({ type:'', text:'' }), 3000)
    }
  }

  async function resetSenha(user) {
    const hash = await hashPassword('Transp@123')
    await supabase.from('transp_usuarios').update({ senha_hash: hash, precisa_trocar_senha: true }).eq('id', user.id)
    setMsg({ type:'success', text: `Senha de ${user.nome} redefinida para Transp@123 (troca obrigatória no login).` })
    setTimeout(() => setMsg({ type:'', text:'' }), 5000)
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !search || u.nome?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) ||
      u.cnpjs?.some(c => c.transportador_nome?.toLowerCase().includes(q))
  })

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })
  }

  return (
    <Layout title="Transportadores">
      {msg.text && (
        <div style={msg.type === 'success' ? S.success : S.error}>{msg.text}</div>
      )}

      <div style={S.toolbar}>
        <input style={S.search} placeholder="Buscar por nome, e-mail, transportadora..."
          value={search} onChange={e => setSearch(e.target.value)}
          onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
          onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
        />
        <button style={S.btnPrimary} onClick={openNew}>+ Novo transportador</button>
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <div style={S.empty}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>Nenhum transportador cadastrado.</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Nome</th>
                <th style={S.th}>E-mail</th>
                <th style={S.th}>Transportadora(s) / CNPJ(s)</th>
                <th style={S.th}>Senha</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Último acesso</th>
                <th style={S.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--slate-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ ...S.td, fontWeight:600, color:'var(--slate-900)' }}>{u.nome}</td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}>
                    {u.cnpjs.length === 0 ? (
                      <span style={{ color:'var(--slate-400)', fontSize:12 }}>—</span>
                    ) : (
                      u.cnpjs.map((c, i) => (
                        <div key={i} style={{ fontSize:12, marginBottom:2 }}>
                          <span style={{ fontWeight:500, color:'var(--slate-700)' }}>{c.transportador_nome || '—'}</span>
                          <span style={{ color:'var(--slate-400)', marginLeft:6 }}>{c.transportador_cnpj}</span>
                        </div>
                      ))
                    )}
                  </td>
                  <td style={S.td}>
                    <span style={{ ...S.tag, ...(u.precisa_trocar_senha ? {} : { background:'var(--green-100)', color:'var(--green-700)' }) }}>
                      {u.precisa_trocar_senha ? 'Provisória' : 'Definida'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={{ ...S.tag, ...(u.ativo ? S.tagActive : S.tagInactive) }}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ ...S.td, color:'var(--slate-500)' }}>{fmtDate(u.ultimo_acesso)}</td>
                  <td style={S.td}>
                    <button style={S.btnEdit} onClick={() => openEdit(u)}>Editar</button>
                    <button style={{ ...S.btnEdit, color:'var(--amber-700)', borderColor:'var(--amber-200)' }} onClick={() => resetSenha(u)}>Reset senha</button>
                    <button style={u.ativo ? S.btnDeact : { ...S.btnDeact, borderColor:'var(--green-200)', color:'var(--green-700)' }}
                      onClick={() => toggleAtivo(u)}>
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={S.modal}>
            <div style={S.modalTitle}>{editing ? 'Editar transportador' : 'Novo transportador'}</div>
            <div style={S.modalSub}>
              {editing ? 'Atualize os dados do usuário. Deixe a senha em branco para não alterá-la.' : 'O usuário receberá uma senha provisória e será obrigado a trocar no primeiro acesso.'}
            </div>

            {formError && <div style={S.error}>{formError}</div>}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
              <div style={S.field}>
                <label style={S.label}>Nome *</label>
                <InputFocus value={form.nome} onChange={e => setField('nome', e.target.value)} placeholder="Nome completo" />
              </div>
              <div style={S.field}>
                <label style={S.label}>E-mail *</label>
                <InputFocus type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@transportadora.com" disabled={!!editing} style={editing ? { opacity:.6 } : {}} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Telefone</label>
                <InputFocus value={form.telefone} onChange={e => setField('telefone', e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Cargo</label>
                <InputFocus value={form.cargo} onChange={e => setField('cargo', e.target.value)} placeholder="Ex: Coordenador" />
              </div>
            </div>

            <div style={S.divider} />

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
              <div style={S.field}>
                <label style={S.label}>{editing ? 'Nova senha' : 'Senha provisória *'}</label>
                <span style={S.sublabel}>{editing ? 'Deixe em branco para não alterar' : 'Mín. 6 caracteres — troca obrigatória no 1º login'}</span>
                <InputFocus type="password" value={form.senha} onChange={e => setField('senha', e.target.value)} placeholder="••••••••" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Confirmar senha</label>
                <span style={S.sublabel}>&nbsp;</span>
                <InputFocus type="password" value={form.confirma_senha} onChange={e => setField('confirma_senha', e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            <div style={S.divider} />

            <div style={S.field}>
              <label style={S.label}>CNPJs da transportadora *</label>
              <span style={S.sublabel}>O usuário só enxerga NFs dos CNPJs vinculados a ele</span>

              {form.cnpjs.map((c, i) => (
                <div key={i} style={S.cnpjRow}>
                  <div style={{ flex:1 }}>
                    <input
                      style={{ ...S.input, marginBottom:6, fontSize:13, padding:'7px 10px' }}
                      placeholder="CNPJ (somente números)"
                      value={c.cnpj}
                      onChange={e => setCnpjField(i, 'cnpj', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
                    />
                    <input
                      style={{ ...S.input, fontSize:13, padding:'7px 10px' }}
                      placeholder="Nome da transportadora"
                      value={c.nome}
                      onChange={e => setCnpjField(i, 'nome', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
                    />
                  </div>
                  {form.cnpjs.length > 1 && (
                    <button style={S.cnpjRemove} onClick={() => removeCnpj(i)}>×</button>
                  )}
                </div>
              ))}

              <button style={S.btnAddCnpj} onClick={addCnpj} type="button">+ Adicionar outro CNPJ</button>
            </div>

            <div style={S.btnRow}>
              <button style={S.btnCancel} onClick={() => setShowModal(false)}>Cancelar</button>
              <button style={{ ...S.btnSave, opacity: saving ? .6 : 1 }} onClick={save} disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
