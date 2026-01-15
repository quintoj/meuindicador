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
import { LucideIcon, TrendingUp, TrendingDown, Target, MoreVertical, BarChart3, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import EditKPIModal from "./EditKPIModal";
import EditIndicatorModal from "./EditIndicatorModal";
import { calculateIndicatorStatus, getDifferenceText, type IndicatorDirection } from "@/utils/indicators";

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
}

interface KPICardProps {
  kpi: KPI;
  onUpdate?: () => void;
}

const KPICard = ({ kpi, onUpdate }: KPICardProps) => {
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
        return value.toLocaleString('pt-BR');
    }
  };

  // 🔥 NOVA LÓGICA: Usa a direção do indicador
  const direction = (kpi.template?.direction || 'HIGHER_BETTER') as IndicatorDirection;
  
  // 🔧 v1.27: Usa thresholds do template para cálculo de status
  const warningThreshold = kpi.template?.default_warning_threshold;
  const criticalThreshold = kpi.template?.default_critical_threshold;
  
  // Calcular status usando a função corrigida com thresholds do template
  const status = calculateIndicatorStatus(kpi.value, kpi.target, direction, warningThreshold, criticalThreshold);
  const difference = getDifferenceText(kpi.value, kpi.target, direction);

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
                    setIsDataModalOpen(true);
                  }}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Lançar Dados
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
          <div>
            <div className="text-2xl font-bold text-foreground">
              {formatValue(kpi.value, kpi.format)}
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              <span>Meta: {formatValue(kpi.target, kpi.format)}</span>
            </div>
          </div>

          {/* Performance Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Performance</span>
              <div className="flex items-center space-x-1">
                <StatusIcon className={`w-4 h-4 ${
                  status.color === 'success' ? 'text-success' : 
                  status.color === 'warning' ? 'text-warning' : 'text-danger'
                }`} />
                <span className={`font-semibold ${
                  status.color === 'success' ? 'text-success' : 
                  status.color === 'warning' ? 'text-warning' : 'text-danger'
                }`}>
                  {status.percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  status.color === 'success' ? 'bg-success' : 
                  status.color === 'warning' ? 'bg-warning' : 'bg-danger'
                }`}
                style={{ width: `${Math.min(status.percentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Difference */}
          <div className={`text-sm p-3 rounded-lg ${
            status.color === 'success' ? 'bg-success/10 text-success' : 
            status.color === 'warning' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
          }`}>
            <div className="font-semibold">
              {formatValue(difference.value, kpi.format)} {status.text}
            </div>
            <div className="text-xs opacity-80">
              {difference.percentage}% de diferença da meta
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Modal de Lançamento de Dados */}
    <EditKPIModal
      open={isDataModalOpen}
      onOpenChange={setIsDataModalOpen}
      kpi={kpi}
      onSave={handleUpdate}
    />

    {/* Modal de Edição do Indicador */}
    <EditIndicatorModal
      open={isEditModalOpen}
      onOpenChange={setIsEditModalOpen}
      kpi={kpi}
      onUpdate={handleUpdate}
    />
    </>
  );
};

export default KPICard;