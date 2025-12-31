import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // Check environment variables (try both VITE_ and non-VITE_ prefixes for compatibility)
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
    const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    // Validate that environment variables are not empty
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      console.error('SUPABASE_URL:', supabaseUrl ? `Found (length: ${supabaseUrl.length})` : 'Missing');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `Found (length: ${supabaseServiceKey.length})` : 'Missing');
      return res.status(500).json({ 
        ok: false, 
        error: 'Server configuration error: Missing Supabase credentials. Please check Vercel environment variables: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY' 
      });
    }

    // Create Supabase admin client with error handling
    let supabaseAdmin;
    try {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    } catch (clientError: any) {
      console.error('❌ Error creating Supabase client:', clientError);
      return res.status(500).json({ 
        ok: false, 
        error: `Server configuration error: Failed to initialize Supabase client. ${clientError.message || 'Please check Vercel environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'}` 
      });
    }

    // Get user ID from request body
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing userId in request body' 
      });
    }

    // Verify the requesting user is an admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Unauthorized: Missing or invalid authorization header' 
      });
    }

    const userToken = authHeader.replace('Bearer ', '');
    
    // Use admin client to verify user and check admin status
    // This avoids needing the anon key
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(userToken);

    if (userError || !user) {
      console.error('❌ Error verifying user token:', userError);
      return res.status(401).json({ 
        ok: false, 
        error: 'Unauthorized: Invalid token' 
      });
    }

    // Check if user is admin using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error checking admin status:', profileError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Error verifying admin status' 
      });
    }

    if (profile?.role !== 'admin') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Forbidden: Admin access required' 
      });
    }

    // Delete user from auth.users (this will cascade delete profile due to ON DELETE CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('❌ Error deleting user from auth:', deleteError);
      return res.status(500).json({ 
        ok: false, 
        error: `Failed to delete user: ${deleteError.message}` 
      });
    }

    // Also delete related data manually (in case cascade doesn't work)
    // Delete subscriptions
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);

    // Delete takbull orders
    await supabaseAdmin
      .from('takbull_orders')
      .delete()
      .eq('user_id', userId);

    // Delete analyses
    await supabaseAdmin
      .from('analyses')
      .delete()
      .eq('user_id', userId);

    // Delete videos
    await supabaseAdmin
      .from('videos')
      .delete()
      .eq('user_id', userId);

    // Delete trainees (if user is a coach)
    await supabaseAdmin
      .from('trainees')
      .delete()
      .eq('coach_id', userId);

    // Delete coupon redemptions
    await supabaseAdmin
      .from('coupon_redemptions')
      .delete()
      .eq('user_id', userId);

    // Delete user trials
    await supabaseAdmin
      .from('user_trials')
      .delete()
      .eq('user_id', userId);

    // Delete user announcements
    await supabaseAdmin
      .from('user_announcements')
      .delete()
      .eq('user_id', userId);

    console.log('✅ User deleted successfully:', userId);

    return res.status(200).json({ 
      ok: true, 
      message: 'User deleted successfully' 
    });

  } catch (error: any) {
    console.error('❌ Error in delete-user API:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || 'Internal server error' 
    });
  }
}

