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

import { type TelegramUser } from "./types";
import { litActionCode } from "./litAction";

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
