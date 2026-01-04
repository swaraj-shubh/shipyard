// src/solana/releasePayment.js
import { AnchorProvider, Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl/pohw.json";

export async function releasePayment({
  wallet,
  connection,
  escrowAddress,
  recipient,
}) {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const provider = new AnchorProvider(connection, wallet, {
  commitment: "confirmed",
  preflightCommitment: "processed",
});

  const programId = new PublicKey(import.meta.env.VITE_PROGRAM_ID);
  const program = new Program(idl, programId, provider);

  const escrowPubkey = new PublicKey(escrowAddress);
  const recipientPubkey = new PublicKey(recipient);

  const tx = await program.methods
  .release()
  .accounts({
    escrow: escrowPubkey,
    recipient: recipientPubkey,
  })
  .rpc();

  console.log("✅ Release transaction:", tx);
  return tx;
}
