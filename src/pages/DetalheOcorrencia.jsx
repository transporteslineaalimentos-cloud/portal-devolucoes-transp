import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { StatusBadge, TipoBadge, RespBadge, TrackingBadge, TRACKING_MAP } from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const S = {
  grid: { display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' },
  card: { background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)', padding:'24px', marginBottom:16 },
  sectionTitle: { fontSize:12, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 },
  row: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:8 },
  rowKey: { fontSize:13, color:'var(--slate-500)', minWidth:160 },
  rowVal: { fontSize:13, color:'var(--slate-800)', fontWeight:500, textAlign:'right' },
  textBlock: { background:'var(--slate-50)', borderRadius:'var(--radius-md)', padding:'12px 14px', fontSize:13, color:'var(--slate-700)', lineHeight:1.6 },
  respBox: { background:'var(--amber-50)', border:'1px solid var(--amber-100)', borderRadius:'var(--radius-md)', padding:'12px 14px', fontSize:13, color:'var(--amber-700)' },
  fileItem: {
    display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
    background:'var(--slate-50)', borderRadius:'var(--radius-md)',
    border:'1px solid var(--slate-200)', fontSize:13, marginBottom:6, cursor:'pointer',
  },
  uploadArea: { border:'2px dashed var(--slate-300)', borderRadius:'var(--radius-md)', padding:'20px', textAlign:'center', cursor:'pointer', marginTop:12, background:'var(--slate-50)' },
  btnBack: {
    display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px',
    background:'transparent', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)',
    fontSize:13, fontWeight:500, color:'var(--slate-600)', cursor:'pointer', marginBottom:20,
  },
  error: { background:'var(--red-50)', border:'1px solid var(--red-100)', borderRadius:'var(--radius-md)', padding:'10px 14px', color:'var(--red-700)', fontSize:13, marginBottom:16 },
  success: { background:'var(--green-50)', border:'1px solid var(--green-100)', borderRadius:'var(--radius-md)', padding:'10px 14px', color:'var(--green-700)', fontSize:13, marginBottom:12 },
  trackingGrid: { display:'flex', flexDirection:'column', gap:6, marginTop:8 },
  trackingOption: {
    display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
    borderRadius:'var(--radius-md)', border:'1.5px solid var(--slate-200)',
    cursor:'pointer', transition:'all .15s', fontSize:13,
  },
  trackingOptionActive: { borderColor:'var(--amber-500)', background:'var(--amber-50)' },
  input: { width:'100%', padding:'9px 12px', border:'1.5px solid var(--slate-200)', borderRadius:'var(--radius-md)', fontSize:13, outline:'none', background:'var(--slate-50)', transition:'border-color .15s' },
  btnSave: { width:'100%', padding:'9px 0', background:'var(--amber-500)', border:'none', borderRadius:'var(--radius-md)', color:'var(--slate-900)', fontSize:13, fontWeight:600, cursor:'pointer', marginTop:10 },
  timelineItem: { display:'flex', gap:12, paddingBottom:14 },
  timelineDot: { width:26, height:26, borderRadius:'50%', flexShrink:0, background:'var(--slate-100)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--slate-500)' },
  timelineDotAdmin: { background:'var(--slate-800)', color:'#fff' },
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
  if (b < 1024*1024) return (b/1024).toFixed(0) + ' KB'
  return (b/1024/1024).toFixed(1) + ' MB'
}

export default function DetalheOcorrencia() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInput = useRef()

  const [occ, setOcc] = useState(null)
  const [anexos, setAnexos] = useState([])
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [savingTracking, setSavingTracking] = useState(false)
  const [savingNFD, setSavingNFD] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const [tracking, setTracking] = useState('pendente')
  const [nfdNumero, setNfdNumero] = useState('')
  const [nfdData, setNfdData] = useState('')

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [{ data: o }, { data: a }, { data: h }] = await Promise.all([
      supabase.from('dev_ocorrencias').select('*').eq('id', id).single(),
      supabase.from('dev_anexos').select('*').eq('ocorrencia_id', id).order('created_at'),
      supabase.from('dev_historico').select('*').eq('ocorrencia_id', id).order('created_at'),
    ])

    // Segurança: transportador só vê ocorrências dele
    if (o && user.tipo === 'transportador' && !user.cnpjs.includes(o.transportador_cnpj)) {
      navigate('/dashboard')
      return
    }

    setOcc(o)
    setAnexos(a || [])
    setHistorico(h || [])
    if (o) {
      setTracking(o.tracking_status || 'pendente')
      setNfdNumero(o.nfd_numero || '')
      setNfdData(o.nfd_data || '')
    }
    setLoading(false)
  }

  async function downloadFile(anexo) {
    const { data } = await supabase.storage.from('dev-anexos').createSignedUrl(anexo.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function uploadFiles(fileList) {
    if (!occ) return
    setUploading(true); setError('')
    for (const file of Array.from(fileList)) {
      const path = `${id}/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('dev-anexos').upload(path, file, { contentType: file.type, upsert: true })
      if (upErr) { setError('Erro no upload: ' + upErr.message); continue }
      await supabase.from('dev_anexos').insert({ ocorrencia_id:id, nome_arquivo:file.name, storage_path:path, tamanho_bytes:file.size, tipo_mime:file.type, uploaded_por:user.nome, perfil:'transportador' })
      await supabase.from('dev_historico').insert({ ocorrencia_id:id, acao:`Anexo adicionado: ${file.name}`, usuario:user.nome, perfil:'transportador' })
    }
    await load()
    setUploading(false)
  }

  async function saveTracking() {
    setSavingTracking(true)
    await supabase.from('dev_ocorrencias').update({ tracking_status: tracking, updated_at: new Date().toISOString() }).eq('id', id)
    await supabase.from('dev_historico').insert({ ocorrencia_id:id, acao:`Tracking atualizado: ${TRACKING_MAP[tracking]?.label}`, usuario:user.nome, perfil:'transportador' })
    showMsg('Tracking atualizado!')
    await load()
    setSavingTracking(false)
  }

  async function saveNFD() {
    if (!nfdNumero.trim()) { setError('Informe o número da NFD'); return }
    setSavingNFD(true); setError('')
    await supabase.from('dev_ocorrencias').update({ nfd_numero: nfdNumero.trim(), nfd_data: nfdData || null, updated_at: new Date().toISOString() }).eq('id', id)
    await supabase.from('dev_historico').insert({ ocorrencia_id:id, acao:`NFD informada: ${nfdNumero.trim()}${nfdData ? ` (${new Date(nfdData).toLocaleDateString('pt-BR')})` : ''}`, usuario:user.nome, perfil:'transportador' })
    showMsg('NFD salva!')
    await load()
    setSavingNFD(false)
  }

  function showMsg(text) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3500)
  }

  const canUpload = occ && !['finalizada'].includes(occ.status)
  const canEditTracking = occ && occ.status !== 'registrada'
  const canEditNFD = occ && !['finalizada'].includes(occ.status)
  const nf = occ?.nf_snapshot || {}

  if (loading) return <Layout title="Ocorrência"><div style={{ padding:40, color:'var(--slate-400)' }}>Carregando...</div></Layout>
  if (!occ) return <Layout title="Ocorrência"><div style={{ padding:40, color:'var(--red-600)' }}>Não encontrada.</div></Layout>

  return (
    <Layout title={`Ocorrência — NF ${occ.nf_numero}`}>
      <button style={S.btnBack} onClick={() => navigate('/dashboard')}>← Voltar</button>
      {msg && <div style={S.success}>{msg}</div>}
      {error && <div style={S.error}>{error}</div>}

      <div style={S.grid}>
        <div>
          {/* NF Info */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Nota Fiscal</div>
            <div style={S.row}><span style={S.rowKey}>Número</span><span style={{ ...S.rowVal, fontSize:15, fontWeight:700 }}>{occ.nf_numero}{occ.nf_serie ? `/${occ.nf_serie}` : ''}</span></div>
            <div style={S.row}><span style={S.rowKey}>Destinatário</span><span style={S.rowVal}>{nf.destinatario_nome || '—'}</span></div>
            <div style={S.row}><span style={S.rowKey}>Emissão</span><span style={S.rowVal}>{nf.data_emissao ? new Date(nf.data_emissao).toLocaleDateString('pt-BR') : '—'}</span></div>
            <div style={S.row}><span style={S.rowKey}>Valor mercadoria</span><span style={S.rowVal}>{fmtMoney(nf.valor_mercadoria)}</span></div>
            <div style={S.row}><span style={S.rowKey}>Volumes</span><span style={S.rowVal}>{nf.volumes || '—'}</span></div>
          </div>

          {/* Occurrence */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Detalhes da Ocorrência</div>
            <div style={S.row}><span style={S.rowKey}>Tipo</span><TipoBadge tipo={occ.tipo} /></div>
            <div style={S.row}><span style={S.rowKey}>Volumes afetados</span><span style={S.rowVal}>{occ.qtd_volumes_afetados || '—'}</span></div>
            <div style={S.row}><span style={S.rowKey}>Valor estimado</span><span style={S.rowVal}>{fmtMoney(occ.valor_estimado)}</span></div>
            <div style={S.row}><span style={S.rowKey}>Registrado por</span><span style={S.rowVal}>{occ.usuario_nome}</span></div>
            <div style={S.row}><span style={S.rowKey}>Data registro</span><span style={S.rowVal}>{fmtDate(occ.created_at)}</span></div>
            <div style={{ marginTop:12 }}>
              <div style={S.sectionTitle}>Motivo</div>
              <div style={S.textBlock}>{occ.motivo}</div>
            </div>
            {occ.observacao && <div style={{ marginTop:12 }}><div style={S.sectionTitle}>Observações</div><div style={S.textBlock}>{occ.observacao}</div></div>}
            {occ.observacao_linea && <div style={{ marginTop:12 }}><div style={S.sectionTitle}>Resposta Linea</div><div style={S.respBox}>{occ.observacao_linea}</div></div>}
            {occ.status === 'cobranca_nfd' && (
              <div style={{ marginTop:12, padding:'12px 14px', background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:'var(--radius-md)' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#991B1B', marginBottom:4 }}>COBRANÇA NFD</div>
                {occ.motivo_cobranca && <div style={{ fontSize:13, color:'#B91C1C', marginBottom:4 }}>{occ.motivo_cobranca}</div>}
                {occ.valor_cobranca && <div style={{ fontSize:14, fontWeight:700, color:'#991B1B' }}>{fmtMoney(occ.valor_cobranca)}</div>}
              </div>
            )}
          </div>

          {/* NFD */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Nota Fiscal de Devolução (NFD)</div>
            {occ.nfd_numero ? (
              <div style={{ marginBottom: canEditNFD ? 16 : 0 }}>
                <div style={S.row}><span style={S.rowKey}>Número NFD</span><span style={{ ...S.rowVal, fontWeight:700 }}>{occ.nfd_numero}</span></div>
                <div style={S.row}><span style={S.rowKey}>Data NFD</span><span style={S.rowVal}>{occ.nfd_data ? new Date(occ.nfd_data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span></div>
              </div>
            ) : (
              <div style={{ color:'var(--slate-400)', fontSize:13, marginBottom: canEditNFD ? 12 : 0 }}>Nenhuma NFD informada ainda.</div>
            )}
            {canEditNFD && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--slate-600)', marginBottom:5 }}>Número da NFD</label>
                    <input style={S.input} placeholder="Ex: 12345" value={nfdNumero} onChange={e => setNfdNumero(e.target.value)}
                      onFocus={e => (e.target.style.borderColor='var(--amber-500)')} onBlur={e => (e.target.style.borderColor='var(--slate-200)')} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--slate-600)', marginBottom:5 }}>Data da devolução</label>
                    <input type="date" style={S.input} value={nfdData} onChange={e => setNfdData(e.target.value)}
                      onFocus={e => (e.target.style.borderColor='var(--amber-500)')} onBlur={e => (e.target.style.borderColor='var(--slate-200)')} />
                  </div>
                </div>
                <button style={{ ...S.btnSave, marginTop:10, background:'var(--slate-800)', color:'#fff', opacity: savingNFD ? .6 : 1 }} onClick={saveNFD} disabled={savingNFD}>
                  {savingNFD ? 'Salvando...' : 'Salvar NFD'}
                </button>
              </>
            )}
          </div>

          {/* Attachments */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Anexos ({anexos.length})</div>
            {anexos.length === 0 && <div style={{ color:'var(--slate-400)', fontSize:13 }}>Nenhum anexo.</div>}
            {anexos.map(a => (
              <div key={a.id} style={S.fileItem} onClick={() => downloadFile(a)}
                onMouseEnter={e => (e.currentTarget.style.background='var(--slate-100)')}
                onMouseLeave={e => (e.currentTarget.style.background='var(--slate-50)')}>
                <span style={{ fontSize:16 }}>{a.tipo_mime?.includes('image') ? '🖼' : a.tipo_mime?.includes('pdf') ? '📄' : '📎'}</span>
                <span>{a.nome_arquivo}</span>
                <span style={{ color:'var(--slate-400)', marginLeft:'auto', fontSize:11 }}>{fmtBytes(a.tamanho_bytes)}</span>
                <span style={{ fontSize:11, color:'var(--blue-600)' }}>↗</span>
              </div>
            ))}
            {canUpload && (
              <div style={S.uploadArea} onClick={() => fileInput.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--amber-500)' }}
                onDragLeave={e => (e.currentTarget.style.borderColor='var(--slate-300)')}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--slate-300)'; uploadFiles(e.dataTransfer.files) }}>
                <div style={{ fontSize:13, color:'var(--slate-500)' }}>{uploading ? 'Enviando...' : '+ Adicionar anexo (clique ou arraste)'}</div>
                <input ref={fileInput} type="file" multiple style={{ display:'none' }} accept=".jpg,.jpeg,.png,.pdf,.xml,.webp"
                  onChange={e => uploadFiles(e.target.files)} />
              </div>
            )}
          </div>
        </div>

        {/* Right col */}
        <div>
          {/* Status */}
          <div style={{ ...S.card, marginBottom:16 }}>
            <div style={S.sectionTitle}>Status</div>
            <StatusBadge status={occ.status} />
            {occ.responsabilidade && <div style={{ marginTop:10 }}><RespBadge resp={occ.responsabilidade} /></div>}
            {occ.analista_nome && <div style={{ marginTop:8, fontSize:12, color:'var(--slate-500)' }}>Analista: {occ.analista_nome}</div>}
            {occ.atendido_por && <div style={{ marginTop:4, fontSize:12, color:'var(--slate-500)' }}>Atendido por: {occ.atendido_por}</div>}
          </div>

          {/* Tracking */}
          <div style={{ ...S.card, marginBottom:16 }}>
            <div style={S.sectionTitle}>Tracking de Retorno</div>
            {!canEditTracking ? (
              <div style={{ color:'var(--slate-400)', fontSize:13 }}>Disponível após análise da ocorrência.</div>
            ) : (
              <>
                <div style={S.trackingGrid}>
                  {Object.entries(TRACKING_MAP).map(([key, val]) => (
                    <div key={key}
                      style={{ ...S.trackingOption, ...(tracking === key ? S.trackingOptionActive : {}) }}
                      onClick={() => setTracking(key)}>
                      <span style={{ width:10, height:10, borderRadius:'50%', background: tracking === key ? 'var(--amber-500)' : 'var(--slate-300)', flexShrink:0 }} />
                      <span style={{ fontSize:13, color: tracking === key ? 'var(--slate-900)' : 'var(--slate-600)', fontWeight: tracking === key ? 500 : 400 }}>{val.label}</span>
                    </div>
                  ))}
                </div>
                <button style={{ ...S.btnSave, opacity: savingTracking ? .6 : 1 }} onClick={saveTracking} disabled={savingTracking}>
                  {savingTracking ? 'Salvando...' : 'Atualizar tracking'}
                </button>
              </>
            )}
          </div>

          {/* Timeline */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Histórico</div>
            {historico.length === 0 && <div style={{ color:'var(--slate-400)', fontSize:13 }}>Sem registros.</div>}
            {historico.map(h => (
              <div key={h.id} style={S.timelineItem}>
                <div style={{ ...S.timelineDot, ...(h.perfil === 'admin' || h.perfil === 'analista' ? S.timelineDotAdmin : {}) }}>
                  {h.perfil === 'admin' || h.perfil === 'analista' ? 'L' : 'T'}
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
