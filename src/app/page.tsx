import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col gap-4">
      <div className="flex gap-4 pt-10">
        <input className="w-full text-black outline-none border-none p-2 rounded-md flex-[0.8]" />
        <button className="flex items-center flex-[0.2] justify-center py-2 rounded-md text-center bg-[#8b4fe6] text-white rouned-md">
          Create +
        </button>
      </div>
      <div className="flex items-center gap-4 w-full">
        <div className="bg-[#111111] p-8 rounded-md text-white w-[50%]">
          <Image src="/svg1.svg" alt="" height={40} width={40} className="mb-2" />
          <p className="text-xl font-semibold mb-2">Bridge</p>
          <p className="text-xs text-[#979797]">
            Bridge 20 USDT from Linea to Scroll using our smart intent based mini app for smoother and secure briding experience
          </p>
        </div>

        <div className="bg-[#111111] p-8 rounded-md text-white w-[50%]">
          <Image src="/svg2.svg" alt="" height={40} width={40} className="mb-2" />
          <p className="text-xl font-semibold mb-2">Swap</p>
          <p className="text-xs text-[#979797]">
            Swap 10 USDC with 10 DAI on Hedera chain using our decentralized exchange for fast and secure transactions
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full">
        <div className="bg-[#111111] p-8 rounded-md text-white w-[50%]">
          <Image src="/svg1.svg" alt="" height={40} width={40} className="mb-2" />
          <p className="text-xl font-semibold mb-2">Stake</p>
          <p className="text-xs text-[#979797]">
            Stake tokens crosschain using Chainlink&apos;s CCIP and improve your experience of smart staking with our telegram mini app
          </p>
        </div>

        <div className="bg-[#111111] p-8 rounded-md text-white w-[50%]">
          <Image src="/svg2.svg" alt="" height={40} width={40} className="mb-2" />
          <p className="text-xl font-semibold mb-2">Add liquidity</p>
          <p className="text-xs text-[#979797]">
            Stake tokens crosschain using Chainlink&apos;s CCIP and improve your experience of smart staking with our telegram mini app
          </p>
        </div>
      </div>
    </main>
  );
}
