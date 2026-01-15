import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Edit, Plus, X, Trash2, TrendingUp, TrendingDown, Target, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

interface EditTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Tables<'indicator_templates'> | null;
  onSuccess: () => void;
}

interface Variable {
  name: string;
  type: 'fixed' | 'daily';
}

const EditTemplateModal = ({ open, onOpenChange, template, onSuccess }: EditTemplateModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formula, setFormula] = useState("");
  const [importance, setImportance] = useState("");
  const [segment, setSegment] = useState<string>("Geral");
  const [complexity, setComplexity] = useState<string>("Fácil");
  const [iconName, setIconName] = useState("");
  
  // Novos campos
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  
  const formulaTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Carregar dados do template ao abrir
  useEffect(() => {
    if (open && template) {
      console.log('📊 Carregando template:', template);
      console.log('🔍 Campos de configuração:');
      console.log('  - direction:', template.direction);
      console.log('  - unit_type:', template.unit_type);
      console.log('  - calc_method:', template.calc_method);
      console.log('  - default_warning_threshold:', template.default_warning_threshold);
      console.log('  - default_critical_threshold:', template.default_critical_threshold);
      
      setName(template.name || "");
      setDescription(template.description || "");
      setFormula(template.formula || "");
      setImportance(template.importance || "");
      setSegment(template.segment || "Geral");
      setComplexity(template.complexity || "Fácil");
      setIconName(template.icon_name || "");
      
      // 🔧 CORREÇÃO: Garantir valores default corretos e conversão de ENUMs
      const directionValue = template.direction || "HIGHER_BETTER";
      const unitTypeValue = template.unit_type || "integer";
      const calcMethodValue = template.calc_method || "formula";
      
      console.log('✅ Setando valores:');
      console.log('  - direction → ', directionValue);
      console.log('  - unit_type → ', unitTypeValue);
      console.log('  - calc_method → ', calcMethodValue);
      
      setDirection(directionValue);
      setUnitType(unitTypeValue);
      setCalcMethod(calcMethodValue);
      setDefaultWarningThreshold(template.default_warning_threshold?.toString() || "");
      setDefaultCriticalThreshold(template.default_critical_threshold?.toString() || "");
      
      // 🔥 PARSE de input_fields (JSONB)
      let loadedVariables: Variable[] = [];
      
      if (template.input_fields) {
        try {
          let inputFieldsJSON: any;
          
          if (typeof template.input_fields === 'string') {
            inputFieldsJSON = JSON.parse(template.input_fields);
          } else {
            inputFieldsJSON = template.input_fields;
          }
          
          const fixed = Array.isArray(inputFieldsJSON.fixed) ? inputFieldsJSON.fixed : [];
          const daily = Array.isArray(inputFieldsJSON.daily) ? inputFieldsJSON.daily : [];
          
          loadedVariables = [
            ...fixed.map((name: string) => ({ name, type: 'fixed' as const })),
            ...daily.map((name: string) => ({ name, type: 'daily' as const })),
          ];
          
          console.log('✅ Variáveis carregadas de input_fields:', loadedVariables);
        } catch (err) {
          console.error('❌ Erro ao parsear input_fields:', err);
        }
      }
      
      // Fallback: required_data (antigo)
      if (loadedVariables.length === 0 && template.required_data) {
        try {
          let requiredDataArray: string[] = [];
          
          if (Array.isArray(template.required_data)) {
            requiredDataArray = template.required_data;
          } else if (typeof template.required_data === 'string') {
            const parsed = JSON.parse(template.required_data);
            requiredDataArray = Array.isArray(parsed) ? parsed : [];
          }
          
          loadedVariables = requiredDataArray.map(name => ({ name, type: 'fixed' as const }));
          console.log('⚠️ Usando fallback required_data:', loadedVariables);
        } catch (err) {
          console.error('❌ Erro ao parsear required_data:', err);
        }
      }
      
      setVariables(loadedVariables);
    }
  }, [open, template]);

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

  const handleInsertVariable = (varName: string) => {
    if (!formulaTextareaRef.current) return;

    const textarea = formulaTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentFormula = formula;

    const newFormula = 
      currentFormula.substring(0, start) + 
      varName + 
      currentFormula.substring(end);

    setFormula(newFormula);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + varName.length, start + varName.length);
    }, 0);
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
        setLoading(false);
        return;
      }

      if (!template) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Template não encontrado.",
        });
        setLoading(false);
        return;
      }

      // Construir input_fields JSON
      const inputFields = {
        fixed: variables.filter(v => v.type === 'fixed').map(v => v.name),
        daily: variables.filter(v => v.type === 'daily').map(v => v.name),
      };

      // Atualizar template
      const { error } = await (supabase as any)
        .from('indicator_templates')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id);

      if (error) {
        console.error('Erro detalhado ao atualizar template:', error.message || error);
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
            description: "Você não tem permissão de Admin para editar templates.",
          });
          setLoading(false);
          return;
        }

        throw error;
      }

      toast({
        title: "Template atualizado!",
        description: `${name} foi atualizado com sucesso.`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Erro detalhado:', err.message || err);

      const errorMessage = err.message || '';
      if (errorMessage.includes('permission') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        toast({
          variant: "destructive",
          title: "Sem permissão de Admin",
          description: "Você não tem permissão de Admin para editar templates.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: err.message || "Não foi possível atualizar o template.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      if (!template) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Template não encontrado.",
        });
        setDeleting(false);
        return;
      }

      const { error } = await (supabase as any)
        .from('indicator_templates')
        .delete()
        .eq('id', template.id);

      if (error) {
        console.error('Erro detalhado ao deletar:', error.message || error);
        
        if (error.code === '42501' || error.message?.includes('permission')) {
          toast({
            variant: "destructive",
            title: "Permissão negada",
            description: "Você não tem permissão de Admin para deletar templates.",
          });
          setDeleting(false);
          return;
        }

        if (error.code === '23503') {
          toast({
            variant: "destructive",
            title: "Template em uso",
            description: "Este template não pode ser deletado pois está sendo usado por usuários.",
          });
          setDeleting(false);
          return;
        }

        throw error;
      }

      toast({
        title: "Template deletado!",
        description: `${name} foi removido da loja com sucesso.`,
      });

      setShowDeleteDialog(false);
      onOpenChange(false);
      onSuccess();
      
    } catch (err: any) {
      console.error('Erro detalhado:', err.message || err);
      toast({
        variant: "destructive",
        title: "Erro ao deletar",
        description: err.message || "Não foi possível deletar o template.",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!template) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
              <Edit className="w-6 h-6 text-primary" />
              <span>KPI Builder - Editar Indicador</span>
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Atualize a configuração do indicador</p>
          </DialogHeader>

          <div className="space-y-6">
            {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-semibold">Nome do Indicador *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Taxa de Churn (Cancelamento)"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o que este indicador mede..."
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="importance" className="text-base font-semibold">Por que é importante? *</Label>
                  <Textarea
                    id="importance"
                    value={importance}
                    onChange={(e) => setImportance(e.target.value)}
                    placeholder="Explique a importância deste indicador..."
                    rows={2}
                    disabled={loading}
                  />
                </div>

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

            {/* SEÇÃO 2: CONFIGURAÇÃO DE COMPORTAMENTO */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  <span>⚙️ Configuração de Comportamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
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
                  </div>

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

                  <div className="space-y-2">
                    <Label>Método de Cálculo</Label>
                    <Input
                      value={calcMethod}
                      onChange={(e) => setCalcMethod(e.target.value)}
                      placeholder="Ex: formula, sum, average"
                      disabled={loading}
                    />
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

            {/* SEÇÃO 3: VARIÁVEIS */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">🔧 Variáveis do Indicador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    placeholder="Nome da variável"
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
              </CardContent>
            </Card>

            {/* SEÇÃO 4: FÓRMULA */}
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="text-lg">🧮 Fórmula de Cálculo *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  ref={formulaTextareaRef}
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="Ex: (cancelamentos / ativos_inicio) * 100"
                  rows={3}
                  disabled={loading}
                  className="font-mono text-sm"
                />

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
              </CardContent>
            </Card>

            {/* BOTÃO DELETAR */}
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading || deleting}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Template da Loja
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || deleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || deleting}
              className="bg-gradient-primary text-white hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a deletar <strong>{name}</strong> da loja de indicadores.
              <br /><br />
              <strong>Atenção:</strong> Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar Template"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditTemplateModal;
