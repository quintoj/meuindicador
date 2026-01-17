# 🧠 REGRA CRÍTICA: auth.users vs user_profiles

## ⚠️ NUNCA ESQUEÇA

A tabela `user_profiles` **NÃO possui coluna `email`**!

## 📐 Arquitetura do Supabase Auth

```
┌─────────────────┐         ┌─────────────────┐
│   auth.users    │         │  user_profiles  │
│   (Supabase)    │         │  (Nossa tabela) │
├─────────────────┤         ├─────────────────┤
│ id (UUID) PK    │◄────────│ id (UUID) FK    │
│ email           │         │ business_name   │
│ encrypted_pw    │         │ business_segment│
│ confirmed_at    │         │ full_name       │
│ ...             │         │ role            │
└─────────────────┘         │ created_at      │
                            │ updated_at      │
                            └─────────────────┘
```

## ✅ PADRÃO CORRETO

### Para buscar perfil por email:

```sql
-- ✅ CORRETO: Sub-select com auth.users
SELECT * FROM user_profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'usuario@exemplo.com');

-- ✅ CORRETO: JOIN com auth.users
SELECT up.* 
FROM user_profiles up
INNER JOIN auth.users au ON up.id = au.id
WHERE au.email = 'usuario@exemplo.com';

-- ✅ CORRETO: Filtrar múltiplos emails
SELECT * FROM user_profiles
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('admin@exemplo.com', 'gestor@exemplo.com')
);
```

### Para atualizar perfil por email:

```sql
-- ✅ CORRETO: Update com sub-select
UPDATE user_profiles 
SET role = 'ADMIN' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@exemplo.com');

-- ✅ CORRETO: Update múltiplos
UPDATE user_profiles 
SET role = 'ADMIN' 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('admin1@exemplo.com', 'admin2@exemplo.com')
);
```

## ❌ PADRÃO INCORRETO (NÃO FAÇA!)

```sql
-- ❌ ERRO: Coluna 'email' não existe em user_profiles!
SELECT * FROM user_profiles WHERE email = 'usuario@exemplo.com';

-- ❌ ERRO: Tentativa de update direto por email
UPDATE user_profiles SET role = 'ADMIN' WHERE email = 'admin@exemplo.com';

-- ❌ ERRO: Insert com campo email
INSERT INTO user_profiles (id, email, full_name) 
VALUES ('...', 'user@exemplo.com', 'Nome');
```

## 🔍 Como debugar se não souber o email

Se você tem o `id` mas quer confirmar o email:

```sql
-- Buscar email pelo id do perfil
SELECT au.email, up.full_name, up.role
FROM user_profiles up
INNER JOIN auth.users au ON up.id = au.id
WHERE up.id = '123e4567-e89b-12d3-a456-426614174000';

-- Listar todos os perfis com emails (útil para debug)
SELECT 
  au.email,
  up.full_name,
  up.business_name,
  up.role,
  up.created_at
FROM user_profiles up
INNER JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at DESC;
```

## 🎯 Casos de Uso Comuns

### 1. Verificar se email existe e retornar perfil

```sql
SELECT up.*, au.email 
FROM user_profiles up
INNER JOIN auth.users au ON up.id = au.id
WHERE au.email = 'usuario@exemplo.com';
```

### 2. Listar todos os admins com emails

```sql
SELECT 
  au.email,
  up.full_name,
  up.role,
  up.created_at
FROM user_profiles up
INNER JOIN auth.users au ON up.id = au.id
WHERE up.role = 'ADMIN'
ORDER BY up.created_at;
```

### 3. Contar usuários por domínio de email

```sql
SELECT 
  SUBSTRING(au.email FROM '@(.*)$') as domain,
  COUNT(*) as total_users
FROM user_profiles up
INNER JOIN auth.users au ON up.id = au.id
GROUP BY domain
ORDER BY total_users DESC;
```

## 💡 Dica Pro

No código TypeScript/JavaScript, ao trabalhar com Supabase:

```typescript
// ❌ ERRADO - Tentando buscar por email em user_profiles
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('email', 'user@exemplo.com'); // ERRO: coluna não existe!

// ✅ CORRETO - Buscar por id (que você obtém de auth.getUser())
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// ✅ CORRETO - Join com auth.users não é possível via Supabase JS,
// então sempre use o id retornado de auth.getUser()
```

## 📚 Por que essa arquitetura?

1. **Segurança**: `auth.users` é gerenciada pelo Supabase Auth, isolada de acesso direto
2. **Normalização**: Email é dado de autenticação, não de perfil
3. **Flexibilidade**: Permite múltiplos providers (email, Google, GitHub) com mesmo perfil
4. **RLS**: Row Level Security funciona com `auth.uid()` que retorna o `id`

## 🚨 Checklist antes de fazer query

- [ ] Preciso usar email na query?
  - ✅ Sim → Use `auth.users` com sub-select ou join
  - ✅ Não → Use direto `user_profiles` filtrado por `id`
- [ ] Estou no frontend?
  - ✅ Use `auth.getUser()` para pegar o `id`, depois busque em `user_profiles`
- [ ] Estou fazendo migration/SQL?
  - ✅ Use sub-select ou join com `auth.users` quando precisar de email
  
---

**🧠 MEMORIZE ESTA REGRA E NUNCA MAIS ERR E!**

`user_profiles.email` **não existe** → sempre use `auth.users` quando precisar de email
