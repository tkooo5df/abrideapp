import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse the payload from Resend
    const payload = await req.json();

    console.log('Received email payload:', JSON.stringify(payload, null, 2));

    // The email data is inside the payload
    const { from, to, subject, html, text, headers } = payload;

    // Initialize Supabase Client to save the email or trigger notifications
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Optional: Save the incoming email to a database table called 'incoming_emails'
    // Make sure you create this table in your Supabase Dashboard first!
    /*
    const { error } = await supabaseClient
      .from('incoming_emails')
      .insert({
        from_email: from,
        to_email: to,
        subject: subject,
        html_body: html,
        text_body: text,
        raw_headers: headers,
        received_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving email to DB:', error);
    }
    */

    // Respond back to Resend so they know we received it
    return new Response(JSON.stringify({ success: true, message: "Email received successfully" }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
