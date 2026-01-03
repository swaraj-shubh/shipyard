import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const WALLET_ENCRYPTION_KEY='f8d888698ceda22cec37338b9032c57d23664fb5d93e29022695e3f5a57e8cc7';

// if (!process.env.WALLET_ENCRYPTION_KEY) {
//   throw new Error("❌ WALLET_ENCRYPTION_KEY is missing in .env");
// }

const KEY = Buffer.from(WALLET_ENCRYPTION_KEY, "hex");
export const encrypt = (text) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${tag}:${encrypted}`;
};


// (optional) Decrypt function to decrypt data
export const decrypt = (data) => {
  const [ivHex, tagHex, encrypted] = data.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};