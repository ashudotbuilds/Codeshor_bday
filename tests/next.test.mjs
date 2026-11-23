import assert from 'node:assert/strict';
import test from 'node:test';
import { isUuid, normalizeName } from '../lib/cards.js';
import { json, photoField, post, readJson, textField } from '../lib/request.js';
import { illustrateWish } from '../lib/ai-illustration.js';
import { arrangeWishes } from '../lib/storyboard.js';
import sharp from 'sharp';

test('guest names are matched by normalized spelling', () => {
  assert.equal(normalizeName('  Ｍeera   Shah '), 'meera shah');
  assert.equal(isUuid('ffffffff-ffff-ffff-ffff-ffffffffffff'), true);
  assert.equal(isUuid('x'.repeat(36)), false);
});

test('bad submissions return specific errors and preserve the form', async () => {
  const url = 'https://birthday.example/api/cards';
  const request = (origin, body) => new Request(url, { method:'POST', headers:{ Origin:origin }, body });
  assert.equal((await post(request('https://elsewhere.example','{}'), () => json({}))).status, 403);
  const result = await post(request('https://birthday.example','broken'), async () => {
    await readJson(request('https://birthday.example','broken'));
    return json({});
  });
  assert.equal(result.status, 400);
  assert.match((await result.json()).error, /read the form/);
  assert.throws(() => textField(' ', 'your message', 600), /Enter your message/);
  assert.throws(() => photoField('data:image/svg+xml;base64,abc'), /Choose a JPG/);
});

test('same-origin POSTs use the browser-facing host when Next rewrites the request URL', async () => {
  const makeRequest = origin => new Request('https://localhost:4173/api/cards', {
    method: 'POST',
    headers: { Host: '127.0.0.1:4173', Origin: origin, 'Sec-Fetch-Site': 'same-origin' }
  });
  const action = () => json({});
  assert.equal((await post(makeRequest('https://127.0.0.1:4173'), action)).status, 200);
  assert.equal((await post(makeRequest('https://localhost:4173'), action)).status, 403);
});

test('an illustration follows its original wish with or without AI ordering', () => {
  const wishes = [{ id: 'opening', message: 'We ate ice cream.' }, { id: 'second', message: 'Happy birthday!' }];
  const illustrations = { opening: 'data:image/webp;base64,test' };
  const original = arrangeWishes(wishes, { illustrations });
  assert.equal(original[0].illustration, illustrations.opening);
  assert.equal(original[0].message, wishes[0].message);
  assert.equal(original[1].illustration, undefined);
  const arranged = arrangeWishes(wishes, { illustrations, scenes: [{ id: 'second', caption: 'Happy birthday' }] });
  assert.equal(arranged[1].illustration, illustrations.opening);
});

test('BYOK image providers render a single wish and Claude can skip or hand off a scene', async () => {
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'white' } }).png().toBuffer();
  const encoded = png.toString('base64');
  const calls = [];
  const fetcher = async (url, request) => {
    const body = JSON.parse(request.body);
    calls.push({ url, headers: request.headers, body });
    if (url.includes('anthropic')) {
      const text = body.messages[0].content.includes('ice cream') ? 'Two ice cream cones.' : 'SKIP';
      return Response.json({ content: [{ type: 'text', text }] });
    }
    if (url.includes('googleapis')) {
      return Response.json({ steps: [{ type: 'model_output', content: [{ type: 'image', data: encoded }] }] });
    }
    return Response.json({ data: [{ b64_json: encoded }] });
  };
  const wish = 'We ate ice cream.';
  for (const provider of ['openai', 'gemini', 'claude']) {
    const result = await illustrateWish({ provider, key: 'wish-key', renderer: 'gemini', imageKey: 'render-key' }, wish, fetcher);
    assert.match(result, /^data:image\/webp;base64,/);
    const bytes = Buffer.from(result.split(',')[1], 'base64');
    const { width, height } = await sharp(bytes).metadata();
    assert.deepEqual([width, height], [720, 480]);
  }
  assert.equal(calls[0].headers.Authorization, 'Bearer wish-key');
  assert.equal(calls[1].headers['x-goog-api-key'], 'wish-key');
  assert.equal(calls[2].headers['x-api-key'], 'wish-key');
  assert.equal(calls[3].headers['x-goog-api-key'], 'render-key');
  assert.match(calls[3].body.input, /Two ice cream cones/);
  await assert.rejects(illustrateWish({ provider: 'claude', key: 'wish-key', renderer: 'gemini', imageKey: 'render-key' },
    'Happy birthday!', fetcher), /doesn’t describe a specific moment/);
  assert.equal(calls.length, 5);
  await assert.rejects(illustrateWish({ provider: 'gemini', key: 'bad-key' }, wish,
    async () => new Response(null, { status: 403 })), /rejected this key/);
});
