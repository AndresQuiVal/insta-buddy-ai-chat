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

    const { commenter_id, business_account_id } = await req.json()

    if (!commenter_id || !business_account_id) {
      return new Response(
        JSON.stringify({ 
          error: 'commenter_id y business_account_id son requeridos',
          follows: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Verificando si', commenter_id, 'sigue a', business_account_id)

    // Obtener el token de acceso de Instagram para la cuenta de negocio
    const { data: instagramUser, error: userError } = await supabase
      .from('instagram_users')
      .select('access_token')
      .eq('instagram_user_id', business_account_id)
      .eq('is_active', true)
      .single()

    if (userError || !instagramUser) {
      console.error('❌ Error obteniendo usuario de Instagram:', userError)
      return new Response(
        JSON.stringify({ 
          error: 'Usuario de Instagram no encontrado',
          follows: false 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const accessToken = instagramUser.access_token

    // Verificar si el usuario sigue la cuenta usando la API de Instagram
    // Nota: Esta API solo funciona para Instagram Business/Creator accounts
    try {
      const followsUrl = `https://graph.facebook.com/v18.0/${business_account_id}/followers?access_token=${accessToken}&limit=1000`
      
      console.log('🌐 Consultando seguidores en Instagram API...')
      
      const followersResponse = await fetch(followsUrl)
      const followersData = await followersResponse.json()

      if (!followersResponse.ok) {
        console.error('❌ Error en API de Instagram:', followersData)
        
        // Si hay error en la API, no permitimos el envío por seguridad
        return new Response(
          JSON.stringify({ 
            follows: false, 
            note: 'Error en API, bloqueando envío por seguridad',
            error: followersData.error 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Verificar si el commenter_id está en la lista de seguidores
      const followers = followersData.data || []
      const isFollowing = followers.some((follower: any) => follower.id === commenter_id)

      console.log('✅ Resultado de verificación:', isFollowing ? 'SÍ SIGUE' : 'NO SIGUE')
      console.log('📊 Total seguidores consultados:', followers.length)

      return new Response(
        JSON.stringify({ 
          follows: isFollowing,
          followers_count: followers.length 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (apiError) {
      console.error('💥 Error consultando API de Instagram:', apiError)
      
      // En caso de error, no permitimos el envío por seguridad
      return new Response(
        JSON.stringify({ 
          follows: false, 
          note: 'Error consultando API, bloqueando envío por seguridad' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('💥 Error general:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        follows: false // Modo restrictivo en caso de error cuando require_follower está activado
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})