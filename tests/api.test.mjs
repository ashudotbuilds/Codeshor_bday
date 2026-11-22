import {test}from 'node:test';import assert from 'node:assert/strict';import {handle}from '../server.js';
function harness(){const store=new Map();const env={BUCKET:{put:async(k,v)=>store.set(k,v),get:async k=>store.has(k)?{json:async()=>JSON.parse(store.get(k))}:null,list:async({prefix,limit})=>({objects:[...store.keys()].filter(k=>k.startsWith(prefix)).sort().slice(0,limit).map(key=>({key}))})}};return async(path,{key,method='GET',body,origin='https://birthday.test',user='organizer'}={})=>handle(new Request('https://birthday.test'+path,{method,headers:{Origin:origin,...(user?{'oai-authenticated-user-id':user}:{}),'Content-Type':'application/json',...(key?{'X-Celebration-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{})}
const valid={name:'Taylor',creator:'A friend',date:'2026-12-12',tone:'Wholesome'};
test('full shared celebration flow with independent access boundaries',async()=>{const call=harness();const created=await call('/api/celebrations',{method:'POST',body:valid});assert.equal(created.status,201);const {id,organizer}=await created.json();const url='/api/celebrations/'+id;const manage=await(await call(url+'/manage',{key:organizer})).json();assert.equal(manage.messages.length,0);assert.ok(manage.reveal);assert.ok(!manage.organizerHash);assert.equal((await call(url+'/manage',{key:manage.contribute})).status,403);assert.equal((await call(url+'/reveal',{key:manage.contribute})).status,403);const invite=await(await call(url+'/contribute',{key:manage.contribute})).json();assert.ok(!invite.messages);assert.ok(!invite.reveal);const wish={name:'Sam',memory:'Our weekend road trip',award:'Best travel buddy',wish:'More adventures'};assert.equal((await call(url+'/messages',{method:'POST',key:manage.reveal,body:wish})).status,403);assert.equal((await call(url+'/messages',{method:'POST',key:manage.contribute,body:wish})).status,201);const reveal=await(await call(url+'/reveal',{key:manage.reveal})).json();assert.equal(reveal.messages[0].memory,wish.memory);assert.ok(!reveal.contribute);assert.ok(!reveal.reveal);assert.equal((await call(url+'/reveal',{key:'wrong'})).status,403)});
test('rejects invalid inputs and cross-origin writes',async()=>{const call=harness();assert.equal((await call('/api/celebrations',{method:'POST',origin:'https://elsewhere.test',body:valid})).status,403);assert.equal((await call('/api/celebrations',{method:'POST',body:{...valid,name:' '}})).status,400);assert.equal((await call('/api/celebrations',{method:'POST',body:{...valid,photo:'javascript:alert(1)'}})).status,400);assert.equal((await call('/api/celebrations',{method:'POST',body:{...valid,date:'nope'}})).status,400)});
test('family context and English reveal survive organizer and contributor access',async()=>{const call=harness();const {id,organizer}=await(await call('/api/celebrations',{method:'POST',body:{...valid,name:'दादी',audience:'family',language:'english'}})).json();const c=await(await call('/api/celebrations/'+id+'/manage',{key:organizer})).json();assert.equal(c.name,'दादी');assert.equal(c.audience,'family');assert.equal(c.language,'english');const invite=await(await call('/api/celebrations/'+id+'/contribute',{key:c.contribute})).json();assert.equal(invite.audience,'family');assert.equal(invite.language,'english');assert.equal(invite.tone,'Wholesome');assert.ok(!invite.reveal);assert.ok(!invite.messages);const r=await(await call('/api/celebrations/'+id+'/reveal',{key:c.reveal})).json();assert.equal(r.language,'english');assert.equal(r.audience,'family')});
test('rejects unsupported reveal modes while retaining old-client defaults',async()=>{const call=harness();assert.equal((await call('/api/celebrations',{method:'POST',body:{...valid,audience:'public'}})).status,400);assert.equal((await call('/api/celebrations',{method:'POST',body:{...valid,language:'unsupported'}})).status,400);const {id,organizer}=await(await call('/api/celebrations',{method:'POST',body:valid})).json();const c=await(await call('/api/celebrations/'+id+'/manage',{key:organizer})).json();assert.equal(c.audience,'friends');assert.equal(c.language,'hinglish')});

test('single personal wish creates an immediately readable recipient card',async()=>{const call=harness();const response=await call('/api/wishes',{method:'POST',body:{...valid,message:'Happy birthday, yaar! याद है हमारी पहली trip?'}});assert.equal(response.status,201);const {id,reveal,organizer}=await response.json();assert.ok(reveal);assert.equal(organizer,undefined);const card=await(await call('/api/celebrations/'+id+'/reveal',{key:reveal})).json();assert.equal(card.messages.length,1);assert.equal(card.messages[0].name,valid.creator);assert.equal(card.messages[0].memory,'Happy birthday, yaar! याद है हमारी पहली trip?');assert.equal((await call('/api/wishes',{method:'POST',body:{...valid,message:' '}})).status,400)});

test('stable creation endpoint accepts personal wishes with photos',async()=>{const call=harness();const r=await call('/api/celebrations',{method:'POST',body:{...valid,message:'Happy birthday!',photo:'data:image/jpeg;base64,/9j/2Q=='}});assert.equal(r.status,201);const {id,reveal}=await r.json();assert.ok(reveal);const c=await(await call('/api/celebrations/'+id+'/reveal',{key:reveal})).json();assert.equal(c.messages[0].memory,'Happy birthday!');assert.equal(c.photo,'data:image/jpeg;base64,/9j/2Q==')});

test('signed-in organizer collects an anonymous guest photo and releases a separate recipient link', async () => {
  const call = harness();
  const path = '/api/cards';
  const draft = { name:'Aarav', creator:'Isha', message:'Happy birthday!', invited:'Meera, Rohan', prompt:'Favourite memory?' };
  const create = user => call(path, { method:'POST', user, body:draft });
  assert.equal((await create(null)).status, 401);
  const { id } = await (await create('organizer')).json();
  const route = path + '/' + id;
  assert.equal((await call(route + '/organize', { user:'other' })).status, 403);
  assert.equal((await (await call(path, { user:'other' })).json()).cards.length, 0);
  assert.equal((await (await call(path)).json()).cards[0].id, id);
  const before = await (await call(route + '/organize')).json();
  assert.equal(before.reveal, null);
  const guest = { user:null, key:before.invite };
  const invite = await (await call(route + '/invite', guest)).json();
  assert.equal(invite.prompt, draft.prompt);
  assert.equal(invite.messages, undefined);
  const photo = 'data:image/jpeg;base64,/9j/2Q==';
  const submission = { ...guest, method:'POST', body:{ submission:crypto.randomUUID(), name:'Meera', message:'Our chai breaks!', photo } };
  assert.equal((await call(route + '/wishes', submission)).status, 201);
  assert.equal((await call(route + '/wishes', submission)).status, 201);
  const after = await (await call(route + '/organize')).json();
  assert.equal(after.messages.length, 2);
  assert.deepEqual(after.pending, ['Rohan']);
  assert.equal((await call(route + '/publish', { method:'POST', user:'other' })).status, 403);
  assert.equal((await call(route + '/publish', { method:'POST' })).status, 200);
  const finished = await (await call(route + '/organize')).json();
  assert.equal((await call(route + '/reveal', guest)).status, 403);
  const recipient = await (await call(route + '/reveal', { user:null, key:finished.reveal })).json();
  assert.equal(recipient.messages[1].photo, photo);
  assert.equal(recipient.invite, undefined);
  assert.equal((await call(route + '/wishes', submission)).status, 409);
});
