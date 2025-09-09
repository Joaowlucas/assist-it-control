import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, User, Building2, Copy, ExternalLink } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useToast } from '@/hooks/use-toast';

const WhatsAppTestHelper: React.FC = () => {
  const { data: profiles, isLoading } = useProfiles();
  const { toast } = useToast();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const profilesWithPhone = profiles?.filter(p => p.phone && p.phone.trim() !== '') || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Texto copiado para a área de transferência',
    });
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent('Meu computador não está ligando. Preciso de ajuda urgente!');
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando usuários...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Usuários para Teste
        </CardTitle>
        <CardDescription>
          Usuários cadastrados com telefone que podem ser usados para testar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profilesWithPhone.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum usuário com telefone cadastrado encontrado.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Cadastre telefones na seção de usuários para poder testar o sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              {profilesWithPhone.map((profile) => (
                <div 
                  key={profile.id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedProfile === profile.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedProfile(profile.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{profile.name}</span>
                        <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                          {profile.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {profile.phone}
                        </span>
                        {profile.unit_id && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Unidade cadastrada
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(profile.phone!);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openWhatsApp(profile.phone!);
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedProfile && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Como testar com este usuário:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Copie o número de telefone clicando no ícone de cópia</li>
                  <li>Cole o número no campo "Número de Telefone" na aba de teste</li>
                  <li>Ou clique no ícone de link externo para abrir o WhatsApp diretamente</li>
                  <li>Envie uma mensagem simulando um problema de TI</li>
                  <li>O sistema criará um chamado automaticamente</li>
                </ol>
                <div className="mt-2">
                  <p className="text-sm font-medium">Número selecionado:</p>
                  <code className="text-xs bg-background p-2 rounded border block mt-1">
                    {profilesWithPhone.find(p => p.id === selectedProfile)?.phone}
                  </code>
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 Dica para teste real
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Para testar com WhatsApp real, configure o webhook na Evolution API e envie mensagens 
                diretamente pelo WhatsApp usando um dos números cadastrados acima.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppTestHelper;