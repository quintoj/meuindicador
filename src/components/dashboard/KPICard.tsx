import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown, Target } from "lucide-react";
import { useState } from "react";
import EditKPIModal from "./EditKPIModal";

interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  format: "currency" | "percentage" | "number";
  icon: LucideIcon;
  segment: string;
}

interface KPICardProps {
  kpi: KPI;
  onUpdate?: () => void;
}

const KPICard = ({ kpi, onUpdate }: KPICardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const getPerformancePercentage = () => {
    return (kpi.value / kpi.target) * 100;
  };

  const getStatusColor = () => {
    const percentage = getPerformancePercentage();
    if (percentage >= 100) return "success";
    if (percentage >= 90) return "warning";
    return "danger";
  };

  const getStatusIcon = () => {
    const percentage = getPerformancePercentage();
    if (percentage >= 100) return TrendingUp;
    return TrendingDown;
  };

  const getDifference = () => {
    const diff = kpi.value - kpi.target;
    const percentage = Math.abs((diff / kpi.target) * 100);
    const isPositive = diff >= 0;
    
    return {
      value: Math.abs(diff),
      percentage: percentage.toFixed(1),
      isPositive,
      text: isPositive ? "acima da meta" : "abaixo da meta"
    };
  };

  const statusColor = getStatusColor();
  const StatusIcon = getStatusIcon();
  const Icon = kpi.icon;
  const difference = getDifference();
  const performancePercentage = getPerformancePercentage();

  const getGradientClass = () => {
    switch (statusColor) {
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

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <>
      <Card 
        className="bg-gradient-card border-0 shadow-custom-md hover:shadow-custom-lg transition-all duration-300 cursor-pointer"
        onClick={handleCardClick}
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
                  statusColor === 'success' ? 'text-success' : 
                  statusColor === 'warning' ? 'text-warning' : 'text-danger'
                }`} />
                <span className={`font-semibold ${
                  statusColor === 'success' ? 'text-success' : 
                  statusColor === 'warning' ? 'text-warning' : 'text-danger'
                }`}>
                  {performancePercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  statusColor === 'success' ? 'bg-success' : 
                  statusColor === 'warning' ? 'bg-warning' : 'bg-danger'
                }`}
                style={{ width: `${Math.min(performancePercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Difference */}
          <div className={`text-sm p-3 rounded-lg ${
            statusColor === 'success' ? 'bg-success/10 text-success' : 
            statusColor === 'warning' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
          }`}>
            <div className="font-semibold">
              {formatValue(difference.value, kpi.format)} {difference.text}
            </div>
            <div className="text-xs opacity-80">
              {difference.percentage}% de diferença da meta
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <EditKPIModal
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      kpi={kpi}
      onSave={handleSave}
    />
    </>
  );
};

export default KPICard;