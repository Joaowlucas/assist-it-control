import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, BarChart3, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { useWhatsAppTicketConfig, useUpdateWhatsAppTicketConfig, useWhatsAppTicketStats } from '@/hooks/useWhatsAppTickets';
import { Skeleton } from '@/components/ui/skeleton';

const WhatsAppTicketConfigSection: React.FC = () => {
  const { data: config, isLoading: configLoading } = useWhatsAppTicketConfig();
  const { data: stats, isLoading: statsLoading } = useWhatsAppTicketStats();
  const updateConfig = useUpdateWhatsAppTicketConfig();

  const handleToggleEnabled = (enabled: boolean) => {
    updateConfig.mutate({ enabled });
  };

  if (configLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuração Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chamados via WhatsApp
          </CardTitle>
          <CardDescription>
            Configure a criação automática de chamados através de mensagens do WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="whatsapp-tickets">Sistema de Chamados WhatsApp</Label>
              <p className="text-sm text-muted-foreground">
                Permite que usuários criem chamados enviando mensagens via WhatsApp
              </p>
            </div>
            <Switch
              id="whatsapp-tickets"
              checked={config?.enabled || false}
              onCheckedChange={handleToggleEnabled}
              disabled={updateConfig.isPending}
            />
          </div>

          {config?.enabled && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Sistema Ativo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Usuários cadastrados podem enviar mensagens via WhatsApp para criar chamados automaticamente.
                O sistema usará IA para categorizar e priorizar as solicitações.
              </p>
              <div className="text-xs text-muted-foreground mt-2">
                <strong>Webhook URL:</strong> https://riqievnbraelqrzrovyr.functions.supabase.co/whatsapp-webhook
              </div>
            </div>
          )}

          {!config?.enabled && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Sistema Inativo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ative o sistema para permitir a criação automática de chamados via WhatsApp.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {config?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estatísticas de Chamados WhatsApp
            </CardTitle>
            <CardDescription>
              Acompanhe o desempenho dos chamados criados via WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total de Chamados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.recent}</div>
                    <div className="text-sm text-muted-foreground">Últimos 30 dias</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.byStatus?.aberto || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Em Aberto</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.byStatus?.fechado || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Resolvidos</div>
                  </div>
                </div>

                {stats.byPriority && Object.keys(stats.byPriority).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Distribuição por Prioridade</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.byPriority).map(([priority, count]) => (
                        <Badge 
                          key={priority} 
                          variant={
                            priority === 'critica' ? 'destructive' :
                            priority === 'alta' ? 'default' :
                            priority === 'media' ? 'secondary' : 'outline'
                          }
                        >
                          {priority}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Nenhum chamado criado via WhatsApp ainda
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Como Funciona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">1. Recebimento da Mensagem</h4>
            <p className="text-xs text-muted-foreground">
              O sistema recebe mensagens via webhook da Evolution API e identifica o usuário pelo número cadastrado.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">2. Processamento com IA</h4>
            <p className="text-xs text-muted-foreground">
              A mensagem é analisada por IA para extrair título, descrição, categoria e prioridade automaticamente.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">3. Criação do Chamado</h4>
            <p className="text-xs text-muted-foreground">
              Um chamado é criado automaticamente no sistema com as informações extraídas.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">4. Confirmação</h4>
            <p className="text-xs text-muted-foreground">
              O usuário recebe uma confirmação via WhatsApp com o número do chamado e detalhes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppTicketConfigSection;