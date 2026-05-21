import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { StatusBadge, TipoBadge, RespBadge } from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const TIPO_LABELS = { avaria:'Avaria', falta:'Falta', inversao:'Inversão', recusa:'Recusa Total', excesso:'Excesso', outro:'Outro' }

const S = {
  grid: { display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' },
  card: {
    background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)',
    padding:'24px',
  },
  section: { marginBottom:24 },
  sectionTitle: { fontSize:13, fontWeight:600, color:'var(--slate-500)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 },
  row: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:8 },
  rowKey: { fontSize:13, color:'var(--slate-500)', flexShrink:0, minWidth:160 },
  rowVal: { fontSize:13, color:'var(--slate-800)', fontWeight:500, textAlign:'right' },
  textBlock: {
    background:'var(--slate-50)', borderRadius:'var(--radius-md)', padding:'12px 14px',
    fontSize:13, color:'var(--slate-700)', lineHeight:1.6,
  },
  respBox: {
    background:'var(--amber-50)', border:'1px solid var(--amber-100)', borderRadius:'var(--radius-md)',
    padding:'12px 14px', fontSize:13, color:'var(--amber-700)',
  },
  fileItem: {
    display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
    background:'var(--slate-50)', borderRadius:'var(--radius-md)',
    border:'1px solid var(--slate-200)', fontSize:13, marginBottom:6, cursor:'pointer',
    transition:'background .1s',
  },
  fileSize: { color:'var(--slate-400)', marginLeft:'auto', fontSize:11 },
  timelineItem: {
    display:'flex', gap:12, paddingBottom:16, position:'relative',
  },
  timelineDot: {
    width:28, height:28, borderRadius:'50%', flexShrink:0,
    background:'var(--slate-100)', display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:11, fontWeight:600, color:'var(--slate-500)',
  },
  timelineBody: { flex:1 },
  timelineAction: { fontSize:13, fontWeight:500, color:'var(--slate-800)' },
  timelineMeta: { fontSize:11, color:'var(--slate-400)', marginTop:2 },
  timelineObs: { fontSize:12, color:'var(--slate-600)', marginTop:4, lineHeight:1.5 },
  uploadArea: {
    border:'2px dashed var(--slate-300)', borderRadius:'var(--radius-md)',
    padding:'20px', textAlign:'center', cursor:'pointer', marginTop:12,
    background:'var(--slate-50)',
  },
  btnBack: {
    display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px',
    background:'transparent', border:'1.5px solid var(--slate-200)',
    borderRadius:'var(--radius-md)', fontSize:13, fontWeight:500,
    color:'var(--slate-600)', cursor:'pointer', marginBottom:20,
  },
  error: {
    background:'var(--red-50)', border:'1px solid var(--red-100)', borderRadius:'var(--radius-md)',
    padding:'10px 14px', color:'var(--red-700)', fontSize:13, marginBottom:16,
  },
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
  const [error, setError] = useState('')

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
    setLoading(false)
  }

  async function downloadFile(anexo) {
    const { data } = await supabase.storage.from('dev-anexos').createSignedUrl(anexo.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function uploadFiles(fileList) {
    if (!occ || occ.status === 'finalizada' || occ.status === 'aprovada' || occ.status === 'reprovada') return
    setUploading(true); setError('')
    for (const file of Array.from(fileList)) {
      const path = `${id}/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('dev-anexos').upload(path, file, { contentType: file.type })
      if (!upErr) {
        await supabase.from('dev_anexos').insert({
          ocorrencia_id: id,
          nome_arquivo: file.name,
          storage_path: path,
          tamanho_bytes: file.size,
          tipo_mime: file.type,
          uploaded_por: user.nome,
          perfil: 'transportador',
        })
        await supabase.from('dev_historico').insert({
          ocorrencia_id: id,
          acao: `Anexo adicionado: ${file.name}`,
          usuario: user.nome,
          perfil: 'transportador',
        })
      }
    }
    await load()
    setUploading(false)
  }

  if (loading) return <Layout title="Ocorrência"><div style={{ padding:40, color:'var(--slate-400)' }}>Carregando...</div></Layout>
  if (!occ) return <Layout title="Ocorrência"><div style={{ padding:40, color:'var(--red-600)' }}>Ocorrência não encontrada.</div></Layout>

  const nf = occ.nf_snapshot || {}
  const canUpload = !['finalizada','aprovada','reprovada'].includes(occ.status)

  return (
    <Layout title={`Ocorrência — NF ${occ.nf_numero}`}>
      <button style={S.btnBack} onClick={() => navigate('/dashboard')}>← Voltar</button>

      {error && <div style={S.error}>{error}</div>}

      <div style={S.grid}>
        <div>
          {/* NF Info */}
          <div style={{ ...S.card, marginBottom:16 }}>
            <div style={S.section}>
              <div style={S.sectionTitle}>Nota Fiscal</div>
              <div style={S.row}><span style={S.rowKey}>Número</span><span style={{ ...S.rowVal, fontSize:15, fontWeight:700 }}>{occ.nf_numero}{occ.nf_serie ? `/${occ.nf_serie}` : ''}</span></div>
              <div style={S.row}><span style={S.rowKey}>Destinatário</span><span style={S.rowVal}>{nf.destinatario_nome || '—'}</span></div>
              <div style={S.row}><span style={S.rowKey}>Emissão</span><span style={S.rowVal}>{nf.data_emissao ? new Date(nf.data_emissao).toLocaleDateString('pt-BR') : '—'}</span></div>
              <div style={S.row}><span style={S.rowKey}>Valor mercadoria</span><span style={S.rowVal}>{fmtMoney(nf.valor_mercadoria)}</span></div>
              <div style={S.row}><span style={S.rowKey}>Volumes</span><span style={S.rowVal}>{nf.volumes || '—'}</span></div>
            </div>
          </div>

          {/* Occurrence Details */}
          <div style={{ ...S.card, marginBottom:16 }}>
            <div style={S.section}>
              <div style={S.sectionTitle}>Detalhes da Ocorrência</div>
              <div style={S.row}><span style={S.rowKey}>Tipo</span><TipoBadge tipo={occ.tipo} /></div>
              <div style={S.row}><span style={S.rowKey}>Volumes afetados</span><span style={S.rowVal}>{occ.qtd_volumes_afetados || '—'}</span></div>
              <div style={S.row}><span style={S.rowKey}>Valor estimado</span><span style={S.rowVal}>{fmtMoney(occ.valor_estimado)}</span></div>
              <div style={S.row}><span style={S.rowKey}>Registrado por</span><span style={S.rowVal}>{occ.usuario_nome}</span></div>
              <div style={S.row}><span style={S.rowKey}>Data registro</span><span style={S.rowVal}>{fmtDate(occ.created_at)}</span></div>
            </div>
            <div style={S.section}>
              <div style={S.sectionTitle}>Motivo</div>
              <div style={S.textBlock}>{occ.motivo}</div>
            </div>
            {occ.observacao && (
              <div style={S.section}>
                <div style={S.sectionTitle}>Observações</div>
                <div style={S.textBlock}>{occ.observacao}</div>
              </div>
            )}
            {occ.observacao_linea && (
              <div>
                <div style={S.sectionTitle}>Resposta Linea</div>
                <div style={S.respBox}>{occ.observacao_linea}</div>
              </div>
            )}
          </div>

          {/* Attachments */}
          <div style={S.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={S.sectionTitle}>Anexos ({anexos.length})</div>
            </div>
            {anexos.length === 0 && <div style={{ color:'var(--slate-400)', fontSize:13 }}>Nenhum anexo.</div>}
            {anexos.map(a => (
              <div key={a.id} style={S.fileItem}
                onClick={() => downloadFile(a)}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--slate-100)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--slate-50)')}
              >
                <span style={{ fontSize:16 }}>{a.tipo_mime?.includes('image') ? '🖼' : a.tipo_mime?.includes('pdf') ? '📄' : '📎'}</span>
                <span>{a.nome_arquivo}</span>
                <span style={S.fileSize}>{fmtBytes(a.tamanho_bytes)}</span>
                <span style={{ fontSize:11, color:'var(--slate-400)' }}>↗</span>
              </div>
            ))}

            {canUpload && (
              <div
                style={S.uploadArea}
                onClick={() => fileInput.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--amber-500)' }}
                onDragLeave={e => (e.currentTarget.style.borderColor = 'var(--slate-300)')}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--slate-300)'; uploadFiles(e.dataTransfer.files) }}
              >
                <div style={{ fontSize:13, color:'var(--slate-500)' }}>
                  {uploading ? 'Enviando...' : '+ Adicionar anexo (arraste ou clique)'}
                </div>
                <input ref={fileInput} type="file" multiple style={{ display:'none' }}
                  accept=".jpg,.jpeg,.png,.pdf,.xml,.webp"
                  onChange={e => uploadFiles(e.target.files)} />
              </div>
            )}
          </div>
        </div>

        {/* Right column: Status + Timeline */}
        <div>
          <div style={{ ...S.card, marginBottom:16 }}>
            <div style={S.sectionTitle}>Status</div>
            <div style={{ marginBottom:12 }}><StatusBadge status={occ.status} /></div>
            {occ.responsabilidade && (
              <div style={S.row}>
                <span style={S.rowKey}>Responsabilidade</span>
                <RespBadge resp={occ.responsabilidade} />
              </div>
            )}
            {occ.atendido_por && (
              <div style={S.row}>
                <span style={S.rowKey}>Atendido por</span>
                <span style={S.rowVal}>{occ.atendido_por}</span>
              </div>
            )}
            {occ.finalizada_em && (
              <div style={S.row}>
                <span style={S.rowKey}>Finalizada em</span>
                <span style={S.rowVal}>{fmtDate(occ.finalizada_em)}</span>
              </div>
            )}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Histórico</div>
            {historico.length === 0 && <div style={{ color:'var(--slate-400)', fontSize:13 }}>Sem registros.</div>}
            {historico.map((h, i) => (
              <div key={h.id} style={{ ...S.timelineItem, borderLeft: i < historico.length-1 ? '1px solid var(--slate-200)' : 'none', paddingLeft:12, marginLeft:14 }}>
                <div style={{ ...S.timelineDot, marginLeft:-26 }}>
                  {h.perfil === 'admin' ? 'L' : 'T'}
                </div>
                <div style={S.timelineBody}>
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
