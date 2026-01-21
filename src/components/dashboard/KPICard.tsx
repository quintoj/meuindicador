import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LucideIcon, TrendingUp, TrendingDown, Target, MoreVertical, BarChart3, Edit, Trash2, Calendar, History } from "lucide-react";
import { useState } from "react";
import EditIndicatorModal from "./EditIndicatorModal";
import { LancamentoModal } from "./LancamentoModal";
import { HistoryModal } from "./HistoryModal";
import { calculateIndicatorStatus, getDifferenceTextWithDirection, type IndicatorDirection } from "@/utils/indicators";

interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  format: "currency" | "percentage" | "number";
  icon: LucideIcon;
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
    default_warning_threshold?: number | null;
    default_critical_threshold?: number | null;

  };
  originalTarget?: number;
}

interface KPICardProps {
  kpi: KPI;
  onUpdate?: () => void;
}

const KPICard = ({ kpi, onUpdate }: KPICardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      case "percentage":
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    }
  };

  // 🔥 NOVA LÓGICA: Usa a direção do indicador
  const directionRaw = kpi.template?.direction || 'HIGHER_BETTER';
  const direction = directionRaw.toUpperCase() as IndicatorDirection;

  // 🔧 v1.27: Usa thresholds do template para cálculo de status
  const warningThreshold = kpi.template?.default_warning_threshold;
  const criticalThreshold = kpi.template?.default_critical_threshold;

  // Calcular status usando a função corrigida com thresholds do template
  const status = calculateIndicatorStatus(kpi.value, kpi.target, direction, warningThreshold, criticalThreshold);
  const difference = getDifferenceTextWithDirection(kpi.value, kpi.target, direction);

  // Ícone baseado no status (não mais na simples comparação)
  const StatusIcon = status.isPositive ? TrendingUp : TrendingDown;
  const Icon = kpi.icon;

  const getGradientClass = () => {
    switch (status.color) {
      case "success":
        return "bg-gradient-success";
      case "warning":
        return "bg-gradient-warning";
      case "danger":
        return "bg-gradient-danger";
      default:
        return "bg-gradient-primary";
    }
  };

  const getStatusColor = (type: 'bg' | 'text') => {
    const prefix = type === 'bg' ? 'bg' : 'text';
    switch (status.color) {
      case 'success': return `${prefix}-emerald-500`;
      case 'warning': return `${prefix}-yellow-500`;
      case 'danger': return `${prefix}-red-500`;
      default: return `${prefix}-emerald-500`;
    }
  };

  // Removido: card não deve ser clicável
  // Apenas o menu de 3 pontos deve funcionar

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <>
      <Card
        className="bg-gradient-card border-0 shadow-custom-md hover:shadow-custom-lg transition-all duration-300"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${getGradientClass()} rounded-lg flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-foreground">{kpi.name}</CardTitle>
                <Badge variant="secondary" className="text-xs mt-1">{kpi.segment}</Badge>
              </div>
            </div>

            {/* Menu de Opções */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild data-dropdown-trigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLancamentoModalOpen(true);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Lançar Valor
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditModalOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Indicador
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHistoryModalOpen(true);
                  }}
                >
                  <History className="w-4 h-4 mr-2" />
                  Gerenciar Lançamentos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditModalOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Current Value */}
            <div className="mb-4">
              <div className="text-2xl font-bold text-foreground">
                {formatValue(kpi.value, kpi.format)}
              </div>

              {/* Contexto de Metas - Solicitado pelo usuário */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-2">
                  <Target className="w-3.5 h-3.5" />
                  <span>Meta Período: {kpi.format === 'percentage' ? formatValue(kpi.target, kpi.format) : formatValue(Math.round(kpi.target), kpi.format)}</span> {/* Arredondando visualmente */}
                </div>
                {kpi.originalTarget !== undefined && kpi.originalTarget !== kpi.target && (
                  <div className="flex items-center space-x-2 text-primary/80 font-medium bg-primary/5 w-fit px-1.5 py-0.5 rounded">
                    <Calendar className="w-3.5 h-3.5" />
                    <span title="Meta cheia definida no cadastro">Meta Mensal: {formatValue(kpi.originalTarget, kpi.format)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Performance</span>
                <div className="flex items-center space-x-1">
                  <StatusIcon className={`w-4 h-4 ${getStatusColor('text')}`} />
                  <span className={`font-semibold ${getStatusColor('text')}`}>
                    {status.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar com Cores Explícitas */}
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getStatusColor('bg')}`}
                  style={{ width: `${Math.min(status.percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Difference - Badge com lógica correta */}
            <div className={`text-sm p-3 rounded-lg ${difference.isPositive
              ? 'bg-success/10 text-success'
              : 'bg-danger/10 text-danger'
              }`}>
              <div className="font-semibold">
                {formatValue(difference.value, kpi.format)} {difference.text}
              </div>
              <div className="text-xs opacity-80">
                {difference.percentage}% {difference.isPositive ? 'do objetivo' : 'de diferença'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Lançamento Rápido (Novo) */}
      <LancamentoModal
        isOpen={isLancamentoModalOpen}
        onClose={() => setIsLancamentoModalOpen(false)}
        indicador={{
          id: kpi.id,
          name: kpi.name,
          format: kpi.format,
          current_value: kpi.value,
          template: kpi.template ? {
            input_fields: kpi.template.input_fields as Array<{
              slug: string;
              nome: string;
              tipo: "currency" | "percentage" | "number";
            }> | undefined,
            formula: kpi.template.formula,
          } : undefined,
        }}
        onSaveSuccess={handleUpdate}
      />

      {/* Modal de Edição do Indicador */}
      <EditIndicatorModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        kpi={kpi}
        onUpdateSuccess={handleUpdate}
      />

      {/* Modal de Histórico */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        indicador={{
          id: kpi.id,
          name: kpi.name,
          format: kpi.format,
          template: kpi.template
        }}
        onDataChange={handleUpdate}
      />
    </>
  );
};

export default KPICard;