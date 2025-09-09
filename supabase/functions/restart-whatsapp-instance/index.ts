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
    console.log('🔄 Reiniciando instância WhatsApp...');
    
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
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

    console.log('1️⃣ Desconectando instância...');
    
    // 1. Desconectar instância atual
    try {
      const logoutResponse = await fetch(`${apiUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': token }
      });
      console.log('📤 Logout response:', logoutResponse.status);
    } catch (logoutError) {
      console.log('⚠️ Erro no logout:', logoutError.message);
    }

    // Aguardar
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('2️⃣ Reiniciando instância...');
    
    // 2. Reiniciar instância
    try {
      const restartResponse = await fetch(`${apiUrl}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: { 'apikey': token }
      });
      console.log('🔄 Restart response:', restartResponse.status);
    } catch (restartError) {
      console.log('⚠️ Erro no restart:', restartError.message);
    }

    // Aguardar
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('3️⃣ Removendo webhook antigo...');
    
    // 3. Remover webhook antigo
    try {
      const deleteWebhookResponse = await fetch(`${apiUrl}/webhook/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': token }
      });
      console.log('🗑️ Delete webhook response:', deleteWebhookResponse.status);
    } catch (deleteError) {
      console.log('⚠️ Erro ao deletar webhook:', deleteError.message);
    }

    // Aguardar
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('4️⃣ Configurando novo webhook...');
    
    // 4. Configurar webhook novamente
    const webhookConfig = {
      url: webhookUrl,
      enabled: true,
      events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      webhookByEvents: true,
      webhookBase64: false
    };

    const setWebhookResponse = await fetch(`${apiUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ webhook: webhookConfig })
    });

    const webhookResult = await setWebhookResponse.json();
    console.log('✅ Webhook configurado:', JSON.stringify(webhookResult, null, 2));

    // Aguardar
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('5️⃣ Conectando instância...');
    
    // 5. Conectar instância novamente
    const connectResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': token }
    });

    const connectResult = await connectResponse.json();
    console.log('🔌 Connect result:', JSON.stringify(connectResult, null, 2));

    // 6. Verificar status final
    console.log('6️⃣ Verificando status final...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalStatusResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': token }
    });
    
    const finalStatus = await finalStatusResponse.json();
    console.log('📊 Status final:', JSON.stringify(finalStatus, null, 2));

    return new Response(JSON.stringify({
      success: true,
      message: 'Instância reiniciada com sucesso',
      status: finalStatus,
      webhook: webhookResult,
      qrCode: connectResult?.qrcode || connectResult?.base64 || null,
      needsQrScan: finalStatus?.instance?.state !== 'open'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro ao reiniciar instância:', error);
    
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