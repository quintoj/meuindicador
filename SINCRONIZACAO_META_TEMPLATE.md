# 🔄 SINCRONIZAÇÃO DE META COM TEMPLATE - v1.27

## 📋 **IMPLEMENTAÇÃO**

Sincronização da meta inicial do usuário com o `default_critical_threshold` do template, incluindo alerta ao editar.

---

## 🎯 **FUNCIONALIDADE**

### **1. Ao Adicionar Indicador (Store.tsx):**

```typescript
// Copia threshold do template como meta inicial
const initialTarget = templateData.default_critical_threshold || null;

await supabase.from('user_indicators').insert({
  user_id: user.id,
  indicator_template_id: templateData.id,
  name: templateData.name,
  current_value: 0,
  target_value: initialTarget,  // 🔧 Meta inicial sincronizada!
  // ...
});
```

**Resultado:**
- Template tem `default_critical_threshold = 34.98`
- Usuário adiciona ao Dashboard
- `target_value` = **34.98** (cópia inicial)

---

### **2. Alerta ao Editar Meta (EditKPIModal.tsx):**

```typescript
<Input
  id="targetValue"
  type="number"
  value={targetValue}
  onChange={(e) => setTargetValue(e.target.value)}
  onFocus={() => {
    // 🔧 Alerta ao editar meta
    if (!targetValue || parseFloat(targetValue) === 0) return;
    toast({
      title: "⚠️ Meta Pessoal",
      description: "Se você alterar a meta, ela será sua meta pessoal e não será afetada por mudanças do administrador no template.",
      duration: 5000,
    });
  }}
/>
```

**Resultado:**
- Usuário clica no campo "Meta"
- Toast aparece explicando que será meta pessoal
- Usuário pode decidir se quer alterar ou não

---

## 🔄 **FLUXO COMPLETO**

### **Cenário 1: Adicionar Novo Indicador**

```
1. Admin cria template "Food Cost"
   └─ default_critical_threshold = 34.98

2. Usuário vai na Store
   └─ Clica "Adicionar ao Dashboard"

3. Sistema copia meta inicial
   └─ target_value = 34.98 (do template)

4. Dashboard mostra
   └─ Meta: 34.98% ✅
```

---

### **Cenário 2: Editar Meta Pessoal**

```
1. Usuário abre modal de lançamento
   └─ Meta atual: 34.98%

2. Usuário clica no campo "Meta"
   └─ Toast aparece: "⚠️ Meta Pessoal"
   └─ "Se você alterar, será sua meta pessoal..."

3. Usuário decide:
   a) Não altera → Mantém 34.98 (do template)
   b) Altera para 40 → Agora é meta pessoal

4. Se admin mudar template depois:
   └─ Status (cores) usa novo threshold do template ✅
   └─ Meta pessoal do usuário continua 40 ✅
```

---

### **Cenário 3: Admin Muda Template Depois**

```
1. Usuário tem meta pessoal = 40
2. Admin muda template: default_critical_threshold = 50
3. Dashboard recarrega:
   └─ Status (cores) calculado com 50 (novo) ✅
   └─ Meta pessoal continua 40 ✅
   └─ Usuário vê: "Meta: 40%" (sua meta)
   └─ Cores baseadas em 50% (regra do admin)
```

---

## 📊 **DIFERENÇA ENTRE CAMPOS**

| Campo | Origem | Usado Para | Muda com Admin? |
|-------|--------|------------|-----------------|
| **default_critical_threshold** | `indicator_templates` | Calcular STATUS (cores) | ✅ SIM |
| **target_value** | `user_indicators` | Meta pessoal, exibição | ❌ NÃO (cópia fixa) |

---

## 💡 **COMPORTAMENTO DO ALERTA**

### **Quando Aparece:**
- ✅ Ao clicar no campo "Meta" (`onFocus`)
- ✅ Se meta já tem valor (não é 0 ou vazio)
- ✅ Duração: 5 segundos

### **Quando NÃO Aparece:**
- ❌ Se meta está vazia/zerada (primeira vez)
- ❌ Se usuário não clicar no campo

### **Mensagem:**
```
⚠️ Meta Pessoal

Se você alterar a meta, ela será sua meta pessoal 
e não será afetada por mudanças do administrador 
no template.
```

---

## 🎯 **BENEFÍCIOS**

### **Para o Usuário:**
- ✅ **Meta inicial sensata:** Vem do template (admin definiu)
- ✅ **Flexibilidade:** Pode personalizar se quiser
- ✅ **Transparência:** Alerta explica o comportamento
- ✅ **Controle:** Decide se quer meta pessoal ou não

### **Para o Admin:**
- ✅ **Padrão centralizado:** Define meta inicial para todos
- ✅ **Controle de status:** Cores sempre usam threshold do template
- ✅ **Flexibilidade:** Usuários podem ter metas diferentes

### **Para o Sistema:**
- ✅ **Consistência:** Meta inicial vem de fonte confiável
- ✅ **Escalabilidade:** Fácil adicionar novos indicadores
- ✅ **Manutenibilidade:** Lógica clara e documentada

---

## 🧪 **TESTE DE VALIDAÇÃO**

### **Teste 1: Adicionar Indicador**

```
1. Admin: default_critical_threshold = 34.98
2. Usuário: Adicionar "Food Cost" ao Dashboard
3. Verificar: target_value = 34.98 ✅
4. Dashboard: Meta: 34.98% ✅
```

### **Teste 2: Alerta ao Editar**

```
1. Abrir modal de lançamento
2. Clicar no campo "Meta"
3. Verificar: Toast aparece ✅
4. Mensagem: "Meta Pessoal" ✅
5. Duração: 5 segundos ✅
```

### **Teste 3: Meta Pessoal**

```
1. Usuário altera meta para 40
2. Salva
3. Verificar: target_value = 40 ✅
4. Admin muda template para 50
5. Dashboard recarrega
6. Verificar: 
   - Meta exibida: 40 ✅ (pessoal)
   - Cores: Baseadas em 50 ✅ (template)
```

---

## 📝 **ARQUIVOS MODIFICADOS**

### **`src/pages/Store.tsx`:**

**Linha ~378-395:**
```typescript
// 🔧 v1.27: Sincronizar meta inicial com threshold do template
const initialTarget = templateData.default_critical_threshold || null;

console.log('📦 Adicionando indicador com meta inicial do template:', {
  template_name: templateData.name,
  default_critical_threshold: templateData.default_critical_threshold,
  initial_target: initialTarget
});

await supabase.from('user_indicators').insert({
  // ...
  target_value: initialTarget,  // 🔧 Meta inicial sincronizada!
  // ...
});
```

---

### **`src/components/dashboard/EditKPIModal.tsx`:**

**Linha ~839-854:**
```typescript
<Input
  id="targetValue"
  type="number"
  step="0.01"
  value={targetValue}
  onChange={(e) => setTargetValue(e.target.value)}
  onFocus={() => {
    // 🔧 v1.27: Alerta ao editar meta
    if (!targetValue || parseFloat(targetValue) === 0) return;
    toast({
      title: "⚠️ Meta Pessoal",
      description: "Se você alterar a meta, ela será sua meta pessoal e não será afetada por mudanças do administrador no template.",
      duration: 5000,
    });
  }}
  className="h-12"
  placeholder="Digite a meta desejada"
  disabled={loading}
/>
```

---

## 🔍 **TROUBLESHOOTING**

### **Se meta não vier do template:**

1. **Verificar Console:**
   ```javascript
   // Deve aparecer ao adicionar indicador:
   📦 Adicionando indicador com meta inicial do template: {
     template_name: "Food Cost",
     default_critical_threshold: 34.98,
     initial_target: 34.98
   }
   ```

2. **Verificar Banco:**
   ```sql
   SELECT 
     ui.name,
     ui.target_value,
     it.default_critical_threshold
   FROM user_indicators ui
   JOIN indicator_templates it ON ui.indicator_template_id = it.id
   WHERE ui.user_id = 'xxx';
   ```

3. **Verificar Template:**
   - Template tem `default_critical_threshold` definido?
   - Não é NULL?

---

### **Se alerta não aparecer:**

1. **Verificar Condições:**
   - Meta tem valor? (não é 0 ou vazio)
   - Está clicando no campo?

2. **Verificar Toast:**
   - `useToast` está importado?
   - Toast component está no layout?

3. **Console:**
   - Verificar se há erros no console

---

## ✅ **CHECKLIST DE VALIDAÇÃO**

- [x] Meta inicial copiada do template ao adicionar
- [x] Log de debug no console
- [x] Alerta implementado no onFocus
- [x] Mensagem clara e explicativa
- [x] Duração adequada (5 segundos)
- [x] Condição para não mostrar se meta vazia
- [x] Sem erros de linting
- [x] Testado: Adicionar indicador ✅
- [x] Testado: Alerta ao clicar na meta ✅
- [x] Testado: Meta pessoal independente ✅
- [x] Documentação completa

---

**Data:** 15/01/2026  
**Versão:** v1.27  
**Tipo:** Feature + UX Improvement  
**Status:** ✅ COMPLETO

---

**🎉 Sincronização Implementada! Meta inicial vem do template + Alerta ao editar!**

