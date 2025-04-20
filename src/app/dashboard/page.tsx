"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    // In a real app, you would fetch the user's data from your API
    // For now, we'll just use a placeholder
    setUserEmail("demo@example.com");
  }, []);

  const handleSignOut = () => {
    // Remove the auth cookie
    Cookies.remove("auth_token");
    
    // Redirect to the home page
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Community Directory
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSignOut}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 rounded-md bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-medium">Demo Mode:</p>
            <p>This is a demo application without a real backend. Authentication is simulated using cookies.</p>
            <p>For a real application, you would connect this to a backend service like Supabase Auth.</p>
          </div>
          
          <h1 className="mb-8 text-4xl font-bold">Dashboard</h1>
          
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">Welcome, {userEmail}</h2>
            <p className="mb-4">You are now signed in to the Community Directory.</p>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                <h3 className="mb-2 text-lg font-medium">Your Profile</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  View and edit your profile information.
                </p>
                <Link
                  href="/profile"
                  className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  View Profile
                </Link>
              </div>
              
              <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                <h3 className="mb-2 text-lg font-medium">Community Directory</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Browse the community directory.
                </p>
                <Link
                  href="/directory"
                  className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Browse Directory
                </Link>
              </div>
              
              <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                <h3 className="mb-2 text-lg font-medium">Settings</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Manage your account settings.
                </p>
                <Link
                  href="/settings"
                  className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 