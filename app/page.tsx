import { SignedIn, SignedOut } from "@clerk/nextjs";
import { SignedInContent } from "./components/SignedInContent";
import { Upload, FileText, TrendingUp, DollarSign } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      <main className="container mx-auto px-4 py-4 md:py-6">
        <SignedOut>
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16 mt-10">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Sales Data
              <span className="block text-blue-600 mt-2">Upload Portal</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Upload sales reports and payment collection data with automatic price classification
              and payment method analysis.
            </p>
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-700 font-medium">Ready to get started? Sign in above to upload your reports</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16">
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Item Sales Report</h3>
                </div>
              </div>
              <div className="gap-3 text-gray-700 font-medium">
                <p className="text-gray-600 leading-relaxed">
                  Upload item sales data to classify products as Regular or Non-Regular pricing.
                </p>
                <div className="flex items-center mt-4 gap-2">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Automatic Regular/Non-Regular price detection</span>
                </div>
              </div>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Post Collection Report</h3>

                </div>
              </div>
              <div className="gap-3 text-gray-700 font-medium">
                <p className="text-gray-600 leading-relaxed">
                  Upload payment collection data including cash, cards, digital payments, and credit memos.
                </p>
                <div className="flex items-center mt-4 gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Payment method breakdown and collection totals</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center gap-3 text-gray-600 text-lg">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300"></div>
              Get started by signing in to upload your first report
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300"></div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <SignedInContent />
        </SignedIn>
      </main>
    </div>
  );
}