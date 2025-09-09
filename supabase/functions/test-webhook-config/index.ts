import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Testando configuração do webhook WhatsApp');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configurações
    const { data: settings } = await supabase
      .from('system_settings')
      .select('evolution_api_url, evolution_api_token, evolution_instance_name')
      .single();

    if (!settings?.evolution_api_url) {
      throw new Error('Evolution API URL não configurada');
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
    
    console.log('URL do webhook:', webhookUrl);
    console.log('Instância:', settings.evolution_instance_name);
    
    // Verificar status da instância
    const instanceResponse = await fetch(`${settings.evolution_api_url}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': settings.evolution_api_token,
        'Content-Type': 'application/json',
      },
    });

    const instanceData = await instanceResponse.json();
    console.log('Status das instâncias:', JSON.stringify(instanceData, null, 2));
    
    // Configurar webhook para mensagens
    const webhookConfig = {
      webhook: {
        url: webhookUrl,
        by_events: false,
        base64: false,
        events: [
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE", 
          "MESSAGES_DELETE",
          "SEND_MESSAGE"
        ]
      }
    };

    const setWebhookResponse = await fetch(`${settings.evolution_api_url}/webhook/set/${settings.evolution_instance_name}`, {
      method: 'POST',
      headers: {
        'apikey': settings.evolution_api_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookConfig)
    });

    const webhookResult = await setWebhookResponse.json();
    console.log('Resultado da configuração do webhook:', JSON.stringify(webhookResult, null, 2));

    // Verificar configuração atual do webhook
    const getWebhookResponse = await fetch(`${settings.evolution_api_url}/webhook/find/${settings.evolution_instance_name}`, {
      method: 'GET',
      headers: {
        'apikey': settings.evolution_api_token,
        'Content-Type': 'application/json',
      },
    });

    const currentWebhook = await getWebhookResponse.json();
    console.log('Configuração atual do webhook:', JSON.stringify(currentWebhook, null, 2));

    return new Response(JSON.stringify({
      success: true,
      webhookUrl,
      instanceStatus: instanceData,
      webhookConfig: webhookResult,
      currentWebhook: currentWebhook
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no teste de configuração:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});