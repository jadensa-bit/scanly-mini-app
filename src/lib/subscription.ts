// Subscription utilities for checking user tier and features
import { supabase } from '@/lib/supabaseclient';

// Special accounts with unlimited access (VIP/Admin)
const UNLIMITED_ACCOUNTS = [
  'x@gmail.com',
  // Add more emails here as needed
];

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  piqoLimit: number;
  currentPiqoCount: number;
  canCreateMore: boolean;
  features: {
    unlimitedPiqos: boolean;
    advancedAnalytics: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
    teamAccess: boolean;
  };
}

/**
 * Check if email is in unlimited accounts list
 */
async function isUnlimitedEmail(userId: string): Promise<boolean> {
  try {
    // Try to get email from current session first
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id === userId && session?.user?.email) {
      return UNLIMITED_ACCOUNTS.includes(session.user.email.toLowerCase());
    }
    
    // Fallback: check if profiles table has email column
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (profile?.email) {
      return UNLIMITED_ACCOUNTS.includes(profile.email.toLowerCase());
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Get user's subscription information
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
  try {
    // Check if this is a special unlimited account
    const isUnlimitedAccount = await isUnlimitedEmail(userId);

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, piqo_limit')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    // Get current piqo count (using sites or scanly_sites based on what exists)
    let currentPiqoCount = 0;
    
    // Try 'sites' table first
    const { data: sites, error: sitesError, count: sitesCount } = await supabase
      .from('sites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (!sitesError && sitesCount !== null) {
      currentPiqoCount = sitesCount || 0;
    } else {
      // Fallback to 'scanly_sites' table
      const { data: scanlySites, error: scanlySitesError, count: scanlySitesCount } = await supabase
        .from('scanly_sites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (!scanlySitesError && scanlySitesCount !== null) {
        currentPiqoCount = scanlySitesCount || 0;
      }
    }

    const tier = (profile.subscription_tier || 'free') as SubscriptionTier;
    const status = (profile.subscription_status || 'active') as SubscriptionStatus;
    const piqoLimit = isUnlimitedAccount ? -1 : (profile.piqo_limit || 1);

    // Define features based on tier or unlimited account status
    const features = {
      unlimitedPiqos: isUnlimitedAccount || tier === 'pro' || tier === 'enterprise',
      advancedAnalytics: isUnlimitedAccount || tier === 'pro' || tier === 'enterprise',
      customBranding: isUnlimitedAccount || tier === 'pro' || tier === 'enterprise',
      prioritySupport: isUnlimitedAccount || tier === 'enterprise',
      whiteLabel: isUnlimitedAccount || tier === 'enterprise',
      teamAccess: isUnlimitedAccount || tier === 'enterprise',
    };

    // Check if user can create more piqos
    const canCreateMore = isUnlimitedAccount || (tier === 'free' 
      ? currentPiqoCount < piqoLimit 
      : true); // Pro and enterprise have unlimited

    return {
      tier,
      status,
      piqoLimit,
      currentPiqoCount,
      canCreateMore,
      features,
    };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return null;
  }
}

/**
 * Check if user can access a specific feature
 */
export async function canAccessFeature(userId: string, feature: keyof SubscriptionInfo['features']): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) return false;
  return subscription.features[feature];
}

/**
 * Check if user can create another piqo
 */
export async function canCreatePiqo(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) return false;
  return subscription.canCreateMore;
}

/**
 * Get user's piqo usage stats
 */
export async function getPiqoUsage(userId: string): Promise<{ used: number; limit: number; percentage: number } | null> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) return null;

  const percentage = subscription.piqoLimit === -1 
    ? 0 
    : (subscription.currentPiqoCount / subscription.piqoLimit) * 100;

  return {
    used: subscription.currentPiqoCount,
    limit: subscription.piqoLimit,
    percentage: Math.min(percentage, 100),
  };
}
