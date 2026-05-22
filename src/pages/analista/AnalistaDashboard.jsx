import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { StatusBadge, TipoBadge, TrackingBadge } from '../../components/StatusBadge'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const S = {
  statsRow: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 },
  statCard: { background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)', padding:'16px 20px' },
  statLabel: { fontSize:12, color:'var(--slate-500)', marginBottom:6, fontWeight:500 },
  statValue: { fontSize:26, fontWeight:700, color:'var(--slate-900)' },
  tabs: { display:'flex', gap:0, marginBottom:16, background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-md)', overflow:'hidden', width:'fit-content' },
  tab: { padding:'8px 18px', fontSize:13, fontWeight:500, cursor:'pointer', color:'var(--slate-500)', background:'transparent', border:'none', borderRight:'1px solid var(--slate-200)', transition:'all .15s' },
  tabActive: { background:'var(--slate-900)', color:'#fff' },
  toolbar: { display:'flex', gap:8, marginBottom:14, alignItems:'center' },
  search: { padding:'8px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)', fontSize:13, outline:'none', width:220, background:'var(--slate-50)' },
  tableWrap: { background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:'10px 14px', background:'var(--slate-50)', fontSize:11, fontWeight:600, color:'var(--slate-500)', textAlign:'left', borderBottom:'1px solid var(--slate-200)', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' },
  td: { padding:'12px 14px', fontSize:13, borderBottom:'1px solid var(--slate-100)', color:'var(--slate-700)' },
  empty: { padding:'48px 0', textAlign:'center', color:'var(--slate-400)', fontSize:14 },
  btnAssume: { padding:'5px 12px', background:'var(--amber-500)', border:'none', borderRadius:'var(--radius-sm)', fontSize:12, fontWeight:500, color:'var(--slate-900)', cursor:'pointer' },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })
}

const TAB_FILTERS = {
  pendentes:  ['registrada'],
  em_andamento: ['em_analise', 'aguardando_doc'],
  concluidas: ['aprovada', 'reprovada', 'cobranca_nfd', 'finalizada'],
  todas: null,
}

export default function AnalistaDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pendentes')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [tab])

  async function load() {
    setLoading(true)
    let q = supabase
      .from('dev_ocorrencias')
      .select('id, nf_numero, tipo, motivo, status, tracking_status, transportador_nome, created_at, analista_nome, nf_snapshot')
      .order('created_at', { ascending: false })
      .limit(100)

    const statuses = TAB_FILTERS[tab]
    if (statuses) q = q.in('status', statuses)

    const { data } = await q
    setRows(data || [])
    setLoading(false)
  }

  async function assumir(e, row) {
    e.stopPropagation()
    await supabase.from('dev_ocorrencias').update({
      status: 'em_analise',
      analista_id: user.id,
      analista_nome: user.nome,
      updated_at: new Date().toISOString(),
    }).eq('id', row.id)
    await supabase.from('dev_historico').insert({
      ocorrencia_id: row.id,
      acao: 'Ocorrência assumida pelo analista',
      status_anterior: row.status,
      status_novo: 'em_analise',
      usuario: user.nome,
      perfil: 'analista',
    })
    load()
  }

  const filtered = rows.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.nf_numero?.includes(q) || r.motivo?.toLowerCase().includes(q) || r.transportador_nome?.toLowerCase().includes(q)
  })

  const counts = {
    pendentes: rows.filter(r => TAB_FILTERS.pendentes.includes(r.status)).length,
    em_andamento: rows.filter(r => TAB_FILTERS.em_andamento.includes(r.status)).length,
  }

  return (
    <Layout title="Ocorrências para Análise">
      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={S.statLabel}>Aguardando análise</div>
          <div style={{ ...S.statValue, color:'var(--amber-600)' }}>{rows.filter(r=>r.status==='registrada').length}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Em andamento</div>
          <div style={{ ...S.statValue, color:'var(--blue-600)' }}>{rows.filter(r=>r.status==='em_analise').length}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Concluídas (hoje)</div>
          <div style={{ ...S.statValue, color:'var(--green-600)' }}>
            {rows.filter(r=>['aprovada','reprovada','cobranca_nfd','finalizada'].includes(r.status) && new Date(r.created_at).toDateString()===new Date().toDateString()).length}
          </div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Minhas em análise</div>
          <div style={S.statValue}>{rows.filter(r=>r.analista_nome===user.nome&&r.status==='em_analise').length}</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:16, alignItems:'center' }}>
        <div style={S.tabs}>
          {[
            { key:'pendentes', label:`Pendentes${counts.pendentes>0?` (${counts.pendentes})`:''}`},
            { key:'em_andamento', label:`Em andamento`},
            { key:'concluidas', label:`Concluídas`},
            { key:'todas', label:`Todas`},
          ].map(t => (
            <button key={t.key} style={{ ...S.tab, ...(tab===t.key?S.tabActive:{}) }} onClick={()=>setTab(t.key)}>{t.label}</button>
          ))}
        </div>
        <input style={S.search} placeholder="Buscar NF, motivo, transportadora..."
          value={search} onChange={e=>setSearch(e.target.value)}
          onFocus={e=>(e.target.style.borderColor='var(--amber-500)')} onBlur={e=>(e.target.style.borderColor='var(--slate-200)')} />
      </div>

      <div style={S.tableWrap}>
        {loading ? <div style={S.empty}>Carregando...</div> : filtered.length===0 ? <div style={S.empty}>Nenhuma ocorrência.</div> : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>NF</th>
                <th style={S.th}>Tipo</th>
                <th style={S.th}>Motivo</th>
                <th style={S.th}>Transportadora</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Tracking</th>
                <th style={S.th}>Analista</th>
                <th style={S.th}>Data</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} style={{ cursor:'pointer' }}
                  onClick={()=>navigate(`/analista/${row.id}`)}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--slate-50)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='')}>
                  <td style={{ ...S.td, fontWeight:600, color:'var(--slate-900)' }}>{row.nf_numero}</td>
                  <td style={S.td}><TipoBadge tipo={row.tipo} /></td>
                  <td style={{ ...S.td, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.motivo}</td>
                  <td style={{ ...S.td, color:'var(--slate-500)' }}>{row.transportador_nome}</td>
                  <td style={S.td}><StatusBadge status={row.status} /></td>
                  <td style={S.td}><TrackingBadge status={row.tracking_status} /></td>
                  <td style={{ ...S.td, color:'var(--slate-500)', fontSize:12 }}>{row.analista_nome || '—'}</td>
                  <td style={S.td}>{fmtDate(row.created_at)}</td>
                  <td style={{ ...S.td, textAlign:'right' }}>
                    {row.status === 'registrada' && (
                      <button style={S.btnAssume} onClick={e=>assumir(e,row)}>Assumir</button>
                    )}
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
