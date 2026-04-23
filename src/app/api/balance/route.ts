import { createPublicClient, http, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';
import { NextResponse } from 'next/server';

const WALLET = '0x5104E0Cc9E1c5A70ac23C13Ded8D8c73baFae022';
const USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_DECIMALS = 6;

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export async function GET() {
  try {
    const raw = await client.readContract({
      address: USDC_CONTRACT as `0x${string}`,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [WALLET as `0x${string}`],
    });
    const balance = (Number(raw) / 10 ** USDC_DECIMALS).toFixed(2);
    return NextResponse.json({ balance, wallet: WALLET });
  } catch (e: any) {
    return NextResponse.json({ balance: '—', wallet: WALLET, error: e.message }, { status: 500 });
  }
}
