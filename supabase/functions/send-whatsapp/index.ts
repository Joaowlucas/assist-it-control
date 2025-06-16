
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
    console.log('=== Iniciando envio de WhatsApp ===')
    const { phone, message, notificationId }: SendWhatsAppRequest = await req.json()
    
    console.log('Dados recebidos:', { phone: phone.substring(0, 4) + '****', notificationId })

    // Buscar configurações do sistema
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    console.log('Buscando configurações do sistema...')
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })

    if (!settingsResponse.ok) {
      console.error('Erro ao buscar configurações:', settingsResponse.status, settingsResponse.statusText)
      throw new Error(`Erro ao buscar configurações do sistema: ${settingsResponse.status}`)
    }

    const settings = await settingsResponse.json()
    if (!settings || settings.length === 0) {
      console.error('Configurações não encontradas')
      throw new Error('Configurações do sistema não encontradas')
    }

    const systemSettings = settings[0]
    console.log('Configurações carregadas:', {
      whatsapp_enabled: systemSettings.whatsapp_enabled,
      has_api_url: !!systemSettings.evolution_api_url,
      has_token: !!systemSettings.evolution_api_token,
      has_instance: !!systemSettings.evolution_instance_name
    })

    if (!systemSettings.whatsapp_enabled) {
      console.error('WhatsApp não está habilitado')
      throw new Error('WhatsApp não está habilitado')
    }

    if (!systemSettings.evolution_api_url || !systemSettings.evolution_api_token || !systemSettings.evolution_instance_name) {
      console.error('Configurações da Evolution API incompletas:', {
        has_url: !!systemSettings.evolution_api_url,
        has_token: !!systemSettings.evolution_api_token,
        has_instance: !!systemSettings.evolution_instance_name
      })
      throw new Error('Configurações da Evolution API incompletas')
    }

    // Formatar número de telefone
    const formattedPhone = phone.replace(/\D/g, '') // Remove tudo que não é número
    const phoneWithCountryCode = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`
    
    console.log('Enviando para Evolution API...', {
      url: systemSettings.evolution_api_url,
      instance: systemSettings.evolution_instance_name,
      phone: phoneWithCountryCode.substring(0, 4) + '****'
    })

    // Enviar mensagem via Evolution API
    const evolutionResponse = await fetch(`${systemSettings.evolution_api_url}/message/sendText/${systemSettings.evolution_instance_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': systemSettings.evolution_api_token,
      },
      body: JSON.stringify({
        number: phoneWithCountryCode,
        text: message,
      }),
    })

    console.log('Resposta da Evolution API:', evolutionResponse.status, evolutionResponse.statusText)

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      console.error('Erro da Evolution API:', errorText)
      throw new Error(`Erro da Evolution API (${evolutionResponse.status}): ${errorText}`)
    }

    const evolutionResult = await evolutionResponse.json()
    console.log('Mensagem enviada com sucesso:', evolutionResult)

    // Atualizar notificação como enviada
    console.log('Atualizando status da notificação...')
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
      console.error('Erro ao atualizar status da notificação:', updateResponse.status)
    } else {
      console.log('Status da notificação atualizado com sucesso')
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: evolutionResult.key?.id,
      phone: phoneWithCountryCode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('=== Erro no envio de WhatsApp ===')
    console.error('Erro:', error)
    console.error('Stack:', error.stack)
    
    // Tentar atualizar o status da notificação para failed
    try {
      const { notificationId } = await req.clone().json()
      if (notificationId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        
        await fetch(`${supabaseUrl}/rest/v1/whatsapp_notifications?id=eq.${notificationId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'failed',
            error_message: error.message,
          }),
        })
      }
    } catch (updateError) {
      console.error('Erro ao atualizar status de falha:', updateError)
    }
    
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
