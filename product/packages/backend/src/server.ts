import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import admin from './routes/admin.ts';
import assets from './routes/assets.ts';
import txRoutes from './routes/tx.ts';
import users from './routes/users.ts';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({
  path: resolve(__dirname, '../.env'),
});
const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(admin);
await app.register(assets);
await app.register(txRoutes);
await app.register(users);

app.get('/healthz', async () => ({ ok: true }));

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
await app.listen({ port, host });
