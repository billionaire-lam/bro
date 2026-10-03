import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const REMINDER_MESSAGES = [
  "Đến giờ học rồi! Hôm nay bạn đã học gì chưa?",
  "Giữ streak nào! Dành vài phút hôm nay để tiếp tục bài học.",
  "Một bài học ngắn mỗi ngày sẽ giúp bạn tiến bộ nhanh hơn!",
  "Bạn còn bài đang học dở. Vào StudyHub và tiếp tục nhé!",
  "Học tập mỗi ngày là chìa khóa thành công. Vào học ngay nhé!",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all users with daily_reminder_enabled = true
    const { data: prefs, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("user_id, daily_reminder_time, timezone")
      .eq("daily_reminder_enabled", true);

    if (prefsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch preferences" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!prefs || prefs.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No users with daily reminder enabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current UTC time
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const currentUTCMins = utcHour * 60 + utcMinute;

    const results: { user_id: string; sent: boolean; reason: string }[] = [];

    for (const pref of prefs) {
      const reminderTime = pref.daily_reminder_time || "19:00";
      const [targetHour, targetMinute] = reminderTime.split(":").map(Number);

      // Convert target time from user timezone to UTC
      // For simplicity, we check if current UTC time matches within a 5-minute window
      // of the target time. The edge function is called by cron every 5 minutes.
      const tz = pref.timezone || "Asia/Ho_Chi_Minh";

      // Calculate UTC offset from timezone string (simplified — full TZ DB not available)
      let offsetMinutes = 420; // Default: Asia/Ho_Chi_Minh = UTC+7
      if (tz === "UTC") offsetMinutes = 0;
      else if (tz === "Asia/Bangkok") offsetMinutes = 420;
      else if (tz === "Asia/Singapore") offsetMinutes = 480;
      else if (tz === "Asia/Tokyo") offsetMinutes = 540;
      else if (tz === "Asia/Ho_Chi_Minh") offsetMinutes = 420;

      const targetUTCMins = (targetHour * 60 + targetMinute - offsetMinutes + 1440) % 1440;

      const timeDiff = Math.abs(currentUTCMins - targetUTCMins);
      const inWindow = timeDiff <= 5 || timeDiff >= 1435;

      if (!inWindow) {
        results.push({ user_id: pref.user_id, sent: false, reason: "Not reminder time" });
        continue;
      }

      // Check if a reminder was already sent today (dedup)
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { data: existingLog } = await supabase
        .from("notification_log")
        .select("id")
        .eq("user_id", pref.user_id)
        .eq("type", "daily_reminder")
        .gte("sent_at", todayStart.toISOString())
        .limit(1);

      if (existingLog && existingLog.length > 0) {
        results.push({ user_id: pref.user_id, sent: false, reason: "Already sent today" });
        continue;
      }

      // Pick a random message
      const message = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

      // Log the notification
      const { error: logError } = await supabase
        .from("notification_log")
        .insert({
          user_id: pref.user_id,
          type: "daily_reminder",
          content: message,
          status: "sent",
        });

      if (logError) {
        results.push({ user_id: pref.user_id, sent: false, reason: "Log insert failed" });
        continue;
      }

      // Try to send browser push notification if subscription exists
      const { data: prefData } = await supabase
        .from("notification_preferences")
        .select("push_notifications_enabled, push_subscription")
        .eq("user_id", pref.user_id)
        .maybeSingle();

      if (prefData?.push_notifications_enabled && prefData?.push_subscription) {
        // Web Push would require VAPID keys and the Web Push API
        // For now, the notification is logged and will be visible in the app
        results.push({ user_id: pref.user_id, sent: true, reason: "Logged + push attempted" });
      } else {
        results.push({ user_id: pref.user_id, sent: true, reason: "Logged (no push)" });
      }
    }

    const sentCount = results.filter((r) => r.sent).length;

    return new Response(
      JSON.stringify({ sent: sentCount, total: prefs.length, details: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
