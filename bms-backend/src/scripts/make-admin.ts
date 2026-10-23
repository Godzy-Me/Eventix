// Usage: npm run make-admin -- someone@example.com
import mongoose from "mongoose";
import { config } from "../config/config";
import { UserModel } from "../modules/user/user.model";

const email = process.argv[2]?.trim().toLowerCase();

(async () => {
  if (!email) {
    console.error("Usage: npm run make-admin -- <email>");
    process.exit(1);
  }
  await mongoose.connect(config.databaseUrl as string);
  const res = await UserModel.updateOne({ email }, { $set: { role: "admin" } });
  console.log(res.matchedCount ? `✅ ${email} is now an admin` : `❌ No user with email ${email} (sign in once first)`);
  await mongoose.disconnect();
})();
