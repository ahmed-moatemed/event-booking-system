import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user;
};

export const getUserRole = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user?.user_metadata?.role || 'user';
};

export const isAdmin = async () => {
  const role = await getUserRole();
  return role === 'admin';
}; 