import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Target, TrendingUp, Zap, Users, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import heroDashboard from "@/assets/hero-dashboard.jpg";

const Index = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Dashboard Customizável",
      description: "Monte seu painel personalizado com drag-and-drop dos indicadores mais importantes para seu negócio.",
    },
    {
      icon: Target,
      title: "Metas Inteligentes",
      description: "Defina metas e acompanhe performance com status visual intuitivo: verde, amarelo ou vermelho.",
    },
    {
      icon: TrendingUp,
      title: "Indicadores por Segmento",
      description: "Acesse indicadores específicos para academias, restaurantes, contabilidade, pet shops e mais.",
    },
    {
      icon: Zap,
      title: "IA para Insights",
      description: "Receba análises automáticas e sugestões de melhorias baseadas nos seus dados.",
    },
    {
      icon: Users,
      title: "Para PMEs",
      description: "Desenvolvido especialmente para pequenos e médios negócios que precisam crescer.",
    },
    {
      icon: Shield,
      title: "Simples de Usar",
      description: "Interface intuitiva que qualquer empreendedor pode usar, sem complexidade desnecessária.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Meu Gestor</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to="/dashboard">
              <Button className="bg-gradient-primary text-white hover:opacity-90">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Gerencie seus <span className="bg-gradient-primary bg-clip-text text-transparent">indicadores</span> com inteligência
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              A plataforma completa para PMEs acompanharem KPIs, definirem metas e receberem insights de IA para impulsionar o crescimento do negócio.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-primary text-white hover:opacity-90 px-8 py-6 text-lg">
                Experimente Grátis
              </Button>
            </Link>
            <Link to="/store">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                Ver Indicadores
              </Button>
            </Link>
          </div>

          {/* Hero Image */}
          <div className="mb-16 animate-slide-up">
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl opacity-10 blur-3xl transform scale-105"></div>
              <img 
                src={heroDashboard} 
                alt="Dashboard do Meu Gestor mostrando indicadores de performance com status visual intuitivo"
                className="relative w-full rounded-3xl shadow-custom-xl border border-border/50"
              />
            </div>
          </div>

          {/* Status Demo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-16">
            <Card className="bg-gradient-success text-white border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">127%</div>
                <div className="text-sm opacity-90">Acima da meta</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-warning text-white border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">94%</div>
                <div className="text-sm opacity-90">Próximo da meta</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-danger text-white border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">73%</div>
                <div className="text-sm opacity-90">Abaixo da meta</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para crescer
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas e simples para transformar dados em decisões inteligentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-gradient-card border-0 shadow-custom-md hover:shadow-custom-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comece a gerenciar hoje mesmo
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Junte-se a centenas de empresas que já transformaram sua gestão com o Meu Gestor.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-primary text-white hover:opacity-90 px-8 py-6 text-lg">
                Começar Agora - É Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">Meu Gestor</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 Meu Gestor. Transformando dados em crescimento.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;