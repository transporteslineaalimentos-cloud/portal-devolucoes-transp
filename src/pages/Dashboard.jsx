import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { StatusBadge, TipoBadge } from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const S = {
  statsRow: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:24 },
  statCard: {
    background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)',
    padding:'16px 20px',
  },
  statLabel: { fontSize:12, color:'var(--slate-500)', marginBottom:6, fontWeight:500 },
  statValue: { fontSize:26, fontWeight:700, color:'var(--slate-900)' },
  toolbar: { display:'flex', gap:10, marginBottom:16, alignItems:'center' },
  btnPrimary: {
    padding:'8px 18px', background:'var(--amber-500)', border:'none', borderRadius:'var(--radius-md)',
    color:'var(--slate-900)', fontSize:13, fontWeight:600, cursor:'pointer', marginLeft:'auto',
  },
  search: {
    padding:'8px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)',
    fontSize:13, outline:'none', width:220, background:'var(--slate-50)',
  },
  selectFilter: {
    padding:'8px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)',
    fontSize:13, outline:'none', background:'var(--slate-50)', color:'var(--slate-700)',
  },
  tableWrap: {
    background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)',
    overflow:'hidden',
  },
  table: { width:'100%', borderCollapse:'collapse' },
  th: {
    padding:'10px 16px', background:'var(--slate-50)', fontSize:12, fontWeight:600,
    color:'var(--slate-500)', textAlign:'left', borderBottom:'1px solid var(--slate-200)',
    whiteSpace:'nowrap',
  },
  td: {
    padding:'12px 16px', fontSize:13, borderBottom:'1px solid var(--slate-100)',
    color:'var(--slate-700)',
  },
  trHover: { cursor:'pointer', transition:'background .1s' },
  empty: { padding:'48px 0', textAlign:'center', color:'var(--slate-400)', fontSize:14 },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dev_ocorrencias')
      .select('id, nf_numero, tipo, motivo, status, responsabilidade, created_at, nf_snapshot')
      .in('transportador_cnpj', user.cnpjs.length ? user.cnpjs : ['__none__'])
      .order('created_at', { ascending: false })

    if (!error) setRows(data || [])
    setLoading(false)
  }

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      r.nf_numero?.toLowerCase().includes(q) ||
      r.motivo?.toLowerCase().includes(q) ||
      r.tipo?.toLowerCase().includes(q)
    const matchStatus = !filterStatus || r.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: rows.length,
    registrada: rows.filter(r => r.status === 'registrada').length,
    em_analise: rows.filter(r => r.status === 'em_analise').length,
    finalizada: rows.filter(r => ['aprovada','finalizada'].includes(r.status)).length,
  }

  return (
    <Layout title="Minhas Ocorrências">
      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={S.statLabel}>Total lançadas</div>
          <div style={S.statValue}>{stats.total}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Aguardando</div>
          <div style={{ ...S.statValue, color:'var(--amber-600)' }}>{stats.registrada}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Em análise</div>
          <div style={{ ...S.statValue, color:'var(--blue-600)' }}>{stats.em_analise}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Aprovadas/Finalizadas</div>
          <div style={{ ...S.statValue, color:'var(--green-600)' }}>{stats.finalizada}</div>
        </div>
      </div>

      <div style={S.toolbar}>
        <input
          style={S.search}
          placeholder="Buscar NF, motivo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
          onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
        />
        <select
          style={S.selectFilter}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="registrada">Registrada</option>
          <option value="em_analise">Em análise</option>
          <option value="aprovada">Aprovada</option>
          <option value="reprovada">Reprovada</option>
          <option value="aguardando_doc">Aguard. Documento</option>
          <option value="finalizada">Finalizada</option>
        </select>
        <button style={S.btnPrimary} onClick={() => navigate('/nova')}>
          + Nova Ocorrência
        </button>
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <div style={S.empty}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            {rows.length === 0
              ? 'Nenhuma ocorrência registrada ainda.'
              : 'Nenhuma ocorrência encontrada para o filtro aplicado.'}
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>NF</th>
                <th style={S.th}>Tipo</th>
                <th style={S.th}>Motivo</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Data</th>
                <th style={S.th}>Destinatário</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr
                  key={row.id}
                  style={S.trHover}
                  onClick={() => navigate(`/ocorrencia/${row.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--slate-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ ...S.td, fontWeight:600, color:'var(--slate-900)' }}>{row.nf_numero}</td>
                  <td style={S.td}><TipoBadge tipo={row.tipo} /></td>
                  <td style={{ ...S.td, maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {row.motivo}
                  </td>
                  <td style={S.td}><StatusBadge status={row.status} /></td>
                  <td style={S.td}>{fmtDate(row.created_at)}</td>
                  <td style={{ ...S.td, color:'var(--slate-500)' }}>
                    {row.nf_snapshot?.destinatario_nome || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
