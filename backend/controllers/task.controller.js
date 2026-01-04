import { pinata } from "../utils/pinata.js";
import { randomUUID } from "crypto";

/**
 * CREATE TASK → upload JSON to IPFS
 */
export const createTask = async (req, res) => {
  try {
    const task = {
      taskId: randomUUID(),
      title: req.body.title,
      description: req.body.description,
      deadline: req.body.deadline,
      fields: req.body.fields,
      createdBy: req.user.email,
      createdAt: new Date().toISOString(),
    };

    const file = new File(
      [JSON.stringify(task, null, 2)],
      "task.json",
      { type: "application/json" }
    );

    const upload = await pinata.upload.public.file(file);

    return res.status(201).json({
      success: true,
      cid: upload.cid,
      url: `https://${process.env.PINATA_GATEWAY}/ipfs/${upload.cid}`,
    });
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ error: "IPFS upload failed" });
  }
};
import express from "express";
import crypto from "crypto";

const router = express.Router();

const tasks = []; // replace with DB

router.post("/create", (req, res) => {
  const { title, reward, escrowAddress } = req.body;

  const task = {
    id: crypto.randomUUID(),
    title,
    reward,
    escrowAddress: reward > 0 ? escrowAddress : null,
    type: reward > 0 ? "PAID" : "FREE",
  };

  tasks.push(task);
  res.json(task);
});

export default router;

/**
 * GET TASK → fetch JSON from IPFS
 */
export const getTaskByCid = async (req, res) => {
  try {
    const { cid } = req.params;

    const data = await pinata.gateways.public.get(cid);
    res.json(data);
  } catch (error) {
    res.status(404).json({ error: "Task not found on IPFS" });
  }
};
