import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  MessageSquare, 
  TestTube, 
  Users, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import { useWhatsAppTickets, useWhatsAppStats, useTestWhatsAppWebhook } from '@/hooks/useWhatsAppAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/useSystemSettings';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const WhatsAppAdminPanel: React.FC = () => {
  const { data: tickets, isLoading: ticketsLoading } = useWhatsAppTickets();
  const { data: stats, isLoading: statsLoading } = useWhatsAppStats();
  const { data: settings, isLoading: settingsLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const testWebhook = useTestWhatsAppWebhook();

  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Meu computador não está ligando. Preciso de ajuda urgente!');
  const [openaiApiKey, setOpenaiApiKey] = useState('');

  const handleTest = () => {
    if (!testPhone || !testMessage) {
      return;
    }
    testWebhook.mutate({ phone: testPhone, message: testMessage });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'destructive';
      case 'alta': return 'default';
      case 'media': return 'secondary';
      case 'baixa': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'destructive';
      case 'em_andamento': return 'default';
      case 'aguardando': return 'secondary';
      case 'fechado': return 'outline';
      default: return 'secondary';
    }
  };

  if (settingsLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração da API OpenAI
          </CardTitle>
          <CardDescription>
            Configure a chave da API do OpenAI para processamento inteligente das mensagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">Chave da API OpenAI</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Esta chave é armazenada com segurança nos secrets do Supabase e usada para analisar mensagens automaticamente.
            </p>
          </div>
          <Button 
            onClick={async () => {
              try {
                const response = await supabase.functions.invoke('update-openai-key', {
                  body: { openaiApiKey }
                });
                
                if (response.error) {
                  throw new Error(response.error.message);
                }
                
                setOpenaiApiKey('');
                // Toast de sucesso seria mostrado aqui
                console.log('Chave OpenAI atualizada com sucesso');
              } catch (error) {
                console.error('Erro ao salvar chave:', error);
              }
            }}
            disabled={!openaiApiKey}
          >
            Salvar Chave API
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="tickets">Chamados</TabsTrigger>
          <TabsTrigger value="test">Testar</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <p className="text-sm font-medium">Total</p>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      chamados via WhatsApp
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <p className="text-sm font-medium">Hoje</p>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">{stats.today}</div>
                    <p className="text-xs text-muted-foreground">
                      novos chamados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <p className="text-sm font-medium">Esta Semana</p>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{stats.thisWeek}</div>
                    <p className="text-xs text-muted-foreground">
                      nos últimos 7 dias
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                      <p className="text-sm font-medium">Este Mês</p>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{stats.thisMonth}</div>
                    <p className="text-xs text-muted-foreground">
                      nos últimos 30 dias
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Por Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(stats.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <Badge variant={getStatusColor(status)}>
                          {status}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Por Prioridade</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(stats.byPriority).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <Badge variant={getPriorityColor(priority)}>
                          {priority}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(stats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <Badge variant="outline">
                          {category}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground">
              Nenhuma estatística disponível
            </p>
          )}
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chamados Recentes via WhatsApp</CardTitle>
              <CardDescription>
                Últimos 50 chamados criados através do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : tickets && tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{ticket.ticket_number}</Badge>
                          <Badge variant={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm")}
                        </span>
                      </div>
                      <h4 className="font-medium">{ticket.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>👤 {ticket.requester.name}</span>
                        <span>📱 {ticket.requester.phone}</span>
                        <span>🏢 {ticket.unit.name}</span>
                        <span>📂 {ticket.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  Nenhum chamado criado via WhatsApp ainda
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários para Teste
              </CardTitle>
              <CardDescription>
                Usuários cadastrados com telefone que podem ser usados para testar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <p><strong>💡 Dica:</strong> Vá até a seção de usuários para cadastrar telefones e poder testar o sistema.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Testar Webhook
              </CardTitle>
              <CardDescription>
                Simule o recebimento de uma mensagem via WhatsApp para testar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-phone">Número de Telefone</Label>
                <Input
                  id="test-phone"
                  placeholder="11999999999"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Digite apenas números, sem formatação. O número deve estar cadastrado no sistema.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-message">Mensagem de Teste</Label>
                <Textarea
                  id="test-message"
                  placeholder="Digite uma mensagem para simular..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleTest}
                disabled={!testPhone || !testMessage || testWebhook.isPending}
                className="w-full"
              >
                {testWebhook.isPending ? 'Testando...' : 'Testar Webhook'}
              </Button>

              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="text-sm font-medium">Como testar:</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Digite um número de telefone que esteja cadastrado no sistema</li>
                  <li>Escreva uma mensagem simulando um problema de TI</li>
                  <li>Clique em "Testar Webhook" para simular o recebimento</li>
                  <li>O sistema processará a mensagem e criará um chamado automaticamente</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuração do Webhook na Evolution API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium mb-2">URL do Webhook:</p>
                <code className="text-xs bg-background p-2 rounded border block">
                  https://riqievnbraelqrzrovyr.functions.supabase.co/whatsapp-webhook
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                Configure esta URL no webhook da sua instância da Evolution API para receber as mensagens automaticamente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppAdminPanel;