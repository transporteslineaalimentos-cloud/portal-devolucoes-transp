import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const TIPOS = [
  { value:'avaria',   label:'Avaria', desc:'Produto danificado durante o transporte' },
  { value:'falta',    label:'Falta',  desc:'Volumes ou itens faltando na entrega' },
  { value:'inversao', label:'Inversão', desc:'Produto entregue diferente do pedido' },
  { value:'recusa',   label:'Recusa Total', desc:'Cliente recusou o recebimento total' },
  { value:'excesso',  label:'Excesso', desc:'Volumes a mais do que o pedido' },
  { value:'outro',    label:'Outro',  desc:'Outro motivo de devolução' },
]

const S = {
  steps: { display:'flex', gap:0, marginBottom:28, alignItems:'center' },
  step: {
    display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:500,
    color:'var(--slate-400)',
  },
  stepActive: { color:'var(--slate-900)' },
  stepDone: { color:'var(--amber-600)' },
  stepDot: {
    width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center',
    justifyContent:'center', fontSize:12, fontWeight:700,
    background:'var(--slate-100)', color:'var(--slate-400)',
  },
  stepDotActive: { background:'var(--slate-900)', color:'#fff' },
  stepDotDone: { background:'var(--amber-500)', color:'var(--slate-900)' },
  stepLine: { flex:1, height:1, background:'var(--slate-200)', maxWidth:40 },
  card: {
    background:'#fff', border:'1px solid var(--slate-200)', borderRadius:'var(--radius-lg)',
    padding:'28px 32px', maxWidth:660,
  },
  title: { fontSize:16, fontWeight:600, color:'var(--slate-900)', marginBottom:4 },
  subtitle: { fontSize:13, color:'var(--slate-500)', marginBottom:24 },
  field: { marginBottom:18 },
  label: { display:'block', fontSize:13, fontWeight:500, color:'var(--slate-700)', marginBottom:6 },
  sublabel: { fontSize:11, color:'var(--slate-400)', marginBottom:6, display:'block' },
  input: {
    width:'100%', padding:'10px 12px', border:'1.5px solid var(--slate-200)',
    borderRadius:'var(--radius-md)', fontSize:14, outline:'none', background:'var(--slate-50)',
    transition:'border-color .15s',
  },
  btnRow: { display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' },
  btnBack: {
    padding:'9px 20px', background:'transparent', border:'1.5px solid var(--slate-200)',
    borderRadius:'var(--radius-md)', fontSize:13, fontWeight:500, color:'var(--slate-600)',
    cursor:'pointer',
  },
  btnNext: {
    padding:'9px 24px', background:'var(--amber-500)', border:'none',
    borderRadius:'var(--radius-md)', fontSize:13, fontWeight:600,
    color:'var(--slate-900)', cursor:'pointer',
  },
  nfResult: {
    background:'var(--green-50)', border:'1px solid var(--green-100)', borderRadius:'var(--radius-md)',
    padding:'14px 16px', marginTop:12,
  },
  nfResultTitle: { fontSize:13, fontWeight:600, color:'var(--green-700)', marginBottom:6 },
  nfGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px' },
  nfItem: { fontSize:12, color:'var(--slate-600)' },
  nfKey: { color:'var(--slate-400)', marginRight:4 },
  tiposGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  tipoCard: {
    padding:'12px 16px', border:'2px solid var(--slate-200)', borderRadius:'var(--radius-md)',
    cursor:'pointer', transition:'all .15s',
  },
  tipoCardActive: { borderColor:'var(--amber-500)', background:'var(--amber-50)' },
  tipoLabel: { fontSize:13, fontWeight:600, color:'var(--slate-800)', marginBottom:2 },
  tipoDesc: { fontSize:11, color:'var(--slate-500)' },
  textarea: {
    width:'100%', padding:'10px 12px', border:'1.5px solid var(--slate-200)',
    borderRadius:'var(--radius-md)', fontSize:14, outline:'none', background:'var(--slate-50)',
    resize:'vertical', minHeight:90, transition:'border-color .15s',
  },
  uploadArea: {
    border:'2px dashed var(--slate-300)', borderRadius:'var(--radius-lg)',
    padding:'32px', textAlign:'center', cursor:'pointer', transition:'all .15s',
    background:'var(--slate-50)',
  },
  fileList: { marginTop:12, display:'flex', flexDirection:'column', gap:6 },
  fileItem: {
    display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
    background:'var(--slate-50)', borderRadius:'var(--radius-md)',
    border:'1px solid var(--slate-200)', fontSize:12,
  },
  fileSize: { color:'var(--slate-400)', marginLeft:'auto', fontSize:11 },
  fileRemove: {
    background:'none', border:'none', color:'var(--red-600)', cursor:'pointer',
    fontSize:16, lineHeight:1, padding:'0 2px',
  },
  error: {
    background:'var(--red-50)', border:'1px solid var(--red-100)', borderRadius:'var(--radius-md)',
    padding:'10px 14px', color:'var(--red-700)', fontSize:13, marginBottom:16,
  },
  confirmGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 24px', fontSize:13 },
  confirmKey: { color:'var(--slate-500)', fontWeight:500 },
  confirmVal: { color:'var(--slate-800)', fontWeight:500 },
}

function fmtBytes(b) {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' KB'
  return (b / (1024 * 1024)).toFixed(1) + ' MB'
}

function fmtMoney(v) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v)
}

const TIPO_LABELS = { avaria:'Avaria', falta:'Falta', inversao:'Inversão', recusa:'Recusa Total', excesso:'Excesso', outro:'Outro' }

export default function NovaOcorrencia() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInput = useRef()

  const [step, setStep] = useState(1) // 1=NF 2=Tipo+Motivo 3=Anexos 4=Confirmar
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Step 1
  const [nfBusca, setNfBusca] = useState('')
  const [searching, setSearching] = useState(false)
  const [nfData, setNfData] = useState(null)

  // Step 2
  const [tipo, setTipo] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observacao, setObservacao] = useState('')
  const [qtdVolumes, setQtdVolumes] = useState('')
  const [valorEstimado, setValorEstimado] = useState('')

  // Step 3
  const [files, setFiles] = useState([])

  async function searchNF() {
    if (!nfBusca.trim()) { setError('Informe o número da NF'); return }
    setSearching(true); setError(''); setNfData(null)

    const { data, error: err } = await supabase
      .from('active_webhooks')
      .select('numero, serie, chave_nfe, data_emissao, destinatario_nome, destinatario_cnpj, transportador_nome, transportador_cnpj, valor_mercadoria, volumes, natureza_operacao')
      .eq('tipo', 'nfe')
      .eq('numero', nfBusca.trim())
      .in('transportador_cnpj', user.cnpjs.length ? user.cnpjs : ['__none__'])
      .limit(1)
      .maybeSingle()

    setSearching(false)
    if (err || !data) {
      setError('NF não encontrada ou não pertence à sua transportadora. Verifique o número e tente novamente.')
      return
    }
    setNfData(data)
  }

  function addFiles(fileList) {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const newFiles = Array.from(fileList).filter(f => {
      if (f.size > maxSize) { setError(`Arquivo "${f.name}" excede 10MB`); return false }
      return true
    })
    setFiles(prev => [...prev, ...newFiles])
  }

  function removeFile(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  async function submit() {
    if (!nfData || !tipo || !motivo.trim()) {
      setError('Preencha todos os campos obrigatórios')
      return
    }
    setSubmitting(true); setError('')

    try {
      // Insert occurrence
      const { data: occ, error: occErr } = await supabase
        .from('dev_ocorrencias')
        .insert({
          nf_numero: nfData.numero,
          nf_serie: nfData.serie,
          nf_chave: nfData.chave_nfe,
          nf_snapshot: nfData,
          transportador_cnpj: nfData.transportador_cnpj,
          transportador_nome: nfData.transportador_nome,
          usuario_id: user.id,
          usuario_nome: user.nome,
          tipo,
          motivo: motivo.trim(),
          observacao: observacao.trim() || null,
          qtd_volumes_afetados: qtdVolumes ? parseInt(qtdVolumes) : null,
          valor_estimado: valorEstimado ? parseFloat(valorEstimado.replace(',','.')) : null,
          status: 'registrada',
        })
        .select('id')
        .single()

      if (occErr) throw occErr

      const occId = occ.id

      // Upload attachments
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${occId}/${Date.now()}_${file.name}`
        const { error: upErr } = await supabase.storage
          .from('dev-anexos')
          .upload(path, file, { contentType: file.type })

        if (!upErr) {
          await supabase.from('dev_anexos').insert({
            ocorrencia_id: occId,
            nome_arquivo: file.name,
            storage_path: path,
            tamanho_bytes: file.size,
            tipo_mime: file.type,
            uploaded_por: user.nome,
            perfil: 'transportador',
          })
        }
      }

      // Audit history
      await supabase.from('dev_historico').insert({
        ocorrencia_id: occId,
        acao: 'Ocorrência registrada',
        status_novo: 'registrada',
        usuario: user.nome,
        perfil: 'transportador',
      })

      navigate(`/ocorrencia/${occId}`)
    } catch (err) {
      setError('Erro ao salvar: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const STEPS = ['1. NF', '2. Ocorrência', '3. Anexos', '4. Confirmar']

  return (
    <Layout title="Nova Ocorrência">
      <div style={S.steps}>
        {STEPS.map((s, i) => {
          const n = i + 1
          const done = step > n
          const active = step === n
          return (
            <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ ...S.step, ...(active ? S.stepActive : done ? S.stepDone : {}) }}>
                <div style={{ ...S.stepDot, ...(active ? S.stepDotActive : done ? S.stepDotDone : {}) }}>
                  {done ? '✓' : n}
                </div>
                {s}
              </div>
              {i < STEPS.length - 1 && <div style={S.stepLine} />}
            </div>
          )
        })}
      </div>

      <div style={S.card}>
        {error && <div style={S.error}>{error}</div>}

        {/* STEP 1 - NF Search */}
        {step === 1 && (
          <>
            <div style={S.title}>Identificar a Nota Fiscal</div>
            <div style={S.subtitle}>Informe o número da NF para a qual deseja registrar a devolução.</div>
            <div style={S.field}>
              <label style={S.label}>Número da NF *</label>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  style={{ ...S.input, flex:1 }}
                  placeholder="Ex: 123456"
                  value={nfBusca}
                  onChange={e => { setNfBusca(e.target.value); setNfData(null) }}
                  onKeyDown={e => e.key === 'Enter' && searchNF()}
                  onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
                />
                <button
                  type="button"
                  style={{ ...S.btnNext, padding:'9px 20px' }}
                  onClick={searchNF}
                  disabled={searching}
                >
                  {searching ? '...' : 'Buscar'}
                </button>
              </div>
            </div>

            {nfData && (
              <div style={S.nfResult}>
                <div style={S.nfResultTitle}>✓ NF encontrada</div>
                <div style={S.nfGrid}>
                  <div style={S.nfItem}><span style={S.nfKey}>NF:</span>{nfData.numero}{nfData.serie ? `/${nfData.serie}` : ''}</div>
                  <div style={S.nfItem}><span style={S.nfKey}>Emissão:</span>{nfData.data_emissao ? new Date(nfData.data_emissao).toLocaleDateString('pt-BR') : '—'}</div>
                  <div style={S.nfItem}><span style={S.nfKey}>Destinatário:</span>{nfData.destinatario_nome}</div>
                  <div style={S.nfItem}><span style={S.nfKey}>Valor:</span>{fmtMoney(nfData.valor_mercadoria)}</div>
                  <div style={S.nfItem}><span style={S.nfKey}>Volumes:</span>{nfData.volumes || '—'}</div>
                  <div style={S.nfItem}><span style={S.nfKey}>Natureza:</span>{nfData.natureza_operacao || '—'}</div>
                </div>
              </div>
            )}

            <div style={S.btnRow}>
              <button style={S.btnBack} onClick={() => navigate('/dashboard')} type="button">Cancelar</button>
              <button
                style={{ ...S.btnNext, opacity: nfData ? 1 : 0.4 }}
                disabled={!nfData}
                onClick={() => { setError(''); setStep(2) }}
                type="button"
              >
                Próximo →
              </button>
            </div>
          </>
        )}

        {/* STEP 2 - Tipo + Motivo */}
        {step === 2 && (
          <>
            <div style={S.title}>Tipo e Motivo da Ocorrência</div>
            <div style={S.subtitle}>Selecione o tipo de devolução e descreva o motivo detalhadamente.</div>

            <div style={{ ...S.field }}>
              <label style={S.label}>Tipo de ocorrência *</label>
              <div style={S.tiposGrid}>
                {TIPOS.map(t => (
                  <div
                    key={t.value}
                    style={{ ...S.tipoCard, ...(tipo === t.value ? S.tipoCardActive : {}) }}
                    onClick={() => setTipo(t.value)}
                  >
                    <div style={S.tipoLabel}>{t.label}</div>
                    <div style={S.tipoDesc}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Motivo detalhado *</label>
              <textarea
                style={S.textarea}
                placeholder="Descreva o que aconteceu com a mercadoria..."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
                onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
              />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={S.field}>
                <label style={S.label}>Volumes afetados</label>
                <input
                  style={S.input} type="number" min="1"
                  placeholder="Qtd de volumes"
                  value={qtdVolumes}
                  onChange={e => setQtdVolumes(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Valor estimado (R$)</label>
                <input
                  style={S.input} type="text"
                  placeholder="0,00"
                  value={valorEstimado}
                  onChange={e => setValorEstimado(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
                />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Observações adicionais</label>
              <textarea
                style={{ ...S.textarea, minHeight:70 }}
                placeholder="Informações complementares..."
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                onFocus={e => (e.target.style.borderColor = 'var(--amber-500)')}
                onBlur={e => (e.target.style.borderColor = 'var(--slate-200)')}
              />
            </div>

            <div style={S.btnRow}>
              <button style={S.btnBack} onClick={() => setStep(1)} type="button">← Voltar</button>
              <button
                style={{ ...S.btnNext, opacity: tipo && motivo.trim() ? 1 : 0.4 }}
                disabled={!tipo || !motivo.trim()}
                onClick={() => { setError(''); setStep(3) }}
                type="button"
              >
                Próximo →
              </button>
            </div>
          </>
        )}

        {/* STEP 3 - Attachments */}
        {step === 3 && (
          <>
            <div style={S.title}>Anexos</div>
            <div style={S.subtitle}>
              Adicione fotos da mercadoria, DANFE, laudo ou outros documentos. Máximo 10MB por arquivo.
            </div>

            <div
              style={S.uploadArea}
              onClick={() => fileInput.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--amber-500)' }}
              onDragLeave={e => (e.currentTarget.style.borderColor = 'var(--slate-300)')}
              onDrop={e => {
                e.preventDefault()
                e.currentTarget.style.borderColor = 'var(--slate-300)'
                addFiles(e.dataTransfer.files)
              }}
            >
              <div style={{ fontSize:28, marginBottom:8 }}>📎</div>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--slate-700)', marginBottom:4 }}>
                Clique ou arraste arquivos aqui
              </div>
              <div style={{ fontSize:12, color:'var(--slate-400)' }}>
                JPG, PNG, PDF, XML — até 10MB por arquivo
              </div>
              <input
                ref={fileInput}
                type="file"
                multiple
                style={{ display:'none' }}
                accept=".jpg,.jpeg,.png,.pdf,.xml,.webp"
                onChange={e => addFiles(e.target.files)}
              />
            </div>

            {files.length > 0 && (
              <div style={S.fileList}>
                {files.map((f, i) => (
                  <div key={i} style={S.fileItem}>
                    <span style={{ fontSize:16 }}>{f.type.includes('image') ? '🖼' : f.type.includes('pdf') ? '📄' : '📎'}</span>
                    <span style={{ color:'var(--slate-700)' }}>{f.name}</span>
                    <span style={S.fileSize}>{fmtBytes(f.size)}</span>
                    <button style={S.fileRemove} onClick={() => removeFile(i)} type="button">×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={S.btnRow}>
              <button style={S.btnBack} onClick={() => setStep(2)} type="button">← Voltar</button>
              <button style={S.btnNext} onClick={() => { setError(''); setStep(4) }} type="button">
                Próximo →
              </button>
            </div>
          </>
        )}

        {/* STEP 4 - Confirm */}
        {step === 4 && (
          <>
            <div style={S.title}>Confirmar e Enviar</div>
            <div style={S.subtitle}>Revise as informações antes de registrar a ocorrência.</div>

            <div style={{ background:'var(--slate-50)', borderRadius:'var(--radius-md)', padding:'16px 20px', marginBottom:20 }}>
              <div style={S.confirmGrid}>
                <span style={S.confirmKey}>NF:</span>
                <span style={S.confirmVal}>{nfData?.numero}{nfData?.serie ? `/${nfData?.serie}` : ''}</span>
                <span style={S.confirmKey}>Destinatário:</span>
                <span style={S.confirmVal}>{nfData?.destinatario_nome}</span>
                <span style={S.confirmKey}>Tipo:</span>
                <span style={S.confirmVal}>{TIPO_LABELS[tipo] || tipo}</span>
                <span style={S.confirmKey}>Volumes afetados:</span>
                <span style={S.confirmVal}>{qtdVolumes || '—'}</span>
                <span style={S.confirmKey}>Valor estimado:</span>
                <span style={S.confirmVal}>{valorEstimado ? `R$ ${valorEstimado}` : '—'}</span>
                <span style={S.confirmKey}>Anexos:</span>
                <span style={S.confirmVal}>{files.length} arquivo(s)</span>
              </div>
              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--slate-200)' }}>
                <span style={S.confirmKey}>Motivo: </span>
                <span style={{ ...S.confirmVal, display:'inline', fontWeight:400 }}>{motivo}</span>
              </div>
            </div>

            <div style={S.btnRow}>
              <button style={S.btnBack} onClick={() => setStep(3)} type="button">← Voltar</button>
              <button
                style={{ ...S.btnNext, opacity: submitting ? 0.6 : 1 }}
                onClick={submit}
                disabled={submitting}
                type="button"
              >
                {submitting ? 'Enviando...' : '✓ Registrar Ocorrência'}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
