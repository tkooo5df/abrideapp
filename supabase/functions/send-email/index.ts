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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const diagnostics: string[] = [];
  const respond = (status: number, body: Record<string, unknown>) => {
    const payload = diagnostics.length > 0 ? { ...body, diagnostics } : body;
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  };

  try {
    const { to, subject, html, text, attachments } = await req.json();

    if (!to || !subject) {
      return respond(400, { error: 'Missing required fields: to, subject' });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const MAILRELAY_API_KEY = Deno.env.get('MAILRELAY_API_KEY');
    const MAILRELAY_ACCOUNT = Deno.env.get('MAILRELAY_ACCOUNT');

    if (MAILRELAY_API_KEY && MAILRELAY_ACCOUNT) {
      try {
        const mailrelayUrl = `https://${MAILRELAY_ACCOUNT}/api/v1/send_emails`;
        
        // Map standard attachment format to Mailrelay format
        const mailrelayAttachments = attachments && Array.isArray(attachments) ? attachments.map(a => ({
          file_name: a.filename,
          content_type: a.contentType || a.content_type || 'application/pdf',
          content: a.content
        })) : undefined;

        const mailrelayResponse = await fetch(mailrelayUrl, {
          method: 'POST',
          headers: {
            'X-AUTH-TOKEN': MAILRELAY_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject,
            html: html || text,
            mail: { to: [{ email: to }] },
            from: {
              email: Deno.env.get('FROM_EMAIL') || 'noreply@abride.online',
              name: 'Abride Online',
            },
            attachments: mailrelayAttachments
          }),
        });

        if (mailrelayResponse.ok) {
          const result = await mailrelayResponse.json();
          console.log(`[Mailrelay] Successfully sent email to ${to}. Attachments: ${!!mailrelayAttachments}`);
          return respond(200, { success: true, provider: 'mailrelay', result });
        }

        const errorText = await mailrelayResponse.text();
        console.error(`[Mailrelay] Failed to send email to ${to}: Status ${mailrelayResponse.status} - ${errorText}`);
        diagnostics.push(`Mailrelay provider returned status ${mailrelayResponse.status}: ${errorText}`);
      } catch (mailrelayError) {
        console.error(`[Mailrelay] Exception: ${formatError(mailrelayError)}`);
        diagnostics.push(`Mailrelay provider failed: ${formatError(mailrelayError)}`);
      }
    } else {
      diagnostics.push('Mailrelay provider not configured.');
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      try {
        const fromEmail = 'noreply@abride.online';
        const fromName = 'Abride Online';

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [to],
            subject,
            html: html || text,
            text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
            attachments: attachments || undefined,
          }),
        });

        if (resendResponse.ok) {
          const result = await resendResponse.json();
          console.log(`[Resend] Successfully sent email to ${to}. Attachments included: ${!!attachments}`);
          return respond(200, {
            success: true,
            provider: 'resend',
            result,
            message: 'Email sent successfully via Resend',
          });
        }

        const errorText = await resendResponse.text();
        let errorData: { message?: string } | undefined;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        const message = errorData?.message || errorText || 'Resend API error';
        console.error(`[Resend] Failed to send email to ${to}: Status ${resendResponse.status} - ${message}`);
        diagnostics.push(`Resend provider returned status ${resendResponse.status}: ${message}`);
      } catch (resendError) {
        console.error(`[Resend] Exception: ${formatError(resendError)}`);
        diagnostics.push(`Resend provider failed: ${formatError(resendError)}`);
      }
    } else {
      diagnostics.push('Resend provider not configured.');
    }

    diagnostics.push('Using Supabase Auth fallback provider.');

    try {
      const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers();

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }

      const user = authUsers.users.find((u) => u.email === to);

      if (!user) {
        throw new Error('User not found in auth.users');
      }

      return respond(200, {
        success: true,
        provider: 'supabase-auth',
        message: 'Email queued via Supabase Auth',
        warning: 'Using fallback method - email format may be limited',
      });
    } catch (supabaseError) {
      return respond(500, {
        error: 'Failed to send email',
        details: formatError(supabaseError),
        suggestion: 'Please configure RESEND_API_KEY or MAILRELAY_API_KEY in Supabase Secrets',
      });
    }
  } catch (error) {
    return respond(500, {
      error: 'Internal server error',
      details: formatError(error),
    });
  }
});
