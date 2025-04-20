import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";
import crypto from 'crypto';

// Add runtime configuration to specify this is a Node.js runtime
export const runtime = 'nodejs';

const isDevelopment = process.env.NODE_ENV === "development";
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log configuration without exposing sensitive data
console.log("Webhook Configuration:", {
  environment: process.env.NODE_ENV,
  hasWebhookSecret: !!webhookSecret,
  hasSupabaseUrl: !!supabaseUrl,
  hasServiceRoleKey: !!supabaseServiceRoleKey,
  webhookSecretLength: webhookSecret.length,
});

// Validate environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
  if (isDevelopment) {
    throw new Error("Missing Supabase environment variables");
  } else {
    console.error("Missing Supabase environment variables");
  }
}

// Initialize Supabase client if environment variables are available
const supabase = supabaseUrl && supabaseServiceRoleKey ? 
  createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) : null;

// Test Supabase connection
async function testSupabaseConnection() {
  if (!supabase) {
    console.error("Supabase client not initialized");
    return false;
  }

  try {
    const { data, error } = await supabase.from("profiles").select("count").limit(1);
    if (error) {
      console.error("Supabase connection test failed:", error);
      return false;
    }
    console.log("Supabase connection test successful:", data);
    return true;
  } catch (error) {
    console.error("Supabase connection test error:", error);
    return false;
  }
}

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
    console.error("Supabase client not initialized");
    return { message: "Supabase client not initialized" };
  }

  console.log("Processing user event:", { eventType, userData });
  
  const { id, email_addresses, username, first_name, last_name, image_url } = userData;
  
  if (!id) {
    throw new Error("User ID is required");
  }

  const userProfile = {
    id,
    email: email_addresses?.[0]?.email_address,
    username: username || null,
    full_name: `${first_name || ""} ${last_name || ""}`.trim() || null,
    avatar_url: image_url || null,
    updated_at: new Date().toISOString(),
  };

  console.log("User profile to upsert:", userProfile);

  if (eventType === "user.deleted") {
    console.log("Deleting user profile:", id);
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting user profile:", error);
      throw error;
    }
    return { message: "User deleted successfully" };
  }

  // Handle user.created and user.updated
  console.log("Upserting user profile:", userProfile);
  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(userProfile)
      .select()
      .single();
    
    if (error) {
      console.error("Error upserting user profile:", error);
      throw error;
    }
    
    console.log("Successfully upserted user profile:", data);
    return { data, message: "User profile updated successfully" };
  } catch (error) {
    console.error("Failed to upsert user profile:", error);
    // If the error is related to UUID format, try creating a new profile
    const { data: newData, error: newError } = await supabase
      .from("profiles")
      .insert(userProfile)
      .select()
      .single();
      
    if (newError) {
      console.error("Error creating new user profile:", newError);
      throw newError;
    }
    
    console.log("Successfully created new user profile:", newData);
    return { data: newData, message: "User profile created successfully" };
  }
}

// Handle email-related events
async function handleEmailEvent(eventType: string, emailData: any) {
  if (eventType === "email.created") {
    console.log("Processing email event:", {
      id: emailData.id,
      to: emailData.to_email_address,
      subject: emailData.subject,
      status: emailData.status,
    });

    // Store email data in Supabase
    const { data, error } = await supabase.from("emails").insert({
      email_id: emailData.id,
      user_id: emailData.user_id,
      to_address: emailData.to_email_address,
      subject: emailData.subject,
      status: emailData.status,
      type: emailData.type,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing email data:", error);
      throw error;
    }

    console.log("Successfully stored email data:", data);
  }
}

export async function POST(req: NextRequest) {
  console.log("Received webhook request");
  
  // Test Supabase connection on each webhook request
  const isConnected = await testSupabaseConnection();
  console.log("Supabase connection status:", isConnected);

  try {
    // Verify webhook signature (bypassed in development)
    const { payload, isValid } = await verifyWebhookSignature(req);
    console.log("Webhook signature verification:", { isValid });
    
    if (!isValid && !isDevelopment) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { success: false, message: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const eventType = payload.type;
    const eventData = payload.data;
    console.log("Processing event:", { eventType, eventData });

    // Handle supported events
    if (eventType.startsWith("user.")) {
      const result = await handleUserEvent(eventType, eventData);
      console.log("User event processed successfully:", result);
      return NextResponse.json({ success: true, ...result });
    } else if (eventType.startsWith("email.")) {
      await handleEmailEvent(eventType, eventData);
      return NextResponse.json({ success: true, message: "Email event processed" });
    }

    // Skip unsupported events
    console.log("Skipping unsupported event type:", eventType);
    return NextResponse.json(
      { success: true, message: "Event type not handled" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        } : error
      },
      { status: 500 }
    );
  }
} 