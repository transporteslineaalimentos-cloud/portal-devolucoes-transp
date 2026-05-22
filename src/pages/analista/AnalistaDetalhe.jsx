import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { StatusBadge, TipoBadge, RespBadge, TrackingBadge } from '../../components/StatusBadge'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const S = {
  grid: { display:'grid', gridTemplateColumns:'1fr 380px', gap:20, alignItems:'start' },
  card: { background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)', padding:'24px', marginBottom:16 },
  sectionTitle: { fontSize:12, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 },
  row: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:8 },
  rowKey: { fontSize:13, color:'var(--slate-500)', minWidth:160 },
  rowVal: { fontSize:13, color:'var(--slate-800)', fontWeight:500, textAlign:'right' },
  textBlock: { background:'var(--slate-50)', borderRadius:'var(--radius-md)', padding:'12px 14px', fontSize:13, color:'var(--slate-700)', lineHeight:1.6 },
  fileItem: { display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--slate-50)', borderRadius:'var(--radius-md)', border:'1px solid var(--slate-200)', fontSize:13, marginBottom:6, cursor:'pointer' },
  field: { marginBottom:14 },
  label: { display:'block', fontSize:13, fontWeight:500, color:'var(--slate-700)', marginBottom:5 },
  select: { width:'100%', padding:'9px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)', fontSize:13, outline:'none', background:'var(--slate-50)', color:'var(--slate-700)' },
  textarea: { width:'100%', padding:'10px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)', fontSize:13, outline:'none', background:'var(--slate-50)', resize:'vertical', minHeight:80 },
  input: { width:'100%', padding:'9px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)', fontSize:13, outline:'none', background:'var(--slate-50)' },
  btnSave: { width:'100%', padding:'10px 0', background:'var(--slate-900)', border:'none', borderRadius:'var(--radius-md)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnBack: { display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', background:'transparent', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:500, color:'var(--slate-600)', cursor:'pointer', marginBottom:20 },
  success: { background:'var(--green-50)', border:'1px solid var(--green-100)', borderRadius:'var(--radius-md)', padding:'10px 14px', color:'var(--green-700)', fontSize:13, marginBottom:16 },
  error: { background:'var(--red-50)', border:'1px solid var(--red-100)', borderRadius:'var(--radius-md)', padding:'10px 14px', color:'var(--red-700)', fontSize:13, marginBottom:16 },
  divider: { borderTop:'1px solid var(--slate-200)', margin:'14px 0' },
  timelineItem: { display:'flex', gap:12, paddingBottom:14 },
  timelineDot: { width:26, height:26, borderRadius:'50%', flexShrink:0, background:'var(--slate-100)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--slate-500)' },
  timelineDotLinea: { background:'var(--slate-800)', color:'#fff' },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })
}
function fmtMoney(v) { if (!v) return '—'; return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v) }
function fmtBytes(b) { if (!b) return ''; if (b<1024*1024) return (b/1024).toFixed(0)+' KB'; return (b/1024/1024).toFixed(1)+' MB' }

export default function AnalistaDetalhe() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [occ, setOcc] = useState(null)
  const [anexos, setAnexos] = useState([])
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type:'', text:'' })

  const [status, setStatus] = useState('')
  const [responsabilidade, setResponsabilidade] = useState('')
  const [obsLinea, setObsLinea] = useState('')
  const [notaInterna, setNotaInterna] = useState('')
  const [valorCobranca, setValorCobranca] = useState('')
  const [motivoCobranca, setMotivoCobranca] = useState('')

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [{ data: o }, { data: a }, { data: h }] = await Promise.all([
      supabase.from('dev_ocorrencias').select('*').eq('id', id).single(),
      supabase.from('dev_anexos').select('*').eq('ocorrencia_id', id).order('created_at'),
      supabase.from('dev_historico').select('*').eq('ocorrencia_id', id).order('created_at'),
    ])
    setOcc(o)
    setAnexos(a || [])
    setHistorico(h || [])
    if (o) {
      setStatus(o.status)
      setResponsabilidade(o.responsabilidade || '')
      setObsLinea(o.observacao_linea || '')
      setValorCobranca(o.valor_cobranca || '')
      setMotivoCobranca(o.motivo_cobranca || '')
    }
    setLoading(false)
  }

  async function downloadFile(a) {
    const { data } = await supabase.storage.from('dev-anexos').createSignedUrl(a.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function save() {
    setSaving(true); setMsg({ type:'', text:'' })

    const updates = {
      status,
      responsabilidade: responsabilidade || null,
      observacao_linea: obsLinea.trim() || null,
      analista_id: user.id,
      analista_nome: user.nome,
      updated_at: new Date().toISOString(),
    }

    if (status === 'cobranca_nfd') {
      updates.valor_cobranca = valorCobranca ? parseFloat(valorCobranca.replace(',','.')) : null
      updates.motivo_cobranca = motivoCobranca.trim() || null
    }
    if (status === 'finalizada' && occ.status !== 'finalizada') {
      updates.finalizada_em = new Date().toISOString()
      updates.finalizada_por = user.nome
    }

    await supabase.from('dev_ocorrencias').update(updates).eq('id', id)

    const acoes = []
    if (status !== occ.status) acoes.push(`Status: ${occ.status} → ${status}`)
    if (responsabilidade && responsabilidade !== occ.responsabilidade) acoes.push(`Responsabilidade: ${responsabilidade}`)

    await supabase.from('dev_historico').insert({
      ocorrencia_id: id,
      acao: acoes.length ? acoes.join(' | ') : 'Ocorrência atualizada',
      status_anterior: occ.status,
      status_novo: status,
      observacao: notaInterna.trim() || obsLinea.trim() || null,
      usuario: user.nome,
      perfil: 'analista',
    })

    setNotaInterna('')
    setMsg({ type:'success', text:'Salvo com sucesso!' })
    await load()
    setSaving(false)
    setTimeout(() => setMsg({ type:'', text:'' }), 3000)
  }

  if (loading) return <Layout title="Ocorrência"><div style={{ padding:40, color:'var(--slate-400)' }}>Carregando...</div></Layout>
  if (!occ) return <Layout title="Ocorrência"><div style={{ padding:40 }}>Não encontrada.</div></Layout>

  const nf = occ.nf_snapshot || {}
  const isCobranca = status === 'cobranca_nfd'

  return (
    <Layout title={`Análise — NF ${occ.nf_numero}`}>
      <button style={S.btnBack} onClick={() => navigate('/analista')}>← Voltar</button>
      {msg.text && <div style={msg.type==='success' ? S.success : S.error}>{msg.text}</div>}

      <div style={S.grid}>
        <div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Nota Fiscal</div>
            <div style={S.row}><span style={S.rowKey}>Número</span><span style={{ ...S.rowVal, fontSize:15, fontWeight:700 }}>{occ.nf_numero}{occ.nf_serie?`/${occ.nf_serie}`:''}</span></div>
            <div style={S.row}><span style={S.rowKey}>Destinatário</span><span style={S.rowVal}>{nf.destinatario_nome||'—'}</span></div>
            <div style={S.row}><span style={S.rowKey}>Emissão</span><span style={S.rowVal}>{nf.data_emissao?new Date(nf.data_emissao).toLocaleDateString('pt-BR'):'—'}</span></div>
            <div style={S.row}><span style={S.rowKey}>Valor mercadoria</span><span style={S.rowVal}>{fmtMoney(nf.valor_mercadoria)}</span></div>
            <div style={S.row}><span style={S.rowKey}>Transportadora</span><span style={S.rowVal}>{occ.transportador_nome}</span></div>
            <div style={S.row}><span style={S.rowKey}>Registrado por</span><span style={S.rowVal}>{occ.usuario_nome} · {fmtDate(occ.created_at)}</span></div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Ocorrência</div>
            <div style={S.row}><span style={S.rowKey}>Tipo</span><TipoBadge tipo={occ.tipo} /></div>
            <div style={S.row}><span style={S.rowKey}>Volumes afetados</span><span style={S.rowVal}>{occ.qtd_volumes_afetados||'—'}</span></div>
            <div style={S.row}><span style={S.rowKey}>Valor estimado</span><span style={S.rowVal}>{fmtMoney(occ.valor_estimado)}</span></div>
            <div style={{ marginTop:12 }}>
              <div style={S.sectionTitle}>Motivo</div>
              <div style={S.textBlock}>{occ.motivo}</div>
            </div>
            {occ.observacao && <div style={{ marginTop:10 }}><div style={S.sectionTitle}>Obs. transportador</div><div style={S.textBlock}>{occ.observacao}</div></div>}
          </div>

          {(occ.nfd_numero || occ.tracking_status !== 'pendente') && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Dados de Retorno</div>
              {occ.nfd_numero && <div style={S.row}><span style={S.rowKey}>NFD</span><span style={{ ...S.rowVal, fontWeight:700 }}>{occ.nfd_numero}{occ.nfd_data ? ` · ${new Date(occ.nfd_data+'T00:00:00').toLocaleDateString('pt-BR')}` : ''}</span></div>}
              <div style={S.row}><span style={S.rowKey}>Tracking</span><TrackingBadge status={occ.tracking_status} /></div>
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Anexos ({anexos.length})</div>
            {anexos.length === 0 && <div style={{ color:'var(--slate-400)', fontSize:13 }}>Nenhum anexo.</div>}
            {anexos.map(a => (
              <div key={a.id} style={S.fileItem} onClick={() => downloadFile(a)}
                onMouseEnter={e=>(e.currentTarget.style.background='var(--slate-100)')}
                onMouseLeave={e=>(e.currentTarget.style.background='var(--slate-50)')}>
                <span style={{ fontSize:15 }}>{a.tipo_mime?.includes('image')?'🖼':a.tipo_mime?.includes('pdf')?'📄':'📎'}</span>
                <span>{a.nome_arquivo}</span>
                <span style={{ color:'var(--slate-400)', marginLeft:'auto', fontSize:11 }}>{fmtBytes(a.tamanho_bytes)}</span>
                <span style={{ fontSize:11, color:'var(--blue-600)' }}>↗</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Análise</div>
            <div style={S.field}>
              <label style={S.label}>Status *</label>
              <select style={S.select} value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="registrada">Registrada</option>
                <option value="em_analise">Em análise</option>
                <option value="aguardando_doc">Aguardando Documento</option>
                <option value="aprovada">Aprovada</option>
                <option value="reprovada">Reprovada</option>
                <option value="cobranca_nfd">Cobrança NFD</option>
                <option value="finalizada">Finalizada</option>
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Responsabilidade</label>
              <select style={S.select} value={responsabilidade} onChange={e=>setResponsabilidade(e.target.value)}>
                <option value="">Não definida</option>
                <option value="transportador">Transportador</option>
                <option value="linea">Linea (expedição)</option>
                <option value="investigacao">Investigação</option>
              </select>
            </div>

            {isCobranca && (
              <>
                <div style={S.divider} />
                <div style={{ padding:'10px 12px', background:'#FEF2F2', borderRadius:'var(--radius-md)', marginBottom:12, border:'1px solid #FCA5A5' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#991B1B', marginBottom:6 }}>Dados da Cobrança NFD</div>
                  <div style={S.field}>
                    <label style={{ ...S.label, color:'#991B1B' }}>Motivo da cobrança</label>
                    <textarea style={{ ...S.textarea, minHeight:60, borderColor:'#FCA5A5' }}
                      placeholder="Ex: Avaria não compensou retorno, prazo excedido..."
                      value={motivoCobranca} onChange={e=>setMotivoCobranca(e.target.value)} />
                  </div>
                  <div style={S.field}>
                    <label style={{ ...S.label, color:'#991B1B' }}>Valor a cobrar (R$)</label>
                    <input style={{ ...S.input, borderColor:'#FCA5A5' }} placeholder="0,00" value={valorCobranca} onChange={e=>setValorCobranca(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <div style={S.divider} />
            <div style={S.field}>
              <label style={S.label}>Obs. para o transportador</label>
              <textarea style={S.textarea} placeholder="Mensagem visível ao transportador..."
                value={obsLinea} onChange={e=>setObsLinea(e.target.value)}
                onFocus={e=>(e.target.style.borderColor='var(--amber-500)')} onBlur={e=>(e.target.style.borderColor='var(--slate-200)')} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Nota interna</label>
              <textarea style={{ ...S.textarea, minHeight:60 }} placeholder="Anotação interna (não visível ao transportador)..."
                value={notaInterna} onChange={e=>setNotaInterna(e.target.value)}
                onFocus={e=>(e.target.style.borderColor='var(--amber-500)')} onBlur={e=>(e.target.style.borderColor='var(--slate-200)')} />
            </div>
            <button style={{ ...S.btnSave, opacity:saving?.6:1 }} onClick={save} disabled={saving}>
              {saving?'Salvando...':'✓ Salvar análise'}
            </button>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Histórico</div>
            {historico.length===0 && <div style={{ color:'var(--slate-400)', fontSize:13 }}>Sem registros.</div>}
            {historico.map(h => (
              <div key={h.id} style={S.timelineItem}>
                <div style={{ ...S.timelineDot, ...(['admin','analista'].includes(h.perfil)?S.timelineDotLinea:{}) }}>
                  {['admin','analista'].includes(h.perfil)?'L':'T'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--slate-800)' }}>{h.acao}</div>
                  <div style={{ fontSize:11, color:'var(--slate-400)', marginTop:2 }}>{h.usuario} · {fmtDate(h.created_at)}</div>
                  {h.observacao && <div style={{ fontSize:12, color:'var(--slate-600)', marginTop:4 }}>{h.observacao}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
