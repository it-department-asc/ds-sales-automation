import { SignedIn, SignedOut } from "@clerk/nextjs";
import { AuthButtons } from "./components/AuthButtons";
import { SignedInContent } from "./components/SignedInContent";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8 md:py-16 flex items-start md:items-center justify-center min-h-screen">
        <div className="text-center max-w-6xl w-full">
          <SignedOut>
            <h1 className="text-4xl md:text-7xl font-bold text-black mb-4 md:mb-6">
              Welcome
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 md:mb-12">
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
