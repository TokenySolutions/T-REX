import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db, getUser, putUser, listAssetsByOwner, getCfg } from '../db/store.ts';
import { publicClient } from '../chain/client.ts';
import { loadArtifact } from '../chain/artifacts.ts';
import { BigNumber } from 'bignumber.js';

const cache = new Map<string, { value: any; expiration: number }>();

const getCachedValue = (cacheKey: string) => {
  const cacheEntry = cache.get(cacheKey);
  return cacheEntry && cacheEntry.expiration > Date.now() ? cacheEntry.value : undefined;
};

const setCachedValue = (cacheKey: string, value: any, timeToLiveMilliseconds = 15000) =>
  cache.set(cacheKey, { value, expiration: Date.now() + timeToLiveMilliseconds });

export default async function users(fastifyApp: FastifyInstance) {
  fastifyApp.get('/v1/users/:address', async (request, reply) => {
    const { address } = z.object({ address: z.string() }).parse(request.params);
    let userRow: any = getUser.get(address);
    if (!userRow) {
      putUser.run(address, null, Date.now());
      userRow = getUser.get(address);
    }

    const identityRegistryAddress = getCfg('identityRegistryProxy');
    if (!identityRegistryAddress) {
      return reply.code(424).send({ error: 'identityRegistryProxy not configured' });
    }

    const identityRegistryAbi = loadArtifact('IdentityRegistry').abi;
    const verificationCacheKey = `isVerified:${identityRegistryAddress}:${address}`;
    let isVerified = getCachedValue(verificationCacheKey);

    if (isVerified === undefined) {
      isVerified = (await publicClient.readContract({
        address: identityRegistryAddress as `0x${string}`,
        abi: identityRegistryAbi,
        functionName: 'isVerified',
        args: [address as `0x${string}`],
      })) as boolean;
      setCachedValue(verificationCacheKey, isVerified);
    }

    const userAssets = listAssetsByOwner.all(address) as Array<{
      id: string;
      token: string;
      name: string;
      symbol: string;
      supply: number;
    }>;

    const tokenAbi = loadArtifact('Token').abi;
    const enrichedAssets = await Promise.all(
      userAssets.map(async (asset) => {
        const [totalSupply, isPaused, balance, decimals] = await Promise.all([
          publicClient.readContract({
            address: asset.token as `0x${string}`,
            abi: tokenAbi,
            functionName: 'totalSupply',
            args: [],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: asset.token as `0x${string}`,
            abi: tokenAbi,
            functionName: 'paused',
            args: [],
          }) as Promise<boolean>,
          publicClient.readContract({
            address: asset.token as `0x${string}`,
            abi: tokenAbi,
            functionName: 'balanceOf',
            args: [address],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: asset.token as `0x${string}`,
            abi: tokenAbi,
            functionName: 'decimals',
            args: [],
          }) as Promise<bigint>,
        ]);
        return {
          ...asset,
          totalSupply: totalSupply.toString(),
          balance: new BigNumber(balance).dividedBy(new BigNumber(10).pow(new BigNumber(decimals))).toFixed(8),
          paused: isPaused,
        };
      }),
    );

    return reply.send({
      address,
      identity: {
        verified: isVerified,
        identityAddress: userRow.identityAddress ?? null,
      },
      assets: enrichedAssets,
    });
  });
}
