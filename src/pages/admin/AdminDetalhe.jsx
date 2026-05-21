import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { StatusBadge, TipoBadge, RespBadge } from '../../components/StatusBadge'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const S = {
  grid: { display:'grid', gridTemplateColumns:'1fr 380px', gap:20, alignItems:'start' },
  card: { background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)', padding:'24px', marginBottom:16 },
  sectionTitle: { fontSize:12, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:14 },
  row: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:8 },
  rowKey: { fontSize:13, color:'var(--slate-500)', minWidth:180 },
  rowVal: { fontSize:13, color:'var(--slate-800)', fontWeight:500, textAlign:'right' },
  textBlock: { background:'var(--slate-50)', borderRadius:'var(--radius-md)', padding:'12px 14px', fontSize:13, color:'var(--slate-700)', lineHeight:1.6 },
  field: { marginBottom:16 },
  label: { display:'block', fontSize:13, fontWeight:500, color:'var(--slate-700)', marginBottom:6 },
  select: {
    width:'100%', padding:'9px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)',
    fontSize:13, outline:'none', background:'var(--slate-50)', color:'var(--slate-700)',
  },
  textarea: {
    width:'100%', padding:'10px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)',
    fontSize:13, outline:'none', background:'var(--slate-50)', resize:'vertical', minHeight:90,
  },
  btnSave: {
    width:'100%', padding:'10px 0', background:'var(--slate-900)', border:'none',
    borderRadius:'var(--radius-md)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer',
  },
  btnBack: {
    display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px',
    background:'transparent', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)',
    fontSize:13, fontWeight:500, color:'var(--slate-600)', cursor:'pointer', marginBottom:20,
  },
  fileItem: {
    display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
    background:'var(--slate-50)', borderRadius:'var(--radius-md)', border:'1px solid var(--slate-200)',
    fontSize:13, marginBottom:6, cursor:'pointer', transition:'background .1s',
  },
  timelineItem: { display:'flex', gap:12, paddingBottom:14 },
  timelineDot: {
    width:26, height:26, borderRadius:'50%', flexShrink:0, background:'var(--slate-100)',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--slate-500)',
  },
  timelineDotAdmin: { background:'var(--slate-800)', color:'#fff' },
  timelineAction: { fontSize:13, fontWeight:500, color:'var(--slate-800)' },
  timelineMeta: { fontSize:11, color:'var(--slate-400)', marginTop:2 },
  timelineObs: { fontSize:12, color:'var(--slate-600)', marginTop:4 },
  success: { background:'var(--green-50)', border:'1px solid var(--green-100)', borderRadius:'var(--radius-md)', padding:'10px 14px', color:'var(--green-700)', fontSize:13, marginBottom:16 },
  error: { background:'var(--red-50)', border:'1px solid var(--red-100)', borderRadius:'var(--radius-md)', padding:'10px 14px', color:'var(--red-700)', fontSize:13, marginBottom:16 },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })
}
function fmtMoney(v) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v)
}
function fmtBytes(b) {
  if (!b) return ''
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' KB'
  return (b / (1024 * 1024)).toFixed(1) + ' MB'
}

const TIPO_LABELS = { avaria:'Avaria', falta:'Falta', inversao:'Inversão', recusa:'Recusa Total', excesso:'Excesso', outro:'Outro' }

export default function AdminDetalhe() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [occ, setOcc] = useState(null)
  const [anexos, setAnexos] = useState([])
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type:'', text:'' })

  // Edit fields
  const [status, setStatus] = useState('')
  const [responsabilidade, setResponsabilidade] = useState('')
  const [observacaoLinea, setObservacaoLinea] = useState('')
  const [notaHistorico, setNotaHistorico] = useState('')

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [{ data: o }, { data: a }, { data: h }] = await Promise.all([
      supabase.from('dev_ocorrencias').select('*').eq('id', id).single(),
      supabase.from('dev_anexos').select('*').eq('ocorrencia_id', id).order('created_at'),
      supabase.from('dev_historico').select('*').eq('ocorrencia_id', id).order('created_at'),
    ])
    if (o) {
      setOcc(o)
      setStatus(o.status)
      setResponsabilidade(o.responsabilidade || '')
      setObservacaoLinea(o.observacao_linea || '')
    }
    setAnexos(a || [])
    setHistorico(h || [])
    setLoading(false)
  }

  async function downloadFile(anexo) {
    const { data } = await supabase.storage.from('dev-anexos').createSignedUrl(anexo.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function save() {
    setSaving(true); setMsg({ type:'', text:'' })

    const changed = []
    if (status !== occ.status) changed.push(`status: ${occ.status} → ${status}`)
    if (responsabilidade !== (occ.responsabilidade || '')) changed.push(`responsabilidade: ${responsabilidade}`)

    const updates = {
      status,
      responsabilidade: responsabilidade || null,
      observacao_linea: observacaoLinea.trim() || null,
      atendido_por: user.nome,
      updated_at: new Date().toISOString(),
    }
    if (status === 'finalizada' && occ.status !== 'finalizada') {
      updates.finalizada_em = new Date().toISOString()
      updates.finalizada_por = user.nome
    }

    const { error: upErr } = await supabase.from('dev_ocorrencias').update(updates).eq('id', id)
    if (upErr) { setMsg({ type:'error', text:'Erro ao salvar: ' + upErr.message }); setSaving(false); return }

    // History entry
    const acaoDesc = changed.length ? changed.join(', ') : 'Atualizado pelo admin'
    await supabase.from('dev_historico').insert({
      ocorrencia_id: id,
      acao: acaoDesc,
      status_anterior: occ.status,
      status_novo: status,
      observacao: notaHistorico.trim() || observacaoLinea.trim() || null,
      usuario: user.nome,
      perfil: 'admin',
    })

    setNotaHistorico('')
    setMsg({ type:'success', text:'Salvo com sucesso!' })
    await load()
    setSaving(false)
    setTimeout(() => setMsg({ type:'', text:'' }), 3000)
  }

  if (loading) return <Layout title="Ocorrência"><div style={{ padding:40, color:'var(--slate-400)' }}>Carregando...</div></Layout>
  if (!occ) return <Layout title="Ocorrência"><div style={{ padding:40, color:'var(--red-600)' }}>Não encontrada.</div></Layout>

  const nf = occ.nf_snapshot || {}

  return (
    <Layout title={`Ocorrência — NF ${occ.nf_numero}`}>
      <button style={S.btnBack} onClick={() => navigate('/admin')}>← Voltar</button>

      {msg.text && <div style={msg.type === 'success' ? S.success : S.error}>{msg.text}</div>}

      <div style={S.grid}>
        {/* LEFT */}
        <div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Nota Fiscal</div>
            <div style={S.row}><span style={S.rowKey}>Número</span><span style={{ ...S.rowVal, fontSize:15, fontWeight:700 }}>{occ.nf_numero}{occ.nf_serie ? `/${occ.nf_serie}` : ''}</span></div>
            <div style={S.row}><span style={S.rowKey}>Destinatário</span><span style={S.rowVal}>{nf.destinatario_nome || '—'}</span></div>
            <div style={S.row}><span style={S.rowKey}>Emissão</span><span style={S.rowVal}>{nf.data_emissao ? new Date(nf.data_emissao).toLocaleDateString('pt-BR') : '—'}</span></div>
            <div style={S.row}><span style={S.rowKey}>Valor mercadoria</span><span style={S.rowVal}>{fmtMoney(nf.valor_mercadoria)}</span></div>
            <div style={S.row}><span style={S.rowKey}>Transportadora</span><span style={S.rowVal}>{occ.transportador_nome}</span></div>
            <div style={S.row}><span style={S.rowKey}>Registrado por</span><span style={S.rowVal}>{occ.usuario_nome}</span></div>
            <div style={S.row}><span style={S.rowKey}>Data registro</span><span style={S.rowVal}>{fmtDate(occ.created_at)}</span></div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Ocorrência</div>
            <div style={S.row}><span style={S.rowKey}>Tipo</span><TipoBadge tipo={occ.tipo} /></div>
            <div style={S.row}><span style={S.rowKey}>Volumes afetados</span><span style={S.rowVal}>{occ.qtd_volumes_afetados || '—'}</span></div>
            <div style={S.row}><span style={S.rowKey}>Valor estimado</span><span style={S.rowVal}>{fmtMoney(occ.valor_estimado)}</span></div>
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:12, color:'var(--slate-500)', marginBottom:6, fontWeight:500 }}>MOTIVO</div>
              <div style={S.textBlock}>{occ.motivo}</div>
            </div>
            {occ.observacao && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:12, color:'var(--slate-500)', marginBottom:6, fontWeight:500 }}>OBSERVAÇÕES DO TRANSPORTADOR</div>
                <div style={S.textBlock}>{occ.observacao}</div>
              </div>
            )}
          </div>

          {/* Attachments */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Anexos ({anexos.length})</div>
            {anexos.length === 0 && <div style={{ color:'var(--slate-400)', fontSize:13 }}>Nenhum anexo.</div>}
            {anexos.map(a => (
              <div key={a.id} style={S.fileItem}
                onClick={() => downloadFile(a)}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--slate-100)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--slate-50)')}
              >
                <span style={{ fontSize:15 }}>{a.tipo_mime?.includes('image') ? '🖼' : a.tipo_mime?.includes('pdf') ? '📄' : '📎'}</span>
                <span>{a.nome_arquivo}</span>
                <span style={{ fontSize:11, color:'var(--slate-400)', marginLeft:'auto' }}>{fmtBytes(a.tamanho_bytes)}</span>
                <span style={{ fontSize:11, color:'var(--slate-400)' }}>
                  {a.perfil === 'admin' ? 'Linea' : 'Transp.'} · {fmtDate(a.created_at)}
                </span>
                <span style={{ fontSize:11, color:'var(--blue-600)' }}>↗</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Management */}
        <div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Gerenciar</div>

            <div style={S.field}>
              <label style={S.label}>Status *</label>
              <select style={S.select} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="registrada">Registrada</option>
                <option value="em_analise">Em análise</option>
                <option value="aguardando_doc">Aguardando Documento</option>
                <option value="aprovada">Aprovada</option>
                <option value="reprovada">Reprovada</option>
                <option value="finalizada">Finalizada</option>
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Responsabilidade</label>
              <select style={S.select} value={responsabilidade} onChange={e => setResponsabilidade(e.target.value)}>
                <option value="">Não definida</option>
                <option value="transportador">Transportador</option>
                <option value="linea">Linea (expedição)</option>
                <option value="investigacao">Investigação</option>
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Observação para o transportador</label>
              <textarea style={S.textarea}
                placeholder="Mensagem visível ao transportador..."
                value={observacaoLinea}
                onChange={e => setObservacaoLinea(e.target.value)}
                onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
                onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
              />
            </div>

            <div style={S.field}>
              <label style={S.label}>Nota interna (histórico)</label>
              <textarea style={{ ...S.textarea, minHeight:60 }}
                placeholder="Anotação interna (não visível ao transportador)..."
                value={notaHistorico}
                onChange={e => setNotaHistorico(e.target.value)}
                onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
                onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
              />
            </div>

            <button style={{ ...S.btnSave, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : '✓ Salvar Alterações'}
            </button>
          </div>

          {/* Timeline */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Histórico</div>
            {historico.length === 0 && <div style={{ color:'var(--slate-400)', fontSize:13 }}>Sem registros.</div>}
            {historico.map((h) => (
              <div key={h.id} style={S.timelineItem}>
                <div style={{ ...S.timelineDot, ...(h.perfil === 'admin' ? S.timelineDotAdmin : {}) }}>
                  {h.perfil === 'admin' ? 'L' : 'T'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={S.timelineAction}>{h.acao}</div>
                  <div style={S.timelineMeta}>{h.usuario} · {fmtDate(h.created_at)}</div>
                  {h.observacao && <div style={S.timelineObs}>{h.observacao}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
