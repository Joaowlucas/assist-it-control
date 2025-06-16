
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendWhatsAppRequest {
  phone: string
  message: string
  notificationId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { phone, message, notificationId }: SendWhatsAppRequest = await req.json()

    // Buscar configurações do sistema
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })

    if (!settingsResponse.ok) {
      throw new Error('Erro ao buscar configurações do sistema')
    }

    const settings = await settingsResponse.json()
    if (!settings || settings.length === 0) {
      throw new Error('Configurações do sistema não encontradas')
    }

    const systemSettings = settings[0]

    if (!systemSettings.whatsapp_enabled) {
      throw new Error('WhatsApp não está habilitado')
    }

    if (!systemSettings.evolution_api_url || !systemSettings.evolution_api_token || !systemSettings.evolution_instance_name) {
      throw new Error('Configurações da Evolution API incompletas')
    }

    // Enviar mensagem via Evolution API
    const evolutionResponse = await fetch(`${systemSettings.evolution_api_url}/message/sendText/${systemSettings.evolution_instance_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': systemSettings.evolution_api_token,
      },
      body: JSON.stringify({
        number: `55${phone}`, // Adiciona código do Brasil
        text: message,
      }),
    })

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      throw new Error(`Erro da Evolution API: ${errorText}`)
    }

    const evolutionResult = await evolutionResponse.json()

    // Atualizar notificação como enviada
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_notifications?id=eq.${notificationId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'sent',
        sent_at: new Date().toISOString(),
        evolution_message_id: evolutionResult.key?.id || null,
      }),
    })

    if (!updateResponse.ok) {
      console.error('Erro ao atualizar status da notificação')
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: evolutionResult.key?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
