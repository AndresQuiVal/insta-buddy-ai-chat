-- Create function to delete prospect by user and sender_id
CREATE OR REPLACE FUNCTION public.delete_prospect_by_sender(p_instagram_user_id text, p_prospect_sender_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Delete from prospect_messages first (foreign key dependency)
  DELETE FROM public.prospect_messages
  WHERE prospect_id IN (
    SELECT p.id 
    FROM public.prospects p
    INNER JOIN public.instagram_users iu ON p.instagram_user_id = iu.id
    WHERE iu.instagram_user_id = p_instagram_user_id 
      AND p.prospect_instagram_id = p_prospect_sender_id
  );
  
  -- Delete from prospects table
  DELETE FROM public.prospects p
  USING public.instagram_users iu
  WHERE p.instagram_user_id = iu.id
    AND iu.instagram_user_id = p_instagram_user_id
    AND p.prospect_instagram_id = p_prospect_sender_id;
  
  -- Delete from instagram_messages table (both sent and received)
  DELETE FROM public.instagram_messages im
  USING public.instagram_users iu
  WHERE im.instagram_user_id = iu.id
    AND iu.instagram_user_id = p_instagram_user_id
    AND (im.sender_id = p_prospect_sender_id OR im.recipient_id = p_prospect_sender_id);
  
  -- Delete from prospect_task_status
  DELETE FROM public.prospect_task_status
  WHERE instagram_user_id = p_instagram_user_id
    AND prospect_sender_id = p_prospect_sender_id;
  
  -- Delete from prospect_analysis
  DELETE FROM public.prospect_analysis
  WHERE sender_id = p_prospect_sender_id;
  
  -- Delete from prospect_states
  DELETE FROM public.prospect_states
  WHERE instagram_user_id = p_instagram_user_id
    AND prospect_sender_id = p_prospect_sender_id;
  
  -- Delete from daily_prospect_contacts
  DELETE FROM public.daily_prospect_contacts
  WHERE instagram_user_id = p_instagram_user_id
    AND prospect_sender_id = p_prospect_sender_id;
  
  -- Delete from daily_prospect_responses
  DELETE FROM public.daily_prospect_responses
  WHERE instagram_user_id = p_instagram_user_id
    AND prospect_sender_id = p_prospect_sender_id;
    
END;
$function$;