"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { cookieToInitialState } from "wagmi";
import { config } from "@/config";
import AppKitProvider from "@/context";
import { LitContext } from "@/components/Context";
import { useState } from "react";
import { PKPEthersWallet } from "@lit-protocol/pkp-ethers";

const inter = Inter({ subsets: ["latin"] });

type MintedPkp = {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
};
type PkpSessionSigs = any;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = undefined;
  const [mintedPkp, setMintedPkp] = useState<MintedPkp | null>(null);
  const [pkpSessionSigs, setPkpSessionSigs] = useState<PkpSessionSigs | null>(
    null
  );
  const [pkpWallet, setPkpWallet] = useState<PKPEthersWallet>();

  const value = {
    mintedPkp,
    setMintedPkp,
    pkpSessionSigs,
    setPkpSessionSigs,
    pkpWallet,
    setPkpWallet,
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <LitContext.Provider value={value}>
          <AppKitProvider initialState={initialState}>
            <Navbar />

            <div className="px-8 py-4">{children}</div>
          </AppKitProvider>
        </LitContext.Provider>
      </body>
      <script src="https://telegram.org/js/telegram-web-app.js" async />
    </html>
  );
}
