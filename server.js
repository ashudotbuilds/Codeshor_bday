const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const token=()=>crypto.randomUUID()+crypto.randomUUID();
function field(data,name,max){if(typeof data[name]!=='string'||!data[name].trim()||data[name].trim().length>max)throw Error('Please complete '+name+' (up to '+max+' characters).');return data[name].trim()}
function image(data){if(!data.photo)return '';if(typeof data.photo!=='string'||data.photo.length>900000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(data.photo))throw Error('Please choose a smaller JPG photo.');return data.photo}
async function body(request){const declared=Number(request.headers.get('content-length'));if(declared>1000000)throw Error('That upload is too large.');const reader=request.body?.getReader();if(!reader)throw Error('Please complete the form.');let size=0;const chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1000000){await reader.cancel();throw Error('That upload is too large.')}chunks.push(value)}const buffer=new Uint8Array(size);let offset=0;for(const c of chunks){buffer.set(c,offset);offset+=c.byteLength}try{return JSON.parse(new TextDecoder().decode(buffer))}catch{throw Error('Please send a valid form.')}}
export async function handle(request,env,assets){const url=new URL(request.url);if(!url.pathname.startsWith('/api/')){const asset=assets[url.pathname]||((url.pathname==='/'||!url.pathname.includes('.'))?assets['/']:null);if(!asset)return new Response('Not found',{status:404});return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'self' https://*.chatgpt.com https://chatgpt.com"}})}
if(!env.BUCKET)return json({error:'Shared storage is not configured yet. You can explore the sample while setup finishes.'},503);
if(request.method==='POST'&&request.headers.get('origin')!==url.origin)return json({error:'Please submit from the celebration website.'},403);
try{
if(url.pathname==='/api/session'||url.pathname.startsWith('/api/cards'))return await groupApi(request,env.BUCKET,url.pathname);
if(['/api/celebrations','/api/wishes'].includes(url.pathname)&&request.method==='POST'){if(!request.headers.get('oai-authenticated-user-id'))return json({error:signInMessage},401);const data=await body(request);const name=field(data,'name',35),creator=field(data,'creator',35),date=field(data,'date',10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date)))throw Error('Please choose a valid birthday.');if(!['Wholesome','Chaotic','A little of both'].includes(data.tone))throw Error('Please choose a mood.');const audience=data.audience??'friends',language=data.language??'hinglish';if(!['friends','family','partner'].includes(audience))throw Error('Please choose friends, family, or partner.');if(!['english','hinglish'].includes(language))throw Error('Please choose English or Hinglish.');const id=crypto.randomUUID(),organizer=token(),contribute=token(),reveal=token();const record={id,name,creator,date,tone:data.tone,audience,language,photo:image(data),contribute,reveal,organizerHash:await hash(organizer),createdAt:new Date().toISOString()};if(url.pathname==='/api/wishes'||typeof data.message==='string'){const wish={id:crypto.randomUUID(),name:creator,memory:field(data,'message',600),award:'',wish:'',photo:'',createdAt:record.createdAt};await env.BUCKET.put('celebrations/'+id+'/messages/'+wish.createdAt+'-'+wish.id,JSON.stringify(wish));await env.BUCKET.put('celebrations/'+id+'/meta',JSON.stringify(record));return json({id,reveal},201)}await env.BUCKET.put('celebrations/'+id+'/meta',JSON.stringify(record));return json({id,organizer},201)}
const match=url.pathname.match(/^\/api\/celebrations\/([a-f0-9-]{36})\/(manage|contribute|reveal|messages)$/);if(!match)return json({error:'This wish link is incomplete or no longer available. Ask your friend to send the full link again.'},404);const [,id,action]=match;const object=await env.BUCKET.get('celebrations/'+id+'/meta');if(!object)return json({error:'We couldn’t find this birthday wish. Ask the sender to copy and send the full link again.'},404);const c=await object.json();const key=request.headers.get('X-Celebration-Key')||'';const authorized=action==='manage'?await hash(key)===c.organizerHash:key===(action==='reveal'?c.reveal:c.contribute);if(!authorized)return json({error:'This link doesn’t have access. Ask the organizer for a new copy.'},403);
if(action==='messages'&&request.method==='POST'){const data=await body(request);const m={id:crypto.randomUUID(),name:field(data,'name',40),memory:field(data,'memory',600),award:field(data,'award',100),wish:field(data,'wish',600),photo:image(data),createdAt:new Date().toISOString()};const existing=await env.BUCKET.list({prefix:'celebrations/'+id+'/messages/',limit:101});if(existing.objects.length>=100)return json({error:'This celebration has reached its 100-wish limit.'},409);await env.BUCKET.put('celebrations/'+id+'/messages/'+m.createdAt+'-'+m.id,JSON.stringify(m));return json({ok:true},201)}
if(request.method!=='GET')return json({error:'Method not allowed'},405);const {organizerHash,contribute,reveal,...publicC}=c;if(action==='contribute')return json({id:c.id,name:c.name,photo:c.photo,date:c.date,audience:c.audience??'friends',language:c.language??'hinglish',tone:c.tone});if(action==='messages')return json({error:'Not found'},404);const list=await env.BUCKET.list({prefix:'celebrations/'+id+'/messages/',limit:100});const messages=await Promise.all(list.objects.map(async o=>(await env.BUCKET.get(o.key)).json()));return json({...publicC,messages,...(action==='manage'?{contribute,reveal}:{})});
}catch(err){return json({error:err.message||'Something went wrong. Please try again.'},400)}}
const signInMessage = 'Sign in to create and manage birthday cards.';
const groupActions = /^\/api\/cards\/([a-f0-9-]{36})\/(organize|invite|wishes|publish|reveal)$/;
const guestLimit = 30;
const normalizeName = name => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

async function groupApi(request, bucket, path) {
  const user = request.headers.get('oai-authenticated-user-id');
  const owner = user ? await hash(user) : null;
  const collection = '/api/cards';
  if (path === '/api/session' && request.method === 'GET') return json({ signedIn: Boolean(owner) });
  if (path === collection) {
    if (!owner) return json({ error: signInMessage }, 401);
    const prefix = 'owners/' + owner + '/';
    if (request.method === 'GET') {
      const entries = await bucket.list({ prefix, limit: 100 });
      const cards = await Promise.all(entries.objects.map(async ({ key }) => (await bucket.get(key))?.json()));
      return json({ cards: cards.filter(Boolean).reverse() });
    }
    if (request.method !== 'POST') return json({ error: 'Choose a card to continue.' }, 405);
    const data = await body(request);
    const name = field(data, 'name', 35);
    const creator = field(data, 'creator', 35);
    const message = field(data, 'message', 600);
    const prompt = typeof data.prompt === 'string' ? data.prompt.trim().slice(0, 120) : '';
    const invited = typeof data.invited === 'string'
      ? [...new Map(data.invited.split(',').map(x => x.trim()).filter(Boolean).map(x => [normalizeName(x), x.slice(0,40)])).values()].slice(0,guestLimit)
      : [];
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const card = { id, name, creator, message, prompt, invited, createdAt, owner, photo: image(data), invite: token(), reveal: token() };
    await bucket.put('cards/' + id + '/card', JSON.stringify(card));
    await bucket.put(prefix + createdAt + '-' + id, JSON.stringify({ id, name }));
    return json({ id }, 201);
  }
  const match = path.match(groupActions);
  if (!match) return json({ error: 'This birthday link is incomplete. Ask the organizer for the full link.' }, 404);
  const [, id, action] = match;
  const organizerAction = action === 'organize' || action === 'publish';
  if (organizerAction && !owner) return json({ error: signInMessage }, 401);
  const prefix = 'cards/' + id + '/';
  const record = await bucket.get(prefix + 'card');
  if (!record) return json({ error: 'This card couldn’t be opened. Ask the organizer for the full link.' }, 404);
  const card = await record.json();
  const key = request.headers.get('X-Celebration-Key');
  if (organizerAction ? owner !== card.owner : key !== (action === 'reveal' ? card.reveal : card.invite)) {
    return json({ error: 'You don’t have access to this card. Check the link or sign in as its organizer.' }, 403);
  }
  const publication = await bucket.get(prefix + 'published');
  const published = Boolean(publication);
  if (action === 'publish' && request.method === 'POST') {
    if (!published) {
      const entries = await bucket.list({ prefix: prefix + 'wishes/', limit: guestLimit });
      await bucket.put(prefix + 'published', JSON.stringify(entries.objects.map(entry => entry.key)), { onlyIf: { etagDoesNotMatch: '*' } });
    }
    return json({ published: true });
  }
  if (action === 'wishes' && request.method === 'POST') {
    if (published) return json({ error: 'This card has already been shared, so new wishes are closed.' }, 409);
    const data = await body(request);
    const wish = { name: field(data, 'name', 40), memory: field(data, 'message', 600), photo: image(data) };
    const submission = field(data, 'submission', 36);
    if (!/^[a-f0-9-]{36}$/.test(submission)) return json({ error: 'Reload the invitation and try again.' }, 400);
    const wishKey = prefix + 'wishes/' + submission;
    if (await bucket.get(wishKey)) return json({ saved: true }, 201);
    const existing = await bucket.list({ prefix: prefix + 'wishes/', limit: guestLimit });
    if (existing.objects.length >= guestLimit) return json({ error: 'This card has reached its 30 guest wishes.' }, 409);
    await bucket.put(wishKey, JSON.stringify(wish), { onlyIf: { etagDoesNotMatch: '*' } });
    const finished = await bucket.get(prefix + 'published');
    if (finished && !(await finished.json()).includes(wishKey)) return json({ error: 'The organizer finished the card before this wish could be included.' }, 409);
    return json({ saved: true }, 201);
  }
  if (request.method !== 'GET' || action === 'wishes' || action === 'publish') return json({ error: 'Open the card link to continue.' }, 405);
  if (action === 'invite') return json({ name: card.name, prompt: card.prompt, published });
  if (action === 'reveal' && !published) return json({ error: 'This birthday card isn’t ready yet. Ask the organizer when it will be shared.' }, 409);
  const wishKeys = publication ? await publication.json() : (await bucket.list({ prefix: prefix + 'wishes/', limit: guestLimit })).objects.map(entry => entry.key);
  const guests = (await Promise.all(wishKeys.map(async key => (await bucket.get(key))?.json()))).filter(Boolean);
  const messages = [{ name: card.creator, memory: card.message }, ...guests];
  const visible = { id, name: card.name, creator: card.creator, photo: card.photo, messages, published };
  if (action === 'reveal') return json(visible);
  const guestNames = new Set(guests.map(wish => normalizeName(wish.name)));
  return json({ ...visible, invite: card.invite, reveal: published ? card.reveal : null,
    pending: card.invited.filter(name => !guestNames.has(normalizeName(name))) });
}
