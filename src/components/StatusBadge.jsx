const STATUS_MAP = {
  registrada:     { label:'Registrada',     bg:'var(--amber-100)',  color:'var(--amber-600)' },
  em_analise:     { label:'Em análise',     bg:'var(--blue-100)',   color:'var(--blue-700)' },
  aprovada:       { label:'Aprovada',       bg:'var(--green-100)',  color:'var(--green-700)' },
  reprovada:      { label:'Reprovada',      bg:'var(--red-100)',    color:'var(--red-700)' },
  aguardando_doc: { label:'Aguard. Doc.',   bg:'var(--purple-100)', color:'var(--purple-700)' },
  finalizada:     { label:'Finalizada',     bg:'var(--slate-200)',  color:'var(--slate-600)' },
}

const TIPO_MAP = {
  avaria:    'Avaria',
  falta:     'Falta',
  inversao:  'Inversão',
  recusa:    'Recusa Total',
  excesso:   'Excesso',
  outro:     'Outro',
}

const RESP_MAP = {
  transportador: { label:'Transportador', color:'var(--red-700)',    bg:'var(--red-100)' },
  linea:         { label:'Linea',         color:'var(--amber-600)',  bg:'var(--amber-100)' },
  investigacao:  { label:'Investigação',  color:'var(--blue-700)',   bg:'var(--blue-100)' },
}

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, bg:'var(--slate-100)', color:'var(--slate-600)' }
  return (
    <span style={{
      display:'inline-block', padding:'2px 10px', borderRadius:99,
      fontSize:12, fontWeight:500, background: s.bg, color: s.color,
      whiteSpace:'nowrap',
    }}>
      {s.label}
    </span>
  )
}

export function TipoBadge({ tipo }) {
  return (
    <span style={{
      display:'inline-block', padding:'2px 10px', borderRadius:99,
      fontSize:12, fontWeight:500, background:'var(--slate-100)', color:'var(--slate-600)',
      whiteSpace:'nowrap',
    }}>
      {TIPO_MAP[tipo] || tipo}
    </span>
  )
}

export function RespBadge({ resp }) {
  if (!resp) return <span style={{ color:'var(--slate-400)', fontSize:12 }}>—</span>
  const r = RESP_MAP[resp] || { label: resp, bg:'var(--slate-100)', color:'var(--slate-600)' }
  return (
    <span style={{
      display:'inline-block', padding:'2px 10px', borderRadius:99,
      fontSize:12, fontWeight:500, background: r.bg, color: r.color,
    }}>
      {r.label}
    </span>
  )
}

export { TIPO_MAP, STATUS_MAP, RESP_MAP }
