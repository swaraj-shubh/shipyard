import { AnchorProvider, Program, BN } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../idl/pohw.json";

/* 🔑 SHA-256 → 32 bytes */
async function hashTo32Bytes(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

export async function createEscrow({
  wallet,
  connection,
  rewardSOL,
  taskHash,
}) {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const provider = new AnchorProvider(connection, wallet, {
  commitment: "confirmed",
  preflightCommitment: "processed", // Allows the simulation to be more lenient
});

  const programId = new PublicKey(import.meta.env.VITE_PROGRAM_ID);
  const program = new Program(idl, programId, provider);

  const lamports = Math.round(rewardSOL * 1e9);
  /* inside createEscrow function */
const taskSeed = await hashTo32Bytes(taskHash);

// Derive PDA
const [escrowPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("escrow"), 
    taskSeed // Use the Uint8Array directly
  ],
  programId
);

const txHash = await program.methods
  .createPaidTask(
    new BN(lamports), 
    Array.from(taskSeed) // Rust expects [u8; 32] as an Array
  )
  .accounts({
    escrow: escrowPda,
    organiser: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
  console.log(txHash);
  return {
    escrowAddress: escrowPda.toBase58(),
    txHash,
  };
}
