import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, X, Sparkles, TrendingUp, TrendingDown, Target, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Variable {
  name: string;
  type: 'fixed' | 'daily';
}

const AddTemplateModal = ({ open, onOpenChange, onSuccess }: AddTemplateModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formula, setFormula] = useState("");
  const [importance, setImportance] = useState("");
  const [segment, setSegment] = useState<string>("Geral");
  const [complexity, setComplexity] = useState<string>("Fácil");
  const [iconName, setIconName] = useState("");
  
  // ===== NOVOS CAMPOS =====
  const [direction, setDirection] = useState<string>("HIGHER_BETTER");
  const [unitType, setUnitType] = useState<string>("integer");
  const [calcMethod, setCalcMethod] = useState<string>("formula");
  const [defaultWarningThreshold, setDefaultWarningThreshold] = useState<string>("");
  const [defaultCriticalThreshold, setDefaultCriticalThreshold] = useState<string>("");
  
  // Gerenciador de Variáveis
  const [variables, setVariables] = useState<Variable[]>([]);
  const [newVarName, setNewVarName] = useState("");
  const [newVarType, setNewVarType] = useState<'fixed' | 'daily'>('fixed');
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Ref para o textarea da fórmula (para inserir variáveis na posição do cursor)
  const formulaTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Converter para snake_case
  const toSnakeCase = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleAddVariable = () => {
    if (!newVarName.trim()) {
      toast({
        variant: "destructive",
        title: "Nome vazio",
        description: "Digite um nome para a variável.",
      });
      return;
    }

    const snakeCaseName = toSnakeCase(newVarName);
    
    // Verificar duplicata
    if (variables.some(v => v.name === snakeCaseName)) {
      toast({
        variant: "destructive",
        title: "Variável duplicada",
        description: `A variável "${snakeCaseName}" já existe.`,
      });
      return;
    }

    setVariables([...variables, { name: snakeCaseName, type: newVarType }]);
    setNewVarName("");
    
    toast({
      title: "Variável adicionada!",
      description: `"${snakeCaseName}" (${newVarType === 'fixed' ? 'Fixo' : 'Diário'})`,
    });
  };

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  // Inserir variável na fórmula (na posição do cursor)
  const handleInsertVariable = (varName: string) => {
    if (!formulaTextareaRef.current) return;

    const textarea = formulaTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentFormula = formula;

    // Inserir na posição do cursor
    const newFormula = 
      currentFormula.substring(0, start) + 
      varName + 
      currentFormula.substring(end);

    setFormula(newFormula);

    // Focar de volta e posicionar cursor após a variável inserida
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + varName.length, start + varName.length);
    }, 0);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setFormula("");
    setImportance("");
    setSegment("Geral");
    setComplexity("Fácil");
    setIconName("");
    setDirection("HIGHER_BETTER");
    setUnitType("integer");
    setCalcMethod("formula");
    setDefaultWarningThreshold("");
    setDefaultCriticalThreshold("");
    setVariables([]);
    setNewVarName("");
    setNewVarType('fixed');
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!name || !description || !formula || !importance) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Por favor, preencha Nome, Descrição, Fórmula e Importância.",
        });
        return;
      }

      // Construir input_fields JSON
      const inputFields = {
        fixed: variables.filter(v => v.type === 'fixed').map(v => v.name),
        daily: variables.filter(v => v.type === 'daily').map(v => v.name),
      };

      // Inserir novo template
      const { error } = await (supabase as any)
        .from('indicator_templates')
        .insert({
          name: name.trim(),
          description: description.trim(),
          formula: formula.trim(),
          importance: importance.trim(),
          segment: segment,
          complexity: complexity,
          icon_name: iconName.trim() || null,
          direction: direction,
          unit_type: unitType,
          calc_method: calcMethod.trim(),
          default_warning_threshold: defaultWarningThreshold ? parseFloat(defaultWarningThreshold) : null,
          default_critical_threshold: defaultCriticalThreshold ? parseFloat(defaultCriticalThreshold) : null,
          input_fields: inputFields,
          required_data: JSON.stringify(variables.map(v => v.name)), // Fallback
        });

      if (error) {
        console.error('Erro detalhado ao criar template:', error.message || error);
        console.error('Código do erro:', error.code);

        if (error.code === '23505') {
          toast({
            variant: "destructive",
            title: "Nome duplicado",
            description: "Já existe um indicador com este nome.",
          });
          setLoading(false);
          return;
        }

        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          toast({
            variant: "destructive",
            title: "Permissão negada",
            description: "Você não tem permissão de Admin para criar templates.",
          });
          setLoading(false);
          return;
        }

        if (error.code === 'PGRST301' || error.message?.includes('policy')) {
          toast({
            variant: "destructive",
            title: "Sem permissão de Admin",
            description: "Apenas administradores podem criar templates de indicadores.",
          });
          setLoading(false);
          return;
        }

        throw error;
      }

      toast({
        title: "Template criado!",
        description: `${name} foi adicionado à loja com sucesso.`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Erro detalhado:', err.message || err);

      const errorMessage = err.message || '';
      if (errorMessage.includes('permission') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        toast({
          variant: "destructive",
          title: "Sem permissão de Admin",
          description: "Você não tem permissão de Admin para criar templates.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao criar",
          description: err.message || "Não foi possível criar o template. Verifique o console para mais detalhes.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>KPI Builder - Novo Indicador</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Configure seu indicador de forma profissional</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* ===== SEÇÃO 1: INFORMAÇÕES BÁSICAS ===== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold">
                  Nome do Indicador *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Taxa de Churn (Cancelamento)"
                  disabled={loading}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">
                  Descrição *
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que este indicador mede..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              {/* Importância */}
              <div className="space-y-2">
                <Label htmlFor="importance" className="text-base font-semibold">
                  Por que é importante? *
                </Label>
                <Textarea
                  id="importance"
                  value={importance}
                  onChange={(e) => setImportance(e.target.value)}
                  placeholder="Explique a importância deste indicador..."
                  rows={2}
                  disabled={loading}
                />
              </div>

              {/* Grid: Segmento, Complexidade, Ícone */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="segment">Segmento *</Label>
                  <Select value={segment} onValueChange={setSegment} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Geral">Geral</SelectItem>
                      <SelectItem value="Academia">Academia</SelectItem>
                      <SelectItem value="Restaurante">Restaurante</SelectItem>
                      <SelectItem value="Contabilidade">Contabilidade</SelectItem>
                      <SelectItem value="PetShop">Pet Shop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complexity">Complexidade *</Label>
                  <Select value={complexity} onValueChange={setComplexity} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fácil">Fácil</SelectItem>
                      <SelectItem value="Intermediário">Intermediário</SelectItem>
                      <SelectItem value="Avançado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iconName">Ícone</Label>
                  <Input
                    id="iconName"
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    placeholder="DollarSign, Users"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== SEÇÃO 2: CONFIGURAÇÃO DE COMPORTAMENTO ===== */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-primary" />
                <span>⚙️ Configuração de Comportamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Direção */}
                <div className="space-y-2">
                  <Label>Direção (Melhor é...)</Label>
                  <Select value={direction} onValueChange={setDirection} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGHER_BETTER">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-success" />
                          <span>Maior é Melhor</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="LOWER_BETTER">
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="w-4 h-4 text-warning" />
                          <span>Menor é Melhor</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="NEUTRAL_RANGE">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-primary" />
                          <span>Faixa Ideal</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {direction === 'HIGHER_BETTER' && "Ex: Vendas, Faturamento"}
                    {direction === 'LOWER_BETTER' && "Ex: Churn, Despesas"}
                    {direction === 'NEUTRAL_RANGE' && "Ex: Estoque, Temperatura"}
                  </p>
                </div>

                {/* Unidade */}
                <div className="space-y-2">
                  <Label>Unidade de Medida</Label>
                  <Select value={unitType} onValueChange={setUnitType} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="currency">💰 Moeda (R$)</SelectItem>
                      <SelectItem value="percentage">📊 Porcentagem (%)</SelectItem>
                      <SelectItem value="integer">🔢 Número Inteiro</SelectItem>
                      <SelectItem value="decimal">🔢 Número Decimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Método de Cálculo */}
                <div className="space-y-2">
                  <Label>Método de Cálculo</Label>
                  <Input
                    value={calcMethod}
                    onChange={(e) => setCalcMethod(e.target.value)}
                    placeholder="Ex: formula, sum, average"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">formula, sum, average, last</p>
                </div>
              </div>

              {/* Thresholds (Metas Padrão) */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="warningThreshold" className="flex items-center space-x-2">
                    <span>⚠️ Meta de Alerta</span>
                  </Label>
                  <Input
                    id="warningThreshold"
                    type="number"
                    step="0.01"
                    value={defaultWarningThreshold}
                    onChange={(e) => setDefaultWarningThreshold(e.target.value)}
                    placeholder="Ex: 5 (para Churn 5%)"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {direction === 'LOWER_BETTER' 
                      ? 'Valores acima disso ficam amarelos' 
                      : 'Valores abaixo disso ficam amarelos'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criticalThreshold" className="flex items-center space-x-2">
                    <span>🔴 Meta Crítica</span>
                  </Label>
                  <Input
                    id="criticalThreshold"
                    type="number"
                    step="0.01"
                    value={defaultCriticalThreshold}
                    onChange={(e) => setDefaultCriticalThreshold(e.target.value)}
                    placeholder="Ex: 8 (para Churn 8%)"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {direction === 'LOWER_BETTER' 
                      ? 'Valores acima disso ficam vermelhos' 
                      : 'Valores abaixo disso ficam vermelhos'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== SEÇÃO 3: VARIÁVEIS (INPUT FIELDS BUILDER) ===== */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">🔧 Variáveis do Indicador</CardTitle>
              <p className="text-sm text-muted-foreground">Defina quais dados o usuário precisará fornecer</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Variable Form */}
              <div className="flex space-x-2">
                <Input
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  placeholder="Nome da variável (ex: cancelamentos)"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddVariable();
                    }
                  }}
                  className="flex-1"
                />
                <Select value={newVarType} onValueChange={(val) => setNewVarType(val as 'fixed' | 'daily')} disabled={loading}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">📌 Fixo</SelectItem>
                    <SelectItem value="daily">📅 Diário</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleAddVariable}
                  disabled={loading || !newVarName.trim()}
                  className="bg-primary"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Variables List */}
              {variables.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Variáveis Criadas ({variables.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((variable, index) => (
                      <Badge 
                        key={index} 
                        variant={variable.type === 'fixed' ? 'default' : 'secondary'}
                        className="text-sm px-3 py-1"
                      >
                        {variable.type === 'fixed' ? '📌' : '📅'} {variable.name}
                        <button
                          onClick={() => handleRemoveVariable(index)}
                          className="ml-2 hover:text-destructive"
                          disabled={loading}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {variables.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  ℹ️ Nenhuma variável adicionada ainda. As variáveis serão usadas na fórmula.
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== SEÇÃO 4: FÓRMULA (EDITOR INTELIGENTE) ===== */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-lg">🧮 Fórmula de Cálculo *</CardTitle>
              <p className="text-sm text-muted-foreground">Clique nas variáveis para inserir na fórmula</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Textarea da Fórmula */}
              <Textarea
                ref={formulaTextareaRef}
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Ex: (cancelamentos / ativos_inicio) * 100"
                rows={3}
                disabled={loading}
                className="font-mono text-sm"
              />

              {/* Variáveis Disponíveis (Badges Clicáveis) */}
              {variables.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">✨ Clique para inserir:</Label>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((variable, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/20 transition-colors px-3 py-1"
                        onClick={() => handleInsertVariable(variable.name)}
                      >
                        {variable.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                💡 Use operadores: +, -, *, /, (), etc. As variáveis serão substituídas pelos valores digitados pelo usuário.
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
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
                Criando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Criar Indicador
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTemplateModal;
