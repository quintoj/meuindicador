# Guia de Migração: Metadados de Comportamento

## 📋 Resumo da Migração

Esta migração adiciona suporte para **indicadores dinâmicos** com comportamentos específicos (Churn, NPS, Food Cost, etc).

## 🆕 Novos Campos

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `direction` | ENUM | Define se alto/baixo é bom | `LOWER_BETTER` (Churn) |
| `unit_type` | ENUM | Tipo de unidade | `percentage`, `currency` |
| `calc_method` | TEXT | Método de cálculo | `churn_rate`, `nps_score` |
| `default_warning_threshold` | NUMERIC | Limite amarelo | `5.0` (5%) |
| `default_critical_threshold` | NUMERIC | Limite vermelho | `8.0` (8%) |
| `input_fields` | JSONB | Schema de inputs | `{"fixed": [], "daily": []}` |

## 🎯 Direction (Comportamento)

```sql
-- Verde quando ALTO
'HIGHER_BETTER'  → Vendas, Faturamento, NPS, Clientes

-- Verde quando BAIXO  
'LOWER_BETTER'   → Churn, Custos, Inadimplência

-- Verde no MEIO (range ideal)
'NEUTRAL_RANGE'  → Food Cost, Estoque, Temperatura
```

## 🔢 Unit Types

```sql
'currency'    → R$ 1.234,56
'percentage'  → 12,5%
'integer'     → 150
'decimal'     → 1,5
```

## 📊 Calc Methods (Exemplos)

```sql
'simple_formula'        -- Fórmula direta
'churn_rate'           -- Cancelamentos / Base
'nps_score'            -- Promotores - Detratores
'percentage_of_total'  -- Parte / Todo × 100
'flow_balance'         -- Entradas - Saídas
'sum_vs_goal'          -- Soma vs Meta
```

## 📥 Input Fields (JSONB)

Define quais campos o usuário preenche:

```json
{
  "fixed": ["meta_mensal", "clientes_inicio"],
  "daily": ["vendas", "cancelamentos"],
  "calculation": "churn_rate",
  "ideal_range": {"min": 28, "max": 35}
}
```

## 🚀 Como Executar

### 1. Via Supabase Dashboard
```bash
1. Abra Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole o conteúdo de add_indicator_behavior_metadata.sql
4. Execute
```

### 2. Via CLI
```bash
supabase db push
```

### 3. Via Migration Local
```bash
psql -h localhost -U postgres -d meugestor < add_indicator_behavior_metadata.sql
```

## ✅ Verificação

Após executar, verifique:

```sql
-- Ver novos campos
\d indicator_templates

-- Ver indicadores de teste inseridos
SELECT * FROM v_indicator_templates_analysis;

-- Testar função de status
SELECT get_indicator_status(
  3.5,              -- valor atual
  5.0,              -- meta
  'LOWER_BETTER',   -- direção
  5.0,              -- warning
  8.0               -- critical
);
-- Deve retornar: 'success'
```

## 🎨 Frontend: Como Usar

### 1. Renderizar Cor baseado em Direction

```typescript
const getStatusColor = (kpi: KPI) => {
  const { current_value, target, direction, warning, critical } = kpi;
  
  if (direction === 'HIGHER_BETTER') {
    if (current_value >= target) return 'success';
    if (current_value >= warning) return 'warning';
    return 'critical';
  }
  
  if (direction === 'LOWER_BETTER') {
    if (current_value <= critical) return 'success';
    if (current_value <= warning) return 'warning';
    return 'critical';
  }
  
  // NEUTRAL_RANGE logic...
};
```

### 2. Gerar Inputs Dinâmicos

```typescript
const generateInputs = (template: Template) => {
  const { input_fields } = template;
  
  return (
    <>
      {/* Campos Fixos (preenchidos 1x) */}
      {input_fields.fixed.map(field => (
        <Input label={field} type="number" />
      ))}
      
      {/* Campos Diários (preenchidos N vezes) */}
      {input_fields.daily.map(field => (
        <Input label={field} type="number" />
      ))}
    </>
  );
};
```

### 3. Formatar Valor baseado em unit_type

```typescript
const formatValue = (value: number, unit: string) => {
  switch(unit) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'integer':
      return Math.round(value).toLocaleString('pt-BR');
    
    case 'decimal':
      return value.toFixed(2);
  }
};
```

## 📊 Exemplos de Uso

### Churn Rate
```javascript
Template:
{
  direction: 'LOWER_BETTER',
  unit_type: 'percentage',
  calc_method: 'churn_rate',
  warning: 5.0,
  critical: 8.0
}

Lógica:
- 3% → 🟢 Verde (Ótimo)
- 6% → 🟡 Amarelo (Atenção)
- 9% → 🔴 Vermelho (Crítico)
```

### NPS
```javascript
Template:
{
  direction: 'HIGHER_BETTER',
  unit_type: 'integer',
  calc_method: 'nps_score',
  warning: 30,
  critical: 10
}

Lógica:
- 50 → 🟢 Excelente
- 25 → 🟡 Razoável
- 5  → 🔴 Péssimo
```

## 🔄 Rollback (se necessário)

```sql
-- Remover colunas
ALTER TABLE indicator_templates 
  DROP COLUMN direction,
  DROP COLUMN unit_type,
  DROP COLUMN calc_method,
  DROP COLUMN default_warning_threshold,
  DROP COLUMN default_critical_threshold,
  DROP COLUMN input_fields;

-- Remover ENUMs
DROP TYPE IF EXISTS indicator_direction CASCADE;
DROP TYPE IF EXISTS unit_type CASCADE;

-- Remover view
DROP VIEW IF EXISTS v_indicator_templates_analysis;

-- Remover função
DROP FUNCTION IF EXISTS get_indicator_status;
```

## 📚 Próximos Passos

1. ✅ Executar migração
2. ⬜ Atualizar types TypeScript (`supabase gen types`)
3. ⬜ Refatorar KPICard para usar `direction`
4. ⬜ Implementar `calc_method` no EditKPIModal
5. ⬜ Criar componentes para inputs dinâmicos
6. ⬜ Popular loja com mais templates usando nova estrutura

---

**Dúvidas?** Consulte `add_indicator_behavior_metadata.sql` para SQL completo.

