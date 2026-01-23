import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANALYTICS_EMAIL_RECIPIENTS = Deno.env.get("ANALYTICS_EMAIL_RECIPIENTS");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }
    if (!ANALYTICS_EMAIL_RECIPIENTS) {
      throw new Error("Missing ANALYTICS_EMAIL_RECIPIENTS");
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch Analytics Data
    const { data: analytics, error: analyticsError } = await supabase.rpc(
      "get_daily_analytics_summary"
    );

    if (analyticsError) {
      throw new Error(`Analytics RPC failed: ${analyticsError.message}`);
    }

    if (!analytics) {
      throw new Error("No analytics data returned");
    }

    // 2. Format Email - Styled
    const { timeframe, users, engagement } = analytics;
    const dateStr = new Date(timeframe.end).toLocaleDateString("en-US", {
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    
    // Helper for metric cards
    const Card = (label: string, value: string | number, highlight = false) => `
      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; width: 45%; min-width: 140px; margin-bottom: 16px;">
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">${label}</div>
        <div style="font-size: 24px; font-weight: 700; color: ${highlight ? '#4f46e5' : '#111827'};">${value}</div>
      </div>
    `;

    // Helper for section headers
    const SectionHeader = (title: string) => `
      <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin-top: 32px; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">${title}</h2>
    `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; }
          .header { background-color: #111827; color: #ffffff; padding: 32px 24px; text-align: center; }
          .content { padding: 32px 24px; }
          .grid { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; }
          .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container" style="border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Lobe Analytics</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 14px;">${dateStr}</p>
          </div>

          <div class="content">
            <p style="text-align: center; color: #4b5563; font-size: 14px; margin-bottom: 32px;">
              Overview for <strong>${new Date(timeframe.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong> to <strong>${new Date(timeframe.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
            </p>

            ${SectionHeader("User Growth")}
            <div class="grid" style="display: flex; flex-wrap: wrap; justify-content: space-between;">
              ${Card("New Users (24h)", users.new_last_24h, true)}
              ${Card("Total Users", users.total)}
              ${Card("Onboarding (24h)", users.onboarding_completed_last_24h)}
              ${Card("Total Onboarding", users.onboarding_completed_total)}
            </div>

            ${SectionHeader("Engagement")}
            <div class="grid" style="display: flex; flex-wrap: wrap; justify-content: space-between;">
              ${Card("Active Users (24h)", engagement.active_users_last_24h, true)}
              ${Card("Games Played (24h)", engagement.games_played_last_24h)}
              ${Card("Avg Games/User", engagement.avg_games_per_active_user_last_24h)}
              ${Card("Total Games", engagement.total_games_played)}
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0;">Sent automatically by Lobe Service Cron</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 3. Send Email
    const resend = new Resend(RESEND_API_KEY);
    const recipients = ANALYTICS_EMAIL_RECIPIENTS.split(",").map((e) => e.trim());

    // Send to first recipient, BCC others if multiple, or just loop? 
    // Resend supports multiple in 'to' or 'bcc'. Let's us 'to' for the first, 'bcc' for others?
    // Or just put them all in 'to'.
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Lobe Service <onboarding@resend.dev>", // Update this if user has a domain
      to: recipients,
      subject: `Daily Analytics Report - ${dateStr}`,
      html: emailHtml,
    });

    if (emailError) {
      throw new Error(`Resend failed: ${emailError.message}`);
    }

    return new Response(JSON.stringify(emailData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
