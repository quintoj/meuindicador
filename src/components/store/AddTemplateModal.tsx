import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddTemplateModal = ({ open, onOpenChange, onSuccess }: AddTemplateModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formula, setFormula] = useState("");
  const [importance, setImportance] = useState("");
  const [segment, setSegment] = useState<string>("Geral");
  const [complexity, setComplexity] = useState<string>("Fácil");
  const [iconName, setIconName] = useState("");
  const [requiredDataInput, setRequiredDataInput] = useState("");
  const [requiredDataList, setRequiredDataList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddRequiredData = () => {
    if (requiredDataInput.trim()) {
      setRequiredDataList([...requiredDataList, requiredDataInput.trim()]);
      setRequiredDataInput("");
    }
  };

  const handleRemoveRequiredData = (index: number) => {
    setRequiredDataList(requiredDataList.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setFormula("");
    setImportance("");
    setSegment("Geral");
    setComplexity("Fácil");
    setIconName("");
    setRequiredDataInput("");
    setRequiredDataList([]);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!name || !description || !formula || !importance) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
        });
        return;
      }

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
          required_data: JSON.stringify(requiredDataList),
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            variant: "destructive",
            title: "Nome duplicado",
            description: "Já existe um indicador com este nome.",
          });
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
      console.error('Erro ao criar template:', err);
      toast({
        variant: "destructive",
        title: "Erro ao criar",
        description: err.message || "Não foi possível criar o template.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Novo Template de Indicador</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">
              Nome do Indicador *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ticket Médio"
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

          {/* Fórmula */}
          <div className="space-y-2">
            <Label htmlFor="formula" className="text-base font-semibold">
              Fórmula *
            </Label>
            <Textarea
              id="formula"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Ex: Faturamento total / Número de clientes"
              rows={2}
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

          {/* Segmento e Complexidade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="segment" className="text-base font-semibold">
                Segmento *
              </Label>
              <select
                id="segment"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Geral">Geral</option>
                <option value="Academia">Academia</option>
                <option value="Restaurante">Restaurante</option>
                <option value="Contabilidade">Contabilidade</option>
                <option value="PetShop">Pet Shop</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complexity" className="text-base font-semibold">
                Complexidade *
              </Label>
              <select
                id="complexity"
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Fácil">Fácil</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>
          </div>

          {/* Ícone */}
          <div className="space-y-2">
            <Label htmlFor="iconName" className="text-base font-semibold">
              Nome do Ícone (Lucide React)
            </Label>
            <Input
              id="iconName"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              placeholder="Ex: DollarSign, Users, Target"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Opções: Users, DollarSign, Percent, Target, Clock, PawPrint, Heart, Award, etc.
            </p>
          </div>

          {/* Dados Necessários */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Dados Necessários
            </Label>
            <div className="flex space-x-2">
              <Input
                value={requiredDataInput}
                onChange={(e) => setRequiredDataInput(e.target.value)}
                placeholder="Ex: Faturamento mensal"
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRequiredData();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddRequiredData}
                disabled={loading || !requiredDataInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {requiredDataList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {requiredDataList.map((data, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {data}
                    <button
                      onClick={() => handleRemoveRequiredData(index)}
                      className="ml-1 hover:text-destructive"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
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
                <Plus className="w-4 h-4 mr-2" />
                Criar Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTemplateModal;

