import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";

import { cookieStorage, createStorage } from "wagmi";
import { base, arbitrum, optimism } from "wagmi/chains";

export const projectId = "775bf23dd2eef8e07a82a6f747133435";

if (!projectId) throw new Error("Project ID is not defined");

const metadata = {
  name: "Spreadefi",
  description: "Omnichain lending and borrowing platform",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Create wagmiConfig
const chains = [base, arbitrum, optimism] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
