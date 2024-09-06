// import { computePoolAddress, FeeAmount, Pool, Route, SwapOptions, SwapRouter } from "@uniswap/v3-sdk";
// import { Percent, SWAP_ROUTER_02_ADDRESSES, Token } from "@uniswap/sdk-core";
// import { POOL_FACTORY_CONTRACT_ADDRESS, QUOTER_CONTRACT_ADDRESS } from "@/constants/uniswap";
// import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
// import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
// import { BigNumber, ethers } from "ethers";
// import { SwapQuoter, Trade } from "@uniswap/v3-sdk";
// import { CurrencyAmount, TradeType } from "@uniswap/sdk-core";
// import JSBI from "jsbi";

// interface ExampleConfig {
//   rpc: {
//     local: string;
//     mainnet: string;
//   };
//   tokens: {
//     in: Token;
//     amountIn: number;
//     out: Token;
//     poolFee: number;
//   };
// }

// const READABLE_FORM_LEN = 4;

// export function fromReadableAmount(amount: number, decimals: number): BigNumber {
//   return ethers.utils.parseUnits(amount.toString(), decimals);
// }

// export function toReadableAmount(rawAmount: number, decimals: number): string {
//   return ethers.utils.formatUnits(rawAmount, decimals).slice(0, READABLE_FORM_LEN);
// }

// //!uncomment this later
// // export async function getTokenTransferApproval(token: Token): Promise<TransactionState> {
// //   const provider = getProvider();
// //   const address = getWalletAddress();
// //   if (!provider || !address) {
// //     console.log("No Provider Found");
// //     return TransactionState.Failed;
// //   }

// //   try {
// //     const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);

// //     const transaction = await tokenContract.populateTransaction.approve(
// //       V3_SWAP_ROUTER_ADDRESS,
// //       fromReadableAmount(TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER, token.decimals).toString()
// //     );

// //     return sendTransaction({
// //       ...transaction,
// //       from: address,
// //     });
// //   } catch (e) {
// //     console.error(e);
// //     return TransactionState.Failed;
// //   }
// // }

// export const uniswapConfig = (tokenIn: Token, tokenOut: Token, amountIn: number) => {
//   const CurrentConfig: ExampleConfig = {
//     rpc: {
//       local: "http://localhost:8545",
//       mainnet: "https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721",
//     },
//     tokens: {
//       in: tokenIn,
//       amountIn: amountIn,
//       out: tokenOut,
//       poolFee: FeeAmount.MEDIUM,
//     },
//   };

//   return CurrentConfig;
// };

// export const poolAddress = (CurrentConfig: ExampleConfig) => {
//   const currentPoolAddress = computePoolAddress({
//     factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS, //!add uniswap pool factory address
//     tokenA: CurrentConfig.tokens.in,
//     tokenB: CurrentConfig.tokens.out,
//     fee: CurrentConfig.tokens.poolFee,
//   });

//   return currentPoolAddress;
// };

// export const getData = async (rpcUrl: string, tokenIn: Token, tokenOut: Token, amountIn: number) => {
//   const config = uniswapConfig(tokenIn, tokenOut, amountIn);

//   const currentPoolAddress = poolAddress(config);

//   const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
//   const poolContract = new ethers.Contract(currentPoolAddress, IUniswapV3PoolABI.abi, provider);

//   const [token0, token1, fee, liquidity, slot0] = await Promise.all([
//     poolContract.token0(),
//     poolContract.token1(),
//     poolContract.fee(),
//     poolContract.liquidity(),
//     poolContract.slot0(),
//   ]);

//   return [provider, token0, token1, fee, liquidity, slot0];
// };

// //! we need to use this function
// export const getQuote = async (rpcUrl: string, tokenIn: Token, tokenOut: Token, amountIn: number) => {
//   const config = uniswapConfig(tokenIn, tokenOut, amountIn);

//   const [provider, token0, token1, fee, liquidity, slot0] = await getData(rpcUrl, tokenIn, tokenOut, amountIn);

//   const quoterContract = new ethers.Contract(QUOTER_CONTRACT_ADDRESS, Quoter.abi, provider);

//   const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
//     token0,
//     token1,
//     fee,
//     fromReadableAmount(config.tokens.amountIn, config.tokens.in.decimals).toString(),
//     0
//   );
// };

// export const executeSwap = async (rpcUrl: string, tokenIn: Token, tokenOut: Token, amountIn: number, address: string) => {
//   const [provider, token0, token1, fee, liquidity, slot0] = await getData(rpcUrl, tokenIn, tokenOut, amountIn);

//   const config = uniswapConfig(tokenIn, tokenOut, amountIn);
//   const poolInfo = {
//     fee,
//     liquidity,
//     sqrtPriceX96: slot0[0],
//     tick: slot0[1],
//   };

//   const pool = new Pool(
//     config.tokens.in,
//     config.tokens.out,
//     config.tokens.poolFee,
//     poolInfo.sqrtPriceX96.toString(),
//     poolInfo.liquidity.toString(),
//     poolInfo.tick
//   );

//   const swapRoute = new Route([pool], config.tokens.in, config.tokens.out);

//   const amountOut = await getOutputQuote(swapRoute);

//   const { calldata } = await SwapQuoter.quoteCallParameters(
//     swapRoute,
//     //@ts-ignore
//     CurrencyAmount.fromRawAmount(config.tokens.in, fromReadableAmount(config.tokens.amountIn, config.tokens.in.decimals)),
//     TradeType.EXACT_INPUT,
//     {
//       useQuoterV2: true,
//     }
//   );

//   const quoteCallReturnData = await provider.call({
//     to: QUOTER_CONTRACT_ADDRESS,
//     data: calldata,
//   });

//   const d = ethers.utils.defaultAbiCoder.decode(["uint256"], quoteCallReturnData);

//   const uncheckedTrade = Trade.createUncheckedTrade({
//     route: swapRoute,
//     inputAmount: CurrencyAmount.fromRawAmount(
//       config.tokens.in,
//       //@ts-ignore
//       fromReadableAmount(config.tokens.amountIn, config.tokens.in.decimals)
//     ),
//     outputAmount: CurrencyAmount.fromRawAmount(config.tokens.out, JSBI.BigInt(amountOut)),
//     tradeType: TradeType.EXACT_INPUT,
//   });

//   const tokenApproval = await getTokenTransferApproval(config.tokens.in);

//   const options: SwapOptions = {
//     slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
//     deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
//     recipient: address,
//   };

//   const methodParameters = SwapRouter.swapCallParameters([uncheckedTrade], options);

//   const tx = {
//     data: methodParameters.calldata,
//     to: SWAP_ROUTER_02_ADDRESSES,
//     value: methodParameters.value,
//     from: address,
//     maxFeePerGas: MAX_FEE_PER_GAS,
//     maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
//   };

//   const res = await wallet.sendTransaction(tx);
// };

// //!use this file tomorrow -> https://github.com/Uniswap/examples/blob/main/v3-sdk/routing/src/libs/routing.ts#L74
