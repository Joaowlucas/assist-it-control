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
    console.log('🔍 Iniciando diagnóstico do webhook...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configurações
    const { data: settings } = await supabase
      .from('system_settings')
      .select('evolution_api_url, evolution_api_token, evolution_instance_name')
      .maybeSingle();

    if (!settings?.evolution_api_url || !settings?.evolution_api_token || !settings?.evolution_instance_name) {
      throw new Error('Configurações da Evolution API não encontradas');
    }

    const cleanApiUrl = settings.evolution_api_url.replace(/\/+$/, '');
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
    
    console.log('📍 URLs e configurações:');
    console.log('- API URL:', cleanApiUrl);
    console.log('- Webhook URL:', webhookUrl);
    console.log('- Instance:', settings.evolution_instance_name);

    // 1. Verificar status da instância
    console.log('\n1️⃣ Verificando status da instância...');
    const instanceResponse = await fetch(`${cleanApiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': settings.evolution_api_token
      }
    });

    const instances = await instanceResponse.json();
    console.log('📱 Instâncias encontradas:', instances.length);
    
    const targetInstance = instances.find((inst: any) => inst.name === settings.evolution_instance_name);
    if (!targetInstance) {
      console.error('❌ Instância não encontrada!');
      return new Response(JSON.stringify({
        error: 'Instância não encontrada',
        availableInstances: instances.map((i: any) => i.name)
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`✅ Instância encontrada: ${targetInstance.name} (Status: ${targetInstance.connectionStatus})`);

    // 2. Verificar configuração atual do webhook
    console.log('\n2️⃣ Verificando configuração atual do webhook...');
    const webhookResponse = await fetch(`${cleanApiUrl}/webhook/find/${settings.evolution_instance_name}`, {
      method: 'GET',
      headers: {
        'apikey': settings.evolution_api_token
      }
    });

    let currentWebhook = null;
    if (webhookResponse.ok) {
      currentWebhook = await webhookResponse.json();
      console.log('🎣 Webhook atual:', JSON.stringify(currentWebhook, null, 2));
    } else {
      console.log('⚠️ Nenhum webhook configurado');
    }

    // 3. Testar conectividade do webhook
    console.log('\n3️⃣ Testando conectividade do webhook...');
    try {
      const testResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'test',
          test: true
        })
      });
      console.log(`📡 Teste de conectividade: ${testResponse.status} ${testResponse.statusText}`);
    } catch (error) {
      console.error('❌ Erro no teste de conectividade:', error.message);
    }

    // 4. Verificar logs recentes
    console.log('\n4️⃣ Verificando configuração de eventos...');
    const recommendedEvents = [
      'MESSAGES_UPSERT',
      'CONNECTION_UPDATE'
    ];

    const diagnosis = {
      instance: {
        name: targetInstance.name,
        status: targetInstance.connectionStatus,
        connected: targetInstance.connectionStatus === 'open'
      },
      webhook: {
        configured: !!currentWebhook,
        url: currentWebhook?.url || 'não configurado',
        enabled: currentWebhook?.enabled || false,
        events: currentWebhook?.events || [],
        recommendedEvents,
        eventsMatch: currentWebhook?.events?.includes('MESSAGES_UPSERT') || false
      },
      urls: {
        api: cleanApiUrl,
        webhook: webhookUrl,
        instance: settings.evolution_instance_name
      }
    };

    console.log('\n📊 Diagnóstico completo:', JSON.stringify(diagnosis, null, 2));

    return new Response(JSON.stringify({
      success: true,
      diagnosis,
      recommendations: [
        !diagnosis.instance.connected && 'Conectar a instância do WhatsApp',
        !diagnosis.webhook.configured && 'Configurar webhook',
        !diagnosis.webhook.enabled && 'Ativar webhook',
        !diagnosis.webhook.eventsMatch && 'Ajustar eventos do webhook'
      ].filter(Boolean)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});