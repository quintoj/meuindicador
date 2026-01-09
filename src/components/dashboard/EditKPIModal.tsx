import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Info, Loader2, Calendar as CalendarIcon, Sparkles, TrendingUp, HelpCircle } from "lucide-react";
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

  // Buscar dados do template quando o modal abrir
  useEffect(() => {
    if (open && kpi.id) {
      fetchTemplateData();
      setActiveTab("manual");
      setQuickInput("");
    }
  }, [open, kpi.id]);

  // Resetar valores quando o modal abrir
  useEffect(() => {
    if (open) {
      setTargetValue(kpi.target.toString());
      setRecordedDate(new Date().toISOString().split('T')[0]);
      setCalculatedResult(kpi.value);
    }
  }, [open, kpi]);

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
          .select('formula, required_data')
          .eq('id', userIndicator.indicator_template_id)
          .single();

        if (!error && template) {
          setFormula(template.formula || '');
          
          // Processar required_data (pode ser JSONB ou array)
          let dataArray: string[] = [];
          if (template.required_data) {
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

  // Detectar se um campo é de texto (informativo)
  const isTextField = (field: string): boolean => {
    const fieldLower = field.toLowerCase();
    const textKeywords = ['status', 'nome', 'descrição', 'descricao', 'tipo', 'categoria', 'observação', 'observacao', 'comentário', 'comentario'];
    return textKeywords.some(keyword => fieldLower.includes(keyword));
  };

  // Filtrar campos numéricos (excluir contextuais como "período", "data", etc e campos de texto)
  const isNumericField = (field: string): boolean => {
    const fieldLower = field.toLowerCase();
    const nonNumericKeywords = ['período', 'periodo', 'data', 'mês', 'mes', 'semana', 'dia'];
    
    // Se for campo de texto, não é numérico
    if (isTextField(field)) {
      return false;
    }
    
    // Se contém palavra-chave não numérica, não é numérico
    return !nonNumericKeywords.some(keyword => fieldLower.includes(keyword));
  };

  const getNumericFields = (): string[] => {
    return requiredData.filter(field => isNumericField(field));
  };

  const getTextFields = (): string[] => {
    return requiredData.filter(field => isTextField(field));
  };

  // Calcular resultado em tempo real
  useEffect(() => {
    if (requiredData.length > 0 && formula) {
      calculateResult();
    }
  }, [dynamicInputs, formula, requiredData]);

  const calculateResult = () => {
    try {
      const numericFields = getNumericFields();
      
      // Verificar se todos os campos NUMÉRICOS necessários foram preenchidos
      // IGNORAR campos de texto (informativos)
      const allFilled = numericFields.every(field => {
        const value = dynamicInputs[field];
        return value !== undefined && value !== '' && !isNaN(parseFloat(value));
      });

      if (!allFilled || numericFields.length === 0) {
        setCalculatedResult(0);
        return;
      }

      // Pegar valores APENAS dos campos numéricos (ignorar texto)
      const values = numericFields
        .filter(field => !isTextField(field)) // Proteção extra: garantir que não há campos de texto
        .map(field => parseFloat(dynamicInputs[field]) || 0);
      
      // Estratégia simplificada: detectar operação da fórmula
      const formulaLower = formula.toLowerCase();
      let result = 0;
      
      if (values.length === 2) {
        // Casos mais comuns com 2 valores
        if (formulaLower.includes('/') || formulaLower.includes('dividido') || formulaLower.includes('divid')) {
          // Divisão: valor1 / valor2
          result = values[0] / (values[1] || 1); // Evitar divisão por zero
        } else if (formulaLower.includes('*') || formulaLower.includes('×') || formulaLower.includes('multiplicado') || formulaLower.includes('vezes')) {
          // Multiplicação: valor1 * valor2
          result = values[0] * values[1];
        } else if (formulaLower.includes('-') || formulaLower.includes('menos') || formulaLower.includes('subtrai')) {
          // Subtração: valor1 - valor2
          result = values[0] - values[1];
        } else if (formulaLower.includes('+') || formulaLower.includes('mais') || formulaLower.includes('soma')) {
          // Adição: valor1 + valor2
          result = values[0] + values[1];
        } else {
          // Padrão: divisão (caso mais comum para indicadores)
          result = values[0] / (values[1] || 1);
        }
      } else if (values.length === 3) {
        // Para 3 valores, geralmente é: (val1 * val2) / val3 ou val1 * val2 * val3
        if (formulaLower.includes('/') || formulaLower.includes('dividido')) {
          result = (values[0] * values[1]) / (values[2] || 1);
        } else {
          result = values[0] * values[1] * values[2];
        }
      } else if (values.length === 1) {
        // Apenas um valor
        result = values[0];
      } else {
        // Fallback: soma de todos os valores
        result = values.reduce((acc, val) => acc + val, 0);
      }
      
      if (!isNaN(result) && isFinite(result)) {
        setCalculatedResult(Math.round(result * 100) / 100);
      } else {
        setCalculatedResult(0);
      }
    } catch (err) {
      console.error('Erro ao calcular:', err);
      setCalculatedResult(0);
    }
  };

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
      
      // Mapear números para campos na ordem
      const newInputs = { ...dynamicInputs };
      requiredData.forEach((field, index) => {
        if (index < normalizedNumbers.length) {
          newInputs[field] = normalizedNumbers[index];
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

  const getFieldHint = (field: string): string => {
    const fieldLower = field.toLowerCase();
    
    // Procurar por palavras-chave no nome do campo
    for (const [key, hint] of Object.entries(fieldHints)) {
      if (fieldLower.includes(key)) {
        return hint;
      }
    }
    
    return "Insira o valor deste dado para o período selecionado";
  };

  const handleSave = async () => {
    try {
      console.log('=== INICIANDO SALVAMENTO ===');
      console.log('calculatedResult:', calculatedResult);
      console.log('targetValue:', targetValue);
      console.log('dynamicInputs:', dynamicInputs);
      console.log('requiredData:', requiredData);
      
      setLoading(true);

      let finalValue = calculatedResult;
      const targetValueNum = parseFloat(targetValue) || 0;

      // Se não há campos numéricos (fallback manual), usar o valor digitado
      const numericFields = getNumericFields();
      console.log('numericFields:', numericFields);
      
      if (numericFields.length === 0 && requiredData.length === 0) {
        // Modo manual: não há required_data, usar calculatedResult diretamente
        finalValue = calculatedResult;
      }

      // Validação mais permissiva: se há campos, verificar se foram preenchidos
      if (numericFields.length > 0) {
        const anyFilled = numericFields.some(field => {
          const value = dynamicInputs[field];
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
      if (finalValue === 0 && numericFields.length === 0 && requiredData.length === 0) {
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

      // 1. UPDATE na tabela user_indicators
      console.log('Fazendo UPDATE em user_indicators...');
      const { error: updateError } = await (supabase as any)
        .from('user_indicators')
        .update({
          current_value: finalValue,
          target_value: targetValueNum,
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

            {/* Inputs Dinâmicos Baseados em required_data */}
            {requiredData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Dados Necessários</h3>
                </div>

                {/* Campos Numéricos (usados no cálculo) */}
                {requiredData.filter(field => isNumericField(field)).map((field, index) => (
                  <div key={`numeric-${index}`} className="space-y-2">
                    <Label htmlFor={`field-${index}`} className="text-base font-medium flex items-center space-x-2">
                      <Calculator className="w-4 h-4 text-primary" />
                      <span>{field}</span>
                      <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                        Numérico
                      </Badge>
                    </Label>
                    <Input
                      id={`field-${index}`}
                      type="number"
                      step="0.01"
                      value={dynamicInputs[field] || ''}
                      onChange={(e) => handleDynamicInputChange(field, e.target.value)}
                      className="text-lg h-12 border-primary/30 focus:border-primary"
                      placeholder="0"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground flex items-start space-x-1">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{getFieldHint(field)}</span>
                    </p>
                  </div>
                ))}

                {/* Campos de Texto (informativos, não entram no cálculo) */}
                {getTextFields().length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-dashed">
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <h4 className="text-sm font-medium text-muted-foreground">Informações Adicionais (opcional)</h4>
                    </div>
                    
                    {getTextFields().map((field, index) => (
                      <div key={`text-${index}`} className="space-y-2">
                        <Label htmlFor={`text-field-${index}`} className="text-sm font-medium flex items-center space-x-2 text-muted-foreground">
                          <span>{field}</span>
                          <Badge variant="secondary" className="text-xs">
                            Informativo
                          </Badge>
                        </Label>
                        <Input
                          id={`text-field-${index}`}
                          type="text"
                          value={dynamicInputs[field] || ''}
                          onChange={(e) => handleDynamicInputChange(field, e.target.value)}
                          className="h-10 bg-muted/30 border-muted"
                          placeholder={`Ex: ${field.toLowerCase()}`}
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground/70 flex items-start space-x-1">
                          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Este campo não é usado no cálculo, apenas para referência</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resultado Calculado em Tempo Real */}
                {calculatedResult > 0 && (
                  <Card className="bg-gradient-primary/10 border-primary/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Resultado Calculado:</p>
                          <p className="text-3xl font-bold text-primary">
                            {calculatedResult.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Calculator className="w-12 h-12 text-primary opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              // Fallback: Se não houver required_data, mostrar campo manual simples
              <div className="space-y-2">
                <Label htmlFor="manualValue" className="text-base font-semibold">
                  Valor Atual (Resultado)
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
              <Label htmlFor="targetValue" className="text-base font-medium">
                Meta (Target)
              </Label>
              <Input
                id="targetValue"
                type="number"
                step="0.01"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="h-12"
                placeholder="0"
                disabled={loading}
              />
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
