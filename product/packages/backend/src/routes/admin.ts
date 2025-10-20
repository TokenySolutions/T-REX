import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { setCfg, getCfg } from '../db/store.ts';

export default async function admin(fastifyApp: FastifyInstance) {
  fastifyApp.post('/v1/admin/config', async (request, reply) => {
    const requestBodySchema = z.object({
      trexImplementationAuthority: z.string(),
      trexFactory: z.string(),
      identityImplementationAuthority: z.string(),
      identityFactory: z.string(),
      claimTopicsRegistryProxy: z.string(),
      trustedIssuersRegistryProxy: z.string(),
      identityRegistryProxy: z.string(),
      trustedIssuer: z.string(),
      claimTopic: z.string(),
    });

    try {
      const parsedRequestBody = requestBodySchema.parse(request.body);

      let successfullyUpdatedCount = 0;
      for (const [configurationKey, configurationValue] of Object.entries(parsedRequestBody)) {
        try {
          const databaseUpdateResult = setCfg.run(configurationKey, configurationValue);
          if (databaseUpdateResult.changes > 0) {
            successfullyUpdatedCount++;
          }
        } catch (error) {
          console.error(`Failed to set config ${configurationKey}:`, error);
          return reply.status(500).send({
            error: 'Database error',
            details: `Failed to set ${configurationKey}: ${error}`,
          });
        }
      }

      const configurationVerification: Record<string, string | null> = {};
      for (const configurationKey of Object.keys(parsedRequestBody)) {
        configurationVerification[configurationKey] = getCfg(configurationKey) ?? null;
      }

      return reply.send({
        ok: true,
        saved: successfullyUpdatedCount,
        total: Object.keys(parsedRequestBody).length,
        config: configurationVerification,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Config update error:', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: String(error),
      });
    }
  });

  fastifyApp.get('/v1/admin/config', async (request, reply) => {
    const requiredConfigurationKeys = [
      'trexImplementationAuthority',
      'trexFactory',
      'identityImplementationAuthority',
      'identityFactory',
      'claimTopicsRegistryProxy',
      'trustedIssuersRegistryProxy',
      'identityRegistryProxy',
      'trustedIssuer',
      'claimTopic',
    ];

    const currentConfiguration: Record<string, string | null> = {};
    for (const configurationKey of requiredConfigurationKeys) {
      currentConfiguration[configurationKey] = getCfg(configurationKey) ?? null;
    }

    return reply.send({ config: currentConfiguration });
  });
}
