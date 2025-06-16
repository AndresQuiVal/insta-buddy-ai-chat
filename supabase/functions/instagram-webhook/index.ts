import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      if (mode === 'subscribe' && token === 'hower_verification_token') {
        console.log('✅ Webhook verification successful');
        return new Response(challenge);
      }
      
      return new Response('Unauthorized', { status: 401 });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      console.log('📨 ===== NUEVO WEBHOOK RECIBIDO =====');
      console.log('📋 Webhook completo:', JSON.stringify(body, null, 2));

      if (body.object === 'instagram') {
        for (const entry of body.entry) {
          console.log('🔄 ===== PROCESANDO ENTRY =====');
          console.log('📋 Entry ID:', entry.id);

          if (entry.messaging) {
            console.log('📝 PROCESANDO MENSAJES DIRECTOS');
            
            for (const event of entry.messaging) {
              console.log('📝 Processing messaging event:', JSON.stringify(event, null, 2));

              if (event.message && !event.message.is_echo) {
                console.log('🚀 === PROCESANDO MENSAJE PARA AUTORESPONDER ===');
                console.log('👤 SENDER ID:', event.sender.id);
                console.log('💬 MENSAJE:', event.message.text);

                const senderId = event.sender.id;
                const recipientId = event.recipient.id;
                const messageText = event.message.text;
                const messageTimestamp = new Date(event.timestamp);

                // 🔄 Actualizar actividad del prospecto
                console.log('🔄 Actualizando actividad del prospecto...');
                await updateProspectActivity(supabase, senderId);

                // ===== BUSCAR USUARIO DE INSTAGRAM =====
                console.log('🔍 ===== BUSCANDO USUARIO DE INSTAGRAM =====');
                console.log('📋 Recipient ID (Instagram Business Account):', recipientId);

                const { data: instagramUser, error: userError } = await supabase
                  .from('instagram_users')
                  .select('*')
                  .eq('instagram_user_id', recipientId)
                  .single();

                if (userError || !instagramUser) {
                  console.error('❌ Error finding Instagram user:', userError);
                  return new Response('User not found', { status: 404 });
                }

                console.log('✅ Usuario encontrado:', instagramUser);

                // ===== CREAR/ACTUALIZAR PROSPECTO =====
                console.log('🔍 ===== CREANDO/ACTUALIZANDO PROSPECTO =====');
                console.log('📋 Parámetros para create_or_update_prospect:');
                console.log('  - p_instagram_user_id (UUID):', instagramUser.id);
                console.log('  - p_prospect_instagram_id (string):', senderId);
                console.log('  - p_username:', `prospect_${senderId.slice(-8)}`);

                const { data: prospectData, error: prospectError } = await supabase
                  .rpc('create_or_update_prospect', {
                    p_instagram_user_id: instagramUser.id,
                    p_prospect_instagram_id: senderId,
                    p_username: `prospect_${senderId.slice(-8)}`
                  });

                if (prospectError) {
                  console.error('❌ Error creating/updating prospect:', prospectError);
                  return new Response('Error creating prospect', { status: 500 });
                }

                console.log('✅ Prospecto creado/actualizado con ID:', prospectData);

                // Verificar que el prospecto se guardó en la base de datos
                console.log('🔍 Verificando que el prospecto se guardó en la base de datos...');
                const { data: verifyProspect, error: verifyError } = await supabase
                  .from('prospects')
                  .select('*')
                  .eq('id', prospectData)
                  .single();

                if (verifyError) {
                  console.error('❌ Error verificando prospecto:', verifyError);
                } else {
                  console.log('✅ PROSPECTO VERIFICADO EN BD:', verifyProspect);
                }

                // ===== GUARDAR MENSAJE DEL PROSPECTO =====
                const { error: messageError } = await supabase
                  .from('prospect_messages')
                  .insert({
                    prospect_id: prospectData,
                    message_instagram_id: event.message.mid,
                    message_text: messageText,
                    is_from_prospect: true,
                    message_timestamp: messageTimestamp,
                    message_type: 'text',
                    raw_data: event
                  });

                if (messageError) {
                  console.error('❌ Error saving prospect message:', messageError);
                } else {
                  console.log('✅ Mensaje del prospecto guardado en BD');
                }

                // ===== ANÁLISIS DEL MENSAJE =====
                console.log('🔍 ===== ANÁLISIS DEL MENSAJE =====');
                console.log('📝 Texto:', messageText);

                const messageTypes = await analyzeMessage(messageText);
                console.log('📊 Tipos detectados guardados:', messageTypes);

                // ===== GUARDAR EN TABLA instagram_messages PARA COMPATIBILIDAD =====
                const { error: legacyMessageError } = await supabase
                  .from('instagram_messages')
                  .insert({
                    instagram_message_id: event.message.mid,
                    sender_id: senderId,
                    recipient_id: recipientId,
                    message_text: messageText,
                    message_type: 'text',
                    timestamp: messageTimestamp,
                    instagram_user_id: instagramUser.id,
                    is_invitation: messageTypes.isInvitation,
                    is_presentation: messageTypes.isPresentation,
                    is_inscription: messageTypes.isInscription,
                    raw_data: event
                  });

                if (legacyMessageError) {
                  console.error('❌ Error saving to instagram_messages:', legacyMessageError);
                } else {
                  console.log('✅ Mensaje guardado correctamente con relación al usuario');
                }

                // ===== NOTIFICAR CAMBIOS AL DASHBOARD =====
                console.log('🔄 ===== NOTIFICANDO CAMBIOS AL DASHBOARD =====');
                await notifyDashboard(supabase, instagramUser.id);
                console.log('✅ Cambios notificados al dashboard');

                // ===== OBTENER AUTORESPONDERS =====
                console.log('🔍 === OBTENIENDO AUTORESPONDERS ===');
                console.log('📡 Consultando autoresponders desde endpoint...');
                
                const autoresponders = await getAutoresponders(instagramUser.instagram_user_id);
                
                if (!autoresponders || autoresponders.length === 0) {
                  console.log('⚠️ No hay autoresponders configurados');
                  return new Response('No autoresponders found', { status: 200 });
                }

                console.log('✅ Autoresponders obtenidos:', autoresponders.length);
                console.log('📋 Lista de autoresponders:', autoresponders.map(ar => ({
                  id: ar.id,
                  name: ar.name,
                  is_active: ar.is_active,
                  message_preview: ar.message_text.substring(0, 30) + "...",
                  use_keywords: ar.use_keywords,
                  keywords: ar.keywords
                })));

                // ===== SELECCIONAR AUTORESPONDER =====
                let selectedAutoresponder = null;

                for (const autoresponder of autoresponders) {
                  if (!autoresponder.is_active) continue;

                  let shouldSend = false;

                  if (autoresponder.use_keywords && autoresponder.keywords && autoresponder.keywords.length > 0) {
                    const messageTextLower = messageText.toLowerCase();
                    
                    for (const keyword of autoresponder.keywords) {
                      console.log(`🔍 Verificando palabra clave "${keyword}" -> ${messageTextLower.includes(keyword.toLowerCase()) ? 'COINCIDE' : 'NO COINCIDE'}`);
                      if (messageTextLower.includes(keyword.toLowerCase())) {
                        shouldSend = true;
                        break;
                      }
                    }
                    
                    if (shouldSend) {
                      console.log(`✅ Autoresponder "${autoresponder.name}" tiene coincidencia de palabras clave - COINCIDE`);
                      selectedAutoresponder = autoresponder;
                      break;
                    }
                  } else {
                    shouldSend = true;
                    selectedAutoresponder = autoresponder;
                    break;
                  }
                }

                if (!selectedAutoresponder) {
                  console.log('⚠️ Ningún autoresponder cumple las condiciones');
                  return new Response('No matching autoresponder', { status: 200 });
                }

                console.log('🎯 AUTORESPONDER SELECCIONADO:');
                console.log('📋 ID:', selectedAutoresponder.id);
                console.log('📋 Nombre:', selectedAutoresponder.name);
                console.log('📋 Mensaje:', selectedAutoresponder.message_text);
                console.log('📋 Solo primer mensaje:', selectedAutoresponder.send_only_first_message);
                console.log('📋 Usa palabras clave:', selectedAutoresponder.use_keywords);
                console.log('📋 Palabras clave:', selectedAutoresponder.keywords);

                // ===== VERIFICAR SI YA SE ENVIÓ AUTORESPONDER (NUEVA LÓGICA DE 12 HORAS) =====
                console.log('🔍 Verificando si ya se le envió autoresponder a:', senderId);
                
                const { data: lastMessage, error: lastMessageError } = await supabase
                  .from('prospect_messages')
                  .select('message_timestamp')
                  .eq('prospect_id', prospectData)
                  .eq('is_from_prospect', true)
                  .order('message_timestamp', { ascending: false })
                  .limit(2);

                if (lastMessageError) {
                  console.error('❌ Error consultando últimos mensajes:', lastMessageError);
                }

                let shouldSendAutoresponder = true;

                if (lastMessage && lastMessage.length >= 2) {
                  // Hay al menos 2 mensajes del prospecto
                  const currentMessageTime = new Date(messageTimestamp);
                  const previousMessageTime = new Date(lastMessage[1].message_timestamp);
                  const hoursDifference = (currentMessageTime.getTime() - previousMessageTime.getTime()) / (1000 * 60 * 60);
                  
                  console.log('⏰ Último mensaje anterior:', previousMessageTime);
                  console.log('⏰ Mensaje actual:', currentMessageTime);
                  console.log('⏰ Diferencia en horas:', hoursDifference);
                  
                  if (hoursDifference < 12) {
                    shouldSendAutoresponder = false;
                    console.log('⏰ NO ENVIAR - Menos de 12 horas desde el último mensaje');
                  } else {
                    console.log('✅ ENVIAR - Más de 12 horas desde el último mensaje');
                  }
                } else {
                  console.log('🆕 PRIMERA VEZ QUE ESCRIBE - ENVIANDO');
                }

                if (!shouldSendAutoresponder) {
                  console.log('⏭️ Autoresponder no enviado por regla de 12 horas');
                  return new Response('Autoresponder skipped - less than 12 hours', { status: 200 });
                }

                // ===== ENVIAR AUTORESPONDER =====
                console.log('🚀 ENVIANDO AUTORESPONDER...');

                const { data: sendResult, error: sendError } = await supabase.functions.invoke('instagram-send-message', {
                  body: {
                    recipient_id: senderId,
                    message_text: selectedAutoresponder.message_text,
                    instagram_user_id: recipientId
                  }
                });

                console.log('📨 Respuesta de instagram-send-message:');
                console.log('📋 Data:', sendResult);
                console.log('📋 Error:', sendError);

                if (sendError) {
                  console.error('❌ Error enviando autoresponder:', sendError);
                  return new Response('Error sending autoresponder', { status: 500 });
                }

                console.log('✅ ===== MENSAJE ENVIADO EXITOSAMENTE VIA EDGE FUNCTION =====');

                // ===== GUARDAR LOG DEL AUTORESPONDER =====
                const { error: logError } = await supabase
                  .from('autoresponder_sent_log')
                  .insert({
                    autoresponder_message_id: selectedAutoresponder.id,
                    sender_id: senderId
                  });

                if (logError) {
                  console.error('❌ Error saving autoresponder log:', logError);
                } else {
                  console.log('✅ Autoresponder guardado en BD del prospecto');
                }

                // ===== GUARDAR AUTORESPONDER EN MENSAJES =====
                const { error: autoresponderMessageError } = await supabase
                  .from('prospect_messages')
                  .insert({
                    prospect_id: prospectData,
                    message_instagram_id: sendResult?.message_id || `auto_${Date.now()}`,
                    message_text: selectedAutoresponder.message_text,
                    is_from_prospect: false,
                    message_timestamp: new Date(),
                    message_type: 'autoresponder',
                    raw_data: { autoresponder_id: selectedAutoresponder.id }
                  });

                if (autoresponderMessageError) {
                  console.error('❌ Error saving autoresponder message:', autoresponderMessageError);
                } else {
                  console.log('✅ Autoresponder guardado en prospect_messages');
                }

                console.log('✅ AUTORESPONDER ENVIADO EXITOSAMENTE');
              } else if (event.message && event.message.is_echo) {
                console.log('⏭️ Mensaje no válido o es un echo - saltando');
              }
            }
          }
        }
      }

      console.log('✅ === MENSAJE PROCESADO COMPLETAMENTE ===');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('❌ Error in webhook:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});

async function updateProspectActivity(supabase: any, prospectId: string) {
  const { error } = await supabase
    .from('prospect_last_activity')
    .upsert({
      prospect_id: prospectId,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'prospect_id'
    });

  if (error) {
    console.error('Error updating prospect activity:', error);
  } else {
    console.log('✅ Actividad del prospecto actualizada');
  }
}

async function analyzeMessage(messageText: string) {
  const text = messageText.toLowerCase();
  
  return {
    isInvitation: text.includes('invit') || text.includes('evento') || text.includes('reunión'),
    isPresentation: text.includes('present') || text.includes('demostrar') || text.includes('mostrar'),
    isInscription: text.includes('inscrib') || text.includes('registr') || text.includes('apunt')
  };
}

async function notifyDashboard(supabase: any, instagramUserId: string) {
  const { error } = await supabase
    .from('instagram_users')
    .update({ 
      nuevos_prospectos_contactados: supabase.sql`nuevos_prospectos_contactados + 1`,
      updated_at: new Date().toISOString()
    })
    .eq('id', instagramUserId);

  if (error) {
    console.error('Error notifying dashboard:', error);
  }
}

async function getAutoresponders(instagramUserId: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const response = await fetch(`${supabaseUrl}/functions/v1/get-autoresponders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')!}`
      },
      body: JSON.stringify({
        instagram_user_id: instagramUserId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Respuesta del endpoint:', data);
    
    return data.autoresponders || [];
  } catch (error) {
    console.error('❌ Error fetching autoresponders:', error);
    return [];
  }
}
