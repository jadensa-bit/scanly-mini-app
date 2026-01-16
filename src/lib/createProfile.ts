// Utility to manage user profiles in the Supabase 'profiles' table
import { supabase } from '@/lib/supabaseclient';

interface CreateProfileParams {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
}

interface ProfileResponse {
  success: boolean;
  error?: string;
  data?: any;
}

// Create a new profile after signup
export async function createProfile({ 
  id, 
  name, 
  email, 
  avatar_url 
}: CreateProfileParams): Promise<ProfileResponse> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        { 
          id, 
          name,
          email,
          avatar_url,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error creating profile:', err);
    return { success: false, error: 'Failed to create profile' };
  }
}

// Get user profile for dashboard
export async function getUserProfile(userId: string): Promise<ProfileResponse> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: 'Failed to fetch profile' };
  }
}

// Get all user creations (bookings, storefronts, etc.)
export async function getUserCreations(userId: string): Promise<ProfileResponse> {
  try {
    // Fetch bookings created by this user
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      return { success: false, error: bookingsError.message };
    }

    // Add additional queries for storefronts, products, etc. as needed
    // Example:
    // const { data: storefronts } = await supabase
    //   .from('storefronts')
    //   .select('*')
    //   .eq('user_id', userId);

    return { 
      success: true, 
      data: { 
        bookings,
        // storefronts,
        // Add other creation types here
      } 
    };
  } catch (err) {
    return { success: false, error: 'Failed to fetch creations' };
  }
}
