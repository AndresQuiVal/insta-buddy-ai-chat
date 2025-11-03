import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { toast } from "sonner";

export const DeleteUserTool = () => {
  const [loading, setLoading] = useState(false);

  const deleteUser = async (instagramUserId: string) => {
    setLoading(true);
    try {
      // Delete in order using service role permissions through RPC or direct deletes
      const userResponse = await supabase
        .from('instagram_users')
        .select('id, username')
        .eq('instagram_user_id', instagramUserId)
        .single();

      if (userResponse.error || !userResponse.data) {
        throw new Error('User not found');
      }

      const userUuid = userResponse.data.id;
      const username = userResponse.data.username;

      console.log(`Deleting user: ${username} (${instagramUserId})`);

      // Delete prospects messages first
      const { data: prospects } = await supabase
        .from('prospects')
        .select('id')
        .eq('instagram_user_id', userUuid);

      if (prospects && prospects.length > 0) {
        const prospectIds = prospects.map(p => p.id);
        await supabase.from('prospect_messages').delete().in('prospect_id', prospectIds);
      }

      // Delete all related data
      await supabase.from('prospects').delete().eq('instagram_user_id', userUuid);
      await supabase.from('instagram_messages').delete().eq('instagram_user_id', userUuid);
      await supabase.from('autoresponder_messages').delete().eq('instagram_user_id', userUuid);
      await supabase.from('ideal_client_traits').delete().eq('instagram_user_id', userUuid);
      await supabase.from('user_icp').delete().eq('instagram_user_id', instagramUserId);
      await supabase.from('daily_prospect_metrics').delete().eq('instagram_user_id', instagramUserId);
      await supabase.from('daily_prospect_contacts').delete().eq('instagram_user_id', instagramUserId);
      await supabase.from('daily_prospect_responses').delete().eq('instagram_user_id', instagramUserId);
      await supabase.from('daily_prospect_searches').delete().eq('instagram_user_id', instagramUserId);
      await supabase.from('prospect_task_status').delete().eq('instagram_user_id', instagramUserId);
      await supabase.from('prospect_states').delete().eq('instagram_user_id', instagramUserId);
      await supabase.from('whatsapp_notification_settings').delete().eq('instagram_user_id', instagramUserId);
      await supabase.from('whatsapp_schedule_days').delete().eq('instagram_user_id', instagramUserId);
      await supabase.from('hower_lite_profiles').delete().eq('instagram_user_id', instagramUserId);
      await supabase.from('prospect_list_settings').delete().eq('instagram_user_id', instagramUserId);
      await supabase.from('comment_autoresponders').delete().eq('user_id', instagramUserId);
      await supabase.from('general_comment_autoresponders').delete().eq('user_id', instagramUserId);
      await supabase.from('prospect_search_results').delete().eq('instagram_user_id', instagramUserId);

      // Finally delete the user
      const { error: deleteError } = await supabase
        .from('instagram_users')
        .delete()
        .eq('id', userUuid);

      if (deleteError) throw deleteError;

      toast.success(`Usuario ${username} eliminado exitosamente`);
      console.log(`Successfully deleted user: ${username}`);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Delete User Tool</h2>
      <Button
        onClick={() => deleteUser('17841465053326727')}
        disabled={loading}
        variant="destructive"
      >
        {loading ? 'Eliminando...' : 'Eliminar davidedigrumo'}
      </Button>
    </div>
  );
};
