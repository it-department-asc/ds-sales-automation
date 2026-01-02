// Script to manually set up admin user in Convex
// Run this with: node setup-admin.js

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210");

async function setupAdminUser() {
  try {

    const clerkId = "user_372adEWROdQuJunogShuMiKs6ka"; // Replace with your actual Clerk user ID
    const email = "itdepartment@albertogroup.com.ph"; // Replace with your actual email
    const firstName = "ALBERTO IT ADMIN"; // Replace with your actual name


    const userId = await convex.mutation(api.users.setupAdminUser, {
      clerkId: clerkId,
      email: email,
      firstName: firstName,
    });


    // Verify the user was created
    const users = await convex.query(api.users.getAllUsers);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}


// Uncomment the line below to run the setup (after updating the details)
setupAdminUser();