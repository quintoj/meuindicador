import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Info, Loader2, Calendar as CalendarIcon, Sparkles, TrendingUp, HelpCircle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  format: "currency" | "percentage" | "number";
  icon: any;
  segment: string;
  template?: {
    id: string;
    name: string;
    formula: string;
    required_data: any;
    input_fields: any;
    calc_method: string;
    direction: string;
    unit_type: string;
    default_target?: number | null;
    default_warning_threshold?: number | null;
    default_critical_threshold?: number | null;
  };
}

interface EditKPIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: KPI;
  onSave: () => void;
}

// Mapeamento de hints para campos comuns
const fieldHints: Record<string, string> = {
  "faturamento": "Veja no seu extrato bancário ou sistema de vendas",
  "receita": "Veja no seu extrato bancário ou sistema de vendas",
  "clientes": "Conte o número total de clientes no período",
  "agendamentos": "Confira sua agenda ou sistema de agendamento",
  "serviços": "Conte os serviços realizados no período",
  "cancelamentos": "Verifique quantos clientes cancelaram",
  "ativos": "Clientes com contrato vigente",
  "check-ins": "Registros de entrada dos clientes",
  "ocupações": "Quantas vezes as mesas foram ocupadas",
  "mesas": "Número total de mesas disponíveis",
  "ingredientes": "Custo total dos ingredientes usados",
  "estoque": "Valor atual do estoque",
  "gastos": "Some todos os gastos do período",
  "marketing": "Investimento em anúncios e marketing",
  "novos": "Novos clientes que entraram no período",
  "compras": "Número de compras realizadas",
  "ticket": "Valor médio gasto por cliente",
  "período": "Defina o período de análise (dia/semana/mês)",
};

// ============================================
// FUNÇÕES AUXILIARES (FORA DO COMPONENTE)
// ============================================

// Converter nome do campo em label amigável
const formatFieldLabel = (field: string): string => {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

// Detectar se um campo é de texto (informativo)
const isTextField = (field: string): boolean => {
  const fieldLower = field.toLowerCase();
  const textKeywords = ['status', 'nome', 'descricao', 'tipo', 'categoria', 'observacao', 'comentario', 'nota'];
  return textKeywords.some(keyword => fieldLower === keyword || fieldLower.startsWith(keyword + '_'));
};

// Se não é campo de texto, é numérico
const isNumericField = (field: string): boolean => {
  return !isTextField(field);
};

// Obter hint contextual para um campo
const getFieldHint = (field: string): string => {
  const fieldLower = field.toLowerCase();

  for (const [key, hint] of Object.entries(fieldHints)) {
    if (fieldLower.includes(key)) {
      return hint;
    }
  }

  return "Insira o valor deste dado para o período selecionado";
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const EditKPIModal = ({ open, onOpenChange, kpi, onSave }: EditKPIModalProps) => {
  const [targetValue, setTargetValue] = useState(kpi.target.toString());
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [formula, setFormula] = useState<string>("");
  const [requiredData, setRequiredData] = useState<string[]>([]);
  const [dynamicInputs, setDynamicInputs] = useState<Record<string, string>>({});
  const [calculatedResult, setCalculatedResult] = useState<number>(0);
  const [quickInput, setQuickInput] = useState("");
  const [activeTab, setActiveTab] = useState("manual");
  const { toast } = useToast();

  // ============================================
  // DERIVED STATE com useMemo - DEVE VIR ANTES DE TUDO!
  // ============================================

  // Modificar a estrutura para suportar {slug, label}
  const { numericFields, textFields, showDynamicInputs } = useMemo(() => {
    console.log('🔍 ===== CALCULANDO CAMPOS (useMemo) =====');
    const template = kpi.template;

    let dynamicFields: { slug: string; label: string }[] = [];

    // Extrair campos do input_fields (JSONB)
    if (template?.input_fields) {
      try {
        let inputFieldsJSON: any;

        if (typeof template.input_fields === 'string') {
          inputFieldsJSON = JSON.parse(template.input_fields);
        } else {
          inputFieldsJSON = template.input_fields;
        }

        const fixed = Array.isArray(inputFieldsJSON.fixed) ? inputFieldsJSON.fixed : [];
        const daily = Array.isArray(inputFieldsJSON.daily) ? inputFieldsJSON.daily : [];
        const rawFields = [...fixed, ...daily];

        // Normalizar para objeto {slug, label}
        dynamicFields = rawFields.map((field: any) => {
          if (typeof field === 'string') {
            return { slug: field, label: field };
          }
          return { slug: field.slug, label: field.nome || field.name || field.slug };
        });

        console.log('✅ Campos de input_fields:', dynamicFields);
      } catch (err) {
        console.error('❌ Erro ao processar input_fields:', err);
      }
    }

    // FALLBACK: required_data
    if (dynamicFields.length === 0 && template?.required_data) {
      try {
        let rawData: string[] = [];
        if (Array.isArray(template.required_data)) {
          rawData = template.required_data;
        } else if (typeof template.required_data === 'string') {
          const parsed = JSON.parse(template.required_data);
          rawData = Array.isArray(parsed) ? parsed : [];
        }
        dynamicFields = rawData.map(str => ({ slug: str, label: str }));
        console.log('⚠️ Usando fallback required_data:', dynamicFields);
      } catch (err) {
        console.error('❌ Erro ao processar required_data:', err);
      }
    }

    // Filtrar campos
    const numeric = dynamicFields.filter(field => isNumericField(field.slug));
    const text = dynamicFields.filter(field => isTextField(field.slug));
    const showDynamic = numeric.length > 0;

    console.log('✅ Resultado:', { numeric, text, showDynamic });
    console.log('=============================');

    return {
      numericFields: numeric,
      textFields: text,
      showDynamicInputs: showDynamic
    };
  }, [kpi.template]); // Só recalcula se o template mudar

  // Carregar dados do template quando o modal abrir
  useEffect(() => {
    if (open) {
      console.log('🔍 Modal aberto com KPI:', kpi);
      console.log('📊 Template Data:', kpi.template);

      // Se o template já veio do Dashboard, usar diretamente
      if (kpi.template) {
        loadTemplateFromKPI();
      } else {
        // Fallback: buscar template do banco
        fetchTemplateData();
      }

      setActiveTab("manual");
      setQuickInput("");
    }
  }, [open, kpi]);

  // Resetar valores quando o modal abrir
  useEffect(() => {
    if (open) {
      // Preencher Meta automaticamente com o valor salvo
      const targetVal = kpi.target || 0;
      setTargetValue(targetVal.toString());
      console.log('📊 Meta carregada:', targetVal);

      setRecordedDate(new Date().toISOString().split('T')[0]);
      setCalculatedResult(kpi.value || 0);

      // 🔄 CARREGAR últimos inputs salvos (se existirem)
      loadLastInputs();
    }
  }, [open, kpi]);

  // 🎯 Usar default_target como meta principal do Admin
  const templateDefaultTarget =
    (kpi.template?.default_target !== null && kpi.template?.default_target !== undefined)
      ? Number(kpi.template.default_target)
      : null;

  // Carregar últimos inputs salvos do banco
  const loadLastInputs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('user_indicators')
        .select('last_inputs')
        .eq('id', kpi.id)
        .single();

      if (!error && data?.last_inputs) {
        console.log('🔄 Carregando últimos inputs:', data.last_inputs);
        setDynamicInputs(data.last_inputs);
      } else {
        console.log('ℹ️ Sem inputs salvos anteriormente');
      }
    } catch (err) {
      console.error('Erro ao carregar last_inputs:', err);
    }
  };

  // Carregar template a partir do KPI (que já veio do Dashboard)
  const loadTemplateFromKPI = () => {
    if (!kpi.template) return;

    const template = kpi.template;
    console.log('✅ Usando template do KPI:', template);

    setFormula(template.formula || '');

    // PRIORIDADE 1: Usar input_fields (JSONB) se existir
    let dataArray: string[] = [];
    if (template.input_fields) {
      try {
        const inputFields = typeof template.input_fields === 'string'
          ? JSON.parse(template.input_fields)
          : template.input_fields;

        console.log('📝 input_fields encontrado:', inputFields);

        // Combinar campos fixed e daily
        const fixedFields = inputFields.fixed || [];
        const dailyFields = inputFields.daily || [];
        // Extract just slugs for data array to keep compatibility
        dataArray = [...fixedFields, ...dailyFields].map((f: any) => typeof f === 'string' ? f : f.slug);

        console.log('✅ Campos extraídos de input_fields:', dataArray);
      } catch (err) {
        console.error('❌ Erro ao processar input_fields:', err);
      }
    }

    // FALLBACK: Usar required_data se input_fields não existir
    if (dataArray.length === 0 && template.required_data) {
      console.log('⚠️ Usando fallback: required_data');
      if (Array.isArray(template.required_data)) {
        dataArray = template.required_data;
      } else if (typeof template.required_data === 'string') {
        try {
          const parsed = JSON.parse(template.required_data);
          dataArray = Array.isArray(parsed) ? parsed : [];
        } catch {
          dataArray = [];
        }
      }
    }

    console.log('🎯 Campos finais para renderizar:', dataArray);
    setRequiredData(dataArray);

    // Inicializar inputs dinâmicos
    const initialInputs: Record<string, string> = {};
    dataArray.forEach(field => {
      initialInputs[field] = '';
    });
    setDynamicInputs(initialInputs);
  };

  const fetchTemplateData = async () => {
    try {
      setLoadingTemplate(true);

      // Buscar o template do indicador através do user_indicator
      const { data: userIndicator } = await (supabase as any)
        .from('user_indicators')
        .select('indicator_template_id')
        .eq('id', kpi.id)
        .single();

      if (userIndicator?.indicator_template_id) {
        const { data: template, error } = await (supabase as any)
          .from('indicator_templates')
          .select('formula, required_data, input_fields, calc_method')
          .eq('id', userIndicator.indicator_template_id)
          .single();

        if (!error && template) {
          console.log('Template carregado:', template);
          setFormula(template.formula || '');

          // PRIORIDADE 1: Usar input_fields (JSONB) se existir
          let dataArray: string[] = [];
          if (template.input_fields) {
            try {
              const inputFields = typeof template.input_fields === 'string'
                ? JSON.parse(template.input_fields)
                : template.input_fields;

              console.log('input_fields encontrado:', inputFields);

              // Combinar campos fixed e daily
              const fixedFields = inputFields.fixed || [];
              const dailyFields = inputFields.daily || [];
              dataArray = [...fixedFields, ...dailyFields].map((f: any) => typeof f === 'string' ? f : f.slug);

              console.log('Campos extraídos de input_fields:', dataArray);
            } catch (err) {
              console.error('Erro ao processar input_fields:', err);
            }
          }

          // FALLBACK: Usar required_data se input_fields não existir
          if (dataArray.length === 0 && template.required_data) {
            console.log('Usando fallback: required_data');
            if (Array.isArray(template.required_data)) {
              dataArray = template.required_data;
            } else if (typeof template.required_data === 'string') {
              try {
                const parsed = JSON.parse(template.required_data);
                dataArray = Array.isArray(parsed) ? parsed : [];
              } catch {
                dataArray = [];
              }
            }
          }

          console.log('Campos finais para renderizar:', dataArray);
          setRequiredData(dataArray);

          // Inicializar inputs dinâmicos
          const initialInputs: Record<string, string> = {};
          dataArray.forEach(field => {
            initialInputs[field] = '';
          });
          setDynamicInputs(initialInputs);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar template:', err);
    } finally {
      setLoadingTemplate(false);
    }
  };

  // Funções auxiliares agora estão FORA do componente (acima)

  // Calcular resultado em tempo real quando inputs mudam
  useEffect(() => {
    if (!formula || numericFields.length === 0) {
      console.log('⏭️ Pulando cálculo: sem fórmula ou sem campos');
      return;
    }

    console.log('🧮 Calculando resultado...');
    console.log('  - formula:', formula);
    console.log('  - numericFields:', numericFields);
    console.log('  - dynamicInputs:', dynamicInputs);

    try {
      // Verificar se todos os campos numéricos foram preenchidos
      const allFilled = numericFields.every(field => {
        const value = dynamicInputs[field.slug];
        const isFilled = value !== undefined && value !== '' && !isNaN(parseFloat(value));
        console.log(`  - "${field.slug}": valor="${value}", preenchido=${isFilled}`);
        return isFilled;
      });

      if (!allFilled) {
        console.log('  ⏸️ Ainda não: campos não preenchidos');
        setCalculatedResult(0);
        return;
      }

      // 🔥 CORREÇÃO CRÍTICA: Substituir variáveis POR NOME, não por índice
      let formulaProcessed = formula;

      console.log('  📝 Substituindo variáveis na fórmula:');
      console.log('  - Fórmula ORIGINAL:', formula);

      // Substituir cada variável pelo seu valor correspondente (pelo NOME)
      Object.entries(dynamicInputs).forEach(([fieldName, fieldValue]) => {
        const numericValue = parseFloat(fieldValue as string) || 0;

        // Criar regex com word boundary para evitar substituições parciais
        // Ex: "ativos" não deve substituir "ativos_inicio"
        const regex = new RegExp(`\\b${fieldName}\\b`, 'gi');

        // Contar quantas vezes a variável aparece na fórmula
        const matches = formulaProcessed.match(regex);

        if (matches && matches.length > 0) {
          console.log(`    ✅ "${fieldName}" → ${numericValue} (encontrado ${matches.length}x)`);
          formulaProcessed = formulaProcessed.replace(regex, String(numericValue));
        } else {
          console.log(`    ⚠️ "${fieldName}" não encontrado na fórmula`);
        }
      });

      console.log('  - Fórmula PROCESSADA:', formulaProcessed);

      // Avaliar a expressão matemática
      const result = evaluateSafeExpression(formulaProcessed);

      if (!isNaN(result) && isFinite(result)) {
        const rounded = Math.round(result * 100) / 100;
        console.log(`  ✅ RESULTADO FINAL: ${rounded}`);
        setCalculatedResult(rounded);
      } else {
        console.log('  ❌ Resultado inválido:', result);
        setCalculatedResult(0);
      }
    } catch (err) {
      console.error('❌ Erro ao calcular:', err);
      setCalculatedResult(0);
    }
  }, [dynamicInputs, formula, numericFields]);

  // Avaliador de expressão matemática seguro (sem eval)
  const evaluateSafeExpression = (expr: string): number => {
    try {
      // Remove espaços e caracteres não numéricos/operadores
      expr = expr.replace(/[^0-9+\-*/().]/g, '');

      // Usa Function para avaliar de forma mais segura que eval
      const result = Function('"use strict"; return (' + expr + ')')();
      return parseFloat(result);
    } catch {
      return 0;
    }
  };

  const handleDynamicInputChange = (field: string, value: string) => {
    setDynamicInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const processQuickInput = () => {
    if (!quickInput.trim()) return;

    // IA simples: extrai números do texto
    const numbers = quickInput.match(/\d+[.,]?\d*/g);

    if (numbers && numbers.length > 0) {
      const normalizedNumbers = numbers.map(n => n.replace(',', '.'));

      // Mapear números para campos na ordem (usar dynamicFields do derived state)
      const fieldsToFill = numericFields.length > 0 ? numericFields.map(f => f.slug) : Object.keys(dynamicInputs);
      const newInputs = { ...dynamicInputs };
      fieldsToFill.forEach((fieldSlug, index) => {
        if (index < normalizedNumbers.length) {
          newInputs[fieldSlug] = normalizedNumbers[index];
        }
      });

      setDynamicInputs(newInputs);
      setActiveTab("manual");

      toast({
        title: "Dados extraídos!",
        description: `${numbers.length} valor(es) identificado(s) no texto.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Nenhum número encontrado",
        description: "Tente colar um texto com números, ex: 'Faturamento: 5000, Clientes: 100'",
      });
    }
  };

  const handleSave = async () => {
    try {
      console.log('=== INICIANDO SALVAMENTO ===');
      console.log('calculatedResult:', calculatedResult);
      console.log('targetValue:', targetValue);
      console.log('dynamicInputs:', dynamicInputs);
      console.log('numericFields:', numericFields);

      setLoading(true);

      let finalValue = calculatedResult;
      const targetValueNum = parseFloat(targetValue) || 0;

      console.log('numericFields (from derived state):', numericFields);

      // Se não há campos numéricos (fallback manual), usar o valor digitado
      if (numericFields.length === 0) {
        // Modo manual: não há campos dinâmicos, usar calculatedResult diretamente
        finalValue = calculatedResult;
      }

      // Validação mais permissiva: se há campos, verificar se foram preenchidos
      if (numericFields.length > 0) {
        const anyFilled = numericFields.some(field => {
          const value = dynamicInputs[field.slug];
          return value !== undefined && value !== '' && !isNaN(parseFloat(value));
        });

        console.log('anyFilled:', anyFilled);
        console.log('finalValue:', finalValue);

        if (!anyFilled) {
          toast({
            variant: "destructive",
            title: "Preencha os campos",
            description: "Por favor, preencha os dados necessários para calcular o resultado.",
          });
          setLoading(false);
          return;
        }

        // Se os campos estão preenchidos mas o resultado é 0, permitir salvar 0
        // (pode ser um indicador onde o resultado realmente é zero)
      }

      // Se não há campos e o valor é 0, não permitir salvar
      if (finalValue === 0 && numericFields.length === 0) {
        toast({
          variant: "destructive",
          title: "Valor inválido",
          description: "Por favor, insira um valor maior que zero.",
        });
        setLoading(false);
        return;
      }

      console.log('Passou nas validações, finalValue:', finalValue);

      // Obter usuário autenticado
      console.log('Obtendo usuário...');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('Erro: usuário não autenticado');
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para atualizar indicadores.",
        });
        setLoading(false);
        return;
      }

      console.log('Usuário:', user.id);

      // 1. UPDATE na tabela user_indicators (incluindo last_inputs)
      console.log('Fazendo UPDATE em user_indicators...');
      console.log('💾 Salvando inputs para próxima vez:', dynamicInputs);

      const { error: updateError } = await (supabase as any)
        .from('user_indicators')
        .update({
          current_value: finalValue,
          target_value: targetValueNum,
          last_inputs: dynamicInputs, // 💾 Salvar inputs para "memória"
          updated_at: new Date().toISOString(),
        })
        .eq('id', kpi.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Erro no UPDATE:', updateError);
        throw updateError;
      }

      console.log('UPDATE realizado com sucesso!');

      // 2. INSERT na tabela indicator_history (apenas o resultado final calculado)
      console.log('Fazendo INSERT em indicator_history...');
      const { error: historyError } = await (supabase as any)
        .from('indicator_history')
        .insert({
          user_indicator_id: kpi.id,
          value: finalValue,
          recorded_at: new Date(recordedDate).toISOString(),
          notes: null,
        });

      if (historyError) {
        console.error('Erro ao salvar histórico:', historyError);
      } else {
        console.log('INSERT no histórico realizado com sucesso!');
      }

      toast({
        title: "Indicador atualizado!",
        description: `${kpi.name} foi atualizado com sucesso.`,
      });

      // Limpar campos
      setDynamicInputs({});
      setQuickInput("");

      console.log('Fechando modal e atualizando tela...');
      // Fechar modal e atualizar a tela
      onOpenChange(false);
      onSave();

      console.log('=== SALVAMENTO CONCLUÍDO COM SUCESSO ===');

    } catch (err: any) {
      console.error('Erro ao salvar indicador:', err);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err.message || "Não foi possível atualizar o indicador. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
            <span>{kpi.name}</span>
            {calculatedResult > 0 && (
              <Badge variant="default" className="bg-gradient-primary text-white">
                Resultado: {calculatedResult.toLocaleString('pt-BR')}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">
              <Calculator className="w-4 h-4 mr-2" />
              Entrada Manual
            </TabsTrigger>
            <TabsTrigger value="quick">
              <Sparkles className="w-4 h-4 mr-2" />
              Entrada Rápida (IA)
            </TabsTrigger>
          </TabsList>

          {/* Aba: Entrada Manual */}
          <TabsContent value="manual" className="space-y-6 mt-4">
            {/* Seção: Como Calcular */}
            {formula && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-1">Fórmula de Cálculo</h3>
                      <p className="text-sm text-muted-foreground">{formula}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ============================================ */}
            {/* INPUTS DINÂMICOS vs FALLBACK */}
            {/* ============================================ */}
            {showDynamicInputs ? (
              /* ✅ MODO DINÂMICO: Renderiza inputs baseados em input_fields */
              <div className="space-y-4 mb-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Dados do Indicador</h4>
                  <Badge variant="secondary" className="text-xs">
                    {numericFields.length} campo{numericFields.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Campos Numéricos */}
                {numericFields.map((field, index) => (
                  <div key={`dynamic-${field.slug}-${index}`} className="space-y-1">
                    <Label htmlFor={`field-${index}`} className="capitalize text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                      <Calculator className="w-3 h-3 text-primary" />
                      <span>{field.label} ({field.slug})</span>
                    </Label>
                    <Input
                      id={`field-${index}`}
                      type="number"
                      step="0.01"
                      value={dynamicInputs[field.slug] || ''}
                      onChange={(e) => handleDynamicInputChange(field.slug, e.target.value)}
                      className="bg-white dark:bg-slate-800 h-10"
                      placeholder="0"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground flex items-start space-x-1">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{getFieldHint(field.slug)}</span>
                    </p>
                  </div>
                ))}

                {/* Campos de Texto (informativos) */}
                {textFields.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-dashed">
                    <div className="flex items-center space-x-2">
                      <Info className="w-3 h-3 text-muted-foreground" />
                      <h4 className="text-xs font-medium text-muted-foreground">Informações Adicionais (opcional)</h4>
                    </div>

                    {textFields.map((field, index) => (
                      <div key={`text-${index}`} className="space-y-1">
                        <Label htmlFor={`text-field-${index}`} className="capitalize text-xs text-gray-500 dark:text-gray-400">
                          {field.label}
                        </Label>
                        <Input
                          id={`text-field-${index}`}
                          type="text"
                          value={dynamicInputs[field.slug] || ''}
                          onChange={(e) => handleDynamicInputChange(field.slug, e.target.value)}
                          className="h-9 bg-muted/30 border-muted"
                          placeholder={`Ex: ${field.label.toLowerCase()}`}
                          disabled={loading}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Área de Resultado Preliminar */}
                <div className="pt-2 border-t mt-3">
                  <Label className="text-xs text-muted-foreground">Resultado Preliminar</Label>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {calculatedResult > 0 ? calculatedResult.toLocaleString('pt-BR') : '...'}
                  </div>
                </div>
              </div>
            ) : (
              /* ⚠️ MODO FALLBACK: Input manual simples (indicadores antigos sem input_fields) */
              <div className="space-y-2">
                <Label htmlFor="manualValue" className="text-base font-semibold flex items-center space-x-2">
                  <span>Valor Atual (Resultado)</span>
                  <Badge variant="secondary" className="text-xs">Manual</Badge>
                </Label>
                <Input
                  id="manualValue"
                  type="number"
                  step="0.01"
                  value={calculatedResult}
                  onChange={(e) => setCalculatedResult(parseFloat(e.target.value) || 0)}
                  className="text-2xl font-bold h-16 text-center"
                  placeholder="0"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Este indicador não possui campos dinâmicos. Digite o valor manualmente.
                </p>
              </div>
            )}

            {loadingTemplate && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Carregando informações do indicador...</span>
              </div>
            )}
          </TabsContent>

          {/* Aba: Entrada Rápida com IA */}
          <TabsContent value="quick" className="space-y-4 mt-4">
            <Card className="bg-gradient-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3 mb-4">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-1">Como funciona?</h3>
                    <p className="text-sm text-muted-foreground">
                      Cole um texto com os dados (relatório, planilha, mensagem) e a IA extrairá os números automaticamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="quickInput" className="text-base font-medium">
                Cole seu texto aqui
              </Label>
              <Textarea
                id="quickInput"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Ex: Faturamento total foi de 15.000 reais com 120 clientes atendidos no mês..."
                className="min-h-[150px] text-sm"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Exemplo: "Tivemos 500 agendamentos e realizamos 480 serviços"
              </p>
            </div>

            <Button
              onClick={processQuickInput}
              disabled={!quickInput.trim() || loading}
              className="w-full bg-gradient-primary text-white hover:opacity-90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Extrair Dados
            </Button>
          </TabsContent>
        </Tabs>

        {/* Campos Comuns: Meta e Data */}
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue" className="text-base font-medium flex items-center space-x-2">
                <Target className="w-4 h-4 text-primary" />
                <span>Meta (Target)</span>
                {targetValue && parseFloat(targetValue) > 0 && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-300">
                    Salva
                  </Badge>
                )}
              </Label>
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
              {templateDefaultTarget !== null && (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Meta padrão do Admin: <span className="font-medium">{templateDefaultTarget}</span>
                  </p>
                  {Number(targetValue || 0) !== templateDefaultTarget && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setTargetValue(String(templateDefaultTarget));
                        toast({
                          title: "Meta aplicada",
                          description: "Definimos a meta padrão do Admin como sua meta atual. Você ainda pode personalizar se quiser.",
                          duration: 4000,
                        });
                      }}
                      disabled={loading}
                    >
                      Usar meta do Admin
                    </Button>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-start space-x-1">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  {targetValue && parseFloat(targetValue) > 0
                    ? "Esta é a meta salva anteriormente. Você pode alterá-la se necessário."
                    : "Defina uma meta para este indicador"}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recordedDate" className="text-base font-medium flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4" />
                <span>Data</span>
              </Label>
              <Input
                id="recordedDate"
                type="date"
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                className="h-12"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-primary text-white hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Resultado"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditKPIModal;
