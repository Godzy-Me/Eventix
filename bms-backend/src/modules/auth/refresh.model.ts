import mongoose, { Schema } from "mongoose";
import { IRefreshTokenPayload } from "./auth.interface";

const refreshTokenSchema = new mongoose.Schema<IRefreshTokenPayload>({
    token: { type: String, required: true },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

// Housekeeping: Mongo removes refresh tokens automatically once they are older than their max lifetime
refreshTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const RefreshTokenModel = mongoose.model<IRefreshTokenPayload>(
    "RefreshToken",
    refreshTokenSchema
);