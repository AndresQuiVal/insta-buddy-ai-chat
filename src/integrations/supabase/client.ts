// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rpogkbqcuqrihynbpnsi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwb2drYnFjdXFyaWh5bmJwbnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDczNzAsImV4cCI6MjA2Mzc4MzM3MH0.9x4X9Dqc_eIkgaG4LAecrG9PIGXZEEqxYIMbLBtXjNQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);