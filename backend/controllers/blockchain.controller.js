import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getKeypairFromPrivateKey } from "../utils/solanaWallet.js";
import { getAnchorProvider } from "../config/solana.js";

// ✅ Proper __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Correct relative path to IDL
const idlPath = path.join(__dirname, "../idl/pohw.json");

const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

// ================= PROGRAM ID =================
const PROGRAM_ID = new PublicKey(
  "GD3rPe9P8NfsJZ1m4dcsqTBJpodc956hB4AJydjvakdA"
);

// ================= CREATE TASK =================
export const createTask = async (req, res) => {
  try {
    const { cid } = req.body;
    if (!cid) return res.status(400).json({ error: "CID required" });

    // ⚠️ TEMP: Admin key from env
    const adminKeypair = getKeypairFromPrivateKey(
        process.env.ADMIN_PRIVATE_KEY
    );

    const provider = getAnchorProvider(adminKeypair);
    anchor.setProvider(provider);

    const program = new anchor.Program(idl, PROGRAM_ID, provider);
    const taskKeypair = Keypair.generate();

    const tx = await program.methods
      .createTask(cid)
      .accounts({
        task: taskKeypair.publicKey,
        creator: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([taskKeypair])
      .rpc();

    res.json({
      success: true,
      tx,
      taskAddress: taskKeypair.publicKey.toBase58(),
    });
  } catch (err) {
    console.error("createTask error:", err);
    res.status(500).json({ error: err.message });
  }
};


// ================= SUBMIT PROOF =================
export const submitProof = async (req, res) => {
  try {
    const { taskAddress } = req.body;
    if (!taskAddress)
      return res.status(400).json({ error: "taskAddress required" });

    const userKeypair = getKeypairFromPrivateKey(req.user.privateKey);

    const provider = getAnchorProvider(userKeypair);
    anchor.setProvider(provider);

    const program = new anchor.Program(idl, PROGRAM_ID, provider);

    // PDA for HumanProfile
    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), userKeypair.publicKey.toBuffer()],
      PROGRAM_ID
    );

    const tx = await program.methods
      .submitProof()
      .accounts({
        task: new PublicKey(taskAddress),
        profile: profilePda,
        worker: userKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    res.json({
      success: true,
      tx,
      profile: profilePda.toBase58(),
    });
  } catch (err) {
    console.error("submitProof error:", err);
    res.status(500).json({ error: err.message });
  }
};