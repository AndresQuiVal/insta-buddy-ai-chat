import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const WHATSAPP_API_URL = "https://www.howersoftware.io/clients/api/send-whatsapp/";

async function sendWhatsAppMessage(message: string, toNumber: string): Promise<boolean> {
  try {
    const payload = {
      message: message,
      to_number: toNumber
    };
    
    console.log("📤 Enviando mensaje WhatsApp a:", toNumber);
    console.log("📤 Mensaje:", message.substring(0, 100) + "...");
    console.log("📤 Payload completo:", JSON.stringify(payload));
    console.log("📤 URL:", WHATSAPP_API_URL);
    
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log("📥 Status code:", response.status);
    console.log("📥 Status text:", response.statusText);
    console.log("📥 Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries())));
    
    const responseText = await response.text();
    console.log("📥 Response text (raw):", responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log("📥 Response JSON:", JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.log("⚠️ No se pudo parsear como JSON:", parseError.message);
      responseData = { raw: responseText };
    }
    
    if (response.ok && responseData.success) {
      console.log("✅ Mensaje enviado exitosamente");
      return true;
    } else {
      console.error("❌ Error en respuesta:");
      console.error("❌ Status:", response.status);
      console.error("❌ Data:", responseData);
      return false;
    }
    
  } catch (error) {
    console.error("❌ Error enviando mensaje WhatsApp:", error);
    console.error("❌ Error stack:", error.stack);
    return false;
  }
}

async function getPerplexitySearch(query: string, location: string, followers_from: string, followers_to: string) {
  try {
    const payload = {
      howerUsername: 'andresquival',
      howerToken: 'testhower',
      query: query,
      location: location,
      followers_from: followers_from.replaceAll(",", ""),
      followers_to: followers_to.replaceAll(",", "")
    };

    console.log(`🔍 Realizando búsqueda con query: "${query}"`);

    const response = await fetch('https://www.howersoftware.io/clients/perplexity_instagram_search_2/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(payload))
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Búsqueda completada para query: "${query}", resultados: ${data.accounts?.length || 0}`);
    
    return data;

  } catch (error) {
    console.error('Error en getPerplexitySearch:', error);
    throw error;
  }
}

async function searchAndSaveProspects(instagramUserId: string) {
  try {
    console.log(`🔍 Iniciando búsqueda de prospectos para usuario: ${instagramUserId}`);
    
    // Obtener ICP del usuario
    const { data: icpData, error: icpError } = await supabase
      .from('user_icp')
      .select('search_keywords, is_complete')
      .eq('instagram_user_id', instagramUserId)
      .single();

    if (icpError || !icpData || !icpData.search_keywords || icpData.search_keywords.length === 0) {
      console.log(`⚠️ Usuario ${instagramUserId} no tiene palabras clave definidas`);
      return;
    }

    const searchKeywords = icpData.search_keywords || [];
    if (searchKeywords.length === 0) {
      console.log(`⚠️ Usuario ${instagramUserId} no tiene palabras clave definidas`);
      return;
    }

    // Seleccionar 3 palabras aleatorias
    const selectedKeywords = searchKeywords
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(3, searchKeywords.length));

    console.log(`🎯 Palabras clave seleccionadas para ${instagramUserId}:`, selectedKeywords);

    // Limpiar resultados anteriores del usuario
    await supabase
      .from('prospect_search_results')
      .delete()
      .eq('instagram_user_id', instagramUserId);

    let allAccounts: any[] = [];
    
    // Realizar búsquedas con cada palabra clave
    for (const keyword of selectedKeywords) {
      try {
        const searchResults = await getPerplexitySearch(keyword, '', '1000', '50000');
        if (searchResults?.accounts) {
          allAccounts = allAccounts.concat(searchResults.accounts.map((account: any) => ({
            ...account,
            search_keyword: keyword
          })));
        }
      } catch (error) {
        console.error(`Error buscando con keyword "${keyword}":`, error);
      }
    }

    if (allAccounts.length === 0) {
      console.log(`⚠️ No se encontraron resultados para usuario ${instagramUserId}`);
      return;
    }

    // Separar posts/reels de cuentas
    const posts = allAccounts.filter(account => 
      account.profile.includes('/reel/') || account.profile.includes('/p/')
    );
    const accounts = allAccounts.filter(account => 
      !account.profile.includes('/reel/') && !account.profile.includes('/p/')
    );

    // Seleccionar y priorizar posts (máximo 5)
    const selectedPosts = posts
      .sort((a, b) => {
        // Priorizar por fecha y comentarios
        const aCommentsMatch = a.description?.match(/([\d,]+)\s*[Cc]omentarios?/);
        const bCommentsMatch = b.description?.match(/([\d,]+)\s*[Cc]omentarios?/);
        
        const aComments = aCommentsMatch ? parseInt(aCommentsMatch[1].replace(/,/g, '')) : 0;
        const bComments = bCommentsMatch ? parseInt(bCommentsMatch[1].replace(/,/g, '')) : 0;
        
        return bComments - aComments; // Más comentarios primero
      })
      .slice(0, 5);

    // Seleccionar cuentas aleatoriamente (máximo 15)
    const selectedAccounts = accounts
      .sort(() => 0.5 - Math.random())
      .slice(0, 15);

    // Guardar resultados en la base de datos
    const resultsToSave = [];

    // Procesar posts
    selectedPosts.forEach(post => {
      const commentsMatch = post.description?.match(/([\d,]+)\s*[Cc]omentarios?/);
      const commentsCount = commentsMatch ? parseInt(commentsMatch[1].replace(/,/g, '')) : 0;
      
      const dateMatch = post.description?.match(/([A-Za-z]+ \d{1,2}, \d{4}):/);
      let isRecent = false;
      let publishDate = '';
      
      if (dateMatch) {
        publishDate = dateMatch[1];
        const publishDateObj = new Date(publishDate);
        const currentDate = new Date();
        const monthsDiff = (currentDate.getFullYear() - publishDateObj.getFullYear()) * 12 + 
                         (currentDate.getMonth() - publishDateObj.getMonth());
        isRecent = monthsDiff <= 3;
      }

      resultsToSave.push({
        instagram_user_id: instagramUserId,
        result_type: 'post',
        instagram_url: post.profile,
        title: post.profile.includes('/reel/') ? 'Reel de Instagram' : 'Post de Instagram',
        description: post.description || '',
        comments_count: commentsCount,
        is_recent: isRecent,
        has_keywords: true,
        publish_date: publishDate,
        search_keywords: selectedKeywords
      });
    });

    // Procesar cuentas
    selectedAccounts.forEach(account => {
      const username = account.profile.split('/').pop();
      
      resultsToSave.push({
        instagram_user_id: instagramUserId,
        result_type: 'account',
        instagram_url: account.profile,
        title: username.includes('?locale') ? '' : '@' + username,
        description: account.description || '',
        comments_count: 0,
        is_recent: false,
        has_keywords: true,
        publish_date: '',
        search_keywords: selectedKeywords
      });
    });

    // Insertar todos los resultados
    if (resultsToSave.length > 0) {
      const { error: insertError } = await supabase
        .from('prospect_search_results')
        .insert(resultsToSave);

      if (insertError) {
        console.error('Error guardando resultados:', insertError);
      } else {
        console.log(`✅ Guardados ${resultsToSave.length} resultados para usuario ${instagramUserId} (${selectedPosts.length} posts, ${selectedAccounts.length} cuentas)`);
      }
    }

  } catch (error) {
    console.error(`Error en searchAndSaveProspects para usuario ${instagramUserId}:`, error);
  }
}

async function getUserStats(instagramUserId: string) {
  try {
    console.log('🔍 Getting Hower usernames for user:', instagramUserId);
    
    // Llamar al edge function para obtener usernames de Hower
    const { data: howerResponse, error: howerError } = await supabase.functions.invoke(
      'get-hower-usernames',
      {
        body: { instagram_user_id: instagramUserId }
      }
    );

    let howerUsernames: string[] = [];
    if (!howerError && howerResponse?.success && howerResponse?.data?.usernames) {
      howerUsernames = howerResponse.data.usernames;
      console.log('📞 Got Hower usernames:', { 
        usernameCount: howerUsernames.length 
      });
    } else {
      console.log('⚠️ No Hower credentials or error getting usernames:', howerError?.message || 'No credentials');
      // 🎯 FILTRO HOWER ES OBLIGATORIO: Si no hay credenciales Hower, retornar stats = 0
      console.log('🚫 No Hower credentials available - returning zero stats (Hower filter is mandatory)');
      return { abiertas: 0, seguimientos: 0, agendados: 0 };
    }

    // 🔥 NUEVA LÓGICA: Replicar EXACTAMENTE la lógica del prospectService
    console.log('🔥 Aplicando lógica CORREGIDA del prospectService...');

    // Obtener UUID del usuario
    const { data: userUuidData, error: userUuidError } = await supabase
      .from('instagram_users')
      .select('id')
      .eq('instagram_user_id', instagramUserId)
      .single();

    if (userUuidError || !userUuidData) {
      console.error('❌ Error obteniendo UUID del usuario:', userUuidError);
      return { abiertas: 0, seguimientos: 0, agendados: 0 };
    }

    const userUUID = userUuidData.id;

    // Obtener todos los prospectos con filtros de calidad (MISMOS FILTROS que prospectService)
    const { data: prospects, error: prospectsError } = await supabase
      .from('prospects')
      .select('*')
      .eq('instagram_user_id', userUUID)
      .not('username', 'like', 'user_%')  // EXCLUIR usernames genéricos user_*
      .not('username', 'like', 'prospect_%')  // EXCLUIR usernames genéricos prospect_*
      .neq('username', '');  // EXCLUIR usernames vacíos

    if (prospectsError) {
      console.error('❌ Error obteniendo prospectos:', prospectsError);
      return { abiertas: 0, seguimientos: 0, agendados: 0 };
    }

    // Obtener estados de tareas
    const { data: taskStatuses, error: taskError } = await supabase
      .from('prospect_task_status')
      .select('prospect_sender_id, is_completed, completed_at, last_message_type')
      .eq('instagram_user_id', instagramUserId)
      .eq('task_type', 'pending');

    if (taskError) {
      console.error('❌ Error obteniendo task statuses:', taskError);
    }

    console.log(`📊 Procesando ${prospects?.length || 0} prospectos con lógica CORREGIDA`);

    let abiertas = 0;
    let seguimientos = 0;

    for (const prospect of prospects || []) {
      // 🎯 FILTRO HOWER: Solo procesar si está en la lista de Hower
      const isInHowerList = howerUsernames.some(username => 
        prospect.username === username || 
        prospect.username.replace('@', '') === username ||
        prospect.username === '@' + username
      );

      if (!isInHowerList) {
        continue;
      }

      const taskStatus = taskStatuses?.find(task => 
        task.prospect_sender_id === prospect.prospect_instagram_id
      );

      console.log(`🔍 Procesando ${prospect.username}: taskStatus=${JSON.stringify(taskStatus)}`);

      if (!taskStatus) {
        // Sin taskStatus = evaluar según last_message_from_prospect (SIMPLIFICADO como prospectService)
        if (prospect.last_message_from_prospect) {
          console.log(`✅ ${prospect.username} → ABIERTA (sin taskStatus, último mensaje del prospecto)`);
          abiertas++;
        }
        continue;
      }

      const { is_completed, completed_at, last_message_type } = taskStatus;

      // 🔥 LÓGICA DE RECONTACTO PRINCIPAL (APLICAR PRIMERO como en prospectService)
      if (is_completed && last_message_type === 'sent' && completed_at) {
        const completedDate = new Date(completed_at);
        const now = new Date();
        const hoursSinceCompleted = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
        
        console.log(`⏰ ${prospect.username}: ${Math.round(hoursSinceCompleted)}h desde completed_at`);
        
        if (hoursSinceCompleted > 24) {
          console.log(`🔄 ${prospect.username} → SEGUIMIENTO (recontacto necesario, ${Math.round(hoursSinceCompleted)}h > 24h)`);
          
          // 🔥 ACTUALIZAR BD: Sincronizar EXACTAMENTE como hace el prospectService
          try {
            const { error: updateError } = await supabase
              .from('prospects')
              .update({ 
                last_owner_message_at: completed_at,
                last_message_from_prospect: false
              })
              .eq('instagram_user_id', prospect.instagram_user_id)
              .eq('prospect_instagram_id', prospect.prospect_instagram_id);
            
            if (updateError) {
              console.error(`❌ Error actualizando prospect ${prospect.username}:`, updateError);
            } else {
              console.log(`✅ BD actualizada para ${prospect.username}`);
            }
            
            // Destachar el prospecto
            const { error: taskError } = await supabase
              .from('prospect_task_status')
              .update({ is_completed: false })
              .eq('instagram_user_id', instagramUserId)
              .eq('prospect_sender_id', prospect.prospect_instagram_id)
              .eq('task_type', 'pending');
            
            if (taskError) {
              console.error(`❌ Error destachando ${prospect.username}:`, taskError);
            } else {
              console.log(`✅ Prospecto ${prospect.username} destachado`);
            }
          } catch (syncError) {
            console.error(`❌ Error sincronizando ${prospect.username}:`, syncError);
          }
          
          seguimientos++;
          continue; // IMPORTANTE: Ya procesado, no evaluar más
        } else {
          console.log(`🚫 ${prospect.username} filtrado (completado hace ${Math.round(hoursSinceCompleted)}h < 24h)`);
          continue; // IMPORTANTE: Filtrado, no evaluar más
        }
      }

      // 🔥 LÓGICA NORMAL: Si no está completado O si está completado pero recibió mensaje
      if (!is_completed) {
        // MISMO CRITERIO que prospectService: Solo evaluar last_message_from_prospect
        if (prospect.last_message_from_prospect) {
          console.log(`✅ ${prospect.username} → ABIERTA (no completado, último mensaje del prospecto)`);
          abiertas++;
        } else if (prospect.last_owner_message_at) {
          const lastOwnerMessage = new Date(prospect.last_owner_message_at);
          const now = new Date();
          const hoursSinceLastMessage = (now.getTime() - lastOwnerMessage.getTime()) / (1000 * 60 * 60);
          const daysSinceLastMessage = hoursSinceLastMessage / 24;
          
          // 🎯 APLICAR FILTRO 7-30 DÍAS para recontactar
          if (daysSinceLastMessage >= 7 && daysSinceLastMessage <= 30) {
            console.log(`✅ ${prospect.username} → SEGUIMIENTO (no completado, ${Math.round(daysSinceLastMessage)} días - en rango 7-30)`);
            seguimientos++;
          } else if (hoursSinceLastMessage >= 24 && daysSinceLastMessage < 7) {
            console.log(`✅ ${prospect.username} → SEGUIMIENTO (no completado, ${Math.round(hoursSinceLastMessage)}h desde último mensaje - menos de 7 días)`);
            seguimientos++;
          } else if (daysSinceLastMessage > 30) {
            console.log(`🚫 ${prospect.username} filtrado (${Math.round(daysSinceLastMessage)} días > 30 días)`);
          }
        }
      } else if (last_message_type === 'received') {
        // El prospecto me respondió después de que yo le escribí
        console.log(`✅ ${prospect.username} → ABIERTA (completado pero último mensaje del prospecto)`);
        abiertas++;
      }
    } // ← Cerrar el bucle for aquí

    const finalStats = { 
      abiertas, 
      seguimientos, 
      agendados: 20 // Placeholder
    };
    
    console.log('📊 Stats finales con lógica actualizada:', finalStats);
    return finalStats;
    
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return { abiertas: 0, seguimientos: 0, agendados: 0 };
  }
}

function createMotivationalMessage(stats: { abiertas: number, seguimientos: number, agendados: number }): string {
  const greetings = [
    "¡Buenos días! 🌟",
    "¡Hola campeón! 💪",
    "¡Arranca el día con energía! ⚡",
    "¡A conquistar el día! 🚀",
    "¡Buenos días, prospector! 🎯"
  ];
  
  const motivationalPhrases = [
    "¡Cada contacto te acerca más a tu objetivo! 🎯",
    "¡El éxito está en la constancia! 💪",
    "¡Hoy es un gran día para cerrar negocios! 🚀",
    "¡Tu dedicación se convertirá en resultados! ⭐",
    "¡Sigue así, vas por buen camino! 🔥"
  ];
  
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
  
  const totalProspects = stats.abiertas + stats.seguimientos;
  
  return `${randomGreeting}

Tienes estos prospectos por contactar:
URGENTES de contestar: ${stats.abiertas}
Prospectos en seguimiento: ${stats.seguimientos}
Nuevos prospectos de hoy: ${stats.agendados}

Accede a este link:
https://preview--insta-buddy-ai-chat.lovable.app/tasks-to-do

y limpia esos prospectos

${randomPhrase}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    
    // Modo de test - solo buscar prospectos sin enviar WhatsApp
    if (body.test_mode) {
      console.log("🧪 Modo de test activado - solo búsqueda de prospectos");
      
      // Usar un usuario de test
      const testUserId = '17841476656827421'; // Usuario de test
      await searchAndSaveProspects(testUserId);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Test de búsqueda de prospectos completado",
          test_mode: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log("🚀 Starting WhatsApp notification process...");
    console.log("🔧 Usando endpoint simplificado de WhatsApp");
    
    // We'll get current time for each user's timezone individually
    console.log("UTC time:", new Date().toISOString());
    
    // Get all scheduled notifications first
    const { data: scheduleDays, error: scheduleError } = await supabase
      .from('whatsapp_schedule_days')
      .select('*')
      .eq('enabled', true);

    if (scheduleError) {
      console.error('Error getting scheduled days:', scheduleError);
      return new Response(
        JSON.stringify({ error: "Error al obtener días programados" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!scheduleDays || scheduleDays.length === 0) {
      console.log("No hay días programados");
      return new Response(
        JSON.stringify({ message: "No hay días programados" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get WhatsApp settings for each user
    const { data: whatsappSettings, error: settingsError } = await supabase
      .from('whatsapp_notification_settings')
      .select('*')
      .eq('enabled', true);

    if (settingsError) {
      console.error('Error getting WhatsApp settings:', settingsError);
      return new Response(
        JSON.stringify({ error: "Error al obtener configuración WhatsApp" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine schedule and settings data
    const scheduleData = scheduleDays.map(day => {
      const settings = whatsappSettings.find(s => s.instagram_user_id === day.instagram_user_id);
      return {
        ...day,
        whatsapp_notification_settings: settings
      };
    }).filter(item => item.whatsapp_notification_settings);
    
    if (!scheduleData || scheduleData.length === 0) {
      console.log("No hay usuarios con configuración de horarios");
      return new Response(
        JSON.stringify({ message: "No hay usuarios programados" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${scheduleData.length} users with scheduled notifications`);
    
    const results = [];
    
    // Process each user
    for (const notification of scheduleData) {
      try {
        const userTimezone = notification.whatsapp_notification_settings.timezone || 'America/Mexico_City';
        
        // Get current time in user's timezone
        const userTime = new Date().toLocaleString("en-US", {timeZone: userTimezone});
        const userDate = new Date(userTime);
        const userDay = userDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const userCurrentTime = userDate.toTimeString().substring(0, 5); // HH:MM format
        
        // Check if current day matches the scheduled day
        if (userDay !== notification.day_of_week) {
          console.log(`Skipping user ${notification.instagram_user_id} - day mismatch (${userDay} vs ${notification.day_of_week}) in timezone ${userTimezone}`);
          continue;
        }
        
        const notificationTime = notification.notification_time.substring(0, 5); // HH:MM
        
        // Check if current time is within the notification minute (more flexible)
        const [notificationHour, notificationMinute] = notificationTime.split(':').map(Number);
        const currentHour = userDate.getHours();
        const currentMinute = userDate.getMinutes();
        
        // Allow notification if we're in the same hour and minute
        if (currentHour !== notificationHour || currentMinute !== notificationMinute) {
          console.log(`Skipping user ${notification.instagram_user_id} - time mismatch (${currentHour}:${currentMinute.toString().padStart(2, '0')} vs ${notificationTime}) in timezone ${userTimezone}`);
          continue;
        }
        
        console.log(`✅ Processing user: ${notification.instagram_user_id} at ${userCurrentTime} in ${userTimezone}`);
        
        // PRIMERO: Buscar y guardar nuevos prospectos
        await searchAndSaveProspects(notification.instagram_user_id);
        
        // Get user stats
        const stats = await getUserStats(notification.instagram_user_id);
        console.log(`User stats:`, stats);
        
        // SIEMPRE enviar mensaje, sin importar si hay prospectos o no
        console.log(`💪 Enviando mensaje motivacional independientemente de prospectos`);
        
        // Create message
        const messageBody = createMotivationalMessage(stats);
        
        // Send WhatsApp message using new simplified endpoint
        const success = await sendWhatsAppMessage(
          messageBody, 
          notification.whatsapp_notification_settings.whatsapp_number
        );
        
        results.push({
          instagram_user_id: notification.instagram_user_id,
          whatsapp_number: notification.whatsapp_notification_settings.whatsapp_number,
          status: success ? 'sent' : 'failed',
          stats: stats,
          message_length: messageBody.length
        });
        
        console.log(`Message ${success ? 'sent successfully' : 'failed'} to ${notification.instagram_user_id}`);
        
      } catch (error) {
        console.error(`Error processing user ${notification.instagram_user_id}:`, error);
        results.push({
          instagram_user_id: notification.instagram_user_id,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log("🏁 WhatsApp notification process completed");
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in send-whatsapp-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});