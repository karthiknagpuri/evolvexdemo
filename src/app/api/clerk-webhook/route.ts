import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";
import crypto from 'crypto';
import { headers } from "next/headers";
import { WebhookEvent, UserJSON } from "@clerk/nextjs/server";

// Add runtime configuration to specify this is a Node.js runtime
export const runtime = 'nodejs';

// Add dynamic configuration to prevent static optimization
export const dynamic = 'force-dynamic';

const isDevelopment = process.env.NODE_ENV === "development";

// Initialize Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

try {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase environment variables");
  } else {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      }
    );
    console.log("Supabase client initialized successfully");
  }
} catch (error) {
  console.error("Failed to initialize Supabase client:", error);
}

// Test Supabase connection
if (supabase) {
  const testConnection = async () => {
    try {
      await supabase?.from('profiles').select('count').single();
      console.log('Supabase connection test successful');
    } catch (error) {
      console.error('Supabase connection test failed:', error);
    }
  };
  void testConnection();
}

// Get webhook secret from environment variable
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || 'whsec_test';

// Log configuration without exposing sensitive data
console.log("Webhook Configuration:", {
  environment: process.env.NODE_ENV,
  hasWebhookSecret: !!webhookSecret,
  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  webhookSecretLength: webhookSecret.length,
  vercelUrl: process.env.VERCEL_URL
});

// Verify webhook signature
const verifyWebhookSignature = async (req: NextRequest) => {
  const payloadString = await req.text();
  const payload = JSON.parse(payloadString);
  
  // In development, bypass signature verification
  if (isDevelopment) {
    console.log("Development mode: Bypassing webhook signature verification");
    return { payload, isValid: true };
  }
  
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  
  try {
    const wh = new Webhook(webhookSecret);
    const isValid = await wh.verify(payloadString, svixHeaders);
    return { payload, isValid };
  } catch (error) {
    console.error("Webhook verification error:", error);
    return { payload, isValid: false };
  }
};

// Function to generate a deterministic UUID from Clerk's user ID
function generateDeterministicUUID(clerkUserId: string): string {
  // Create a namespace UUID (version 5)
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // A fixed UUID namespace
  
  // Create a SHA-1 hash of the namespace UUID and the Clerk user ID
  const hash = crypto.createHash('sha1')
    .update(Buffer.from(namespace.replace(/-/g, ''), 'hex'))
    .update(clerkUserId)
    .digest();

  // Set version (4) and variant bits
  hash[6] = (hash[6] & 0x0f) | 0x40;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  // Convert to UUID string format
  const parts = hash.toString('hex').match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
  if (!parts) {
    throw new Error("Failed to generate UUID");
  }
  return parts.slice(1).join('-');
}

// Handle user events
async function handleUserEvent(eventType: string, userData: any) {
  if (!supabase) {
    return { message: "Supabase client not initialized" };
  }

  const { id, email_addresses, first_name, last_name } = userData;
  
  if (!id) {
    return { message: "User ID is required" };
  }

  try {
    if (eventType === "user.deleted") {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("clerk_id", id);

      if (error) {
        console.error("Error deleting user profile:", error);
        return { message: "Failed to delete user profile", error };
      }
      return { message: "User deleted successfully" };
    }

    // For user.created and user.updated events
    const userProfile = {
      clerk_id: id,
      email: email_addresses?.[0]?.email_address,
      first_name: first_name || "",
      last_name: last_name || "",
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(userProfile)
      .select()
      .single();

    if (error) {
      console.error("Error upserting user profile:", error);
      return { message: "Failed to upsert user profile", error };
    }
      
    console.log("Successfully upserted user profile:", data);
    return { data, message: "User profile updated successfully" };
  } catch (error) {
    console.error("Failed to upsert user profile:", error);
    return { message: "Internal server error", error };
  }
}

// Handle email-related events
async function handleEmailEvent(eventType: string, emailData: any) {
  if (!supabase) {
    return { message: "Supabase client not initialized" };
  }

  try {
    // Store email data in Supabase
    const { data, error } = await supabase.from("emails").insert({
      email_id: emailData.id,
      user_id: emailData.user_id,
      to_address: emailData.to_email_address,
      created_at: new Date(emailData.created_at * 1000).toISOString()
    });

    if (error) {
      console.error("Error storing email data:", error);
      return { message: "Failed to store email data", error };
    }

    console.log("Successfully stored email data:", data);
    return { data, message: "Email data stored successfully" };
  } catch (error) {
    console.error("Error in handleEmailEvent:", error);
    return { message: "Internal server error", error };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error occurred -- no svix headers", {
        status: 400
      });
    }

    // Get the body
    const payload = await req.json();
    console.log("📦 Webhook payload:", payload);

    // Create a new Svix instance with your secret
    const wh = new Webhook(webhookSecret);

    // Verify the payload with the headers
    let evt: WebhookEvent;
    try {
      evt = wh.verify(JSON.stringify(payload), {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occurred", {
        status: 400
      });
    }

    // Check if Supabase is initialized
    if (!supabase) {
      console.error("Supabase client not initialized");
      return NextResponse.json(
        { success: false, message: "Database service unavailable" },
        { status: 500 }
      );
    }

    // Handle the webhook
    const eventType = evt.type;
    console.log(`Processing webhook event: ${eventType}`);

    if (eventType.startsWith("user.")) {
      const userData = evt.data as UserJSON;
      console.log("👤 User data:", userData);

      try {
        // Safely extract email address
        let emailAddress = null;
        if (userData.email_addresses && Array.isArray(userData.email_addresses) && userData.email_addresses.length > 0) {
          const primaryEmail = userData.email_addresses[0];
          if (primaryEmail && typeof primaryEmail === 'object' && 'email_address' in primaryEmail) {
            emailAddress = primaryEmail.email_address;
          }
        }

        const { data, error } = await supabase
          .from("profiles")
          .upsert({
            clerk_id: userData.id,
            email: emailAddress,
            first_name: userData.first_name ?? "",
            last_name: userData.last_name ?? "",
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error("🧨 Supabase error:", error);
          return NextResponse.json(
            { success: false, message: error.message },
            { status: 200 }
          );
        }

        console.log("✅ Successfully updated user profile:", data);
        return NextResponse.json({ success: true });
      } catch (err) {
        console.error("💥 Internal error:", err);
        return NextResponse.json(
          { success: false, message: "Internal server error" },
          { status: 200 }
        );
      }
    } else if (eventType.startsWith("email.")) {
      const result = await handleEmailEvent(eventType, evt.data);
      if (!result) {
        return NextResponse.json(
          { success: false, message: "Failed to process email event" },
          { status: 500 }
        );
      }
      if (result.message === "Supabase client not initialized") {
        return NextResponse.json(
          { success: false, message: "Database service unavailable" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ success: true });
    }
  } catch (err) {
    console.error("💥 Unhandled error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 200 }
    );
  }
} 