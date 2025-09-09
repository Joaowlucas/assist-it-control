import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Testando webhook...');
    
    // Fazer chamada de teste direta ao webhook
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook`;
    
    const testMessage = {
      event: "messages.upsert",
      instance: "acolher",
      data: {
        key: {
          remoteJid: "5598986082332@s.whatsapp.net",
          fromMe: false,
          id: "TEST_" + Date.now()
        },
        message: {
          conversation: "teste"
        },
        messageType: "conversation",
        pushName: "Teste",
        messageTimestamp: Math.floor(Date.now() / 1000)
      }
    };

    console.log('📤 Enviando mensagem de teste para webhook...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!
      },
      body: JSON.stringify(testMessage)
    });

    const responseText = await response.text();
    console.log('📥 Resposta do webhook:', response.status, responseText);

    if (response.ok) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Webhook funcionando corretamente',
        status: response.status,
        response: responseText
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Webhook com problema',
        status: response.status,
        response: responseText
      }), {
        status: 200, // Não retornar erro HTTP para o frontend
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      message: 'Erro ao conectar com o webhook',
      error: error.message
    }), {
      status: 200, // Não retornar erro HTTP para o frontend
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});