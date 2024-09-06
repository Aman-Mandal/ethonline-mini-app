import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LitNetwork, LIT_RPC } from "@lit-protocol/constants";
import * as ethers from "ethers";
import { LitAbility, LitActionResource, createSiweMessage, generateAuthSig } from "@lit-protocol/auth-helpers";

export async function litNode() {
  const litNodeClient = new LitNodeClient({
    litNetwork: LitNetwork.DatilDev,
    debug: false,
  });
  await litNodeClient.connect();

  const ethersWallet = new ethers.Wallet(
    process.env.ETHEREUM_PRIVATE_KEY as string, //! Replace with your private key or user's EOA
    new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
  );

  return { litNodeClient, ethersWallet };
}

export async function generateLitSignatures() {
  const { litNodeClient, ethersWallet } = await litNode();

  const sessionSignatures = await litNodeClient.getSessionSigs({
    chain: "ethereum", //!change the chain later
    expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    resourceAbilityRequests: [
      {
        resource: new LitActionResource("*"),
        ability: LitAbility.LitActionExecution,
      },
    ],
    authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
      const toSign = await createSiweMessage({
        uri,
        expiration,
        resources: resourceAbilityRequests,
        walletAddress: await ethersWallet.getAddress(),
        nonce: await litNodeClient.getLatestBlockhash(),
        litNodeClient,
      });

      return await generateAuthSig({
        signer: ethersWallet,
        toSign,
      });
    },
  });

  return { sessionSignatures };
}

export async function execute(code: string) {
  const { litNodeClient } = await litNode();
  const { sessionSignatures } = await generateLitSignatures();

  const response = await litNodeClient.executeJs({
    sessionSigs: sessionSignatures,
    code: "litActionCode",
    // jsParams: {
    //   magicNumber: 43,
    // },
  });
}
