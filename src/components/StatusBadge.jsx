const STATUS_MAP = {
  registrada:     { label:'Registrada',     bg:'var(--amber-100)',  color:'var(--amber-600)' },
  em_analise:     { label:'Em análise',     bg:'var(--blue-100)',   color:'var(--blue-700)' },
  aprovada:       { label:'Aprovada',       bg:'var(--green-100)',  color:'var(--green-700)' },
  reprovada:      { label:'Reprovada',      bg:'var(--red-100)',    color:'var(--red-700)' },
  aguardando_doc: { label:'Aguard. Doc.',   bg:'var(--purple-100)', color:'var(--purple-700)' },
  cobranca_nfd:   { label:'Cobrança NFD',   bg:'#FEE2E2',          color:'#991B1B' },
  finalizada:     { label:'Finalizada',     bg:'var(--slate-200)',  color:'var(--slate-600)' },
}

const TIPO_MAP = {
  avaria:   'Avaria',
  falta:    'Falta',
  inversao: 'Inversão',
  recusa:   'Recusa Total',
  excesso:  'Excesso',
  outro:    'Outro',
}

const RESP_MAP = {
  transportador: { label:'Transportador', color:'var(--red-700)',   bg:'var(--red-100)' },
  linea:         { label:'Linea',         color:'var(--amber-600)', bg:'var(--amber-100)' },
  investigacao:  { label:'Investigação',  color:'var(--blue-700)',  bg:'var(--blue-100)' },
}

const TRACKING_MAP = {
  pendente:          { label:'Aguardando início',   color:'var(--slate-500)',  bg:'var(--slate-100)' },
  em_coleta:         { label:'Em coleta no cliente',color:'var(--amber-600)',  bg:'var(--amber-50)' },
  em_rota_retorno:   { label:'Em rota de retorno',  color:'var(--blue-700)',   bg:'var(--blue-50)' },
  chegou_cd:         { label:'Chegou ao CD',         color:'var(--purple-700)', bg:'var(--purple-50)' },
  finalizado:        { label:'Retorno finalizado',   color:'var(--green-700)',  bg:'var(--green-50)' },
}

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, bg:'var(--slate-100)', color:'var(--slate-600)' }
  return (
    <span style={{
      display:'inline-block', padding:'2px 10px', borderRadius:99,
      fontSize:12, fontWeight:500, background:s.bg, color:s.color, whiteSpace:'nowrap',
    }}>{s.label}</span>
  )
}

export function TipoBadge({ tipo }) {
  return (
    <span style={{
      display:'inline-block', padding:'2px 10px', borderRadius:99,
      fontSize:12, fontWeight:500, background:'var(--slate-100)', color:'var(--slate-600)', whiteSpace:'nowrap',
    }}>{TIPO_MAP[tipo] || tipo}</span>
  )
}

export function RespBadge({ resp }) {
  if (!resp) return <span style={{ color:'var(--slate-400)', fontSize:12 }}>—</span>
  const r = RESP_MAP[resp] || { label:resp, bg:'var(--slate-100)', color:'var(--slate-600)' }
  return (
    <span style={{
      display:'inline-block', padding:'2px 10px', borderRadius:99,
      fontSize:12, fontWeight:500, background:r.bg, color:r.color,
    }}>{r.label}</span>
  )
}

export function TrackingBadge({ status }) {
  const t = TRACKING_MAP[status] || TRACKING_MAP.pendente
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99,
      fontSize:12, fontWeight:500, background:t.bg, color:t.color, whiteSpace:'nowrap',
    }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block', flexShrink:0 }} />
      {t.label}
    </span>
  )
}

export { TIPO_MAP, STATUS_MAP, RESP_MAP, TRACKING_MAP }
