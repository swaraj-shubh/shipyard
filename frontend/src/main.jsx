import { Buffer } from "buffer"; // Only once!
window.Buffer = Buffer;
globalThis.Buffer = Buffer; 

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

/* 🔗 Solana Wallet Adapter */
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

/* 🔴 REQUIRED STYLES */
import "@solana/wallet-adapter-react-ui/styles.css";

const endpoint = "https://api.devnet.solana.com";
const wallets = []; 

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>
);