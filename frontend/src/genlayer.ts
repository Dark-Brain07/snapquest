import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { CONTRACT_ADDRESS } from "./App";

let _readClient: any;
function readClient() {
  if (!_readClient) {
    _readClient = createClient({
      chain: testnetBradbury,
      account: createAccount(generatePrivateKey()), // ephemeral read-only account
    });
  }
  return _readClient;
}

export async function readContract(functionName: string, args: any[] = []) {
  try {
    return await readClient().readContract({
      address: CONTRACT_ADDRESS,
      functionName,
      args,
    });
  } catch (error) {
    console.error("Read Contract Error:", error);
    throw error;
  }
}

// Write client from an injected EIP-1193 provider (RainbowKit / MetaMask)
export function makeWalletClient(provider: any, address: `0x${string}`) {
  return createClient({ chain: testnetBradbury, account: address, provider });
}

export async function writeContract(client: any, functionName: string, args: any[] = [], value: bigint = 0n) {
  try {
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName,
      args,
      value,
    });
    return hash;
  } catch (error) {
    console.error("Write Contract Error:", error);
    throw error;
  }
}
