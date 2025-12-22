import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { clerkId } = await request.json();

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Clerk ID is required' },
        { status: 400 }
      );
    }

    // Delete user from Clerk
    await clerkClient.users.deleteUser(clerkId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user from Clerk:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to delete user from Clerk';
    if (error?.message) {
      errorMessage += `: ${error.message}`;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}