import React from 'react';
import { Clock, UserCheck, Building, Mail } from 'lucide-react';

export function WaitingForBranch() {
  return (
    <div className="flex items-center justify-center">
      <div className="max-w-6xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12 text-center mb-8">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Account Setup in Progress
            </h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Your account is being configured by our team. You'll be assigned to your branch shortly.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex flex-col md:flex-row justify-center items-center md:space-x-4 space-y-4 md:space-y-0 mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Account Created</span>
            </div>
            <div className="w-0.5 h-8 md:w-8 md:h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
              </div>
              <div className="ml-3">
                <span className="text-sm font-bold text-blue-700">Branch Assignment</span>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 mt-1">
                  <span className="text-xs font-semibold text-blue-800">In Progress</span>
                </div>
              </div>
            </div>
            <div className="w-0.5 h-8 md:w-8 md:h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">Ready to Use</span>
            </div>
          </div>

          {/* Highlight Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-8 mx-auto max-w-md">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-4 h-4 text-white animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">Just Wait - Nothing Else Needed</h3>
              <p className="text-sm text-blue-800">
                Your account setup is being handled automatically. No action required on your part.
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What Happens Next?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              An administrator will assign you to your specific store location and branch. This ensures you have access to the right data and tools.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              If you haven't received access within 24 hours or believe there's an error, contact your system administrator.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Thank you for your patience. We're setting up your account for optimal performance.
          </p>
        </div>
      </div>
    </div>
  );
}