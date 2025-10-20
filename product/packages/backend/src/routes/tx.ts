import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getAsset } from '../db/store.ts';
import { mint, preflightTransfer, transfer } from '../services/token.ts';
import { registerIdentity } from '../services/identity.ts';
import { PreflightParams, Asset } from '../utils/types.ts';

export default async function transactionRoutes(fastifyApp: FastifyInstance) {
  fastifyApp.post('/v1/assets/transfer', async (request, reply) => {
    const requestBodySchema = z.object({
      from: z.string(),
      to: z.string(),
      amount: z.string(),
      token: z.string(),
    });

    const { from: senderAddress, to: recipientAddress, amount: transferAmount, token: tokenAddress } = requestBodySchema.parse(request.body);

    const tokenAsset = getAsset.get(tokenAddress) as Asset | undefined;
    if (!tokenAsset) {
      return reply.code(404).send({ error: 'Asset not found' });
    }

    const transferParameters = {
      tokenAddress: tokenAsset.token as `0x${string}`,
      identityRegistryAddress: tokenAsset.identityRegistry as `0x${string}`,
      fromAddress: senderAddress as any,
      toAddress: recipientAddress as any,
      amount: transferAmount,
    } as PreflightParams;

    const preflightResult = await preflightTransfer(transferParameters);

    if (!preflightResult.allowed) {
      return reply.code(422).send({
        transactionHash: '',
        status: false,
        blockNumber: -1,
      });
    }

    const transactionReceipt = await transfer(transferParameters);

    return reply.send({
      transactionHash: transactionReceipt.transactionHash,
      status: transactionReceipt.status,
      blockNumber: Number(transactionReceipt.blockNumber),
    });
  });

  fastifyApp.post('/v1/assets/mint', async (request, reply) => {
    const requestBodySchema = z.object({
      owner: z.string(),
      amount: z.string(),
      token: z.string(),
    });

    const { owner: recipientAddress, amount: mintAmount, token: tokenAddress } = requestBodySchema.parse(request.body);

    const tokenAsset = getAsset.get(tokenAddress) as Asset | undefined;
    if (!tokenAsset) {
      return reply.code(404).send({ error: 'Asset not found' });
    }

    const mintParameters = {
      tokenAddress: tokenAsset.token as `0x${string}`,
      identityRegistryAddress: tokenAsset.identityRegistry as `0x${string}`,
      fromAddress: recipientAddress as any,
      toAddress: '' as any,
      amount: mintAmount,
    } as PreflightParams;

    const transactionReceipt = await mint(mintParameters);

    return reply.send({
      transactionHash: transactionReceipt.transactionHash,
      status: transactionReceipt.status,
      blockNumber: Number(transactionReceipt.blockNumber),
    });
  });

  fastifyApp.post('/v1/assets/registerIdentity', async (request, reply) => {
    const requestBodySchema = z.object({
      owner: z.string(),
      country: z.string(),
    });

    const { owner: ownerAddress, country: countryCode } = requestBodySchema.parse(request.body);

    const identityRegistrationResult = await registerIdentity({
      owner: ownerAddress as `0x${string}`,
      country: countryCode,
    });

    return reply.send(identityRegistrationResult);
  });
}
