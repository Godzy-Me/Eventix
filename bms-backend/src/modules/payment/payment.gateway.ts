import crypto from "crypto";
import Razorpay from "razorpay";
import createHttpError from "http-errors";
import { config, isRazorpayConfigured } from "../../config/config";

/**
 * Thin abstraction over the payment provider.
 *
 *  - "razorpay": real Razorpay (use TEST keys - free, no KYC, no real money).
 *  - "mock":     local fake gateway so the whole flow works with zero setup.
 *                Disabled in production unless ALLOW_MOCK_PAYMENTS=true.
 */

export type Provider = "razorpay" | "mock";

export interface GatewayOrder {
  id: string;
  amount: number; // paise
  currency: string;
}

let rzp: Razorpay | null = null;
const getRazorpay = () => {
  if (!rzp) {
    rzp = new Razorpay({ key_id: config.razorpayKeyId, key_secret: config.razorpayKeySecret });
  }
  return rzp;
};

export const getProvider = (): Provider => {
  if (isRazorpayConfigured()) return "razorpay";
  if (!config.isProd || process.env.ALLOW_MOCK_PAYMENTS === "true") return "mock";
  throw createHttpError(503, "Payments are not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)");
};

const hmac = (secret: string, payload: string) =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};

export const createGatewayOrder = async (
  provider: Provider,
  params: { amountPaise: number; receipt: string; notes?: Record<string, string> }
): Promise<GatewayOrder> => {
  if (provider === "razorpay") {
    const order = await getRazorpay().orders.create({
      amount: params.amountPaise,
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes,
    });
    return { id: order.id, amount: Number(order.amount), currency: order.currency };
  }
  return {
    id: `order_mock_${crypto.randomBytes(8).toString("hex")}`,
    amount: params.amountPaise,
    currency: "INR",
  };
};

/** Signature Razorpay returns to the browser: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export const signCheckout = (provider: Provider, orderId: string, paymentId: string) =>
  hmac(provider === "razorpay" ? config.razorpayKeySecret : config.hashingSecret, `${orderId}|${paymentId}`);

export const verifyCheckoutSignature = (
  provider: Provider,
  orderId: string,
  paymentId: string,
  signature: string
) => safeEqual(signCheckout(provider, orderId, paymentId), signature);

/** Razorpay webhooks are signed over the RAW request body with the webhook secret. */
export const verifyWebhookSignature = (rawBody: Buffer, signature: string) => {
  if (!config.razorpayWebhookSecret) return false;
  return safeEqual(hmac(config.razorpayWebhookSecret, rawBody.toString("utf8")), signature);
};

export const fetchPaymentMethod = async (provider: Provider, paymentId: string): Promise<string | undefined> => {
  if (provider !== "razorpay") return "mock";
  try {
    const p = await getRazorpay().payments.fetch(paymentId);
    return p.method;
  } catch {
    return undefined;
  }
};

export const refundPayment = async (
  provider: Provider,
  paymentId: string,
  amountPaise: number
): Promise<string> => {
  if (provider !== "razorpay") return `rfnd_mock_${crypto.randomBytes(6).toString("hex")}`;
  const refund = await getRazorpay().payments.refund(paymentId, { amount: amountPaise });
  return refund.id;
};
