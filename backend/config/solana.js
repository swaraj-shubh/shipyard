import * as anchor from "@project-serum/anchor";
import { Connection } from "@solana/web3.js";

export const connection = new Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

export const getAnchorProvider = (keypair) => {
  const wallet = {
    publicKey: keypair.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(keypair);
      return tx;
    },
    signAllTransactions: async (txs) => {
      txs.forEach(tx => tx.partialSign(keypair));
      return txs;
    },
  };

  return new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
};