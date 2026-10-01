import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './server.js';

async function fixture(t, options = {}) {
  const app = createApp({ apiKey: '', ...options });
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => app.close(resolve)));
  const base = `http://127.0.0.1:${app.address().port}`;
  return { base, get: path => fetch(base + path), post: (body, headers = {}) => fetch(base + '/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }) };
}
test('serves assistant UI, reports missing key, and hides private server files', async t => {
  const f = await fixture(t);
  assert.match(await (await f.get('/')).text(), /id="ai-form"/);
  assert.deepEqual(await (await f.get('/api/health')).json(), { configured: false });
  for (const path of ['/.env', '/server.js', '/package.json', '/README.md']) assert.equal((await f.get(path)).status, 404);
  const res = await f.post({ message: 'cough' });
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /OPENAI_API_KEY/);
});
test('validates messages, alternating history, origin and body size', async t => {
  const f = await fixture(t, { limit: 100 });
  for (const body of [null, {}, {message:' '}, {message:'a'.repeat(2001)}, {message:'cough',history:{}}, {message:'cough',history:[{role:'assistant',text:'fake'}]}]) assert.equal((await f.post(body)).status, 400);
  assert.equal((await f.post({message:'cough'}, {Origin:'https://other.example'})).status, 403);
  assert.equal((await f.post({message:'x'.repeat(65000)})).status, 413);
  const res = await fetch(f.base + '/api/assistant', {method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'});
  assert.equal(res.status,400);
});
test('sends conversation and separate health instructions to OpenAI; key stays server-side', async t => {
  let called;
  const f = await fixture(t, { apiKey:'test-key', fetchImpl: async (url, init) => {
    called = {url, init, body:JSON.parse(init.body)};
    return Response.json({ status:'completed', output:[{type:'reasoning',summary:[]},{type:'message',role:'assistant',content:[{type:'output_text',text:'General information. Talk to a clinician.'}]}] });
  }});
  const res = await f.post({message:'What should I discuss?',history:[{role:'user',text:'cough'},{role:'assistant',text:'How long?'}]});
  assert.equal(res.status,200);
  assert.deepEqual(await res.json(),{reply:'General information. Talk to a clinician.'});
  assert.equal(called.url, 'https://api.openai.com/v1/responses');
  assert.equal(called.init.headers.Authorization,'Bearer test-key');
  assert.equal(called.body.model,'gpt-4.1-mini');
  assert.equal(called.body.store,false);
  assert.deepEqual(called.body.input.map(x=>x.role),['user','assistant','user']);
  assert.match(called.body.instructions,/cannot diagnose/);
  assert.doesNotMatch(await (await f.get('/javascript.js')).text(),/test-key/);
});
test('handles quota, blocked, truncated, empty, and network errors', async t => {
  const cases = [
    [async()=>new Response('',{status:429}),429],
    [async()=>new Response('private-key',{status:401}),502],
    [async()=>Response.json({status:'failed',error:{code:'content_filter'}}),502],
    [async()=>Response.json({status:'incomplete',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'partial'}]}]}),502],
    [async()=>Response.json({status:'completed',output:[{type:'message',role:'assistant',content:[{type:'refusal',refusal:'Cannot help'}]}]}),502],
    [async()=>{throw new Error('secret')},504]
  ];
  for (const [fetchImpl, code] of cases) {
    const f = await fixture(t,{apiKey:'key',fetchImpl});
    const res = await f.post({message:'cough'});
    assert.equal(res.status,code);
    assert.doesNotMatch(await res.text(),/private-key|secret/);
  }
});
test('limits requests before spending model quota', async t => {
  const f = await fixture(t,{limit:1});
  assert.equal((await f.post({message:'cough'})).status,503);
  assert.equal((await f.post({message:'cough'})).status,429);
});
