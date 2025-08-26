import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { supabase } from '../_shared/supabase.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración para WhatsApp usando Railway endpoint
const WHATSAPP_API_URL = 'https://www.howersoftware.io/clients/api/send-whatsapp/'

async function sendWhatsAppMessage(message: string, toNumber: string): Promise<boolean> {
  try {
    console.log('📤 Enviando mensaje WhatsApp a:', toNumber)
    console.log('📤 Mensaje:', message.substring(0, 50) + '...')
    
    const payload = {
      message: message,
      to_number: toNumber
    }
    
    console.log('📤 Payload completo:', JSON.stringify(payload))
    console.log('📤 URL:', WHATSAPP_API_URL)
    
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    
    console.log('📥 Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())))
    console.log('📥 Status code:', response.status)
    console.log('📥 Status text:', response.statusText)
    
    const responseText = await response.text()
    console.log('📥 Response text (raw):', responseText)
    
    if (response.ok) {
      try {
        const responseJson = JSON.parse(responseText)
        console.log('📥 Response JSON:', JSON.stringify(responseJson, null, 2))
        console.log('✅ Mensaje enviado exitosamente')
        return true
      } catch (parseError) {
        console.log('⚠️ Response no es JSON válido, pero status OK:', responseText)
        return true
      }
    } else {
      console.error('❌ Error en respuesta:', response.status, responseText)
      return false
    }
  } catch (error) {
    console.error('❌ Error enviando mensaje WhatsApp:', error)
    return false
  }
}

async function getUserStats(instagramUserId: string) {
  try {
    // Get the instagram_user UUID for this instagram_user_id 
    const { data: instagramUser, error: userError } = await supabase
      .from('instagram_users')
      .select('id')
      .eq('instagram_user_id', instagramUserId)
      .single();

    if (userError || !instagramUser) {
      console.error('Error getting instagram user:', userError);
      return { abiertas: 0, seguimientos: 0, agendados: 20 };
    }

    // Use EXACT same logic as frontend - get prospects from prospects table with last_owner_message_at
    const { data: prospects, error: prospectsError } = await supabase
      .from('prospects')
      .select(`
        prospect_instagram_id,
        username,
        last_owner_message_at,
        last_message_from_prospect,
        prospect_messages!inner (
          id,
          is_from_prospect,
          is_invitation,
          message_timestamp
        )
      `)
      .eq('instagram_user_id', instagramUser.id);

    if (prospectsError) {
      console.error('Error getting prospects:', prospectsError);
      return { abiertas: 0, seguimientos: 0, agendados: 20 };
    }

    if (!prospects) {
      console.log('No prospects found');
      return { abiertas: 0, seguimientos: 0, agendados: 20 };
    }

    // 2. For each prospect, determine state using EXACT same logic as frontend
    const prospectsWithStates = prospects.map(prospect => {
      // Check for invitations sent (same as frontend)
      const messages = prospect.prospect_messages || [];
      const hasInvitation = messages.some((msg: any) => 
        msg.is_invitation === true && msg.is_from_prospect === false
      );
      
      if (hasInvitation) {
        return { ...prospect, state: 'invited' };
      }

      // If no last_owner_message_at = PENDING (same as frontend)
      if (!prospect.last_owner_message_at) {
        return { ...prospect, state: 'pending' };
      }

      // Calculate time since last owner message (same as frontend)
      const lastOwnerMessageTime = new Date(prospect.last_owner_message_at).getTime();
      const now = new Date().getTime();
      const hoursSinceLastOwnerMessage = (now - lastOwnerMessageTime) / (1000 * 60 * 60);
      const daysSinceLastOwnerMessage = hoursSinceLastOwnerMessage / 24;

      // Apply time-based logic (same as frontend)
      if (daysSinceLastOwnerMessage >= 7) {
        return { ...prospect, state: 'week' };
      } else if (daysSinceLastOwnerMessage >= 1) {
        return { ...prospect, state: 'yesterday' };
      } else {
        return { ...prospect, state: 'pending' };
      }
    });

    // 3. Get completed tasks 
    const { data: taskStatus, error: taskError } = await supabase
      .from('prospect_task_status')
      .select('prospect_sender_id, task_type, is_completed')
      .eq('instagram_user_id', instagramUserId)
      .eq('is_completed', true)
      .in('task_type', ['pending', 'yesterday', 'week']);

    if (taskError) {
      console.error('Error getting task status:', taskError);
    }

    // Create sets of completed tasks
    const completedByType = {
      pending: new Set(taskStatus?.filter(t => t.task_type === 'pending').map(t => t.prospect_sender_id) || []),
      yesterday: new Set(taskStatus?.filter(t => t.task_type === 'yesterday').map(t => t.prospect_sender_id) || []),
      week: new Set(taskStatus?.filter(t => t.task_type === 'week').map(t => t.prospect_sender_id) || [])
    };

    // 4. Calculate final stats
    let abiertas = 0; // pending NOT completed
    let seguimientos = 0; // yesterday + week NOT completed

    prospectsWithStates.forEach((prospect: any) => {
      const senderId = prospect.prospect_instagram_id;
      const state = prospect.state;

      if (state === 'pending' && !completedByType.pending.has(senderId)) {
        abiertas++;
      } else if ((state === 'yesterday' && !completedByType.yesterday.has(senderId)) ||
                 (state === 'week' && !completedByType.week.has(senderId))) {
        seguimientos++;
      }
    });

    console.log('📊 Real-time stats for', instagramUserId + ':');
    console.log('   💬 Abiertas (pending NOT tachados):', abiertas);
    console.log('   🔄 Seguimientos (yesterday+week NOT tachados):', seguimientos);
    console.log('   🎯 Agendados (siempre):', 20);

    return { abiertas, seguimientos, agendados: 20 };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return { abiertas: 0, seguimientos: 0, agendados: 20 };
  }
}

function createMotivationalMessage(stats: { abiertas: number, seguimientos: number, agendados: number }): string {
  const greetings = [
    '¡Hola campeón!',
    '¡Hey crack!',
    '¡Hola máquina!',
    '¡Qué tal guerrero!',
    '¡Hola tigre!'
  ]
  
  const motivationalPhrases = [
    '¡Tu dedicación se convertirá en resultados!',
    '¡Cada mensaje cuenta, sigue así!',
    '¡Tu constancia te llevará al éxito!',
    '¡Sigue conquistando prospectos!',
    '¡Eres imparable, continúa!',
    '¡El éxito está en tus manos!',
    '¡Tu esfuerzo vale la pena!'
  ]
  
  const greeting = greetings[Math.floor(Math.random() * greetings.length)]
  const phrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)]
  
  const message = `${greeting} 💪

Tienes estos prospectos por contactar:
URGENTES de contestar: ${stats.abiertas}
Prospectos en seguimiento: ${stats.seguimientos}
Nuevos prospectos de hoy: ${stats.agendados}

Accede a este link:
https://preview--insta-buddy-ai-chat.lovable.app/tasks-to-do

y limpia esos prospectos

${phrase} ⭐`

  return message
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔧 Usando endpoint simplificado de WhatsApp')
    console.log('🚀 Starting WhatsApp notification process...')
    
    // Get current time in Mexico City timezone
    const now = new Date()
    const mexicoTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now)
    
    const [datePart, timePart] = mexicoTime.split(', ')
    const [month, day, year] = datePart.split('/')
    const [hour, minute] = timePart.split(':')
    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Mexico_City',
      weekday: 'numeric'
    }).format(now)
    
    console.log(`Current day (Mexico): ${dayOfWeek}, time (Mexico): ${hour}:${minute}, hour: ${parseInt(hour)}, minute: ${parseInt(minute)}`)
    
    // Get users who should receive notifications at this time
    const { data: scheduledUsers, error: scheduleError } = await supabase
      .from('whatsapp_notification_settings')
      .select(`
        instagram_user_id,
        whatsapp_number,
        notification_time,
        notification_days,
        enabled
      `)
      .eq('enabled', true)
      .contains('notification_days', [parseInt(dayOfWeek)])
    
    if (scheduleError) {
      console.error('Error fetching scheduled users:', scheduleError)
      return new Response(
        JSON.stringify({ error: 'Error fetching scheduled users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Found', scheduledUsers?.length || 0, 'users with scheduled notifications')
    
    let processedCount = 0
    let sentCount = 0
    
    for (const user of scheduledUsers || []) {
      console.log('Processing user:', user.instagram_user_id)
      
      // Check if notification time matches current time (with 5-minute tolerance)
      const [scheduleHour, scheduleMinute] = user.notification_time.split(':').map(Number)
      const currentHour = parseInt(hour)
      const currentMinute = parseInt(minute)
      
      const scheduleTimeInMinutes = scheduleHour * 60 + scheduleMinute
      const currentTimeInMinutes = currentHour * 60 + currentMinute
      const timeDifference = Math.abs(currentTimeInMinutes - scheduleTimeInMinutes)
      
      if (timeDifference <= 5 || timeDifference >= (24 * 60 - 5)) { // 5 minute tolerance or wrap-around
        // Time matches, get user stats and send notification
        const stats = await getUserStats(user.instagram_user_id)
        console.log('User stats:', stats)
        
        // Siempre enviar mensaje motivacional, independientemente de si hay prospectos o no
        console.log('💪 Enviando mensaje motivacional independientemente de prospectos')
        const message = createMotivationalMessage(stats)
        
        if (user.whatsapp_number) {
          const success = await sendWhatsAppMessage(message, user.whatsapp_number)
          if (success) {
            console.log(`Message sent successfully to ${user.instagram_user_id}`)
            sentCount++
          } else {
            console.log(`Failed to send message to ${user.instagram_user_id}`)
          }
        } else {
          console.log(`No WhatsApp number for user ${user.instagram_user_id}`)
        }
        
        processedCount++
      } else {
        console.log(`Skipping user ${user.instagram_user_id} - time mismatch (${hour}:${minute} vs ${scheduleHour}:${String(scheduleMinute).padStart(2, '0')})`)
      }
    }
    
    console.log('🏁 WhatsApp notification process completed')
    
    return new Response(
      JSON.stringify({
        success: true,
        processedUsers: processedCount,
        messagesSent: sentCount,
        timestamp: mexicoTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in WhatsApp notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})