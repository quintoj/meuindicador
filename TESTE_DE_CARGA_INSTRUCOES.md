# 🔬 SCRIPT DE TESTE DE CARGA - VALIDAÇÃO DE SEMÁFORO

## 📋 **INSTRUÇÕES DE USO**

### **1. Acesse o Supabase SQL Editor**
1. Abra o projeto no Supabase Dashboard
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**

---

### **2. Execute o Script**
1. Copie **TODO** o conteúdo do arquivo `supabase/test_data_load.sql`
2. Cole no SQL Editor
3. Clique em **RUN** (ou pressione `Ctrl+Enter`)

---

### **3. Verifique o Resultado**

Você verá mensagens no console:

```
🧹 Limpando dados anteriores...
✅ Dados limpos!

📊 Inserindo Cenário 1: Churn (VERMELHO)...
✅ Churn inserido (ID: ...)

📊 Inserindo Cenário 2: Vendas (VERDE)...
✅ Vendas inserido (ID: ...)

📊 Inserindo Cenário 3: Inadimplência (VERDE)...
✅ Inadimplência inserido (ID: ...)

📊 Inserindo Cenário 4: Lucro por m² (VERDE)...
✅ Lucro por m² inserido (ID: ...)

═══════════════════════════════════════════════════
✅ CARGA COMPLETA!
═══════════════════════════════════════════════════

📊 Indicadores inseridos para user_id: b1e19597-...

🔴 VERMELHO: Churn 10% (meta 5%) - LOWER_BETTER
🟢 VERDE:    Vendas 25 (meta 20) - HIGHER_BETTER
🟢 VERDE:    Inadimplência 2% (meta 5%) - LOWER_BETTER
🟢 VERDE:    Lucro/m² R$ 50 (meta R$ 40) - HIGHER_BETTER
```

---

### **4. Tabela de Verificação**

Após o script, uma tabela será exibida:

| Indicador | Valor Atual | Meta | Direction | Status Esperado |
|-----------|-------------|------|-----------|-----------------|
| Churn | 10.0 | 5.0 | LOWER_BETTER | 🔴 VERMELHO |
| Vendas | 25.0 | 20.0 | HIGHER_BETTER | 🟢 VERDE |
| Inadimplência | 2.0 | 5.0 | LOWER_BETTER | 🟢 VERDE |
| Lucro/m² | 50.0 | 40.0 | HIGHER_BETTER | 🟢 VERDE |

---

## 🎯 **CENÁRIOS DE TESTE**

### **Cenário 1: Churn (VERMELHO) 🔴**
```
Template: "Taxa de Churn (Cancelamento)"
Direction: LOWER_BETTER (quanto menor, melhor)
Meta: 5%
Valor Atual: 10%
Resultado: 10 > 5 → VERMELHO (crítico!)
```

### **Cenário 2: Vendas (VERDE) 🟢**
```
Template: "Vendas Diárias"
Direction: HIGHER_BETTER (quanto maior, melhor)
Meta: 20
Valor Atual: 25
Resultado: 25 > 20 → VERDE (ótimo!)
```

### **Cenário 3: Inadimplência (VERDE) 🟢**
```
Template: "Taxa de Inadimplência"
Direction: LOWER_BETTER (quanto menor, melhor)
Meta: 5%
Valor Atual: 2%
Resultado: 2 < 5 → VERDE (ótimo!)
```

### **Cenário 4: Lucro por m² (VERDE) 🟢**
```
Template: "Lucro por m²"
Direction: HIGHER_BETTER (quanto maior, melhor)
Meta: R$ 40
Valor Atual: R$ 50
Resultado: 50 > 40 → VERDE (ótimo!)
```

---

## 📊 **LÓGICA DE SEMÁFORO**

### **HIGHER_BETTER (Maior é Melhor):**
```
🟢 VERDE:    valor >= meta
🟡 AMARELO:  valor >= meta * 0.8 (80%)
🔴 VERMELHO: valor < meta * 0.8 (<80%)
```

### **LOWER_BETTER (Menor é Melhor):**
```
🟢 VERDE:    valor <= meta
🟡 AMARELO:  valor <= meta * 1.2 (120%)
🔴 VERMELHO: valor > meta * 1.2 (>120%)
```

---

## 🧪 **TESTAR NO FRONTEND**

### **1. Faça Login:**
```
Email: b1e19597-96e9-457a-aac0-bd17417fb003 (ou crie usuário com este ID)
```

### **2. Vá para o Dashboard:**
```
http://localhost:5173/dashboard
```

### **3. Verifique as Cores:**
- ✅ **Churn** deve aparecer **VERMELHO** 🔴
- ✅ **Vendas** deve aparecer **VERDE** 🟢
- ✅ **Inadimplência** deve aparecer **VERDE** 🟢
- ✅ **Lucro/m²** deve aparecer **VERDE** 🟢

---

## 🔧 **O QUE O SCRIPT FAZ:**

### **1. Limpeza:**
```sql
DELETE FROM user_indicators 
WHERE user_id = 'b1e19597-96e9-457a-aac0-bd17417fb003';
```

### **2. Busca Templates:**
```sql
SELECT id FROM indicator_templates 
WHERE name ILIKE '%churn%' 
LIMIT 1;
```

### **3. Inserção:**
```sql
INSERT INTO user_indicators (
  user_id,
  indicator_template_id,  -- ✅ Nome correto da coluna FK
  name,
  current_value,
  target_value,
  format,
  last_inputs,
  is_active
) VALUES (...);
```

### **4. Criação Automática:**
Se um template não existir, o script **cria automaticamente** com:
- Nome
- Descrição
- Fórmula
- Direction (HIGHER_BETTER ou LOWER_BETTER)
- Unit Type
- Input Fields (JSONB)

---

## 🐛 **TROUBLESHOOTING**

### **Erro: "User ID não encontrado"**
**Solução:** Crie um usuário no Supabase Auth com este ID específico, ou altere o ID no script.

### **Erro: "Template não encontrado"**
**Solução:** O script cria automaticamente! Se persistir, verifique se a tabela `indicator_templates` está vazia.

### **Erro: "Column 'template_id' does not exist"**
**Solução:** ✅ **JÁ CORRIGIDO!** O script usa `indicator_template_id` (nome correto).

### **Nenhum dado aparece no Dashboard:**
**Solução:** 
1. Verifique o `user_id` logado no frontend
2. Execute o script com o ID correto
3. Verifique `is_active = true`

---

## 📝 **DETALHES TÉCNICOS**

### **Coluna FK Correta:**
```typescript
// src/integrations/supabase/types.ts
user_indicators: {
  Row: {
    id: string
    user_id: string
    indicator_template_id: string  // ✅ Nome correto!
    name: string
    current_value: number | null
    target_value: number | null
    format: "currency" | "percentage" | "number"
    last_inputs: Json | null
    is_active: boolean | null
    created_at: string
    updated_at: string | null
  }
}
```

### **Last Inputs JSON:**
```json
{
  "fixed": {
    "ativos_inicio": "100"
  },
  "daily": {
    "cancelamentos": "10"
  }
}
```

---

## 🎯 **VALIDAÇÃO FINAL**

### **Query Manual:**
```sql
SELECT 
  ui.name,
  ui.current_value,
  ui.target_value,
  it.direction,
  CASE 
    WHEN it.direction = 'HIGHER_BETTER' AND ui.current_value >= ui.target_value THEN '🟢'
    WHEN it.direction = 'LOWER_BETTER' AND ui.current_value <= ui.target_value THEN '🟢'
    ELSE '🔴'
  END AS cor
FROM user_indicators ui
JOIN indicator_templates it ON ui.indicator_template_id = it.id
WHERE ui.user_id = 'b1e19597-96e9-457a-aac0-bd17417fb003';
```

---

## ✅ **CHECKLIST DE VALIDAÇÃO**

- [ ] Script executado sem erros
- [ ] 4 indicadores inseridos
- [ ] Tabela de verificação exibida
- [ ] Churn aparece como VERMELHO no console
- [ ] Outros aparecem como VERDE no console
- [ ] Dashboard carregou os 4 indicadores
- [ ] Cores corretas no frontend
- [ ] Percentuais calculados corretamente
- [ ] Badges de performance visíveis

---

**Data:** 15/01/2026  
**Versão:** v1.15.2  
**Arquivo:** `supabase/test_data_load.sql`  
**Status:** ✅ PRONTO PARA USO

---

**🎉 Script Pronto! Execute no Supabase e valide o semáforo!**

