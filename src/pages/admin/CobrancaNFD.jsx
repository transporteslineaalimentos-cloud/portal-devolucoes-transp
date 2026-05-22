import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { TipoBadge, TrackingBadge } from '../../components/StatusBadge'
import { supabase } from '../../lib/supabase'

const S = {
  statsRow: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 },
  statCard: { background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)', padding:'16px 20px' },
  statLabel: { fontSize:12, color:'var(--slate-500)', marginBottom:6, fontWeight:500 },
  statValue: { fontSize:26, fontWeight:700 },
  toolbar: { display:'flex', gap:8, marginBottom:14, alignItems:'center' },
  search: { padding:'8px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)', fontSize:13, outline:'none', width:240, background:'var(--slate-50)' },
  sel: { padding:'8px 10px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)', fontSize:13, outline:'none', background:'var(--slate-50)', color:'var(--slate-700)' },
  tableWrap: { background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:'10px 14px', background:'#FEF2F2', fontSize:11, fontWeight:600, color:'#991B1B', textAlign:'left', borderBottom:'1px solid #FCA5A5', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' },
  td: { padding:'12px 14px', fontSize:13, borderBottom:'1px solid var(--slate-100)', color:'var(--slate-700)' },
  empty: { padding:'48px 0', textAlign:'center', color:'var(--slate-400)', fontSize:14 },
  badge: { display:'inline-block', padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:500, background:'#FEE2E2', color:'#991B1B' },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})
}
function fmtMoney(v) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)
}

export default function CobrancaNFD() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTransp, setFilterTransp] = useState('')
  const [transpList, setTranspList] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('dev_ocorrencias')
      .select('id, nf_numero, tipo, motivo, transportador_nome, transportador_cnpj, tracking_status, nfd_numero, nfd_data, valor_cobranca, motivo_cobranca, analista_nome, created_at, nf_snapshot, valor_estimado')
      .eq('status', 'cobranca_nfd')
      .order('created_at', { ascending: false })

    setRows(data || [])
    const unique = [...new Map((data||[]).map(r=>[r.transportador_cnpj,r])).values()]
    setTranspList(unique)
    setLoading(false)
  }

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !search || r.nf_numero?.includes(q) || r.transportador_nome?.toLowerCase().includes(q) || r.motivo_cobranca?.toLowerCase().includes(q)
    const matchTransp = !filterTransp || r.transportador_cnpj === filterTransp
    return matchSearch && matchTransp
  })

  const totalCobranca = filtered.reduce((acc, r) => acc + (r.valor_cobranca || r.valor_estimado || 0), 0)

  return (
    <Layout title="Cobrança NFD">
      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={S.statLabel}>Ocorrências em cobrança</div>
          <div style={{ ...S.statValue, color:'#991B1B' }}>{filtered.length}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Valor total a cobrar</div>
          <div style={{ ...S.statValue, color:'#991B1B', fontSize:20 }}>{fmtMoney(totalCobranca)}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Transportadoras envolvidas</div>
          <div style={{ ...S.statValue, color:'var(--slate-700)' }}>{[...new Set(filtered.map(r=>r.transportador_cnpj))].length}</div>
        </div>
      </div>

      <div style={S.toolbar}>
        <input style={S.search} placeholder="Buscar NF, transportadora, motivo..."
          value={search} onChange={e=>setSearch(e.target.value)}
          onFocus={e=>(e.target.style.borderColor='var(--amber-500)')} onBlur={e=>(e.target.style.borderColor='var(--slate-200)')} />
        <select style={S.sel} value={filterTransp} onChange={e=>setFilterTransp(e.target.value)}>
          <option value="">Todas as transportadoras</option>
          {transpList.map(t=><option key={t.transportador_cnpj} value={t.transportador_cnpj}>{t.transportador_nome}</option>)}
        </select>
        <button style={{ ...S.sel, cursor:'pointer', marginLeft:'auto' }} onClick={load}>↺ Atualizar</button>
      </div>

      <div style={S.tableWrap}>
        {loading ? <div style={S.empty}>Carregando...</div> : filtered.length===0 ? (
          <div style={S.empty}>Nenhuma ocorrência com status de cobrança NFD.</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>NF</th>
                <th style={S.th}>Tipo</th>
                <th style={S.th}>Transportadora</th>
                <th style={S.th}>Motivo da Cobrança</th>
                <th style={S.th}>NFD</th>
                <th style={S.th}>Tracking</th>
                <th style={S.th}>Valor Cobrança</th>
                <th style={S.th}>Analista</th>
                <th style={S.th}>Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} style={{ cursor:'pointer' }}
                  onClick={()=>navigate(`/admin/ocorrencia/${row.id}`)}
                  onMouseEnter={e=>(e.currentTarget.style.background='#FEF2F2')}
                  onMouseLeave={e=>(e.currentTarget.style.background='')}>
                  <td style={{ ...S.td, fontWeight:600, color:'var(--slate-900)' }}>{row.nf_numero}</td>
                  <td style={S.td}><TipoBadge tipo={row.tipo} /></td>
                  <td style={{ ...S.td, color:'var(--slate-500)' }}>{row.transportador_nome}</td>
                  <td style={{ ...S.td, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.motivo_cobranca || row.motivo}</td>
                  <td style={S.td}>
                    {row.nfd_numero
                      ? <span style={S.badge}>{row.nfd_numero}{row.nfd_data?` · ${fmtDate(row.nfd_data)}`:''}</span>
                      : <span style={{ color:'var(--slate-400)', fontSize:12 }}>Aguardando</span>}
                  </td>
                  <td style={S.td}><TrackingBadge status={row.tracking_status} /></td>
                  <td style={{ ...S.td, fontWeight:600, color:'#991B1B' }}>{fmtMoney(row.valor_cobranca || row.valor_estimado)}</td>
                  <td style={{ ...S.td, fontSize:12, color:'var(--slate-500)' }}>{row.analista_nome||'—'}</td>
                  <td style={S.td}>{fmtDate(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
