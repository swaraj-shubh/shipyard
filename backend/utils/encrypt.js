import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const WALLET_ENCRYPTION_KEY='4zduMZzCwkP4pLZ77q2pixpWAGvht6JwoEfjPLUmKqo8VUtpKjz517Wci65w5PdXXJBE3TVzdSaDMBDG1DTTLKkv';

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