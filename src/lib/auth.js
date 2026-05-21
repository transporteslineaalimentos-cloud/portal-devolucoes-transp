import { supabase } from './supabase'

/** SHA-256 hash via SubtleCrypto — no extra deps */
export async function hashPassword(password) {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

/** Login for transporters (transp_usuarios) */
export async function loginTransportador(email, password) {
  const hash = await hashPassword(password)

  const { data: user, error } = await supabase
    .from('transp_usuarios')
    .select('id, nome, email, ativo, precisa_trocar_senha, senha_hash')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !user) throw new Error('Usuário não encontrado')
  if (!user.ativo) throw new Error('Usuário inativo. Entre em contato com a Linea.')
  if (!user.senha_hash) throw new Error('Senha não configurada. Solicite ao administrador.')
  if (user.senha_hash !== hash) throw new Error('Senha incorreta')

  // Load carrier CNPJs
  const { data: cnpjLinks } = await supabase
    .from('transp_usuario_cnpjs')
    .select('transportador_cnpj, transportador_nome')
    .eq('usuario_id', user.id)

  // Update last access
  await supabase.from('transp_usuarios').update({ ultimo_acesso: new Date().toISOString() }).eq('id', user.id)

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo: 'transportador',
    precisa_trocar_senha: user.precisa_trocar_senha,
    cnpjs: (cnpjLinks || []).map(c => c.transportador_cnpj),
    transportador_nome: cnpjLinks?.[0]?.transportador_nome || '',
  }
}

/** Login for Linea admins (portal_admin_users) */
export async function loginAdmin(email, password) {
  const hash = await hashPassword(password)

  const { data: admin, error } = await supabase
    .from('portal_admin_users')
    .select('id, nome, email, ativo, senha_hash')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !admin) throw new Error('Administrador não encontrado')
  if (!admin.ativo) throw new Error('Conta inativa')
  if (admin.senha_hash !== hash) throw new Error('Senha incorreta')

  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    tipo: 'admin',
    cnpjs: [],
    transportador_nome: 'Linea Alimentos',
  }
}

/** Change password */
export async function changePassword(userId, newPassword, table = 'transp_usuarios') {
  const hash = await hashPassword(newPassword)
  const { error } = await supabase
    .from(table)
    .update({ senha_hash: hash, precisa_trocar_senha: false })
    .eq('id', userId)
  if (error) throw new Error('Erro ao salvar nova senha')
}
