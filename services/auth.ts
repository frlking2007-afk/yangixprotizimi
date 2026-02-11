
import { supabase } from './supabase';

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  // Check for app metadata
  if (data.user?.user_metadata?.app !== 'xpro_user') {
    await supabase.auth.signOut();
    throw new Error("Ushbu foydalanuvchi tizimga kira olmaydi.");
  }

  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const updateUsername = async (newName: string) => {
  const { data, error } = await supabase.auth.updateUser({
    data: { full_name: newName }
  });
  if (error) throw error;
  return data;
};
