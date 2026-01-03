import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export const generateSolanaWallet = () => {
  const keypair = Keypair.generate();

  return {
    publicKey: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey), // ENCODED
  };
};

// (optional) Function to get Keypair object from encoded private key
export const getKeypairFromPrivateKey = (encodedPrivateKey) => {
  const secretKey = bs58.decode(encodedPrivateKey);
  return Keypair.fromSecretKey(secretKey);
};