
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestConnectionRequest {
  url: string
  token: string
  instance: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Testando conexão Evolution API ===')
    const { url, token, instance }: TestConnectionRequest = await req.json()

    console.log('Parâmetros de teste:', {
      url: url,
      hasToken: !!token,
      instance: instance
    })

    // Verificar se a URL é válida
    try {
      new URL(url)
    } catch {
      throw new Error('URL da API inválida')
    }

    // Testar conexão com Evolution API
    console.log('Fazendo requisição para:', `${url}/instance/connectionState/${instance}`)
    
    const response = await fetch(`${url}/instance/connectionState/${instance}`, {
      method: 'GET',
      headers: {
        'apikey': token,
        'Content-Type': 'application/json',
      },
    })

    console.log('Resposta da API:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro da API:', errorText)
      throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`)
    }

    const result = await response.json()
    console.log('Estado da conexão:', result)
    
    return new Response(JSON.stringify({ 
      success: true, 
      connectionState: result,
      message: 'Conexão testada com sucesso!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('=== Erro no teste de conexão ===')
    console.error('Erro:', error)
    console.error('Stack:', error.stack)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
