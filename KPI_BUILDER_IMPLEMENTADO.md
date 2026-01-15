# 🎨 KPI BUILDER - Transformação Completa dos Formulários Admin

## 📌 **O que foi implementado?**

Os formulários de criação e edição de Templates de Indicadores foram **completamente refatorados** em um **KPI Builder profissional**.

---

## ✨ **NOVIDADES IMPLEMENTADAS**

### **1️⃣ Seção de Configuração de Comportamento**

Novos campos com dropdowns (Select) para as colunas do banco:

#### **Direção (Direction):**
- 🟢 **Maior é Melhor** (`HIGHER_BETTER`) - Ex: Vendas, Faturamento
- 🟡 **Menor é Melhor** (`LOWER_BETTER`) - Ex: Churn, Despesas
- 🎯 **Faixa Ideal** (`NEUTRAL_RANGE`) - Ex: Estoque, Temperatura

#### **Unidade de Medida (Unit Type):**
- 💰 Moeda (R$) - `currency`
- 📊 Porcentagem (%) - `percentage`
- 🔢 Número Inteiro - `integer`
- 🔢 Número Decimal - `decimal`

#### **Método de Cálculo (Calc Method):**
- Input de texto para definir o método (ex: `formula`, `sum`, `average`, `last`)

---

### **2️⃣ Gerenciador de Variáveis (Input Fields Builder)**

**Antes:**
```
Dados Necessários: [Input simples] [+]
- Faturamento mensal [X]
- Número de clientes [X]
```

**Agora:**
```
🔧 Variáveis do Indicador

[Nome da variável________] [📌 Fixo ▼] [+]

Variáveis Criadas (3):
📌 ativos_inicio [X]  📅 cancelamentos [X]  📌 meta_mensal [X]
```

**Funcionalidades:**
- ✅ **Adicionar Variável**: Nome convertido automaticamente para `snake_case`
- ✅ **Tipo de Variável**: 
  - 📌 **Fixo** - Dados que mudam raramente (ex: meta mensal)
  - 📅 **Diário** - Dados que mudam frequentemente (ex: vendas do dia)
- ✅ **Validação**: Impede variáveis duplicadas
- ✅ **Visual**: Badges com ícones e cores diferentes por tipo

**Salvamento:**
O JSON `input_fields` é construído automaticamente:
```json
{
  "fixed": ["ativos_inicio", "meta_mensal"],
  "daily": ["cancelamentos", "vendas_dia"]
}
```

---

### **3️⃣ Editor de Fórmula Inteligente**

**Antes:**
```
Fórmula: [Textarea simples]
```

**Agora:**
```
🧮 Fórmula de Cálculo *
Clique nas variáveis para inserir na fórmula

[(cancelamentos / ativos_inicio) * 100___________]

✨ Clique para inserir:
[ativos_inicio]  [cancelamentos]  [meta_mensal]
```

**Funcionalidades:**
- ✅ **Badges Clicáveis**: Ao clicar em uma variável, ela é inserida na posição do cursor
- ✅ **Font Monospace**: Facilita leitura de fórmulas complexas
- ✅ **Inserção Inteligente**: Usa `selectionStart` e `selectionEnd` para inserir no lugar certo
- ✅ **Foco Automático**: Após inserir, o cursor é reposicionado após a variável

---

### **4️⃣ Carregamento Inteligente no EditTemplateModal**

**Parse Robusto de `input_fields` (JSONB):**
```typescript
if (template.input_fields) {
  // Aceita string JSON ou objeto direto
  let inputFieldsJSON = typeof template.input_fields === 'string' 
    ? JSON.parse(template.input_fields) 
    : template.input_fields;
  
  const fixed = inputFieldsJSON.fixed || [];
  const daily = inputFieldsJSON.daily || [];
  
  loadedVariables = [
    ...fixed.map(name => ({ name, type: 'fixed' })),
    ...daily.map(name => ({ name, type: 'daily' }))
  ];
}
```

**Fallback para `required_data` (antigo):**
Se `input_fields` não existir, tenta carregar do campo antigo para compatibilidade.

---

## 🎨 **LAYOUT E UX**

### **Cards por Seção:**
- 📋 **Informações Básicas** (branco)
- ⚙️ **Configuração de Comportamento** (borda primary)
- 🔧 **Variáveis do Indicador** (fundo primary/5)
- 🧮 **Fórmula de Cálculo** (fundo blue/5)

### **Ícones e Badges:**
- `Sparkles` (✨) no título "KPI Builder"
- `Calculator` (🧮) na seção de comportamento
- `TrendingUp` / `TrendingDown` / `Target` nos selects de direção
- Badges com emojis (`📌`, `📅`, `💰`, `📊`) para melhor identificação visual

### **Grid Responsivo:**
- Grid 3 colunas para: Segmento | Complexidade | Ícone
- Grid 3 colunas para: Direção | Unidade | Método de Cálculo

---

## 🔧 **DETALHES TÉCNICOS**

### **1. Conversão Snake_Case:**
```typescript
const toSnakeCase = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};
```

**Exemplos:**
- "Clientes Ativos" → `clientes_ativos`
- "Faturamento Total (R$)" → `faturamento_total_r`
- "ROI de Marketing" → `roi_de_marketing`

### **2. Ref do Textarea (Inserção de Variáveis):**
```typescript
const formulaTextareaRef = useRef<HTMLTextAreaElement>(null);

const handleInsertVariable = (varName: string) => {
  const textarea = formulaTextareaRef.current;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  
  const newFormula = 
    formula.substring(0, start) + 
    varName + 
    formula.substring(end);
  
  setFormula(newFormula);
  
  // Reposicionar cursor
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + varName.length, start + varName.length);
  }, 0);
};
```

### **3. Salvamento no Banco:**
```typescript
const inputFields = {
  fixed: variables.filter(v => v.type === 'fixed').map(v => v.name),
  daily: variables.filter(v => v.type === 'daily').map(v => v.name),
};

await supabase
  .from('indicator_templates')
  .insert({
    // ... outros campos
    direction: direction,
    unit_type: unitType,
    calc_method: calcMethod,
    input_fields: inputFields, // JSONB
    required_data: JSON.stringify(variables.map(v => v.name)), // Fallback
  });
```

---

## 📊 **ARQUIVOS MODIFICADOS**

### **Novos Arquivos:**
Nenhum (refatoração de existentes).

### **Arquivos Modificados:**
- ✅ `src/components/store/AddTemplateModal.tsx` - Completamente refatorado
- ✅ `src/components/store/EditTemplateModal.tsx` - Completamente refatorado
- ✅ `src/pages/Store.tsx` - Atualizada chamada do `EditTemplateModal`

---

## 🧪 **COMO TESTAR**

### **Teste 1: Criar Novo Indicador (AddTemplateModal)**

1. **Login como Admin** (`admin@meugestor.com`)
2. **Vá para Store** → Clique em "Novo Template"
3. **Preencha:**
   - Nome: "Taxa de Retenção"
   - Descrição: "Percentual de clientes que permaneceram ativos"
   - Direção: **Maior é Melhor**
   - Unidade: **Porcentagem (%)**
   - Método: `formula`
4. **Adicione Variáveis:**
   - `ativos_fim` (Fixo)
   - `ativos_inicio` (Fixo)
5. **Clique nas variáveis** para inserir na fórmula:
   ```
   (ativos_fim / ativos_inicio) * 100
   ```
6. **Salve** → ✅ Deve criar o indicador com `input_fields` correto

---

### **Teste 2: Editar Indicador Existente (EditTemplateModal)**

1. **Na Store**, clique no ícone de **✏️ Editar** (Admin)
2. **Verifique:**
   - ✅ Variáveis devem aparecer na seção "Variáveis Criadas"
   - ✅ Badges devem ter ícones corretos (📌 ou 📅)
   - ✅ Fórmula deve estar preenchida
   - ✅ Direção, Unidade e Método devem estar selecionados
3. **Adicione uma nova variável** → `cancelamentos` (Diário)
4. **Clique no badge** `cancelamentos` → Deve inserir na fórmula
5. **Salve** → ✅ Deve atualizar o template

---

### **Teste 3: Validação**

1. **Tente criar variável com nome vazio** → ❌ "Nome vazio"
2. **Tente criar variável duplicada** → ❌ "Variável duplicada"
3. **Salve sem preencher nome** → ❌ "Campos obrigatórios"

---

## 🎯 **RESULTADO FINAL**

### **Antes:**
```
[Nome: _________]
[Descrição: _____]
[Fórmula: _______]
[Dados Necessários: ____] [+]
  - Faturamento [X]
  - Clientes [X]
```

### **Agora:**
```
✨ KPI Builder - Novo Indicador
━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INFORMAÇÕES BÁSICAS
  Nome, Descrição, Importância
  Segmento | Complexidade | Ícone

⚙️ CONFIGURAÇÃO DE COMPORTAMENTO
  Direção | Unidade | Método

🔧 VARIÁVEIS DO INDICADOR
  [Nome___] [Tipo▼] [+]
  📌 ativos_inicio [X]  📅 cancelamentos [X]

🧮 FÓRMULA DE CÁLCULO
  [(cancelamentos / ativos_inicio) * 100_____]
  
  ✨ Clique para inserir:
  [ativos_inicio] [cancelamentos]
```

---

## 🚀 **BENEFÍCIOS**

1. ✅ **UX Profissional**: Interface moderna e intuitiva
2. ✅ **Validação Robusta**: Impede erros antes de salvar
3. ✅ **Snake_Case Automático**: Nomes de variáveis sempre corretos
4. ✅ **Editor Inteligente**: Clique para inserir variáveis
5. ✅ **Parse Robusto**: Carrega corretamente JSON e fallback
6. ✅ **Visual Moderno**: Cards, badges, ícones e cores
7. ✅ **Compatibilidade**: Funciona com templates antigos

---

## 📋 **CHECKLIST DE FUNCIONALIDADES**

- ✅ Dropdown de Direção (HIGHER_BETTER, LOWER_BETTER, NEUTRAL_RANGE)
- ✅ Dropdown de Unidade (currency, percentage, integer, decimal)
- ✅ Input de Método de Cálculo
- ✅ Gerenciador de Variáveis (Adicionar/Remover)
- ✅ Tipos de Variáveis (Fixo/Diário)
- ✅ Conversão Snake_Case automática
- ✅ Validação de duplicatas
- ✅ Badges clicáveis para inserir na fórmula
- ✅ Inserção na posição do cursor
- ✅ Parse de `input_fields` JSONB
- ✅ Fallback para `required_data`
- ✅ Salvamento correto no banco
- ✅ Visual moderno com Cards e ícones
- ✅ Sem erros de linting

---

**Data:** 15/01/2026  
**Versão:** v1.15  
**Status:** ✅ COMPLETO  
**Criticidade:** 🎨 ALTA (Melhoria de UX e Funcionalidade Admin)

---

**🎉 KPI Builder Implementado! A criação de indicadores agora é profissional e intuitiva!**

