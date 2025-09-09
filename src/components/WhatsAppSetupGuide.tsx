import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Settings2, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WhatsAppSetupGuide: React.FC = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'URL copiada para a área de transferência',
    });
  };

  const webhookUrl = 'https://riqievnbraelqrzrovyr.functions.supabase.co/whatsapp-webhook';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Guia de Configuração WhatsApp
          </CardTitle>
          <CardDescription>
            Siga este guia para configurar completamente o sistema de chamados via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Passo 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold">Configurar Webhook na Evolution API</h3>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Configure o webhook na sua instância da Evolution API para receber mensagens automaticamente.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div>
                <label className="text-sm font-medium">URL do Webhook:</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-background p-2 rounded border">
                    {webhookUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Eventos para monitorar:</label>
                <div className="mt-1">
                  <Badge variant="outline">MESSAGES_UPSERT</Badge>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p><strong>Como configurar:</strong></p>
                <ol className="list-decimal list-inside space-y-1 mt-1">
                  <li>Acesse o painel da Evolution API</li>
                  <li>Vá em Configurações da Instância</li>
                  <li>Adicione a URL do webhook acima</li>
                  <li>Marque o evento "MESSAGES_UPSERT"</li>
                  <li>Salve as configurações</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Passo 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold">Cadastrar Telefones dos Usuários</h3>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Para que um usuário possa criar chamados via WhatsApp, ele precisa ter o telefone cadastrado no sistema.
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
                <strong>Como fazer:</strong> Vá em Configurações → Usuários → Editar usuário → Adicionar telefone
              </p>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold">Como o Usuário Usa</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Usuário
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3 text-green-600" />
                    <span>Envia mensagem para o WhatsApp Business</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-5">
                    Ex: "Meu computador não está ligando. Preciso de ajuda urgente!"
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Analisa mensagem com IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Cria chamado automaticamente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span>Envia confirmação via WhatsApp</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Status da Configuração</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium">Evolution API</div>
                  <div className="text-xs text-muted-foreground">Conectada e funcionando</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium">OpenAI API</div>
                  <div className="text-xs text-muted-foreground">Configurada</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="text-sm font-medium">Webhook</div>
                  <div className="text-xs text-muted-foreground">Precisa configurar</div>
                </div>
              </div>
            </div>
          </div>

          {/* Números para teste */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Números Cadastrados para Teste</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-muted rounded">
                <Badge variant="outline">Seu Nome</Badge>
                <code className="text-sm">85999999999</code>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => window.open(`https://wa.me/5585999999999?text=${encodeURIComponent('Teste: Meu computador não está funcionando!')}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted rounded">
                <Badge variant="outline">Outro Usuário</Badge>
                <code className="text-sm">85888888888</code>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => window.open(`https://wa.me/5585888888888?text=${encodeURIComponent('Teste: Preciso de suporte técnico!')}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppSetupGuide;