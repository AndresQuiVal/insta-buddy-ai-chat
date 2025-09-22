-- Delete all related data for @howerapp user (instagram_user_id: 17841477036111544)

-- Delete prospect messages first
DELETE FROM prospect_messages 
WHERE prospect_id IN (
  SELECT id FROM prospects 
  WHERE instagram_user_id = 'af6cb584-f1c6-4b6e-a677-9bba3df6d487'
);

-- Delete prospect analysis
DELETE FROM prospect_analysis 
WHERE sender_id IN (
  SELECT prospect_instagram_id FROM prospects 
  WHERE instagram_user_id = 'af6cb584-f1c6-4b6e-a677-9bba3df6d487'
);

-- Delete prospect task status
DELETE FROM prospect_task_status 
WHERE instagram_user_id = '17841477036111544';

-- Delete prospect states
DELETE FROM prospect_states 
WHERE instagram_user_id = '17841477036111544';

-- Delete daily prospect contacts
DELETE FROM daily_prospect_contacts 
WHERE instagram_user_id = '17841477036111544';

-- Delete daily prospect responses
DELETE FROM daily_prospect_responses 
WHERE instagram_user_id = '17841477036111544';

-- Delete daily prospect metrics
DELETE FROM daily_prospect_metrics 
WHERE instagram_user_id = '17841477036111544';

-- Delete daily prospect searches
DELETE FROM daily_prospect_searches 
WHERE instagram_user_id = '17841477036111544';

-- Delete prospects
DELETE FROM prospects 
WHERE instagram_user_id = 'af6cb584-f1c6-4b6e-a677-9bba3df6d487';

-- Delete instagram messages
DELETE FROM instagram_messages 
WHERE instagram_user_id = 'af6cb584-f1c6-4b6e-a677-9bba3df6d487';

-- Delete autoresponder messages
DELETE FROM autoresponder_messages 
WHERE instagram_user_id_ref = '17841477036111544';

-- Delete ideal client traits
DELETE FROM ideal_client_traits 
WHERE instagram_user_id_ref = '17841477036111544';

-- Delete user ICP
DELETE FROM user_icp 
WHERE instagram_user_id = '17841477036111544';

-- Delete WhatsApp notification settings
DELETE FROM whatsapp_notification_settings 
WHERE instagram_user_id = '17841477036111544';

-- Delete WhatsApp schedule days
DELETE FROM whatsapp_schedule_days 
WHERE instagram_user_id = '17841477036111544';

-- Delete prospect list settings
DELETE FROM prospect_list_settings 
WHERE instagram_user_id = '17841477036111544';

-- Delete Hower Lite profiles
DELETE FROM hower_lite_profiles 
WHERE instagram_user_id = '17841477036111544';

-- Delete comment autoresponders
DELETE FROM comment_autoresponders 
WHERE user_id = '17841477036111544';

-- Delete general comment autoresponders
DELETE FROM general_comment_autoresponders 
WHERE user_id = '17841477036111544';

-- Delete conversation flows
DELETE FROM conversation_flows 
WHERE user_id = '17841477036111544';

-- Delete prospect search results
DELETE FROM prospect_search_results 
WHERE instagram_user_id = '17841477036111544';

-- Finally, delete the main instagram user record
DELETE FROM instagram_users 
WHERE username = 'howerapp' AND instagram_user_id = '17841477036111544';