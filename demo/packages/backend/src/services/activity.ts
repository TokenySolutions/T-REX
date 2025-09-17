import { publicClient } from '../chain/client.ts';
import { Address } from 'viem';
import { putEvent } from '../db/store.ts';

export async function backfillTransfers(assetIdentifier: string, tokenAddress: Address, fromBlockNumber?: bigint) {
  const latestBlockNumber = await publicClient.getBlockNumber();
  const startBlockNumber = fromBlockNumber ?? (latestBlockNumber > 2000n ? latestBlockNumber - 2000n : 0n);

  const transferEventDefinition = {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
  } as const;

  const transferEventLogs = await publicClient.getLogs({
    address: tokenAddress,
    fromBlock: startBlockNumber,
    toBlock: latestBlockNumber,
    events: [transferEventDefinition],
  });

  for (const eventLog of transferEventLogs) {
    putEvent.run(
      assetIdentifier,
      Number(eventLog.blockNumber!),
      eventLog.transactionHash!,
      eventLog.logIndex!,
      'Transfer',
      JSON.stringify({
        from: eventLog.args?.from,
        to: eventLog.args?.to,
        value: eventLog.args?.value?.toString(),
      }),
    );
  }
}
