import { SignedIn, SignedOut } from "@clerk/nextjs";
import { AuthButtons } from "./components/AuthButtons";
import { SignedInContent } from "./components/SignedInContent";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-4 md:py-8 flex items-start justify-center min-h-screen">
        <div className="text-center max-w-8xl w-full">
          <SignedOut>
            <h1 className="text-2xl md:text-4xl font-bold text-black mb-2 md:mb-4">
              Welcome
            </h1>
            <p className="text-sm md:text-lg text-gray-600 mb-4 md:mb-6">
              Secure authentication made simple with Clerk.
            </p>
            <AuthButtons />
          </SignedOut>

          <SignedIn>
            <SignedInContent />
          </SignedIn>
        </div>
      </main>
    </div>
  );
}
