# 🚨 CORREÇÃO CRÍTICA: Query de Templates Incompleta - v1.25

## 🔴 **BUG CRÍTICO IDENTIFICADO VIA LOGS**

**Sintoma:** Ao clicar em "Editar Template", os campos de configuração (`direction`, `unit_type`, `calc_method`, `default_warning_threshold`, `default_critical_threshold`) chegam como `undefined` no `EditTemplateModal`.

### **Log do Problema:**
```javascript
// Console ao abrir EditTemplateModal:
📊 Carregando template: {
  id: "xxx",
  name: "Taxa de Churn",
  description: "...",
  formula: "...",
  direction: undefined,      // ❌ PROBLEMA!
  unit_type: undefined,      // ❌ PROBLEMA!
  calc_method: undefined,    // ❌ PROBLEMA!
  default_warning_threshold: undefined, // ❌ PROBLEMA!
  default_critical_threshold: undefined, // ❌ PROBLEMA!
}
```

---

## 🔍 **ANÁLISE DA CAUSA RAIZ**

### **O Fluxo do Bug:**

1. **Query Inicial (Store.tsx - linha 212):**
   ```typescript
   const { data, error } = await supabase
     .from('indicator_templates')
     .select('*')  // ✅ Busca TODAS as colunas
     .order('name');
   ```
   ✅ Esta query está correta!

2. **Mapeamento dos Dados (Store.tsx - linha 225-251):**
   ```typescript
   const mappedIndicators: Indicator[] = data.map((item: Tables<'indicator_templates'>) => {
     return {
       id: String(item.id),
       name: item.name || '',
       description: item.description || '',
       formula: item.formula || '',
       importance: item.importance || '',
       segment: item.segment || 'Geral',
       complexity: (item.complexity || 'Fácil') as "Fácil" | "Intermediário" | "Avançado",
       icon: getIcon(item.icon_name),
       required_data: requiredDataArray
       // ❌ PROBLEMA: direction, unit_type, calc_method, thresholds NÃO foram incluídos!
     };
   });
   ```
   ❌ **PROBLEMA ENCONTRADO:** O mapeamento cria um novo objeto que APENAS inclui os campos da interface `Indicator` local, descartando todos os outros campos vindos do banco!

3. **Ao Clicar em Editar (Store.tsx - linha 568):**
   ```typescript
   onClick={(e) => {
     e.stopPropagation();
     setEditingTemplate(indicator);  // ❌ indicator é o objeto MAPEADO (incompleto)!
     setShowEditTemplateModal(true);
   }}
   ```
   ❌ **PROBLEMA:** Passa o objeto `indicator` que JÁ perdeu os campos novos no mapeamento!

4. **EditTemplateModal Recebe:**
   ```typescript
   // template = { id, name, description, ..., direction: undefined }
   ```
   ❌ Campos novos são `undefined`!

---

## ✅ **SOLUÇÃO IMPLEMENTADA**

### **Estratégia: Buscar Template Completo ao Editar**

Em vez de usar o objeto `indicator` mapeado (que perdeu os campos), fazemos uma **nova query ao banco** para buscar o template completo com TODOS os campos.

### **Código Corrigido (Store.tsx - linha 561-586):**

```typescript
{isAdmin && (
  <Button
    variant="outline"
    size="icon"
    className="h-8 w-8"
    onClick={async (e) => {
      e.stopPropagation();
      
      // 🔧 CORREÇÃO: Buscar template completo do banco com TODOS os campos
      const { data: fullTemplate, error } = await supabase
        .from('indicator_templates')
        .select('*')
        .eq('id', indicator.id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar template completo:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar o template.",
        });
        return;
      }
      
      console.log('📦 Template completo carregado:', fullTemplate);
      setEditingTemplate(fullTemplate);
      setShowEditTemplateModal(true);
    }}
    title="Editar Template (Admin)"
  >
    <Edit className="w-4 h-4" />
  </Button>
)}
```

---

## 🎯 **COMO FUNCIONA AGORA**

### **Fluxo Corrigido:**

```
1. Usuário visualiza lista de templates
   └─ Dados mapeados (interface Indicator)
   └─ Suficiente para exibição visual

2. Usuário clica em "Editar" (ícone de lápis)
   └─ Faz nova query ao banco: .select('*')
   └─ Busca registro completo com TODOS os campos
   └─ Log: "📦 Template completo carregado: {...}"

3. EditTemplateModal recebe template completo
   └─ direction: "LOWER_BETTER" ✅
   └─ unit_type: "percentage" ✅
   └─ calc_method: "formula" ✅
   └─ default_warning_threshold: 5 ✅
   └─ default_critical_threshold: 8 ✅

4. useEffect do modal carrega os campos
   └─ Todos os Select e Inputs preenchidos corretamente ✅
```

---

## 🧪 **TESTE DE VALIDAÇÃO**

### **Antes da Correção:**
```
1. Clicar em "Editar" no indicador "Churn"
2. Console log:
   📊 Carregando template: {
     direction: undefined ❌
   }
3. Dropdown "Direção" fica vazio ❌
```

### **Depois da Correção:**
```
1. Clicar em "Editar" no indicador "Churn"
2. Console log:
   📦 Template completo carregado: {
     direction: "LOWER_BETTER",
     unit_type: "percentage",
     calc_method: "formula",
     default_warning_threshold: 5,
     default_critical_threshold: 8,
     input_fields: {...},
     ...
   } ✅
   📊 Carregando template: {
     direction: "LOWER_BETTER" ✅
   }
3. Dropdown "Direção" mostra "Menor é Melhor" ✅
4. Todos os campos preenchidos corretamente ✅
```

---

## 📊 **ANTES vs DEPOIS**

### **ANTES (Com Bug):**

| Passo | Ação | Resultado |
|-------|------|-----------|
| 1 | Query inicial | Busca * ✅ |
| 2 | Mapeamento | Descarta campos novos ❌ |
| 3 | Clicar Editar | Usa objeto mapeado ❌ |
| 4 | Modal | Campos undefined ❌ |

### **DEPOIS (Corrigido):**

| Passo | Ação | Resultado |
|-------|------|-----------|
| 1 | Query inicial | Busca * (para exibição) ✅ |
| 2 | Mapeamento | Descarta campos (OK para UI) ✅ |
| 3 | Clicar Editar | **Nova query ao banco** ✅ |
| 4 | Modal | Recebe objeto completo ✅ |

---

## 🎯 **POR QUE ESTA SOLUÇÃO É MELHOR**

### **Alternativas Consideradas:**

#### **Alternativa 1: Adicionar campos na interface Indicator**
```typescript
interface Indicator {
  id: string;
  name: string;
  // ...
  direction?: string;
  unit_type?: string;
  // ... +10 campos novos
}
```
❌ **Rejeitada:** 
- Interface `Indicator` é usada apenas para UI de listagem
- Adicionar campos que não são usados na lista polui o código
- Futuras mudanças no banco exigiriam atualizar o mapeamento

#### **Alternativa 2: Armazenar dados originais em paralelo**
```typescript
const [rawIndicators, setRawIndicators] = useState<Tables<'indicator_templates'>[]>([]);
const [indicators, setIndicators] = useState<Indicator[]>([]);
```
❌ **Rejeitada:**
- Duplica dados na memória
- Sincronização complexa entre os dois arrays
- Aumenta complexidade do código

#### **✅ Alternativa 3: Buscar ao editar (ESCOLHIDA)**
```typescript
onClick={async (e) => {
  const { data } = await supabase.from('indicator_templates').select('*').eq('id', indicator.id).single();
  setEditingTemplate(data);
}}
```
✅ **Vantagens:**
- **Simples:** Uma query adicional só quando necessário
- **Sempre atualizado:** Busca dados frescos do banco
- **Manutenível:** Não precisa atualizar mapeamento
- **Performático:** Query rápida (single row by PK)
- **Escalável:** Funciona com qualquer número de campos novos

---

## 🚀 **IMPACTO DA CORREÇÃO**

### **Para o Admin:**
- ✅ **Campos carregam corretamente** ao editar
- ✅ **Não perde configurações** salvas no banco
- ✅ **UX consistente** entre criar e editar
- ✅ **Confiança** no sistema

### **Para o Sistema:**
- ✅ **Menos acoplamento** entre UI de lista e modal de edição
- ✅ **Manutenibilidade** melhorada
- ✅ **Escalável** para novos campos no futuro
- ✅ **Dados sempre atualizados**

### **Performance:**
- **Query adicional:** ~50ms (busca por PK é muito rápida)
- **Frequência:** Apenas quando clicar em Editar (raro)
- **Trade-off:** Aceitável para garantir dados corretos

---

## 📝 **ARQUIVOS MODIFICADOS**

### **`src/pages/Store.tsx`**

**Linha 561-586 (Botão de Editar):**

**Antes:**
```typescript
onClick={(e) => {
  e.stopPropagation();
  setEditingTemplate(indicator);  // ❌ Objeto mapeado (incompleto)
  setShowEditTemplateModal(true);
}}
```

**Depois:**
```typescript
onClick={async (e) => {
  e.stopPropagation();
  
  // 🔧 CORREÇÃO: Buscar template completo
  const { data: fullTemplate, error } = await supabase
    .from('indicator_templates')
    .select('*')
    .eq('id', indicator.id)
    .single();
  
  if (error) {
    console.error('Erro ao buscar template completo:', error);
    toast({ title: "Erro", description: "Não foi possível carregar o template." });
    return;
  }
  
  console.log('📦 Template completo carregado:', fullTemplate);
  setEditingTemplate(fullTemplate);  // ✅ Objeto completo do banco
  setShowEditTemplateModal(true);
}}
```

---

## 🔍 **TROUBLESHOOTING**

### **Se os campos ainda aparecerem undefined:**

1. **Verificar Console Logs:**
   ```
   📦 Template completo carregado: {...}
   ```
   Se este log não aparecer, a query não está funcionando.

2. **Verificar Erro:**
   ```javascript
   if (error) {
     console.error('Erro ao buscar template completo:', error);
   }
   ```
   Pode ser problema de RLS ou permissão.

3. **Verificar Banco de Dados:**
   ```sql
   SELECT direction, unit_type, calc_method 
   FROM indicator_templates 
   WHERE id = 'xxx';
   ```
   Confirmar que os campos existem e têm valores.

4. **Verificar RLS Policy:**
   - Admin precisa ter SELECT em `indicator_templates`
   - Verificar políticas no Supabase

---

## 💡 **LIÇÕES APRENDIDAS**

### **1. Mapeamento de Dados:**
- ⚠️ Mapeamento de objetos **descarta** campos não especificados
- ✅ Use mapeamento apenas quando necessário para UI
- ✅ Mantenha dados originais quando precisar de integridade

### **2. Separação de Responsabilidades:**
- ✅ **Listagem:** Interface simplificada (Indicator)
- ✅ **Edição:** Dados completos do banco (Tables<'indicator_templates'>)
- ✅ Cada caso de uso tem suas necessidades

### **3. Performance vs Simplicidade:**
- ✅ Uma query adicional é aceitável se simplifica o código
- ✅ Queries por PK são muito rápidas
- ✅ Otimize onde importa (consultas frequentes)

---

## ✅ **CHECKLIST DE VALIDAÇÃO**

- [x] Query adicional implementada no botão de Editar
- [x] Log `📦 Template completo carregado` adicionado
- [x] Tratamento de erro implementado
- [x] Toast de erro configurado
- [x] Sem erros de linting
- [x] Testado: Clicar em Editar ✅
- [x] Testado: Console mostra template completo ✅
- [x] Testado: Modal carrega campos corretamente ✅
- [x] Testado: Salvar preserva configurações ✅
- [x] Documentação completa

---

## 📐 **CÓDIGO COMPLETO DA SOLUÇÃO**

```typescript
// Store.tsx - Botão de Editar (Admin)
{isAdmin && (
  <Button
    variant="outline"
    size="icon"
    className="h-8 w-8"
    onClick={async (e) => {
      e.stopPropagation();
      
      // Buscar template completo do banco
      const { data: fullTemplate, error } = await supabase
        .from('indicator_templates')
        .select('*')
        .eq('id', indicator.id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar template completo:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar o template.",
        });
        return;
      }
      
      console.log('📦 Template completo carregado:', fullTemplate);
      setEditingTemplate(fullTemplate);
      setShowEditTemplateModal(true);
    }}
    title="Editar Template (Admin)"
  >
    <Edit className="w-4 h-4" />
  </Button>
)}
```

---

**Data:** 15/01/2026  
**Versão:** v1.25  
**Tipo:** Bug Fix CRÍTICO (Perda de Dados)  
**Prioridade:** 🔴 CRÍTICA  
**Status:** ✅ COMPLETO

---

**🎉 Bug Crítico Corrigido! Agora o EditTemplateModal recebe TODOS os campos do banco!**

**💡 Dica:** Sempre verifique o console ao clicar em "Editar". O log `📦 Template completo carregado` deve mostrar todos os campos com valores corretos.

