// src/routes/search.routes.ts
import { Router } from 'express';
import { getProviders } from '../providers/registry';
import { SearchQuery } from '../providers/types';
import { searchAllProvidersParallel } from '../services/search.service';

export const searchRouter = Router();

type ErrorResponse = { error: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateQuery(body: unknown): SearchQuery {
  const q: unknown = isRecord(body) && 'query' in body ? (body as Record<string, unknown>).query : body;
  if (!isRecord(q)) throw new Error('Missing query');

  const skiSiteRaw = q['ski_site'];
  const groupSizeRaw = q['group_size'];
  const fromDateRaw = q['from_date'];
  const toDateRaw = q['to_date'];

  const ski_site = typeof skiSiteRaw === 'number' ? skiSiteRaw : Number(skiSiteRaw);
  const group_size = typeof groupSizeRaw === 'number' ? groupSizeRaw : Number(groupSizeRaw);

  if (!Number.isFinite(ski_site)) throw new Error('Invalid ski_site');
  if (!Number.isFinite(group_size) || group_size < 1 || group_size > 10) throw new Error('Invalid group_size');
  if (typeof fromDateRaw !== 'string' || typeof toDateRaw !== 'string') throw new Error('Invalid dates');

  return {
    ski_site,
    from_date: fromDateRaw,
    to_date: toDateRaw,
    group_size,
  };
}

// returns all results (non-stream)
searchRouter.post('/search', async (req, res) => {
  try {
    const query = validateQuery(req.body as unknown);
    const providers = getProviders();

    const items = await searchAllProvidersParallel(providers, query);

    res.json({ query, total: items.length, items });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Bad request';
    const out: ErrorResponse = { error: msg };
    res.status(400).json(out);
  }
});

// SSE stream: sends results immediately as each provider+groupSize call resolves
searchRouter.post('/search/stream', async (req, res) => {
  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const query = validateQuery(req.body as unknown);
    const providers = getProviders();

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    // meta first
    send('meta', { query });
    const t0 = Date.now();

    // IMPORTANT: performance - stream only chunks, not a growing full aggregate each time
    const final = await searchAllProvidersParallel(providers, query, (chunk) => {
      console.log(`[chunk] +${Date.now() - t0}ms size=${chunk.groupSize} items=${chunk.items.length}`);
      send('chunk', { groupSize: chunk.groupSize, items: chunk.items });
    });

    // final sorted aggregate
    send('done', { total: final.length, items: final });
    res.end();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Bad request';

    // if SSE already started, send SSE error
    try {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      send('error', { error: msg });
      res.end();
    } catch {
      const out: ErrorResponse = { error: msg };
      res.status(400).json(out);
    }
  }
});
