// Script to manually set up admin user in Convex
// Run this with: node setup-admin.js

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210");

async function setupAdminUser() {
  try {
    console.log("Setting up admin user...");

    const clerkId = "user_372adEWROdQuJunogShuMiKs6ka"; // Replace with your actual Clerk user ID
    const email = "itdepartment@albertogroup.com.ph"; // Replace with your actual email
    const firstName = "ALBERTO IT ADMIN"; // Replace with your actual name

    console.log(`Creating admin user for Clerk ID: ${clerkId}`);

    const userId = await convex.mutation(api.users.setupAdminUser, {
      clerkId: clerkId,
      email: email,
      firstName: firstName,
    });

    console.log("✅ Admin user created/updated with ID:", userId);

    // Verify the user was created
    const users = await convex.query(api.users.getAllUsers);
    console.log("📊 All users in database:", users);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Instructions for the user
console.log(`
🚀 SETUP INSTRUCTIONS:

1. Find your Clerk User ID:
   - Go to https://dashboard.clerk.com/
   - Go to Users tab
   - Click on your user
   - Copy the "ID" field (starts with "user_")

2. Update this script with your details:
   - Replace "user_2abcdefghijklmnop" with your actual Clerk ID
   - Replace "your-email@example.com" with your email
   - Replace "Your Name" with your name

3. Run this script: node setup-admin.js

4. Check your Convex dashboard - you should see the user data!
`);

// Uncomment the line below to run the setup (after updating the details)
setupAdminUser();