# 📁 Migrations - Meu Gestor

## 📄 Arquivos Disponíveis

### 🚀 Para Executar

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| **quick_migration.sql** | Apenas o essencial (15 linhas) | Quero o básico funcionando AGORA |
| **add_indicator_behavior_metadata.sql** | Migração completa com exemplos, views, funções | Produção / Completo |

### 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| **MIGRATION_GUIDE.md** | Guia detalhado com explicações |
| **examples_queries.sql** | Queries úteis para testar |

## ⚡ Quick Start

### Opção 1: Rápido (Recomendado para começar)

```bash
# Copie e cole no SQL Editor do Supabase
cat quick_migration.sql
```

### Opção 2: Completo (Recomendado para produção)

```bash
# Copie e cole no SQL Editor do Supabase
cat add_indicator_behavior_metadata.sql
```

## 🎯 O que cada arquivo faz?

### quick_migration.sql
```sql
✅ Cria 2 ENUMs (direction, unit_type)
✅ Adiciona 6 colunas à tabela
✅ Cria 3 índices
✅ Insere 1 indicador de teste (Churn)
⏱️ Tempo: ~5 segundos
```

### add_indicator_behavior_metadata.sql
```sql
✅ Tudo do quick_migration.sql +
✅ Insere 3 indicadores de teste (Churn, NPS, Food Cost)
✅ Cria VIEW para análise
✅ Cria FUNÇÃO get_indicator_status()
✅ Atualiza indicadores existentes
✅ Comentários e documentação inline
⏱️ Tempo: ~15 segundos
```

## 📊 Após Executar

### 1. Verificar Instalação

```sql
-- Ver estrutura da tabela
\d indicator_templates

-- Deve mostrar os novos campos:
-- - direction (indicator_direction)
-- - unit_type (unit_type)
-- - calc_method (text)
-- - default_warning_threshold (numeric)
-- - default_critical_threshold (numeric)
-- - input_fields (jsonb)
```

### 2. Ver Indicadores de Teste

```sql
SELECT name, direction, unit_type, calc_method
FROM indicator_templates
WHERE name ILIKE '%churn%' OR name ILIKE '%nps%';
```

### 3. Testar Função (apenas se executou add_indicator_behavior_metadata.sql)

```sql
SELECT get_indicator_status(3.5, 5.0, 'LOWER_BETTER', 5.0, 8.0);
-- Deve retornar: 'success'
```

## 🔄 Rollback

Se precisar desfazer:

```sql
-- Remover colunas
ALTER TABLE indicator_templates 
  DROP COLUMN direction,
  DROP COLUMN unit_type,
  DROP COLUMN calc_method,
  DROP COLUMN default_warning_threshold,
  DROP COLUMN default_critical_threshold,
  DROP COLUMN input_fields;

-- Remover tipos
DROP TYPE indicator_direction CASCADE;
DROP TYPE unit_type CASCADE;
```

## 📖 Próximos Passos

1. ✅ Executar migração (quick ou completa)
2. ⬜ Atualizar types TypeScript: `supabase gen types typescript`
3. ⬜ Ler `MIGRATION_GUIDE.md` para entender os conceitos
4. ⬜ Usar `examples_queries.sql` para testar
5. ⬜ Implementar no frontend usando `src/types/indicator-metadata.ts`

## ❓ Dúvidas?

- **Qual arquivo executar?** → `quick_migration.sql` para começar
- **Preciso de exemplos?** → Use `add_indicator_behavior_metadata.sql`
- **Como usar no frontend?** → Leia `MIGRATION_GUIDE.md`
- **Queries úteis?** → Veja `examples_queries.sql`

---

**Recomendação:** Execute `add_indicator_behavior_metadata.sql` (completo) para ter tudo pronto! 🚀

