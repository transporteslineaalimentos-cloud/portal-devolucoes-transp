import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { StatusBadge, TipoBadge, RespBadge } from '../../components/StatusBadge'
import { supabase } from '../../lib/supabase'

const S = {
  statsRow: { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:24 },
  statCard: {
    background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)',
    padding:'14px 16px',
  },
  statLabel: { fontSize:11, color:'var(--slate-500)', marginBottom:4, fontWeight:500 },
  statValue: { fontSize:22, fontWeight:700, color:'var(--slate-900)' },
  toolbar: { display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' },
  search: {
    padding:'8px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)',
    fontSize:13, outline:'none', width:200, background:'var(--slate-50)',
  },
  sel: {
    padding:'8px 10px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)',
    fontSize:13, outline:'none', background:'var(--slate-50)', color:'var(--slate-700)',
  },
  btnRefresh: {
    padding:'8px 14px', background:'transparent', border:'1.5px solid var(--slate-200)',
    borderRadius:'var(--radius-md)', fontSize:13, color:'var(--slate-600)', cursor:'pointer',
    marginLeft:'auto',
  },
  tableWrap: {
    background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)',
    overflow:'hidden',
  },
  table: { width:'100%', borderCollapse:'collapse' },
  th: {
    padding:'10px 14px', background:'var(--slate-50)', fontSize:11, fontWeight:600,
    color:'var(--slate-500)', textAlign:'left', borderBottom:'1px solid var(--slate-200)',
    whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'.04em',
  },
  td: { padding:'12px 14px', fontSize:13, borderBottom:'1px solid var(--slate-100)', color:'var(--slate-700)' },
  empty: { padding:'48px 0', textAlign:'center', color:'var(--slate-400)', fontSize:14 },
  pager: { display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderTop:'1px solid var(--slate-100)', fontSize:13 },
  btnPage: {
    padding:'5px 12px', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-sm)',
    background:'transparent', color:'var(--slate-600)', cursor:'pointer', fontSize:12,
  },
}

const PAGE_SIZE = 25

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterTransp, setFilterTransp] = useState('')
  const [transpList, setTranspList] = useState([])

  useEffect(() => { loadTransp() }, [])
  useEffect(() => { setPage(0) }, [search, filterStatus, filterTipo, filterTransp])
  useEffect(() => { load() }, [page, search, filterStatus, filterTipo, filterTransp])

  async function loadTransp() {
    const { data } = await supabase
      .from('dev_ocorrencias')
      .select('transportador_nome, transportador_cnpj')
    if (data) {
      const unique = [...new Map(data.map(r => [r.transportador_cnpj, r])).values()]
      setTranspList(unique)
    }
  }

  async function load() {
    setLoading(true)
    let q = supabase
      .from('dev_ocorrencias')
      .select('id, nf_numero, tipo, motivo, status, responsabilidade, transportador_nome, transportador_cnpj, created_at, nf_snapshot, usuario_nome', { count:'exact' })
      .order('created_at', { ascending:false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (filterStatus) q = q.eq('status', filterStatus)
    if (filterTipo) q = q.eq('tipo', filterTipo)
    if (filterTransp) q = q.eq('transportador_cnpj', filterTransp)
    if (search) q = q.or(`nf_numero.ilike.%${search}%,motivo.ilike.%${search}%,transportador_nome.ilike.%${search}%`)

    const { data, count } = await q
    setRows(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  const statAll = total
  const statReg = rows.filter(r => r.status === 'registrada').length
  const statAn = rows.filter(r => r.status === 'em_analise').length
  const statOk = rows.filter(r => ['aprovada','finalizada'].includes(r.status)).length
  const statRep = rows.filter(r => r.status === 'reprovada').length
  const statDoc = rows.filter(r => r.status === 'aguardando_doc').length

  return (
    <Layout title="Gestão de Devoluções">
      <div style={S.statsRow}>
        <div style={S.statCard}><div style={S.statLabel}>Total (página)</div><div style={S.statValue}>{statAll}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Registradas</div><div style={{ ...S.statValue, color:'var(--amber-600)' }}>{statReg}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Em análise</div><div style={{ ...S.statValue, color:'var(--blue-600)' }}>{statAn}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Aprovadas</div><div style={{ ...S.statValue, color:'var(--green-600)' }}>{statOk}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Reprovadas</div><div style={{ ...S.statValue, color:'var(--red-600)' }}>{statRep}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Aguard. Doc.</div><div style={{ ...S.statValue, color:'var(--purple-600)' }}>{statDoc}</div></div>
      </div>

      <div style={S.toolbar}>
        <input style={S.search} placeholder="Buscar NF, motivo, transportadora..." value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
          onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
        />
        <select style={S.sel} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="registrada">Registrada</option>
          <option value="em_analise">Em análise</option>
          <option value="aprovada">Aprovada</option>
          <option value="reprovada">Reprovada</option>
          <option value="aguardando_doc">Aguard. Documento</option>
          <option value="finalizada">Finalizada</option>
        </select>
        <select style={S.sel} value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="avaria">Avaria</option>
          <option value="falta">Falta</option>
          <option value="inversao">Inversão</option>
          <option value="recusa">Recusa Total</option>
          <option value="excesso">Excesso</option>
          <option value="outro">Outro</option>
        </select>
        <select style={S.sel} value={filterTransp} onChange={e => setFilterTransp(e.target.value)}>
          <option value="">Todas as transportadoras</option>
          {transpList.map(t => (
            <option key={t.transportador_cnpj} value={t.transportador_cnpj}>{t.transportador_nome}</option>
          ))}
        </select>
        <button style={S.btnRefresh} onClick={load}>↺ Atualizar</button>
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <div style={S.empty}>Carregando...</div>
        ) : rows.length === 0 ? (
          <div style={S.empty}>Nenhuma ocorrência encontrada.</div>
        ) : (
          <>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>NF</th>
                  <th style={S.th}>Tipo</th>
                  <th style={S.th}>Motivo</th>
                  <th style={S.th}>Transportadora</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Responsab.</th>
                  <th style={S.th}>Data</th>
                  <th style={S.th}>Destinatário</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}
                    style={{ cursor:'pointer' }}
                    onClick={() => navigate(`/admin/ocorrencia/${row.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--slate-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ ...S.td, fontWeight:600, color:'var(--slate-900)' }}>{row.nf_numero}</td>
                    <td style={S.td}><TipoBadge tipo={row.tipo} /></td>
                    <td style={{ ...S.td, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.motivo}</td>
                    <td style={{ ...S.td, color:'var(--slate-500)' }}>{row.transportador_nome}</td>
                    <td style={S.td}><StatusBadge status={row.status} /></td>
                    <td style={S.td}><RespBadge resp={row.responsabilidade} /></td>
                    <td style={S.td}>{fmtDate(row.created_at)}</td>
                    <td style={{ ...S.td, color:'var(--slate-500)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {row.nf_snapshot?.destinatario_nome || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={S.pager}>
              <button style={S.btnPage} disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Anterior</button>
              <span style={{ color:'var(--slate-500)' }}>
                Página {page + 1} — {rows.length} de {total} registros
              </span>
              <button style={S.btnPage} disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Próximo →</button>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
