import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    console.log('🔧 Iniciando correção do webhook...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configurações
    const { data: settings } = await supabase
      .from('system_settings')
      .select('evolution_api_url, evolution_api_token, evolution_instance_name')
      .single();

    if (!settings?.evolution_api_url || !settings?.evolution_api_token || !settings?.evolution_instance_name) {
      throw new Error('Configurações da Evolution API não encontradas');
    }

    const cleanApiUrl = settings.evolution_api_url.replace(/\/+$/, '');
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
    
    console.log('📍 URL do webhook:', webhookUrl);
    console.log('🏭 Instância:', settings.evolution_instance_name);

    // Configurar webhook corretamente
    const webhookConfig = {
      url: webhookUrl,
      enabled: true,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE'
      ],
      webhookByEvents: false,
      webhookBase64: false
    };

    console.log('⚙️ Configuração do webhook:', JSON.stringify(webhookConfig, null, 2));

    // Primeiro, deletar webhook existente (se houver)
    try {
      const deleteResponse = await fetch(`${cleanApiUrl}/webhook/${settings.evolution_instance_name}`, {
        method: 'DELETE',
        headers: {
          'apikey': settings.evolution_api_token,
          'Content-Type': 'application/json'
        }
      });
      console.log('🗑️ Delete webhook response:', deleteResponse.status);
    } catch (e) {
      console.log('⚠️ Erro ao deletar webhook (pode não existir):', e.message);
    }

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Criar novo webhook
    const createResponse = await fetch(`${cleanApiUrl}/webhook/set/${settings.evolution_instance_name}`, {
      method: 'POST',
      headers: {
        'apikey': settings.evolution_api_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookConfig)
    });

    const createResult = await createResponse.json();
    console.log('✅ Resposta da criação do webhook:', JSON.stringify(createResult, null, 2));

    if (!createResponse.ok) {
      throw new Error(`Erro ao criar webhook: ${JSON.stringify(createResult)}`);
    }

    // Verificar status da instância
    const instanceResponse = await fetch(`${cleanApiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': settings.evolution_api_token
      }
    });

    const instances = await instanceResponse.json();
    console.log('📱 Status das instâncias:', JSON.stringify(instances, null, 2));

    return new Response(JSON.stringify({
      success: true,
      webhookUrl,
      instanceName: settings.evolution_instance_name,
      webhookConfig: createResult,
      instances
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});