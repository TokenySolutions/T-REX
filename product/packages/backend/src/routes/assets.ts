import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { deployAssetSuite } from '../services/deploy.ts';
import { getAsset } from '../db/store.ts';
import { publicClient } from '../chain/client.ts';
import { loadArtifact } from '../chain/artifacts.ts';

export default async function assets(fastifyApp: FastifyInstance) {
  fastifyApp.post('/v1/assets/tokenise', async (request, reply) => {
    const requestBodySchema = z.object({
      ownerAddress: z.string(),
      name: z.string().min(3),
      symbol: z.string().min(3).max(4),
      supply: z.number().int().positive(),
      description: z.string().optional(),
    });

    const {
      ownerAddress,
      name: tokenName,
      symbol: tokenSymbol,
      supply: tokenSupply,
      description: tokenDescription,
    } = requestBodySchema.parse(request.body);

    const deploymentResult = await deployAssetSuite({
      owner: ownerAddress as `0x${string}`,
      name: tokenName,
      symbol: tokenSymbol,
      supply: BigInt(tokenSupply),
      description: tokenDescription,
    });

    return reply.send({ asset: deploymentResult });
  });

  fastifyApp.get('/v1/assets/:token', async (request, reply) => {
    const tokenAddress = (request.params as any).token;
    const assetRecord: any = getAsset.get(tokenAddress);

    if (!assetRecord) {
      return reply.code(404).send({ error: 'not found' });
    }

    const tokenAbi = loadArtifact('Token').abi;
    const [currentTotalSupply, isTokenPaused] = await Promise.all([
      publicClient.readContract({
        address: assetRecord.token as `0x${string}`,
        abi: tokenAbi,
        functionName: 'totalSupply',
        args: [],
      }) as Promise<bigint>,
      publicClient.readContract({
        address: assetRecord.token as `0x${string}`,
        abi: tokenAbi,
        functionName: 'paused',
        args: [],
      }) as Promise<boolean>,
    ]);

    return reply.send({
      asset: {
        id: assetRecord.id,
        owner: assetRecord.owner,
        name: assetRecord.name,
        symbol: assetRecord.symbol,
        contracts: {
          token: assetRecord.token,
          identityRegistry: assetRecord.identityRegistry,
          compliance: assetRecord.compliance,
          agentManager: assetRecord.agentManager,
        },
        supply: {
          total: currentTotalSupply.toString(),
          decimals: 0,
          paused: isTokenPaused,
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  });
}
