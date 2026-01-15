# 🏗️ ARQUITETURA: Fonte da Verdade (Source of Truth) - v1.26

## 📋 **VISÃO GERAL**

Este documento define a arquitetura de dados do sistema de indicadores, estabelecendo a **"Fonte da Verdade"** para cada tipo de informação.

### **Princípio Fundamental:**

> **Template é Master, User Indicator é Instância**

- `indicator_templates` = **Definição** (O QUE medir e COMO calcular)
- `user_indicators` = **Instância** (Dados do usuário e resultados)

---

## 🎯 **PROBLEMA QUE RESOLVE**

### **Cenário Problemático (Sem Fonte da Verdade):**

```
1. Admin cria template "Churn" com fórmula: (cancelamentos / ativos) * 100
2. Usuário A adiciona "Churn" ao dashboard
3. Sistema DUPLICA fórmula em user_indicators ❌
4. Admin corrige fórmula para: (cancelamentos / ativos_inicio) * 100
5. Template atualizado ✅
6. Dashboard do Usuário A continua com fórmula antiga ❌
7. Usuário precisa remover e adicionar de novo ❌
```

### **Solução (Com Fonte da Verdade):**

```
1. Admin cria template "Churn" com fórmula
2. Usuário A adiciona "Churn" ao dashboard
3. Sistema salva REFERÊNCIA ao template (foreign key) ✅
4. Dashboard busca dados via JOIN ✅
5. Admin corrige fórmula
6. Template atualizado ✅
7. Dashboard do Usuário A recarrega → Nova fórmula ✅ (automático!)
```

---

## 📊 **MODELO DE DADOS**

### **Tabela: `indicator_templates` (FONTE DA VERDADE)**

```sql
CREATE TABLE indicator_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,                    -- ✅ Master
  description TEXT,                      -- ✅ Master
  formula TEXT,                          -- ✅ Master (Como calcular)
  direction indicator_direction,         -- ✅ Master (Melhor alto/baixo)
  unit_type TEXT,                        -- ✅ Master (R$, %, #)
  calc_method TEXT,                      -- ✅ Master (Método de cálculo)
  input_fields JSONB,                    -- ✅ Master (Campos necessários)
  default_warning_threshold NUMERIC,     -- ✅ Master (Meta amarelo)
  default_critical_threshold NUMERIC,    -- ✅ Master (Meta vermelho)
  required_data JSONB,                   -- ✅ Master (Fallback)
  complexity TEXT,                       -- ✅ Master
  importance TEXT,                       -- ✅ Master
  segment TEXT,                          -- ✅ Master
  icon_name TEXT,                        -- ✅ Master
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Responsabilidade:** Definir O QUE é o indicador e COMO ele funciona.

---

### **Tabela: `user_indicators` (INSTÂNCIA DO USUÁRIO)**

```sql
CREATE TABLE user_indicators (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,                      -- 👤 Quem possui
  indicator_template_id UUID REFERENCES indicator_templates, -- 🔗 REFERÊNCIA!
  
  -- ✅ Dados EXCLUSIVOS do usuário:
  name TEXT,                            -- ✅ Nome personalizado (opcional)
  current_value NUMERIC DEFAULT 0,      -- ✅ Valor atual calculado
  target_value NUMERIC,                 -- ✅ Meta pessoal
  last_inputs JSONB,                    -- ✅ Últimos inputs digitados
  format TEXT,                          -- ✅ Formato de exibição
  position INTEGER,                     -- ✅ Ordem no dashboard
  segment TEXT,                         -- ✅ Categoria visual
  icon_name TEXT,                       -- ✅ Ícone personalizado (opcional)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
  
  -- ❌ NÃO deve ter:
  -- formula TEXT,                      -- Vem de indicator_templates!
  -- direction TEXT,                    -- Vem de indicator_templates!
  -- input_fields JSONB,                -- Vem de indicator_templates!
);
```

**Responsabilidade:** Armazenar dados específicos do usuário e resultados.

---

## 🔄 **QUERY CORRETA (FETCH USER INDICATORS)**

### **Dashboard.tsx - fetchUserIndicators:**

```typescript
const { data, error } = await supabase
  .from('user_indicators')
  .select(`
    *,
    template:indicator_templates(*)
  `)
  .eq('user_id', user.id)
  .eq('is_active', true)
  .order('position', { ascending: true, nullsFirst: false });
```

**O que faz:**
- ✅ Busca dados de `user_indicators` (valor atual, meta, inputs)
- ✅ **JOIN automático** com `indicator_templates` (fórmula, direção, campos)
- ✅ Retorna objeto combinado: `{ ...userIndicator, template: {...} }`

**Resultado:**
```javascript
{
  id: "ui-123",
  user_id: "user-abc",
  current_value: 3.5,
  target_value: 5.0,
  last_inputs: { ativos_inicio: 100, cancelamentos: 3 },
  template: {
    id: "tpl-xyz",
    name: "Taxa de Churn",
    formula: "(cancelamentos / ativos_inicio) * 100",
    direction: "LOWER_BETTER",
    unit_type: "percentage",
    input_fields: { fixed: ["ativos_inicio"], daily: ["cancelamentos"] },
    // ... todos os campos do template
  }
}
```

---

## 📐 **USO NO CÓDIGO**

### **1. KPICard.tsx (Exibição):**

```typescript
const KPICard = ({ kpi }: { kpi: KPI }) => {
  // ✅ CORRETO: Sempre usar template.*
  const direction = (kpi.template?.direction || 'HIGHER_BETTER') as IndicatorDirection;
  
  // ✅ Dados do usuário (instância)
  const currentValue = kpi.value;           // De user_indicators
  const targetValue = kpi.target;           // De user_indicators
  
  // ✅ Dados do template (master)
  const formula = kpi.template?.formula;    // De indicator_templates
  const unitType = kpi.template?.unit_type; // De indicator_templates
  
  // Cálculo de status usando dados do template
  const status = calculateIndicatorStatus(
    currentValue,
    targetValue,
    direction  // ✅ Do template!
  );
  
  return (
    <Card>
      <h3>{kpi.name}</h3>  {/* User pode personalizar */}
      <p>{formatValue(currentValue, unitType)}</p>
    </Card>
  );
};
```

---

### **2. EditKPIModal.tsx (Lançamento de Dados):**

```typescript
const EditKPIModal = ({ kpi }: { kpi: KPI }) => {
  // ✅ CORRETO: Ler do template
  const formula = kpi.template?.formula || '';
  const inputFields = kpi.template?.input_fields || {};
  const calcMethod = kpi.template?.calc_method || 'formula';
  
  // ✅ Ler da instância do usuário
  const lastInputs = kpi.last_inputs || {};
  const target = kpi.target || 0;
  
  // Renderizar inputs dinamicamente
  const fields = inputFields.fixed.concat(inputFields.daily);
  
  return (
    <Dialog>
      <h3>Lançar Dados: {kpi.template?.name}</h3>
      <p>Fórmula: {formula}</p>
      {fields.map(field => (
        <Input 
          key={field}
          defaultValue={lastInputs[field]}  // ✅ Pré-preenche com último valor
        />
      ))}
    </Dialog>
  );
};
```

---

### **3. EditIndicatorModal.tsx (Editar Configurações do Usuário):**

```typescript
const EditIndicatorModal = ({ kpi }: { kpi: KPI }) => {
  // ✅ Campos EDITÁVEIS pelo usuário:
  const [name, setName] = useState(kpi.name);           // Personalizar nome
  const [target, setTarget] = useState(kpi.target);     // Meta pessoal
  const [format, setFormat] = useState(kpi.format);     // Formato de exibição
  
  // ❌ NÃO editáveis pelo usuário comum:
  // kpi.template.formula     - Só admin pode mudar (no template)
  // kpi.template.direction   - Só admin pode mudar (no template)
  // kpi.template.input_fields - Só admin pode mudar (no template)
  
  const handleSave = async () => {
    await supabase
      .from('user_indicators')
      .update({
        name: name,           // ✅ Atualiza na instância
        target_value: target, // ✅ Atualiza na instância
        format: format,       // ✅ Atualiza na instância
        // NÃO toca em campos do template!
      })
      .eq('id', kpi.id);
  };
  
  return (
    <Dialog>
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Input value={target} onChange={(e) => setTarget(e.target.value)} />
      <Select value={format} onValueChange={setFormat}>
        <SelectItem value="currency">R$</SelectItem>
        <SelectItem value="percentage">%</SelectItem>
      </Select>
    </Dialog>
  );
};
```

---

## 🔍 **MATRIZ DE RESPONSABILIDADES**

| Dado | Onde Está | Onde Usar | Quem Edita | Exemplo |
|------|-----------|-----------|------------|---------|
| **Fórmula** | `indicator_templates.formula` | `template.formula` | Admin | `(a / b) * 100` |
| **Direção** | `indicator_templates.direction` | `template.direction` | Admin | `LOWER_BETTER` |
| **Unidade** | `indicator_templates.unit_type` | `template.unit_type` | Admin | `percentage` |
| **Campos** | `indicator_templates.input_fields` | `template.input_fields` | Admin | `{fixed: [...]}` |
| **Thresholds** | `indicator_templates.default_*_threshold` | `template.default_*_threshold` | Admin | `5, 8` |
| **Nome** | `user_indicators.name` | `kpi.name` | Usuário | "Meu Churn" |
| **Meta** | `user_indicators.target_value` | `kpi.target` | Usuário | `5.0` |
| **Valor Atual** | `user_indicators.current_value` | `kpi.value` | Sistema | `3.5` |
| **Últimos Inputs** | `user_indicators.last_inputs` | `kpi.last_inputs` | Usuário | `{ativos: 100}` |
| **Formato** | `user_indicators.format` | `kpi.format` | Usuário | `currency` |

---

## ✅ **BENEFÍCIOS DA ARQUITETURA**

### **1. Atualizações Centralizadas:**
```
Admin muda fórmula → Todos os usuários veem a nova fórmula ✅
```

### **2. Consistência de Dados:**
```
1 template → N usuários → Todos usam mesma lógica ✅
```

### **3. Manutenibilidade:**
```
Corrigir bug na fórmula = 1 lugar (template) ✅
Não precisa atualizar N registros de user_indicators ❌
```

### **4. Flexibilidade:**
```
Usuário pode personalizar:
- Nome do indicador
- Meta pessoal
- Formato de exibição
Mas a LÓGICA vem do template (admin controla) ✅
```

### **5. Escalabilidade:**
```
Adicionar novo campo no template:
- Rodar migration
- Código já busca template.*
- Funciona automaticamente ✅
```

---

## 🧪 **TESTE DE VALIDAÇÃO**

### **Cenário: Admin Atualiza Fórmula**

```
1. Admin acessa EditTemplateModal
2. Muda fórmula de "(cancelamentos / ativos) * 100"
   para "(cancelamentos / ativos_inicio) * 100"
3. Salva no banco:
   UPDATE indicator_templates SET formula = '...' WHERE id = 'xxx'
4. Usuário recarrega Dashboard
5. Query busca: .select('*, template:indicator_templates(*)')
6. Retorna template com nova fórmula ✅
7. EditKPIModal usa: const formula = kpi.template.formula
8. Cálculo usa nova fórmula ✅
9. Resultado correto sem ação do usuário! ✅
```

### **Validação:**
```sql
-- Ver qual fórmula o usuário está usando
SELECT 
  ui.id,
  ui.name AS user_indicator_name,
  it.formula AS template_formula,  -- ✅ Esta é a fonte da verdade!
  it.direction,
  it.unit_type
FROM user_indicators ui
JOIN indicator_templates it ON ui.indicator_template_id = it.id
WHERE ui.user_id = 'xxx';
```

---

## 🚨 **ANTI-PADRÕES (NÃO FAZER)**

### **❌ 1. Duplicar Dados do Template em user_indicators:**

```typescript
// ❌ ERRADO
await supabase.from('user_indicators').insert({
  user_id: userId,
  indicator_template_id: templateId,
  formula: template.formula,          // ❌ Duplicação!
  direction: template.direction,      // ❌ Duplicação!
  input_fields: template.input_fields // ❌ Duplicação!
});
```

```typescript
// ✅ CORRETO
await supabase.from('user_indicators').insert({
  user_id: userId,
  indicator_template_id: templateId,  // ✅ Apenas referência!
  name: template.name,                // ✅ Pode personalizar
  target_value: 0,                    // ✅ Dado do usuário
  format: 'currency'                  // ✅ Dado do usuário
});
```

---

### **❌ 2. Ler Dados Diretamente de user_indicators:**

```typescript
// ❌ ERRADO
const formula = kpi.formula;          // undefined ou desatualizado!
const direction = kpi.direction;      // undefined ou desatualizado!
```

```typescript
// ✅ CORRETO
const formula = kpi.template?.formula || '';
const direction = kpi.template?.direction || 'HIGHER_BETTER';
```

---

### **❌ 3. Atualizar user_indicators quando deveria atualizar template:**

```typescript
// ❌ ERRADO - Atualiza a instância do usuário
await supabase.from('user_indicators')
  .update({ formula: novaFormula })  // ❌ Campo nem deveria existir!
  .eq('id', kpiId);
```

```typescript
// ✅ CORRETO - Admin atualiza o template
await supabase.from('indicator_templates')
  .update({ formula: novaFormula })  // ✅ Todos os usuários recebem!
  .eq('id', templateId);
```

---

## 📝 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Para Desenvolvedores:**

- [ ] Query usa `.select('*, template:indicator_templates(*)')`
- [ ] Componentes leem `kpi.template.formula`, não `kpi.formula`
- [ ] Componentes leem `kpi.template.direction`, não `kpi.direction`
- [ ] Componentes leem `kpi.template.input_fields`, não `kpi.input_fields`
- [ ] user_indicators NÃO tem colunas duplicadas (formula, direction, etc.)
- [ ] EditKPIModal usa dados do template para lógica de cálculo
- [ ] EditIndicatorModal só permite editar dados da instância (name, target, format)
- [ ] AddTemplateModal salva dados em indicator_templates (não user_indicators)

### **Para Testadores:**

- [ ] Admin atualiza fórmula no template
- [ ] Usuário recarrega Dashboard
- [ ] Novo cálculo usa fórmula atualizada (sem remover/adicionar)
- [ ] Admin atualiza direction no template
- [ ] Cores dos cards mudam automaticamente
- [ ] Admin adiciona novo campo em input_fields
- [ ] Modal de lançamento mostra novo campo

---

## 🎯 **RESUMO**

### **Regra de Ouro:**

> **"Se o Admin controla, vem do Template. Se o Usuário controla, vem da Instância."**

### **Sempre Pergunte:**

1. **Este dado muda para todos os usuários?**
   - SIM → `indicator_templates` (Admin)
   - NÃO → `user_indicators` (Usuário)

2. **Este dado é sobre O QUE/COMO medir?**
   - SIM → `indicator_templates` (Definição)
   - NÃO → `user_indicators` (Resultado)

3. **Este dado é específico de um usuário?**
   - SIM → `user_indicators` (Meta, Inputs)
   - NÃO → `indicator_templates` (Fórmula, Direção)

---

**Data:** 15/01/2026  
**Versão:** v1.26  
**Tipo:** Documentação de Arquitetura  
**Status:** ✅ COMPLETO

---

**🏗️ Arquitetura Validada! Sistema já segue o padrão "Fonte da Verdade"!**

