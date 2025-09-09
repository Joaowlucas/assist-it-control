import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TestWebhookConfig = () => {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testWebhookConfig = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-webhook-config');
      
      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "Teste concluído",
        description: "Verificar logs para mais detalhes",
      });
    } catch (error: any) {
      console.error('Erro no teste:', error);
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-4">Teste de Configuração WhatsApp</h3>
      
      <Button 
        onClick={testWebhookConfig}
        disabled={testing}
        className="mb-4"
      >
        {testing ? 'Testando...' : 'Testar Webhook'}
      </Button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h4 className="font-semibold">Resultado:</h4>
          <pre className="text-sm mt-2 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestWebhookConfig;