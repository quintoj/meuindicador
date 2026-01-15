import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const UserHelpGuide = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Ajuda
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
                <HelpCircle className="w-6 h-6 text-primary" />
                <span>Como usar seu Painel Inteligente</span>
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Aprenda a gerenciar seus indicadores em 3 passos simples
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] px-6 py-4">
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            {/* Introdução */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                🎯 Como usar seu Painel Inteligente
              </h3>
              <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                Este sistema funciona como um <strong>GPS para seu negócio</strong>: ele te avisa se você está na rota certa 
                (<span className="text-green-600 font-bold">Verde</span>) ou se precisa corrigir algo 
                (<span className="text-red-600 font-bold">Vermelho</span>).
              </p>
            </section>

            {/* Passo 1: Escolhendo Indicadores */}
            <section className="pt-4 border-t">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <span className="w-7 h-7 bg-gradient-primary text-white rounded-full flex items-center justify-center mr-2 text-sm font-bold">1</span>
                Escolhendo seus Indicadores
              </h3>
              <div className="flex gap-3 items-start p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span className="text-2xl">🛒</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Clique em <strong className="text-primary">Loja de Indicadores</strong> para ver as métricas disponíveis.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    💡 <strong>Dica:</strong> Adicione apenas o que for importante para você hoje. Você pode remover depois se quiser.
                  </p>
                </div>
              </div>
            </section>

            {/* Passo 2: Fazendo Lançamentos */}
            <section className="pt-4 border-t">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <span className="w-7 h-7 bg-gradient-primary text-white rounded-full flex items-center justify-center mr-2 text-sm font-bold">2</span>
                Fazendo Lançamentos (O Segredo)
              </h3>
              <p className="mb-3 text-gray-600 dark:text-gray-400">
                Ao clicar nos <strong>três pontinhos (⋮)</strong> de um card e selecionar <strong>"Lançar Dados"</strong>, você verá dois tipos de campos:
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Campos Diários */}
                <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/30 rounded-r">
                  <h4 className="font-bold text-purple-900 dark:text-purple-400 text-xs uppercase mb-2 flex items-center">
                    📅 Campos Diários
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    São dados <strong>vivos</strong> da sua operação (ex: Vendas de Hoje, Cancelamentos do Dia). 
                  </p>
                  <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs text-purple-800 dark:text-purple-400">
                    <strong>Como funciona:</strong> Você preenche todo dia com o valor atualizado.
                  </div>
                </div>
                
                {/* Campos Fixos */}
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 rounded-r">
                  <h4 className="font-bold text-blue-900 dark:text-blue-400 text-xs uppercase mb-2 flex items-center">
                    🔒 Campos Fixos (Inteligentes)
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    São dados de <strong>estrutura</strong> do seu negócio (ex: Total de Alunos, Metragem do Estabelecimento).
                  </p>
                  <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs">
                    <strong className="text-blue-700 dark:text-blue-400">✨ A mágica:</strong> 
                    <span className="text-gray-700 dark:text-gray-300"> Você digita uma vez no dia 1º, e o sistema já traz preenchido no resto do mês para te poupar tempo!</span>
                  </div>
                </div>
              </div>

              {/* Exemplo Visual */}
              <div className="mt-4 p-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">📋 Exemplo Prático:</p>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <p>• <strong>Vendas do Dia</strong> (Diário): Você preenche R$ 1.200 hoje, amanhã vai estar zerado esperando o novo valor.</p>
                  <p>• <strong>Total de Alunos</strong> (Fixo): Você digitou 150 no dia 1º? Vai aparecer 150 automaticamente nos próximos dias.</p>
                </div>
              </div>
            </section>

            {/* Passo 3: Entendendo as Cores */}
            <section className="pt-4 border-t">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <span className="w-7 h-7 bg-gradient-primary text-white rounded-full flex items-center justify-center mr-2 text-sm font-bold">3</span>
                Entendendo as Cores (Semáforo)
              </h3>
              <p className="mb-3 text-gray-600 dark:text-gray-400">
                O sistema compara automaticamente seu <strong>Resultado</strong> com a <strong>Meta</strong> e mostra uma cor:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Verde */}
                <div className="text-center p-4 rounded-lg border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
                  <span className="text-4xl mb-2 block">🟢</span>
                  <div className="font-bold text-green-700 dark:text-green-400 text-lg mb-2">Parabéns!</div>
                  <p className="text-xs text-green-800 dark:text-green-500 leading-relaxed">
                    Você <strong>bateu a meta</strong> (ex: Vendas)<br/>
                    <span className="text-green-600 dark:text-green-400">OU</span><br/>
                    Ficou <strong>dentro do limite seguro</strong> (ex: Cancelamentos baixos).
                  </p>
                </div>
                
                {/* Amarelo */}
                <div className="text-center p-4 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30">
                  <span className="text-4xl mb-2 block">🟡</span>
                  <div className="font-bold text-yellow-700 dark:text-yellow-400 text-lg mb-2">Fique Atento</div>
                  <p className="text-xs text-yellow-800 dark:text-yellow-500 leading-relaxed">
                    Está <strong>perto da meta</strong>, mas ainda não chegou<br/>
                    <span className="text-yellow-600 dark:text-yellow-400">OU</span><br/>
                    Está no <strong>limite aceitável</strong>, mas pode melhorar.
                  </p>
                </div>
                
                {/* Vermelho */}
                <div className="text-center p-4 rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 md:col-span-2">
                  <span className="text-4xl mb-2 block">🔴</span>
                  <div className="font-bold text-red-700 dark:text-red-400 text-lg mb-2">Atenção Necessária</div>
                  <p className="text-xs text-red-800 dark:text-red-500 leading-relaxed">
                    <strong>Falta muito</strong> para bater a meta (ex: Vendas muito abaixo)<br/>
                    <span className="text-red-600 dark:text-red-400">OU</span><br/>
                    Você <strong>estourou o limite</strong> aceitável (ex: Cancelamentos muito altos).
                  </p>
                </div>
              </div>

              {/* Explicação Extra */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed">
                  <strong>💡 Por que alguns indicadores "invertem" a lógica?</strong><br/>
                  Para Vendas e Lucro, quanto <strong>maior melhor</strong> = Verde quando alto.<br/>
                  Para Churn e Despesas, quanto <strong>menor melhor</strong> = Verde quando baixo.<br/>
                  <span className="text-blue-600 dark:text-blue-500">O sistema já sabe disso e calcula automaticamente!</span>
                </p>
              </div>
            </section>

            {/* Dicas Rápidas */}
            <section className="pt-4 border-t">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                💡 Dicas Rápidas
              </h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Alterar a Meta:</strong> Você pode mudar a meta de cada indicador direto na tela de lançamento.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Editar Indicador:</strong> Use os três pontinhos (⋮) no canto do card e selecione "Editar Indicador" para mudar nome ou formato.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Remover do Dashboard:</strong> Se um indicador não faz sentido para você, pode removê-lo a qualquer momento.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Lançamentos Diários:</strong> Crie o hábito de fazer os lançamentos no mesmo horário todos os dias (ex: ao abrir ou fechar o estabelecimento).
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t text-center">
              <p className="text-xs text-muted-foreground">
                ❓ Precisa de mais ajuda? Entre em contato com o suporte.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default UserHelpGuide;

