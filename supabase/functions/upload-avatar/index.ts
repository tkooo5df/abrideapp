import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get service role key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    const { userId, imageData, fileName, contentType } = await req.json();

    if (!userId || !imageData || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, imageData, fileName' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert base64 to buffer
    const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));

    const warnings: string[] = [];
    const diagnostics: string[] = [];
    let profileUpdated = false;

    // Upload to storage using service role (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, imageBuffer, {
        contentType: contentType || 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user profile with avatar URL
    // Use upsert to create or update profile (works even if profile doesn't exist yet)
    // First, get user data to populate profile fields
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (userData?.user && !userError) {
        // Get user metadata
        const metadata = userData.user.user_metadata || {};
        const firstName = metadata.first_name || '';
        const lastName = metadata.last_name || '';
        const fullName = metadata.full_name || `${firstName} ${lastName}`.trim() || '';
        
        // Use upsert to create or update profile with avatar URL
        // This works even if profile doesn't exist yet (database trigger might not have run yet)
        const { error: upsertError, data: upsertData } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            email: userData.user.email,
            first_name: firstName,
            last_name: lastName,
            full_name: fullName || userData.user.email || '',
            role: metadata.role || 'passenger',
            phone: metadata.phone || null,
            wilaya: metadata.wilaya || null,
            avatar_url: publicUrl
          }, {
            onConflict: 'id'
          })
          .select();
        
        if (!upsertError && upsertData && upsertData.length > 0) {
          profileUpdated = true;
        } else {
          if (upsertError) {
            diagnostics.push(`Profile upsert failed: ${formatError(upsertError)}`);
          }

          // Fallback: Try simple update if profile exists
          if (upsertError) {
            const { error: updateError, data: updateData } = await supabaseAdmin
              .from('profiles')
              .update({ avatar_url: publicUrl })
              .eq('id', userId)
              .select();

            if (!updateError && updateData && updateData.length > 0) {
              profileUpdated = true;
            } else {
              warnings.push('Avatar uploaded but profile metadata will be updated after the next successful login.');
            }
          }
        }
      } else {
        if (userError) {
          diagnostics.push(`Unable to retrieve user profile metadata: ${formatError(userError)}`);
        }
        // Try simple update anyway (profile might exist from database trigger)
        const { error: updateError, data: updateData } = await supabaseAdmin
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', userId)
          .select();

        if (!updateError && updateData && updateData.length > 0) {
          profileUpdated = true;
        } else {
          warnings.push('Avatar uploaded but profile metadata could not be updated automatically.');
        }
      }
    } catch (error: any) {
      diagnostics.push(`Profile update attempt failed: ${formatError(error)}`);
      // Don't fail - avatar is still uploaded
    }

    const payload: Record<string, unknown> = {
      success: true,
      avatarUrl: publicUrl,
      message: 'Avatar uploaded successfully',
      profileUpdated,
    };

    if (warnings.length > 0) {
      payload.warnings = warnings;
    }

    if (diagnostics.length > 0) {
      payload.diagnostics = diagnostics;
    }

    return new Response(
      JSON.stringify(payload),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: formatError(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

