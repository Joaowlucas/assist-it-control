import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Settings, MessageSquare, Users, Phone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BotFlow {
  id: string;
  name: string;
  trigger: string;
  steps: BotStep[];
}

interface BotStep {
  id: string;
  type: 'message' | 'input' | 'option' | 'create_ticket';
  content: string;
  options?: string[];
  next?: string;
}

export default function BotConfigSection() {
  const { toast } = useToast();
  const [flows, setFlows] = useState<BotFlow[]>([
    {
      id: '1',
      name: 'Criar Chamado',
      trigger: '1',
      steps: [
        {
          id: '1',
          type: 'message',
          content: '📋 Vamos criar um novo chamado! Por favor, descreva seu problema:',
          next: '2'
        },
        {
          id: '2',
          type: 'input',
          content: 'description',
          next: '3'
        },
        {
          id: '3',
          type: 'message',
          content: '📍 Qual sua localização/setor?',
          next: '4'
        },
        {
          id: '4',
          type: 'input',
          content: 'location',
          next: '5'
        },
        {
          id: '5',
          type: 'option',
          content: '🔴 Selecione a prioridade do chamado:',
          options: ['1 - Baixa', '2 - Média', '3 - Alta', '4 - Urgente'],
          next: '6'
        },
        {
          id: '6',
          type: 'create_ticket',
          content: '✅ Chamado criado com sucesso! Número: {ticket_number}'
        }
      ]
    }
  ]);

  const [selectedFlow, setSelectedFlow] = useState<BotFlow | null>(null);
  const [newFlowName, setNewFlowName] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');

  const addNewFlow = () => {
    if (!newFlowName.trim()) return;
    
    const newFlow: BotFlow = {
      id: Date.now().toString(),
      name: newFlowName,
      trigger: flows.length + 1 + '',
      steps: [{
        id: '1',
        type: 'message',
        content: `Olá! Você selecionou ${newFlowName}`,
      }]
    };
    
    setFlows([...flows, newFlow]);
    setNewFlowName('');
    toast({
      title: "Fluxo criado",
      description: `Fluxo "${newFlowName}" foi adicionado com sucesso!`
    });
  };

  const deleteFlow = (flowId: string) => {
    setFlows(flows.filter(f => f.id !== flowId));
    if (selectedFlow?.id === flowId) {
      setSelectedFlow(null);
    }
    toast({
      title: "Fluxo removido",
      description: "O fluxo foi removido com sucesso!"
    });
  };

  const testWebhook = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-webhook', {
        body: {
          event: 'messages.upsert',
          instance: 'acolher',
          data: {
            key: {
              remoteJid: testPhone + '@s.whatsapp.net',
              fromMe: false,
              id: 'TEST_' + Date.now()
            },
            message: {
              conversation: testMessage
            },
            messageType: 'conversation',
            pushName: 'Teste',
            messageTimestamp: Math.floor(Date.now() / 1000)
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Teste enviado",
        description: "Mensagem de teste enviada para o webhook!"
      });
    } catch (error: any) {
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fixWebhookConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fix-webhook-config');

      if (error) throw error;

      toast({
        title: "Webhook corrigido",
        description: "A configuração do webhook foi corrigida na Evolution API!"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao corrigir",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const diagnoseWebhook = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('diagnose-webhook');

      if (error) throw error;

      console.log('Diagnóstico:', data);
      
      const recommendations = data.recommendations || [];
      if (recommendations.length === 0) {
        toast({
          title: "Diagnóstico completo",
          description: "Tudo parece estar configurado corretamente!"
        });
      } else {
        toast({
          title: "Problemas encontrados",
          description: `${recommendations.length} problema(s) detectado(s). Verifique o console.`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no diagnóstico",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="flows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="flows">
            <MessageSquare className="w-4 h-4 mr-2" />
            Fluxos
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="test">
            <Phone className="w-4 h-4 mr-2" />
            Teste
          </TabsTrigger>
          <TabsTrigger value="status">
            <Users className="w-4 h-4 mr-2" />
            Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fluxos do Bot WhatsApp</CardTitle>
              <CardDescription>
                Configure os fluxos de conversa para criação automática de chamados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lista de Fluxos */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome do novo fluxo"
                      value={newFlowName}
                      onChange={(e) => setNewFlowName(e.target.value)}
                    />
                    <Button onClick={addNewFlow} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {flows.map((flow) => (
                      <div
                        key={flow.id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedFlow(flow)}
                      >
                        <div>
                          <h4 className="font-medium">{flow.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Gatilho: "{flow.trigger}" • {flow.steps.length} passos
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{flow.trigger}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFlow(flow.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Editor de Fluxo */}
                <div className="space-y-4">
                  {selectedFlow ? (
                    <>
                      <div>
                        <h4 className="font-medium mb-2">Editando: {selectedFlow.name}</h4>
                        <div className="space-y-2">
                          <Label>Gatilho (número ou palavra)</Label>
                          <Input
                            value={selectedFlow.trigger}
                            onChange={(e) => {
                              const updated = { ...selectedFlow, trigger: e.target.value };
                              setSelectedFlow(updated);
                              setFlows(flows.map(f => f.id === updated.id ? updated : f));
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Passos do Fluxo:</h5>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedFlow.steps.map((step, index) => (
                            <div key={step.id} className="p-2 border rounded text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="secondary">{index + 1}</Badge>
                                <Badge variant="outline">{step.type}</Badge>
                              </div>
                              <p className="text-muted-foreground">{step.content}</p>
                              {step.options && (
                                <div className="mt-1">
                                  {step.options.map((opt, i) => (
                                    <Badge key={i} variant="outline" className="mr-1 text-xs">
                                      {opt}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Selecione um fluxo para editar
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Bot</CardTitle>
              <CardDescription>
                Configure mensagens padrão e comportamentos do bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem de Boas-vindas</Label>
                <Textarea
                  placeholder="Olá! 👋 Sou o assistente virtual..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Mensagem de Menu Principal</Label>
                <Textarea
                  placeholder="Escolha uma opção: 1️⃣ Criar Chamado..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Erro</Label>
                <Textarea
                  placeholder="Desculpe, não entendi sua mensagem..."
                  rows={2}
                />
              </div>

              <Button>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testar Bot</CardTitle>
              <CardDescription>
                Simule mensagens para testar o funcionamento do bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Número de Teste (apenas números)</Label>
                <Input
                  placeholder="5511999999999"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Teste</Label>
                <Input
                  placeholder="1"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={testWebhook} disabled={!testPhone || !testMessage}>
                  Enviar Teste
                </Button>
                <Button onClick={fixWebhookConfig} variant="outline">
                  Corrigir Webhook
                </Button>
                <Button onClick={diagnoseWebhook} variant="secondary">
                  Diagnosticar
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke('test-webhook-ping');
                      
                      if (error) {
                        console.error('Erro no teste:', error);
                        toast({
                          title: "Erro no teste",
                          description: error.message || "Não foi possível testar o webhook"
                        });
                        return;
                      }

                      console.log('Resultado do teste:', data);
                      toast({
                        title: data.success ? "✅ Webhook funcionando" : "❌ Webhook com problema",
                        description: data.message
                      });
                    } catch (error) {
                      console.error('Erro no teste de ping:', error);
                      toast({
                        title: "Erro no teste",
                        description: "Não foi possível testar o webhook"
                      });
                    }
                  }} 
                  variant="secondary"
                >
                  Testar Webhook
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      toast({
                        title: "Reconfigurando webhook...",
                        description: "Aguarde, isso pode levar alguns segundos"
                      });
                      
                      const { data, error } = await supabase.functions.invoke('verify-webhook-config');
                      
                      if (error) {
                        console.error('Erro na reconfiguração:', error);
                        toast({
                          title: "Erro na reconfiguração",
                          description: error.message || "Não foi possível reconfigurar o webhook"
                        });
                        return;
                      }

                      console.log('Resultado da reconfiguração:', data);
                      toast({
                        title: data.success ? "✅ Webhook reconfigurado" : "❌ Erro na reconfiguração",
                        description: data.message
                      });
                    } catch (error) {
                      console.error('Erro na reconfiguração:', error);
                      toast({
                        title: "Erro na reconfiguração",
                        description: "Não foi possível reconfigurar o webhook"
                      });
                    }
                  }} 
                  variant="destructive"
                >
                  Reconfigurar Webhook
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      toast({
                        title: "Verificando instância...",
                        description: "Analisando conexão WhatsApp"
                      });
                      
                      const { data, error } = await supabase.functions.invoke('check-whatsapp-instance');
                      
                      if (error) {
                        console.error('Erro na verificação:', error);
                        toast({
                          title: "Erro na verificação",
                          description: error.message || "Não foi possível verificar a instância"
                        });
                        return;
                      }

                      console.log('Status da instância:', data);
                      
                      const instance = data.diagnosis?.instance;
                      const connected = instance?.connected;
                      
                      toast({
                        title: connected ? "✅ Instância conectada" : "❌ Instância desconectada",
                        description: connected ? 
                          `WhatsApp ativo como: ${instance.profileName}` : 
                          "Escaneie o QR Code para conectar"
                      });
                    } catch (error) {
                      console.error('Erro na verificação:', error);
                      toast({
                        title: "Erro na verificação",
                        description: "Não foi possível verificar a instância"
                      });
                    }
                  }} 
                  variant="outline"
                >
                  Verificar Instância
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status do Webhook</CardTitle>
              <CardDescription>
                Monitore o status da integração WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>URL do Webhook:</span>
                  <Badge variant="outline">
                    https://riqievnbraelqrzrovyr.functions.supabase.co/whatsapp-webhook
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Status da Instância:</span>
                  <Badge variant="default">Ativo</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Últimas Mensagens:</span>
                  <Badge variant="secondary">0 nas últimas 24h</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}