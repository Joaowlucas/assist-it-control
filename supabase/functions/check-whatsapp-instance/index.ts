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
    console.log('🔍 Verificando status completo da instância WhatsApp...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configurações
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

    const instanceName = settings.evolution_instance_name;
    const token = settings.evolution_api_token;

    console.log('📱 Verificando informações da instância...');

    // 1. Verificar status da instância
    const statusResponse = await fetch(`${apiUrl}/instance/fetchInstances/${instanceName}`, {
      headers: { 'apikey': token }
    });
    
    const statusData = await statusResponse.json();
    console.log('📊 Status da instância:', JSON.stringify(statusData, null, 2));

    // 2. Verificar informações de conexão
    const connectResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': token }
    });
    
    const connectData = await connectResponse.json();
    console.log('🔌 Estado de conexão:', JSON.stringify(connectData, null, 2));

    // 3. Verificar QR Code se necessário
    let qrCode = null;
    if (connectData?.instance?.state !== 'open') {
      try {
        const qrResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': token }
        });
        const qrData = await qrResponse.json();
        console.log('📱 QR Code info:', qrData);
        qrCode = qrData;
      } catch (qrError) {
        console.log('⚠️ Não foi possível obter QR Code:', qrError.message);
      }
    }

    // 4. Verificar webhook atual
    const webhookResponse = await fetch(`${apiUrl}/webhook/find/${instanceName}`, {
      headers: { 'apikey': token }
    });
    
    const webhookData = await webhookResponse.json();
    console.log('🎣 Webhook atual:', JSON.stringify(webhookData, null, 2));

    // 5. Testar envio de mensagem para si mesmo (se conectado)
    let testMessage = null;
    if (connectData?.instance?.state === 'open' && statusData?.instance?.profilePictureUrl) {
      try {
        const phoneNumber = statusData.instance.profileName || statusData.instance.instanceName;
        console.log('📤 Tentando enviar mensagem de teste...');
        
        // Tentar enviar mensagem para o próprio número (teste)
        const testMsgResponse = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: statusData.instance.profileName?.replace(/[^\d]/g, '') || "5511999999999",
            text: "🤖 Teste de conectividade do bot - ignore esta mensagem"
          })
        });
        
        if (testMsgResponse.ok) {
          testMessage = await testMsgResponse.json();
          console.log('✅ Mensagem de teste enviada:', testMessage);
        } else {
          console.log('❌ Falha ao enviar mensagem de teste:', testMsgResponse.status);
        }
      } catch (testError) {
        console.log('⚠️ Erro no teste de mensagem:', testError.message);
      }
    }

    // Compilar diagnóstico
    const diagnosis = {
      instance: {
        name: instanceName,
        connected: connectData?.instance?.state === 'open',
        state: connectData?.instance?.state || 'unknown',
        profileName: statusData?.instance?.profileName,
        profilePicture: statusData?.instance?.profilePictureUrl,
        number: statusData?.instance?.profileName?.replace(/[^\d]/g, ''),
      },
      webhook: {
        configured: webhookResponse.ok,
        url: webhookData?.url,
        enabled: webhookData?.enabled,
        events: webhookData?.events
      },
      connectivity: {
        apiUrl,
        testMessageSent: testMessage !== null,
        qrCodeNeeded: connectData?.instance?.state !== 'open'
      },
      qrCode: qrCode
    };

    console.log('📋 Diagnóstico completo:', JSON.stringify(diagnosis, null, 2));

    return new Response(JSON.stringify({
      success: true,
      diagnosis,
      recommendations: [
        ...(diagnosis.instance.state !== 'open' ? ['Instância não está conectada - escaneie o QR Code'] : []),
        ...(diagnosis.webhook.configured ? [] : ['Webhook não está configurado']),
        ...(!diagnosis.connectivity.testMessageSent && diagnosis.instance.connected ? ['Problema no envio de mensagens'] : [])
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    
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