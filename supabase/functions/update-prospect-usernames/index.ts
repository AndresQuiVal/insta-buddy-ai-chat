import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    console.log('🔄 Iniciando actualización de usernames de prospectos...')
    
    // Obtener prospectos con usernames genéricos
    const { data: prospectsToUpdate, error: queryError } = await supabase
      .from('prospects')
      .select('id, instagram_user_id, prospect_instagram_id, username')
      .like('username', 'user_%')
      .limit(50) // Procesar en lotes para evitar timeout
    
    if (queryError) {
      console.error('❌ Error obteniendo prospectos:', queryError)
      return new Response(
        JSON.stringify({ error: 'Error obteniendo prospectos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`📋 Encontrados ${prospectsToUpdate?.length || 0} prospectos con usernames genéricos`)
    
    let updatedCount = 0
    let errorCount = 0
    
    if (prospectsToUpdate && prospectsToUpdate.length > 0) {
      for (const prospect of prospectsToUpdate) {
        try {
          console.log(`🔍 Procesando prospecto ${prospect.prospect_instagram_id}...`)
          
          // Obtener token del usuario propietario
          const { data: ownerUser, error: ownerError } = await supabase
            .from('instagram_users')
            .select('access_token, token_expires_at, username')
            .eq('id', prospect.instagram_user_id)
            .eq('is_active', true)
            .maybeSingle()
          
          if (ownerError || !ownerUser || !ownerUser.access_token) {
            console.log(`⚠️ No se encontró token válido para el prospecto ${prospect.prospect_instagram_id}`)
            errorCount++
            continue
          }
          
          // Verificar que el token no haya expirado
          if (ownerUser.token_expires_at) {
            const tokenExpiry = new Date(ownerUser.token_expires_at)
            if (tokenExpiry < new Date()) {
              console.log(`⚠️ Token expirado para ${ownerUser.username}`)
              errorCount++
              continue
            }
          }
          
          // Intentar obtener el username real de Instagram
          try {
            const apiUrl = `https://graph.instagram.com/${prospect.prospect_instagram_id}?fields=username,name&access_token=${ownerUser.access_token}`
            const response = await fetch(apiUrl, {
              headers: {
                'User-Agent': 'Hower-Instagram-Bot/1.0'
              }
            })
            
            if (response.ok) {
              const userData = await response.json()
              
              if (userData.username && userData.username !== prospect.username) {
                // Actualizar el username en la base de datos
                const { error: updateError } = await supabase
                  .from('prospects')
                  .update({ 
                    username: userData.username,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', prospect.id)
                
                if (updateError) {
                  console.error(`❌ Error actualizando prospecto ${prospect.id}:`, updateError)
                  errorCount++
                } else {
                  console.log(`✅ Actualizado: ${prospect.username} → ${userData.username}`)
                  updatedCount++
                }
              } else {
                console.log(`⚠️ Sin username válido para ${prospect.prospect_instagram_id}`)
                errorCount++
              }
            } else {
              const errorText = await response.text()
              console.log(`❌ Error API Instagram para ${prospect.prospect_instagram_id}: ${response.status} - ${errorText}`)
              errorCount++
            }
          } catch (apiError) {
            console.error(`❌ Error de API para ${prospect.prospect_instagram_id}:`, apiError)
            errorCount++
          }
          
          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 200))
          
        } catch (error) {
          console.error(`❌ Error procesando prospecto ${prospect.id}:`, error)
          errorCount++
        }
      }
    }
    
    const result = {
      success: true,
      processed: prospectsToUpdate?.length || 0,
      updated: updatedCount,
      errors: errorCount,
      message: `Procesados ${prospectsToUpdate?.length || 0} prospectos. Actualizados: ${updatedCount}, Errores: ${errorCount}`
    }
    
    console.log('✅ Proceso completado:', result)
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('❌ Error en edge function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})