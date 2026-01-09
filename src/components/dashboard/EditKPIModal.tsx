import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Info, Loader2, Calendar as CalendarIcon } from "lucide-react";
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

const EditKPIModal = ({ open, onOpenChange, kpi, onSave }: EditKPIModalProps) => {
  const [currentValue, setCurrentValue] = useState(kpi.value.toString());
  const [targetValue, setTargetValue] = useState(kpi.target.toString());
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [formula, setFormula] = useState<string>("");
  const [requiredData, setRequiredData] = useState<string[]>([]);
  const { toast } = useToast();

  // Buscar dados do template quando o modal abrir
  useEffect(() => {
    if (open && kpi.id) {
      fetchTemplateData();
    }
  }, [open, kpi.id]);

  // Resetar valores quando o modal abrir
  useEffect(() => {
    if (open) {
      setCurrentValue(kpi.value.toString());
      setTargetValue(kpi.target.toString());
      setRecordedDate(new Date().toISOString().split('T')[0]);
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
          if (template.required_data) {
            if (Array.isArray(template.required_data)) {
              setRequiredData(template.required_data);
            } else if (typeof template.required_data === 'string') {
              try {
                const parsed = JSON.parse(template.required_data);
                setRequiredData(Array.isArray(parsed) ? parsed : []);
              } catch {
                setRequiredData([]);
              }
            } else {
              setRequiredData([]);
            }
          } else {
            setRequiredData([]);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar template:', err);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const currentValueNum = parseFloat(currentValue) || 0;
      const targetValueNum = parseFloat(targetValue) || 0;

      // Obter usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para atualizar indicadores.",
        });
        return;
      }

      // 1. UPDATE na tabela user_indicators
      const { error: updateError } = await (supabase as any)
        .from('user_indicators')
        .update({
          current_value: currentValueNum,
          target_value: targetValueNum,
          updated_at: new Date().toISOString(),
        })
        .eq('id', kpi.id)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // 2. INSERT na tabela indicator_history
      const { error: historyError } = await (supabase as any)
        .from('indicator_history')
        .insert({
          user_indicator_id: kpi.id,
          value: currentValueNum,
          recorded_at: new Date(recordedDate).toISOString(),
          notes: null,
        });

      if (historyError) {
        console.error('Erro ao salvar histórico:', historyError);
        // Não falhar se o histórico não for salvo, apenas logar o erro
      }

      toast({
        title: "Indicador atualizado!",
        description: `${kpi.name} foi atualizado com sucesso.`,
      });

      // Fechar modal e atualizar a tela
      onOpenChange(false);
      onSave(); // Callback para atualizar a lista de KPIs
      
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{kpi.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção: Como Calcular */}
          {(formula || requiredData.length > 0) && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Info className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Como calcular</h3>
                  </div>

                  {formula && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calculator className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Fórmula:</Label>
                      </div>
                      <p className="text-sm text-muted-foreground bg-background p-3 rounded-md border">
                        {formula}
                      </p>
                    </div>
                  )}

                  {requiredData.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Dados necessários:</Label>
                      <div className="flex flex-wrap gap-2">
                        {requiredData.map((data, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {data}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {loadingTemplate && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Carregando informações...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Input: Valor Atual (Grande) */}
          <div className="space-y-2">
            <Label htmlFor="currentValue" className="text-base font-semibold">
              Valor Atual (Resultado)
            </Label>
            <Input
              id="currentValue"
              type="number"
              step="0.01"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="text-2xl font-bold h-16 text-center"
              placeholder="0"
              disabled={loading}
            />
          </div>

          {/* Input: Meta (Menor) */}
          <div className="space-y-2">
            <Label htmlFor="targetValue" className="text-base font-semibold">
              Meta (Target)
            </Label>
            <Input
              id="targetValue"
              type="number"
              step="0.01"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="text-xl h-12"
              placeholder="0"
              disabled={loading}
            />
          </div>

          {/* Campo: Data */}
          <div className="space-y-2">
            <Label htmlFor="recordedDate" className="text-base font-semibold flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Data do Registro</span>
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
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditKPIModal;

