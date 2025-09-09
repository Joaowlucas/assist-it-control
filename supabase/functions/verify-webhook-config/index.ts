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
    console.log('🔍 Verificando e corrigindo configuração do webhook...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configurações do sistema
    const { data: settings } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (!settings?.evolution_api_url || !settings?.evolution_api_token || !settings?.evolution_instance_name) {
      throw new Error('Configurações da Evolution API não encontradas');
    }

    let apiUrl = settings.evolution_api_url;
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/manager')) apiUrl = apiUrl.slice(0, -8);

    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
    
    console.log('🔧 Removendo webhook existente...');
    
    // Primeiro, remover webhook existente
    const deleteResponse = await fetch(`${apiUrl}/webhook/${settings.evolution_instance_name}`, {
      method: 'DELETE',
      headers: {
        'apikey': settings.evolution_api_token,
        'Content-Type': 'application/json'
      }
    });

    console.log('🗑️ Resultado da remoção:', deleteResponse.status);

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('➕ Criando novo webhook...');

    // Criar novo webhook com configuração correta
    const webhookConfig = {
      url: webhookUrl,
      enabled: true,
      events: [
        "MESSAGES_UPSERT",
        "CONNECTION_UPDATE"
      ],
      webhookByEvents: true,
      webhookBase64: false
    };

    const createResponse = await fetch(`${apiUrl}/webhook/set/${settings.evolution_instance_name}`, {
      method: 'POST',
      headers: {
        'apikey': settings.evolution_api_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhook: webhookConfig
      })
    });

    const createResult = await createResponse.json();
    console.log('✅ Resultado da criação:', createResult);

    if (!createResponse.ok) {
      throw new Error(`Erro ao criar webhook: ${createResponse.status} - ${JSON.stringify(createResult)}`);
    }

    // Aguardar configuração ser aplicada
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verificar se foi criado corretamente
    console.log('🔍 Verificando webhook criado...');
    const verifyResponse = await fetch(`${apiUrl}/webhook/find/${settings.evolution_instance_name}`, {
      headers: {
        'apikey': settings.evolution_api_token
      }
    });

    const verifyResult = await verifyResponse.json();
    console.log('📋 Webhook verificado:', JSON.stringify(verifyResult, null, 2));

    // Testar enviando uma mensagem de teste
    console.log('📤 Enviando mensagem de teste...');
    const testResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: "test-verification",
        instance: settings.evolution_instance_name,
        timestamp: Date.now()
      })
    });

    console.log('🧪 Teste enviado:', testResponse.status);

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook reconfigurado com sucesso',
      webhookUrl: webhookUrl,
      instance: settings.evolution_instance_name,
      verification: verifyResult,
      testSent: testResponse.ok
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});