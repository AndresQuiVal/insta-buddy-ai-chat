import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { instagram_user_id } = await req.json()
    
    if (!instagram_user_id) {
      throw new Error('instagram_user_id is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`Starting deletion for user: ${instagram_user_id}`)

    // Get user UUID first
    const { data: user, error: userError } = await supabase
      .from('instagram_users')
      .select('id, username')
      .eq('instagram_user_id', instagram_user_id)
      .single()

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message}`)
    }

    const userUuid = user.id
    console.log(`Found user UUID: ${userUuid}, username: ${user.username}`)

    // Delete in order (dependents first)
    
    // 1. Delete prospect messages (depends on prospects)
    const { error: pmError } = await supabase
      .from('prospect_messages')
      .delete()
      .in('prospect_id', 
        supabase.from('prospects').select('id').eq('instagram_user_id', userUuid)
      )
    if (pmError) console.error('Error deleting prospect_messages:', pmError)

    // 2. Delete prospects
    const { error: pError } = await supabase
      .from('prospects')
      .delete()
      .eq('instagram_user_id', userUuid)
    if (pError) console.error('Error deleting prospects:', pError)

    // 3. Delete Instagram messages
    const { error: imError } = await supabase
      .from('instagram_messages')
      .delete()
      .eq('instagram_user_id', userUuid)
    if (imError) console.error('Error deleting instagram_messages:', imError)

    // 4. Delete autoresponders
    const { error: amError } = await supabase
      .from('autoresponder_messages')
      .delete()
      .eq('instagram_user_id', userUuid)
    if (amError) console.error('Error deleting autoresponder_messages:', amError)

    // 5. Delete ideal client traits
    const { error: ictError } = await supabase
      .from('ideal_client_traits')
      .delete()
      .eq('instagram_user_id', userUuid)
    if (ictError) console.error('Error deleting ideal_client_traits:', ictError)

    // 6. Delete user ICP
    const { error: icpError } = await supabase
      .from('user_icp')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (icpError) console.error('Error deleting user_icp:', icpError)

    // 7. Delete daily metrics
    const { error: dmError } = await supabase
      .from('daily_prospect_metrics')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (dmError) console.error('Error deleting daily_prospect_metrics:', dmError)

    // 8. Delete daily contacts
    const { error: dcError } = await supabase
      .from('daily_prospect_contacts')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (dcError) console.error('Error deleting daily_prospect_contacts:', dcError)

    // 9. Delete daily responses
    const { error: drError } = await supabase
      .from('daily_prospect_responses')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (drError) console.error('Error deleting daily_prospect_responses:', drError)

    // 10. Delete daily searches
    const { error: dsError } = await supabase
      .from('daily_prospect_searches')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (dsError) console.error('Error deleting daily_prospect_searches:', dsError)

    // 11. Delete task status
    const { error: tsError } = await supabase
      .from('prospect_task_status')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (tsError) console.error('Error deleting prospect_task_status:', tsError)

    // 12. Delete prospect states
    const { error: psError } = await supabase
      .from('prospect_states')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (psError) console.error('Error deleting prospect_states:', psError)

    // 13. Delete WhatsApp settings
    const { error: wnError } = await supabase
      .from('whatsapp_notification_settings')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (wnError) console.error('Error deleting whatsapp_notification_settings:', wnError)

    // 14. Delete WhatsApp schedule days
    const { error: wsdError } = await supabase
      .from('whatsapp_schedule_days')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (wsdError) console.error('Error deleting whatsapp_schedule_days:', wsdError)

    // 15. Delete Hower Lite profiles
    const { error: hlpError } = await supabase
      .from('hower_lite_profiles')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (hlpError) console.error('Error deleting hower_lite_profiles:', hlpError)

    // 16. Delete prospect list settings
    const { error: plsError } = await supabase
      .from('prospect_list_settings')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (plsError) console.error('Error deleting prospect_list_settings:', plsError)

    // 17. Delete comment autoresponders
    const { error: caError } = await supabase
      .from('comment_autoresponders')
      .delete()
      .eq('user_id', instagram_user_id)
    if (caError) console.error('Error deleting comment_autoresponders:', caError)

    // 18. Delete general comment autoresponders
    const { error: gcaError } = await supabase
      .from('general_comment_autoresponders')
      .delete()
      .eq('user_id', instagram_user_id)
    if (gcaError) console.error('Error deleting general_comment_autoresponders:', gcaError)

    // 19. Delete prospect search results
    const { error: psrError } = await supabase
      .from('prospect_search_results')
      .delete()
      .eq('instagram_user_id', instagram_user_id)
    if (psrError) console.error('Error deleting prospect_search_results:', psrError)

    // 20. Finally, delete the user
    const { error: userDelError } = await supabase
      .from('instagram_users')
      .delete()
      .eq('id', userUuid)
    
    if (userDelError) {
      throw new Error(`Failed to delete user: ${userDelError.message}`)
    }

    console.log(`Successfully deleted user: ${user.username}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${user.username} and all related data deleted successfully`,
        instagram_user_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in delete-user-completely:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
