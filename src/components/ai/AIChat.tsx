import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, User, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai", 
      content: "Olá! Sou seu assistente de IA para análise de indicadores. Posso ajudar você a interpretar seus KPIs e sugerir melhorias. O que gostaria de saber?",
      timestamp: new Date()
    },
    {
      id: "2",
      type: "ai",
      content: "📊 **Análise Rápida dos seus KPIs:**\n\n🔴 **Atenção:** Seu faturamento está 15% abaixo da meta. Considere:\n• Revisar estratégias de vendas\n• Aumentar conversão de leads\n• Analisar ticket médio\n\n🟡 **Monitorar:** Taxa de conversão próxima da meta - está no caminho certo!\n\n🟢 **Parabéns:** Margem bruta saudável, continue assim!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simular resposta da IA (aqui você conectaria com uma API real de IA)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: getAIResponse(inputMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2000);
  };

  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes("faturamento") || input.includes("receita")) {
      return "📉 **Análise do Faturamento:**\n\nSeu faturamento está em R$ 85.420, que representa 85% da meta mensal.\n\n**Sugestões para melhorar:**\n• Implemente campanhas de reativação de clientes inativos\n• Analise os horários de pico para otimizar a operação\n• Considere parcerias com apps de delivery\n• Revise a precificação dos serviços principais";
    }
    
    if (input.includes("conversão") || input.includes("marketing")) {
      return "🎯 **Análise de Conversão:**\n\nSua taxa de conversão está em 23.4%, muito próxima da meta de 25%.\n\n**Para alcançar a meta:**\n• Melhore a qualificação dos leads\n• Otimize o funil de vendas\n• Treine a equipe comercial\n• Implemente follow-up automático";
    }
    
    if (input.includes("cliente") || input.includes("retenção")) {
      return "👥 **Análise de Clientes:**\n\nVocê tem 892 clientes ativos (89% da meta).\n\n**Estratégias de crescimento:**\n• Programa de indicação de clientes\n• Melhore a experiência do cliente\n• Implemente pesquisas de satisfação\n• Crie campanhas de fidelização";
    }
    
    return "🤖 Entendi sua pergunta! Com base nos seus dados atuais, recomendo focar primeiro nos indicadores que estão mais distantes da meta. Posso ajudar com análises específicas de qualquer KPI - basta me perguntar sobre faturamento, conversão, clientes ou qualquer outro indicador.";
  };

  const suggestions = [
    "Como melhorar o faturamento?",
    "Por que a conversão está baixa?",
    "Estratégias para novos clientes",
    "Análise da margem bruta"
  ];

  return (
    <Card className="h-[600px] bg-gradient-card border-0 shadow-custom-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg">IA Insights</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 h-[calc(100%-80px)] flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                  <div className="flex items-start space-x-2">
                    {message.type === 'ai' && (
                      <Bot className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    )}
                    {message.type === 'user' && (
                      <User className="w-4 h-4 mt-0.5 text-primary-foreground flex-shrink-0" />
                    )}
                    <div className="text-sm whitespace-pre-line">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Suggestions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-4">
            <div className="text-xs text-muted-foreground mb-2">Sugestões:</div>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs h-8"
                  onClick={() => setInputMessage(suggestion)}
                >
                  <Lightbulb className="w-3 h-3 mr-2" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Pergunte sobre seus indicadores..."
              className="text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-primary text-white hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;