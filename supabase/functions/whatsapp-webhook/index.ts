import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  messageType: string;
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  pushName: string;
  messageTimestamp: number;
}

interface ConversationState {
  step: 'greeting' | 'problem' | 'category' | 'priority' | 'confirmation' | 'completed';
  userId: string;
  userName: string;
  problem?: string;
  category?: string;
  priority?: string;
  phone: string;
  unitId: string;
}

// Armazenamento temporário de conversas
const activeConversations = new Map<string, ConversationState>();

// Normalizar número de telefone
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    return cleaned.substring(2);
  }
  return cleaned;
}

// Enviar mensagem via WhatsApp
async function sendWhatsAppMessage(supabase: any, phone: string, message: string) {
  await supabase.functions.invoke('send-whatsapp', {
    body: {
      phone: phone,
      message: message
    }
  });
}

// Processar diferentes etapas da conversa
async function processConversation(
  supabase: any, 
  phone: string, 
  messageText: string, 
  userProfile: any
): Promise<void> {
  const conversationKey = normalizePhone(phone);
  let conversation = activeConversations.get(conversationKey);

  // Se não existe conversa, iniciar nova
  if (!conversation) {
    conversation = {
      step: 'greeting',
      userId: userProfile.id,
      userName: userProfile.name,
      phone: phone,
      unitId: userProfile.unit_id
    };
    activeConversations.set(conversationKey, conversation);
  }

  switch (conversation.step) {
    case 'greeting':
      await sendWhatsAppMessage(supabase, phone, 
        `Olá ${userProfile.name}! 👋\n\nSou o assistente de TI da Marka. Estou aqui para ajudar você a abrir um chamado.\n\n📝 *Por favor, descreva qual é o problema que você está enfrentando:*\n\nExemplo: "Meu computador não liga" ou "Não consigo acessar o email"`
      );
      conversation.step = 'problem';
      break;

    case 'problem':
      conversation.problem = messageText;
      await sendWhatsAppMessage(supabase, phone,
        `✅ Problema registrado: "${messageText}"\n\n📂 *Agora me diga qual categoria melhor descreve seu problema:*\n\n1️⃣ Hardware (computador, impressora, equipamentos)\n2️⃣ Software (programas, aplicativos)\n3️⃣ Rede (internet, wifi, conexão)\n4️⃣ Email (problemas com e-mail)\n5️⃣ Acesso (senhas, permissões)\n6️⃣ Outros\n\n*Digite o número ou nome da categoria:*`
      );
      conversation.step = 'category';
      break;

    case 'category':
      const categoryMap: { [key: string]: string } = {
        '1': 'hardware', 'hardware': 'hardware',
        '2': 'software', 'software': 'software', 
        '3': 'rede', 'rede': 'rede',
        '4': 'email', 'email': 'email',
        '5': 'acesso', 'acesso': 'acesso',
        '6': 'outros', 'outros': 'outros'
      };
      
      const categoryInput = messageText.toLowerCase().trim();
      conversation.category = categoryMap[categoryInput] || 'outros';
      
      await sendWhatsAppMessage(supabase, phone,
        `✅ Categoria: ${conversation.category}\n\n⚡ *Qual é a urgência do seu problema?*\n\n🔴 *Alta* - Problema que impede completamente o trabalho\n🟡 *Média* - Problema que dificulta o trabalho\n🟢 *Baixa* - Problema que pode aguardar\n\n*Digite: Alta, Média ou Baixa*`
      );
      conversation.step = 'priority';
      break;

    case 'priority':
      const priorityMap: { [key: string]: string } = {
        'alta': 'alta', 'alto': 'alta', 'urgente': 'alta',
        'media': 'media', 'média': 'media', 'normal': 'media',
        'baixa': 'baixa', 'baixo': 'baixa', 'pouco': 'baixa'
      };
      
      const priorityInput = messageText.toLowerCase().trim();
      conversation.priority = priorityMap[priorityInput] || 'media';
      
      // Mostrar resumo para confirmação
      await sendWhatsAppMessage(supabase, phone,
        `📋 *RESUMO DO CHAMADO*\n\n👤 Solicitante: ${conversation.userName}\n📝 Problema: ${conversation.problem}\n📂 Categoria: ${conversation.category}\n⚡ Prioridade: ${conversation.priority}\n\n✅ *Digite "CONFIRMAR" para criar o chamado*\n❌ *Digite "CANCELAR" para cancelar*`
      );
      conversation.step = 'confirmation';
      break;

    case 'confirmation':
      const confirmInput = messageText.toLowerCase().trim();
      
      if (confirmInput.includes('confirmar') || confirmInput.includes('sim') || confirmInput.includes('ok')) {
        // Criar o chamado
        const { data: newTicket, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            title: conversation.problem!.substring(0, 100),
            description: `CHAMADO CRIADO VIA WHATSAPP\n\nUsuário: ${conversation.userName}\nTelefone: ${phone}\n\nDescrição do problema:\n${conversation.problem}`,
            category: conversation.category,
            priority: conversation.priority,
            requester_id: conversation.userId,
            unit_id: conversation.unitId,
            status: 'aberto'
          })
          .select('ticket_number, id')
          .single();

        if (ticketError) {
          console.error('Erro ao criar chamado:', ticketError);
          await sendWhatsAppMessage(supabase, phone,
            `❌ Erro ao criar o chamado. Tente novamente mais tarde ou entre em contato com o suporte.`
          );
        } else {
          await sendWhatsAppMessage(supabase, phone,
            `✅ *CHAMADO CRIADO COM SUCESSO!*\n\n🎫 *Número:* #${newTicket.ticket_number}\n📝 *Título:* ${conversation.problem}\n📂 *Categoria:* ${conversation.category}\n⚡ *Prioridade:* ${conversation.priority}\n\n🔄 *Status:* Aberto\n⏰ *Criado em:* ${new Date().toLocaleString('pt-BR')}\n\n✨ Seu chamado foi registrado e será atendido em breve!\n\n💬 Para abrir um novo chamado, basta enviar uma mensagem.`
          );
          console.log(`Chamado #${newTicket.ticket_number} criado via WhatsApp para ${conversation.userName}`);
        }
        
        conversation.step = 'completed';
        // Limpar conversa após 5 minutos
        setTimeout(() => {
          activeConversations.delete(conversationKey);
        }, 5 * 60 * 1000);
        
      } else if (confirmInput.includes('cancelar') || confirmInput.includes('não') || confirmInput.includes('nao')) {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Chamado cancelado.\n\n💬 Se precisar de ajuda, basta enviar uma nova mensagem!`
        );
        activeConversations.delete(conversationKey);
      } else {
        await sendWhatsAppMessage(supabase, phone,
          `🔄 Não entendi sua resposta.\n\n✅ Digite "CONFIRMAR" para criar o chamado\n❌ Digite "CANCELAR" para cancelar`
        );
      }
      break;

    case 'completed':
      // Reiniciar conversa
      activeConversations.delete(conversationKey);
      await processConversation(supabase, phone, messageText, userProfile);
      break;
  }

  // Atualizar estado da conversa
  if (conversation.step !== 'completed') {
    activeConversations.set(conversationKey, conversation);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook WhatsApp recebido');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('Dados recebidos:', JSON.stringify(body, null, 2));

    // Verificar se é uma mensagem recebida (não enviada pelo bot)
    if (!body.data || body.data.key?.fromMe) {
      console.log('Mensagem ignorada: enviada pelo bot ou sem dados');
      return new Response(JSON.stringify({ success: true, message: 'Ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messageData: WhatsAppMessage = body.data;
    
    // Extrair texto da mensagem
    let messageText = '';
    if (messageData.message?.conversation) {
      messageText = messageData.message.conversation;
    } else if (messageData.message?.extendedTextMessage?.text) {
      messageText = messageData.message.extendedTextMessage.text;
    }

    if (!messageText || messageText.trim().length === 0) {
      console.log('Mensagem sem texto ignorada');
      return new Response(JSON.stringify({ success: true, message: 'No text' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extrair e normalizar número de telefone
    const phoneNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
    const normalizedPhone = normalizePhone(phoneNumber);
    console.log('Número extraído:', phoneNumber);
    console.log('Número normalizado:', normalizedPhone);

    // Buscar usuário pelo telefone (tentando ambos os formatos)
    const { data: userProfiles, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, unit_id')
      .or(`phone.eq.${phoneNumber},phone.eq.${normalizedPhone}`)
      .eq('status', 'ativo');

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      throw userError;
    }

    if (!userProfiles || userProfiles.length === 0) {
      console.log('Usuário não encontrado para o telefone:', phoneNumber);
      
      // Mensagem explicativa para usuário não cadastrado
      await sendWhatsAppMessage(supabase, phoneNumber,
        `👋 Olá!\n\nSeu número de telefone não está cadastrado no sistema.\n\n📞 *Para usar o atendimento via WhatsApp, você precisa:*\n\n1️⃣ Solicitar ao administrador do sistema para cadastrar seu telefone\n2️⃣ Informar este número: ${phoneNumber}\n\n💬 Após o cadastro, você poderá criar chamados de TI diretamente pelo WhatsApp!\n\n📧 Entre em contato com o suporte para mais informações.`
      );

      return new Response(JSON.stringify({ success: true, message: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Se há múltiplos usuários, usar o primeiro (pode ser melhorado para critério específico)
    const userProfile = userProfiles[0];
    if (userProfiles.length > 1) {
      console.log(`Múltiplos usuários encontrados para o telefone ${phoneNumber}. Usando: ${userProfile.name}`);
    }
    console.log('Usuário encontrado:', userProfile.name);

    // Processar conversa interativa
    await processConversation(supabase, phoneNumber, messageText, userProfile);

    return new Response(JSON.stringify({ 
      success: true, 
      user: userProfile.name,
      phone: phoneNumber
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no webhook WhatsApp:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});