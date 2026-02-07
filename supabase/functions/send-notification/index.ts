import { createClient } from "jsr:@supabase/supabase-js@2";

console.log("Hello from send-notification!");

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Pop a batch of messages
    // Batch size 100 matches Expo's limit
    const { data: messages, error: popError } = await supabase.rpc(
      "pop_notifications_batch",
      { batch_size: 100 },
    );

    if (popError) {
      console.error("Error popping messages:", popError);
      throw popError;
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ message: "No messages in queue" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${messages.length} messages...`);

    // 2. Prepare Expo format
    const expoMessages = messages.map((m: any) => m.message);
    const msgIds = messages.map((m: any) => m.msg_id);

    // 3. Send to Expo
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expoMessages),
    });

    const result = await response.json();
    console.log("Expo Response:", JSON.stringify(result));

    // 4. Handle Cleanup
    // For now, we delete all processed messages (success or fail).
    // In a real prod environment, we should check `result.data.status` for each ticket
    // and handle `DeviceNotRegistered` error tickets to clean up tokens DB.

    // We can iterate through tickets if we want to remove invalid tokens
    // But simplest v1 is just delete from queue so we don't loop forever.

    if (messages.length > 0) {
      const { error: deleteError } = await supabase.rpc(
        "delete_notifications_batch",
        {
          msg_ids: msgIds,
        },
      );
      if (deleteError) {
        console.error("Error deleting messages:", deleteError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: messages.length,
        expo_data: result.data,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
