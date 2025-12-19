'use client';

import { useState } from 'react';
import { SignIn, SignUp } from '@clerk/nextjs';

export function AuthButtons() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowSignIn(true)}
        className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Sign In
      </button>
      <button
        onClick={() => setShowSignUp(true)}
        className="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Sign Up
      </button>

      {showSignIn && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900 opacity-75" onClick={() => setShowSignIn(false)}></div>
            <div className="relative z-10">
              <SignIn routing="hash" />
            </div>
          </div>
        </div>
      )}

      {showSignUp && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900 opacity-75" onClick={() => setShowSignUp(false)}></div>
            <div className="relative z-10">
              <SignUp routing="hash" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}