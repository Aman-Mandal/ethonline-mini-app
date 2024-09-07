"use client";

import React, { useCallback, useEffect, useState } from "react";
import TelegramLoginButton from "./TelegramLoginButton";
import { type TelegramUser } from "../../helpers/types";
import {
  getPkpSessionSigs,
  mintPkpTg,
  preparePKPWallet,
} from "../../helpers/lit";
import { useLitContext } from "./Context";

type MintedPkp = {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
};
type PkpSessionSigs = any;

const Navbar = () => {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const {
    mintedPkp,
    setMintedPkp,
    pkpSessionSigs,
    setPkpSessionSigs,
    pkpWallet,
    setPkpWallet,
  } = useLitContext();

  const [validationError, setValidationError] = useState<string | null>(null);

  const verifyTelegramUser = useCallback(
    async (
      user: TelegramUser
    ): Promise<{ isValid: boolean; isRecent: boolean }> => {
      console.log("🔄 Validating user Telegram info client side...");
      const { hash, ...otherData } = user;

      const dataCheckString = Object.entries(otherData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

      const encoder = new TextEncoder();
      const secretKeyHash = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(process.env.NEXT_PUBLIC_TELEGRAM_BOT_SECRET!)
      );
      const key = await crypto.subtle.importKey(
        "raw",
        secretKeyHash,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(dataCheckString)
      );

      const calculatedHash = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const isValid = calculatedHash === user.hash;
      const isRecent = Date.now() / 1000 - user.auth_date < 600;

      console.log(
        `ℹ️ User Telegram data is valid: ${isValid}. User data is recent: ${isRecent}`
      );

      return { isValid, isRecent };
    },
    [process.env.NEXT_PUBLIC_TELEGRAM_BOT_SECRET]
  );

  const handleTelegramResponse = useCallback(
    async (user: TelegramUser) => {
      console.log("Telegram auth response received:", user);
      if (user && typeof user === "object") {
        setTelegramUser(user);

        const { isValid, isRecent } = await verifyTelegramUser(user);
        if (!isValid || !isRecent) {
          setValidationError(
            !isValid
              ? "Failed to validate Telegram user info. Please try again."
              : "Authentication has expired. Please log in again."
          );
        } else {
          setValidationError(null);
        }
      } else {
        console.error("Invalid user data received:", user);
        setValidationError("Invalid user data received. Please try again.");
      }
    },
    [verifyTelegramUser]
  );

  const handleMintPkp = useCallback(async () => {
    if (telegramUser) {
      try {
        const minted = await mintPkpTg(telegramUser);
        if (minted) {
          localStorage.setItem("mintedPkp", JSON.stringify(minted));
        }
        setMintedPkp(minted!);
      } catch (error) {
        console.error("Failed to mint PKP:", error);
        setValidationError("Failed to mint PKP. Please try again.");
      }
    }
  }, [telegramUser, setMintedPkp, setValidationError]);

  useEffect(() => {
    if (telegramUser) {
      const mintedPkp = localStorage.getItem("mintedPkp");
      console.log("🔄 Checking for minted PKP in localStorage:", mintedPkp);
      if (mintedPkp) {
        setMintedPkp(JSON.parse(mintedPkp));
      } else {
        const attemptMint = async (retries = 3) => {
          try {
            await handleMintPkp();
          } catch (error) {
            console.error(
              `Minting attempt failed (${retries} retries left):`,
              error
            );
            if (retries > 0) {
              console.log("Retrying mint...");
              await attemptMint(retries - 1);
            } else {
              console.error("All minting attempts failed");
              setValidationError(
                "Failed to mint PKP after multiple attempts. Please try again later."
              );
            }
          }
        };
        attemptMint();
      }
    }
  }, [telegramUser, handleMintPkp]);

  const createWallet = useCallback(async () => {
    if (mintedPkp && pkpSessionSigs) {
      const wallet = await preparePKPWallet(
        mintedPkp,
        pkpSessionSigs,
        "https://rpc.ankr.com/eth_goerli"
      );
      setPkpWallet(wallet);
    }
  }, [mintedPkp, pkpSessionSigs, setPkpWallet]);

  useEffect(() => {
    if (pkpSessionSigs && mintedPkp) {
      createWallet();
    }
  }, [pkpSessionSigs, mintedPkp, createWallet]);

  const handleGetPkpSessionSigs = useCallback(async () => {
    if (telegramUser && mintedPkp) {
      const attemptGetSessionSigs = async (retries = 3) => {
        try {
          console.log("🔄 Getting PKP session signatures...");
          const sessionSigs = await getPkpSessionSigs(telegramUser, mintedPkp);
          setPkpSessionSigs(sessionSigs);
        } catch (error) {
          console.error(
            `Failed to get PKP session signatures (${retries} retries left):`,
            error
          );
          if (retries > 0) {
            console.log("Retrying to get PKP session signatures...");
            await attemptGetSessionSigs(retries - 1);
          } else {
            console.error("All attempts to get PKP session signatures failed");
            setValidationError(
              "Failed to get PKP session signatures after multiple attempts. Please try again later."
            );
          }
        }
      };
      attemptGetSessionSigs();
    }
  }, [telegramUser, mintedPkp, setPkpSessionSigs, setValidationError]);

  useEffect(() => {
    if (telegramUser && mintedPkp) {
      handleGetPkpSessionSigs();
    }
  }, [telegramUser, mintedPkp, handleGetPkpSessionSigs]);

  return (
    <nav className="w-full py-2 flex px-10 justify-between items-center border-b-[0.5px] border-gray-500">
      <p>TM</p>
      {/* <button className="text-[#8b4fe6] bg-white py-2 px-6 rounded-md text-sm">
        Connect
      </button> */}
      <div className="card">
        {!telegramUser ? (
          <TelegramLoginButton
            botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME!}
            dataOnauth={handleTelegramResponse}
            buttonSize="large"
          />
        ) : (
          <div className="bg-blue-400 text-white px-6 py-2 rounded-full">
            <p>Welcome {telegramUser.first_name}</p>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
