import {
  AuthMethodScope,
  AuthMethodType,
  LitNetwork,
} from "@lit-protocol/constants";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import { ethers } from "ethers";
import bs58 from "bs58";
// @ts-expect-error
import IpfsHash from "ipfs-only-hash";
import { PKPEthersWallet } from "@lit-protocol/pkp-ethers";
import { type TelegramUser } from "./types";
import { litActionCode } from "./litAction";
import { IRelayPKP, SessionSigs } from "@lit-protocol/types";
import {
  LitAbility,
  LitActionResource,
  LitPKPResource,
} from "@lit-protocol/auth-helpers";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
export const mintPkpTg = async (telegramUser: TelegramUser) => {
  try {
    const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY!;
    const wallet = new ethers.Wallet(privateKey);
    const rpcUrl = "https://yellowstone-rpc.litprotocol.com";
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const walletWithProvider = wallet.connect(provider);
    const ethersSigner = walletWithProvider;

    const litContracts = new LitContracts({
      signer: ethersSigner,
      network: LitNetwork.DatilTest,
    });
    await litContracts.connect();

    const authMethodType = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("Lit Developer Guide Telegram Auth Example")
    );
    const authMethodId = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(`telegram:${telegramUser.id}`)
    );

    const pkpMintCost = await litContracts.pkpNftContract.read.mintCost();

    const litActionIpfsCid = await IpfsHash.of(litActionCode);

    const tx =
      await litContracts.pkpHelperContract.write.mintNextAndAddAuthMethods(
        AuthMethodType.LitAction, // keyType
        [AuthMethodType.LitAction, authMethodType], // permittedAuthMethodTypes
        [
          `0x${Buffer.from(bs58.decode(litActionIpfsCid)).toString("hex")}`,
          authMethodId,
        ], // permittedAuthMethodIds
        ["0x", "0x"], // permittedAuthMethodPubkeys
        [[AuthMethodScope.SignAnything], [AuthMethodScope.NoPermissions]], // permittedAuthMethodScopes
        true, // addPkpEthAddressAsPermittedAddress
        true, // sendPkpToItself
        { value: pkpMintCost }
      );
    const receipt = await tx.wait();

    const pkpInfo = await getPkpInfoFromMintReceipt(receipt, litContracts);

    return pkpInfo;
  } catch (error) {
    console.error(error);
  }
};

const getPkpInfoFromMintReceipt = async (
  txReceipt: ethers.ContractReceipt,
  litContractsClient: LitContracts
) => {
  const pkpMintedEvent = txReceipt!.events!.find(
    (event) =>
      event.topics[0] ===
      "0x3b2cc0657d0387a736293d66389f78e4c8025e413c7a1ee67b7707d4418c46b8"
  );

  const publicKey = "0x" + pkpMintedEvent!.data.slice(130, 260);
  const tokenId = ethers.utils.keccak256(publicKey);
  const ethAddress = await litContractsClient.pkpNftContract.read.getEthAddress(
    tokenId
  );

  return {
    tokenId: ethers.BigNumber.from(tokenId).toString(),
    publicKey,
    ethAddress,
  };
};

export const preparePKPWallet = async (
  pkp: IRelayPKP,
  sessionSigs: SessionSigs,
  rpc: string
): Promise<PKPEthersWallet> => {
  const litNodeClient = new LitNodeClient({
    litNetwork: "datil-dev",
  });
  await litNodeClient.connect();
  const pkpWallet = new PKPEthersWallet({
    litNodeClient,
    pkpPubKey: pkp.publicKey,
    rpc: rpc, // e.g. https://rpc.ankr.com/eth_goerli
    controllerSessionSigs: sessionSigs,
  });
  await pkpWallet.init();

  return pkpWallet;
};

export const getPkpSessionSigs = async (
  telegramUser: TelegramUser,
  mintedPkp: any
) => {
  let litNodeClient: LitNodeClient;

  try {
    const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY!;
    const wallet = new ethers.Wallet(privateKey);
    const rpcUrl = "https://yellowstone-rpc.litprotocol.com";
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const walletWithProvider = wallet.connect(provider);
    const ethersSigner = walletWithProvider;
    litNodeClient = new LitNodeClient({
      litNetwork: LitNetwork.DatilTest,
      debug: true,
    });
    await litNodeClient.connect();
    console.log("🔄 Connected to Lit Node Client");

    const litContracts = new LitContracts({
      signer: ethersSigner,
      network: LitNetwork.DatilTest,
      debug: false,
    });
    await litContracts.connect();

    let capacityTokenId = process.env.NEXT_PUBLIC_LIT_CAPACITY_CREDIT_TOKEN_ID!;
    if (capacityTokenId === undefined) {
      console.log("🔄 Minting Capacity Credits NFT...");
      capacityTokenId = (
        await litContracts.mintCapacityCreditsNFT({
          requestsPerKilosecond: 10,
          daysUntilUTCMidnightExpiration: 1,
        })
      ).capacityTokenIdStr;
      console.log(`✅ Minted new Capacity Credit with ID: ${capacityTokenId}`);
    } else {
      console.log(
        `ℹ️ Using provided Capacity Credit with ID: ${process.env.NEXT_PUBLIC_LIT_CAPACITY_CREDIT_TOKEN_ID}`
      );
    }

    console.log("🔄 Creating capacityDelegationAuthSig...");
    const { capacityDelegationAuthSig } =
      await litNodeClient.createCapacityDelegationAuthSig({
        dAppOwnerWallet: ethersSigner,
        capacityTokenId,
        delegateeAddresses: [mintedPkp.ethAddress],
        uses: "1",
      });
    console.log(`✅ Created the capacityDelegationAuthSig`);

    console.log(
      `🔄 Getting the Session Sigs for the PKP using Lit Action code string...`
    );
    const sessionSignatures = await litNodeClient.getPkpSessionSigs({
      pkpPublicKey: mintedPkp.publicKey,
      capabilityAuthSigs: [capacityDelegationAuthSig],
      litActionCode: Buffer.from(litActionCode).toString("base64"),
      jsParams: {
        telegramUserData: JSON.stringify(telegramUser),
        telegramBotSecret: process.env.NEXT_PUBLIC_TELEGRAM_BOT_SECRET!,
        pkpTokenId: mintedPkp.tokenId,
      },
      resourceAbilityRequests: [
        {
          resource: new LitPKPResource("*"),
          ability: LitAbility.PKPSigning,
        },
        {
          resource: new LitActionResource("*"),
          ability: LitAbility.LitActionExecution,
        },
      ],
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    });
    console.log(
      `✅ Got PKP Session Sigs: ${JSON.stringify(sessionSignatures, null, 2)}`
    );
    return sessionSignatures;
  } catch (error) {
    console.error(error);
  }
};
