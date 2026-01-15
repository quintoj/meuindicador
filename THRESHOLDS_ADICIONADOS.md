# ⚠️ Thresholds (Metas Padrão) Adicionados ao KPI Builder

## 📌 **O que foi implementado?**

Adicionados campos para definir **Metas de Alerta** e **Metas Críticas** padrão nos formulários de criação e edição de templates.

---

## ✨ **NOVOS CAMPOS**

### **Localização:**
Seção **⚙️ Configuração de Comportamento**, abaixo de Direção | Unidade | Método.

### **Campos Adicionados:**

```
⚠️ Meta de Alerta (Warning Threshold)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[5_________]  (Ex: Churn 5%)

Valores acima disso ficam amarelos*
```

```
🔴 Meta Crítica (Critical Threshold)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[8_________]  (Ex: Churn 8%)

Valores acima disso ficam vermelhos*
```

_*Texto adapta-se automaticamente conforme a **Direção**:_
- **LOWER_BETTER**: "Valores **acima** disso ficam..."
- **HIGHER_BETTER**: "Valores **abaixo** disso ficam..."

---

## 🎯 **USO PRÁTICO**

### **Exemplo: Taxa de Churn**

**Configuração:**
- **Direção**: Menor é Melhor (LOWER_BETTER)
- **Unidade**: Porcentagem (%)
- **⚠️ Meta de Alerta**: `5`
- **🔴 Meta Crítica**: `8`

**Resultado:**
```
Churn = 3%   → 🟢 VERDE   (Abaixo de 5%)
Churn = 6%   → 🟡 AMARELO (Entre 5% e 8%)
Churn = 10%  → 🔴 VERMELHO (Acima de 8%)
```

---

### **Exemplo: Faturamento**

**Configuração:**
- **Direção**: Maior é Melhor (HIGHER_BETTER)
- **Unidade**: Moeda (R$)
- **⚠️ Meta de Alerta**: `80000` (80% da meta)
- **🔴 Meta Crítica**: `60000` (60% da meta)

**Resultado (supondo meta de R$ 100.000):**
```
Faturamento = R$ 120.000 → 🟢 VERDE   (Acima da meta)
Faturamento = R$ 75.000  → 🟡 AMARELO (Entre 60k e 80k)
Faturamento = R$ 50.000  → 🔴 VERMELHO (Abaixo de 60k)
```

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **1. Estados Adicionados:**
```typescript
const [defaultWarningThreshold, setDefaultWarningThreshold] = useState<string>("");
const [defaultCriticalThreshold, setDefaultCriticalThreshold] = useState<string>("");
```

### **2. Salvamento no Banco:**
```typescript
const { error } = await supabase
  .from('indicator_templates')
  .insert({
    // ... outros campos
    default_warning_threshold: defaultWarningThreshold 
      ? parseFloat(defaultWarningThreshold) 
      : null,
    default_critical_threshold: defaultCriticalThreshold 
      ? parseFloat(defaultCriticalThreshold) 
      : null,
  });
```

### **3. Carregamento (EditTemplateModal):**
```typescript
setDefaultWarningThreshold(template.default_warning_threshold?.toString() || "");
setDefaultCriticalThreshold(template.default_critical_threshold?.toString() || "");
```

### **4. Grid Layout:**
```tsx
<div className="grid grid-cols-2 gap-4 pt-4 border-t">
  {/* Input Warning */}
  <div className="space-y-2">
    <Label>⚠️ Meta de Alerta</Label>
    <Input type="number" step="0.01" ... />
    <p className="text-xs text-muted-foreground">
      {direction === 'LOWER_BETTER' 
        ? 'Valores acima disso ficam amarelos' 
        : 'Valores abaixo disso ficam amarelos'}
    </p>
  </div>
  
  {/* Input Critical */}
  <div className="space-y-2">...</div>
</div>
```

---

## 🎨 **VISUAL**

### **Antes:**
```
⚙️ Configuração de Comportamento
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Direção | Unidade | Método
[...]   [...]     [...]
```

### **Agora:**
```
⚙️ Configuração de Comportamento
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Direção | Unidade | Método
[...]   [...]     [...]

────────────────────────────────

⚠️ Meta de Alerta  🔴 Meta Crítica
[5_________]       [8_________]
Valores acima...   Valores acima...
```

---

## 📊 **BANCO DE DADOS**

### **Colunas Usadas:**
```sql
CREATE TABLE indicator_templates (
  -- ... outras colunas
  default_warning_threshold NUMERIC(10,2),   -- Ex: 5.00 (para 5%)
  default_critical_threshold NUMERIC(10,2),  -- Ex: 8.00 (para 8%)
  -- ...
);
```

### **Exemplo de Insert:**
```sql
INSERT INTO indicator_templates (
  name, 
  direction, 
  unit_type,
  default_warning_threshold,
  default_critical_threshold
) VALUES (
  'Taxa de Churn',
  'LOWER_BETTER',
  'percentage',
  5.0,   -- Amarelo acima de 5%
  8.0    -- Vermelho acima de 8%
);
```

---

## 🧪 **TESTE**

### **1. Criar Novo Indicador com Thresholds:**
1. Login como Admin
2. Store → **Novo Template**
3. Preencha:
   - Nome: "Taxa de Inadimplência"
   - Direção: **Menor é Melhor**
   - Unidade: **Porcentagem**
   - ⚠️ Meta de Alerta: `5`
   - 🔴 Meta Crítica: `10`
4. Salve
5. **Verifique no banco:**
   ```sql
   SELECT name, default_warning_threshold, default_critical_threshold 
   FROM indicator_templates 
   WHERE name = 'Taxa de Inadimplência';
   ```
   **Esperado:** `5.00`, `10.00`

---

### **2. Editar Indicador Existente:**
1. Store → Clique em ✏️ de um template
2. **Verifique:**
   - ✅ Se o template tem thresholds, eles devem aparecer preenchidos
   - ✅ Se não tem, os campos devem estar vazios
3. Altere os valores:
   - ⚠️ `3`
   - 🔴 `7`
4. Salve
5. **Verifique no banco** se os valores foram atualizados

---

### **3. Validação de Texto Dinâmico:**
1. Crie indicador com **Maior é Melhor** (HIGHER_BETTER)
2. **Verifique o texto:**
   - Deve dizer: "Valores **abaixo** disso ficam amarelos"
3. Mude para **Menor é Melhor** (LOWER_BETTER)
4. **Verifique o texto:**
   - Deve mudar para: "Valores **acima** disso ficam amarelos"

---

## 📝 **BENEFÍCIOS**

### **Para o Admin:**
- ✅ Define thresholds padrão uma única vez
- ✅ Evita que cada usuário precise adivinhar a meta
- ✅ Padroniza interpretação de "bom" vs "ruim" para toda a base

### **Para o Usuário:**
- ✅ Indicadores chegam com status correto (verde/amarelo/vermelho)
- ✅ Não precisa se preocupar em definir limites
- ✅ Foco em apenas lançar dados, não em configurar

### **Para o Sistema:**
- ✅ Cálculo de status mais preciso (usando thresholds do template)
- ✅ Consistência entre usuários do mesmo segmento
- ✅ Base para alertas e notificações futuras

---

## 🔗 **INTEGRAÇÃO FUTURA**

Esses thresholds podem ser usados:

1. **No EditKPIModal**: Pré-preencher o campo "Meta" com o `default_warning_threshold` na primeira vez.
2. **No KPICard**: Usar os thresholds para calcular status quando o usuário não definiu meta personalizada.
3. **Em Alertas**: Enviar notificação quando um valor ultrapassar `default_critical_threshold`.
4. **Em Relatórios**: Mostrar quantos indicadores estão em zona crítica vs. zona de alerta.

---

## 📊 **ARQUIVOS MODIFICADOS**

- ✅ `src/components/store/AddTemplateModal.tsx`
  - Adicionados estados `defaultWarningThreshold`, `defaultCriticalThreshold`
  - Adicionados inputs na seção de Configuração
  - Atualizado salvamento no banco

- ✅ `src/components/store/EditTemplateModal.tsx`
  - Adicionados estados
  - Carregamento dos valores do template
  - Adicionados inputs
  - Atualizado salvamento no banco

- ✅ `THRESHOLDS_ADICIONADOS.md`
  - Documentação completa

---

## 🎯 **STATUS**

**Data:** 15/01/2026  
**Versão:** v1.15.1  
**Criticidade:** 🟡 MÉDIA (Melhoria de UX e Funcionalidade Admin)  
**Status:** ✅ **COMPLETO**

---

## ✅ **CHECKLIST**

- ✅ Estados adicionados em ambos os modais
- ✅ Inputs numéricos com step 0.01
- ✅ Grid cols-2 (lado a lado)
- ✅ Labels com emojis (⚠️, 🔴)
- ✅ Texto dinâmico baseado em `direction`
- ✅ Salvamento no banco (parse float)
- ✅ Carregamento correto no EditTemplateModal
- ✅ Valores opcionais (null se vazio)
- ✅ Reset dos campos no AddTemplateModal
- ✅ Sem erros de linting

---

**🎉 Thresholds Implementados! Agora os admins podem definir metas padrão para cada indicador!**

