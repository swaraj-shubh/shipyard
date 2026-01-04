import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

/**
 * Generate a Solana wallet
 * → privateKey is BASE58 encoded
 */
export const generateSolanaWallet = () => {
  const keypair = Keypair.generate();

  return {
    publicKey: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
  };
};

/**
 * Get Keypair from private key
 * Supports:
 *  - Base58 encoded secret key
 *  - Hex encoded secret key (128 hex chars)
 */
export const getKeypairFromPrivateKey = (privateKey) => {
  if (!privateKey || typeof privateKey !== "string") {
    throw new Error("Private key must be a string");
  }

  // ✅ HEX FORMAT (64 bytes → 128 hex chars)
  if (/^[0-9a-fA-F]{128}$/.test(privateKey)) {
    const secretKey = Uint8Array.from(
      Buffer.from(privateKey, "hex")
    );
    return Keypair.fromSecretKey(secretKey);
  }

  // ✅ BASE58 FORMAT
  try {
    const secretKey = bs58.decode(privateKey);
    return Keypair.fromSecretKey(secretKey);
  } catch (err) {
    throw new Error("Invalid private key format (not hex or base58)");
  }
};
