import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="flex justify-end mb-4">
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
        
        <SignedIn>
          <h1 className="text-4xl font-bold mb-4">Welcome to EvolveX Demo</h1>
          <p className="text-xl">You are signed in!</p>
        </SignedIn>
        
        <SignedOut>
          <h1 className="text-4xl font-bold mb-4">Welcome to EvolveX Demo</h1>
          <p className="text-xl">Please sign in to continue.</p>
        </SignedOut>
      </div>

      <div className="relative flex place-items-center">
        <h1 className="text-4xl font-bold">Welcome to Your App</h1>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <SignedIn>
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h2 className="mb-3 text-2xl font-semibold">
              Dashboard{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              View your dashboard and manage your account.
            </p>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h2 className="mb-3 text-2xl font-semibold">
              Sign In{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Sign in to access your account.
            </p>
            <Link href="/sign-in" className="mt-4 inline-block text-blue-500 hover:text-blue-600">
              Sign In
            </Link>
          </div>
        </SignedOut>
      </div>
    </main>
  );
}
