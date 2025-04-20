import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white shadow-xl",
            formButtonPrimary: "bg-blue-500 hover:bg-blue-600",
            footerActionLink: "text-blue-500 hover:text-blue-600",
          },
        }}
        afterSignInUrl="/"
        signUpUrl="/sign-up"
        redirectUrl="/"
        routing="path"
        path="/sign-in"
      />
    </div>
  );
} 