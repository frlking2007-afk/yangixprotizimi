
import { supabase } from './supabase';

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  // Note: Previous metadata check (app: 'xpro_user') is removed as we now rely
  // on the customers table link which is handled in App.tsx via getBusinessDetails.
  // If a user has no customer record, they will technically log in but have LITE/No plan functionality.

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
