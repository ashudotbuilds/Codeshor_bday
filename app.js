const $ = s => document.querySelector(s), app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = (name, size=20) => { const paths = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8C2 8 5 0 9 3c2 1 3 5 3 5s1-4 3-5c4-3 7 5-3 5Z"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  play:'<path d="m9 5 11 7-11 7V5Z"/>',
  chat:'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M8 9h8M8 13h5"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  cake:'<path d="M4 12h16v9H4zM4 15q2 4 4 0 2 4 4 0 2 4 4 0 2 4 4 0M8 12V8m8 4V8M12 8V4M8 5V3m8 2V3"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  back:'<path d="m14 6-6 6 6 6"/>',
  spark:'<path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z"/>'
}; return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.spark)+'</svg>'; };
const brand = '<a class="brand" href="#home" aria-label="Birthday Adda home"><span class="brand-mark">'+icon('cake',26)+'</span><span>birthday<span class="brand-bottom">adda<span class="brand-dot">✳</span></span></span></a>';
async function readPhoto(file){if(!file)return '';if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP photo.');if(file.size>10*1024*1024)throw Error('Choose a photo smaller than 10 MB.');const bitmap=await createImageBitmap(file);const ratio=Math.min(1,800/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas.toDataURL('image/jpeg',.75)}
async function api(path,options={}){let res;try{res=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options.headers}})}catch{throw Error('You appear to be offline. Check your connection and try again. Your wish is still here.')}let data;try{data=await res.json()}catch{throw Error('The wish service isn’t responding right now. Please try again in a moment.')}if(!res.ok){if(res.status===404)throw Error(options.method==='POST'?'We couldn’t save your wish because the service is temporarily unavailable. Please try again. Your message has been kept.':'We couldn’t find this wish. Ask your friend to send the full link again.');if(res.status===413)throw Error('That photo is too large. Choose a smaller photo or send your wish without one.');if(res.status===401)throw Error(data.error||'Sign in to continue.');if(res.status===403)throw Error('This wish needs access to the site. Sign in with an allowed account, or ask the sender for access.');if(res.status>=500)throw Error(options.method==='POST'?'We couldn’t save your wish right now. Try again shortly. Your message is still in the form.':'We couldn’t load this card right now. Try again shortly.');throw Error(data.error||'Please check the names and message, then try again.')}return data}
const keyHeader = key => ({'X-Celebration-Key':key});
const demo={id:'demo',name:'Aarav',creator:'Isha',photo:'',messages:[{name:'Isha',memory:'From hostel Maggi at 2 AM to all the Goa plans we never made — life is better with you in it. Happy birthday, yaar! Here’s to more stories, more laughs, and finally booking that trip. ♡'}]};
let current=null;
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(window.tt);window.tt=setTimeout(()=>$('#toast').classList.remove('show'),3500)}
function header(){return '<header class="header">'+brand+'<nav class="group-nav"><a href="#mine">Your cards</a><a href="#create">Create a card</a></nav></header>'}
function footer(){return '<footer>Made for apne log. With a little extra pyaar.</footer>'}
let messagePage=0;function messagePages(c){return c.messages.flatMap(m=>{const full=[m.memory,m.award,m.wish].filter(Boolean).join(' ');const words=full.split(/\s+/);const pages=[];let text='';for(const word of words){for(let pos=0;pos<word.length;pos+=180){const part=word.slice(pos,pos+180);if(text.length+part.length>210&&text){pages.push({text,name:m.name,photo:m.photo,original:m});text=''}text+=(text?' ':'')+part}}if(text)pages.push({text,name:m.name,photo:m.photo,original:m});return pages})}function card(c){const pages=messagePages(c);messagePage=Math.min(messagePage,Math.max(0,pages.length-1));const m=pages[messagePage]||{text:'Happy birthday!',name:c.creator};return '<article class="birthday-card"><span class="eyebrow">SOMEONE’S VERY GLAD YOU EXIST</span>'+((m.photo||c.photo)?'<img class="birthday-photo" src="'+esc(m.photo||c.photo)+'" alt="'+esc(c.name)+'">':'<span class="card-flower">✳</span>')+'<h1>Happy birthday,<br><em>'+esc(c.name)+'!</em></h1><div class="personal-message"><p>'+esc(m.text)+'</p><span>With love, <b>'+esc(m.name)+'</b></span></div>'+(pages.length>1?'<div class="message-pages"><button id="message-back" '+(!messagePage?'disabled':'')+'>Back</button><span>'+(messagePage+1)+' / '+pages.length+'</span><button id="message-next" '+(messagePage===pages.length-1?'disabled':'')+'>Next</button></div>':'')+'<div class="card-signature">birthday adda · made just for you</div></article>'}
function ready(c,key){current=c;const link=location.origin+'/#reveal/'+c.id+'/'+key;app.innerHTML=header()+'<main class="ready"><div class="success-icon">'+icon('check',23)+'</div><h1>Their day just got<br><em>a little more special.</em></h1><p>Your wish is ready. Send it to '+esc(c.name)+'.</p><div class="actions"><button class="btn" id="copy">'+icon('copy',18)+' Copy wish link</button><a class="btn light" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text='+encodeURIComponent('Happy birthday, '+c.name+'! Made a little something for you. ♡\n'+link)+'">Send on WhatsApp</a></div><a class="text-button" href="#reveal/'+c.id+'/'+key+'">Preview their birthday wish</a><p class="access-note">This preview site is private. Your friend needs visitor access to open the link.</p></main>'+footer();$('#copy').onclick=()=>copy(link)}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('Link copied. Send a little birthday love.')}catch{const d=$('#modal');d.innerHTML='<h2>Copy your wish link</h2><textarea aria-label="Wish link" readonly>'+esc(text)+'</textarea><button class="btn" id="close">Done</button>';d.showModal();d.querySelector('textarea').select();$('#close').onclick=()=>d.close()}}
function reveal(c,key){current=c;app.innerHTML=header()+'<main class="recipient">'+card(c)+'<section class="share-panel"><h2>A birthday wish worth sharing.</h2><p>Save for Stories or share the wish link.</p><div class="actions"><button class="btn" id="save">'+icon('download',18)+' Save Story card</button><button class="btn light" id="share-image">Share card</button></div><div class="socials"><button id="instagram">Instagram Stories</button><a id="wa" target="_blank" rel="noopener noreferrer">WhatsApp</a><a id="x" target="_blank" rel="noopener noreferrer">X</a><a id="fb" target="_blank" rel="noopener noreferrer">Facebook</a></div><p class="share-note">The saved card includes your wish and names.</p></section><a class="make-own" href="#home">Make someone else’s birthday special ♡</a></main>'+footer();const link=c.id==='demo'?location.origin:location.origin+'/#'+(c.group?'birthday':'reveal')+'/'+c.id+'/'+key;const text='A little older. A lot more loved. ♡';$('#wa').href='https://wa.me/?text='+encodeURIComponent(text+'\n'+link);$('#x').href='https://twitter.com/intent/tweet?text='+encodeURIComponent(text)+'&url='+encodeURIComponent(link);$('#fb').href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(link);if($('#message-back'))$('#message-back').onclick=()=>{messagePage--;reveal(c,key)};if($('#message-next'))$('#message-next').onclick=()=>{messagePage++;reveal(c,key)};$('#save').onclick=()=>saveCard(c);$('#instagram').onclick=async()=>{await saveCard(c);toast('Card saved. Open Instagram and add it to your Story.')};$('#share-image').onclick=async()=>{const file=await imageFile(c);if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'My birthday wish'})}catch(e){if(e.name!=='AbortError')toast('Couldn’t share. Save the card and upload it instead.')}}else{await saveCard(c);toast('Card saved. Upload it to your favourite app.')}}}
async function imageFile(c){await document.fonts.ready;const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d');ctx.fillStyle='#ded1f5';ctx.fillRect(0,0,1080,1920);ctx.strokeStyle='#b9a0d3';ctx.lineWidth=2;ctx.strokeRect(45,45,990,1830);ctx.fillStyle='#30253f';ctx.textAlign='center';ctx.font='25px "DM Sans",sans-serif';ctx.fillText('SOMEONE’S VERY GLAD YOU EXIST',540,150);const activeWish=messagePages(c)[messagePage]?.original;const cardPhoto=activeWish?.photo||c.photo;if(cardPhoto){const img=new Image();img.src=cardPhoto;await img.decode();ctx.save();ctx.beginPath();ctx.arc(540,380,140,0,Math.PI*2);ctx.clip();const scale=Math.max(280/img.width,280/img.height);ctx.drawImage(img,540-img.width*scale/2,380-img.height*scale/2,img.width*scale,img.height*scale);ctx.restore()}else{ctx.font='200px Georgia';ctx.fillStyle='#9875bb';ctx.fillText('✳',540,450)}ctx.fillStyle='#30253f';ctx.font='bold 75px "DM Sans",sans-serif';ctx.fillText('Happy birthday,',540,650);ctx.font='italic 94px "DM Serif Display",Georgia';ctx.fillText(c.name+'!',540,765,910);const m=activeWish||c.messages[0]||{memory:'Have the happiest birthday.',name:c.creator};const message=[m.memory,m.award,m.wish].filter(Boolean).join('\n\n');let lines=[],size=40;const wrap=()=>{ctx.font=size+'px "DM Sans",sans-serif';lines=[];for(const paragraph of message.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(ctx.measureText(line+word).width>850&&line){lines.push(line.trim());line=''}if(ctx.measureText(word).width>850){for(const char of word){if(ctx.measureText(line+char).width>850){lines.push(line);line=''}line+=char}line+=' '}else line+=word+' '}lines.push(line.trim())}};wrap();while(lines.length*size*1.5>690&&size>25){size--;wrap()}let y=900;for(const line of lines){ctx.fillText(line,540,y,860);y+=size*1.5}ctx.font='28px "DM Sans",sans-serif';ctx.fillText('With love, '+m.name,540,1710,880);ctx.font='23px "DM Sans",sans-serif';ctx.fillText('birthday adda · made just for you',540,1800);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Could not create card.');return new File([blob],'birthday-'+c.name.replace(/[^a-z0-9]/gi,'-')+'.png',{type:'image/png'})}
async function saveCard(c){try{const file=await imageFile(c),url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Story card saved. Ready to share.')}catch{toast('Couldn’t save the card. Please try again.')}}
async function route(){messagePage=0;window.scrollTo(0,0);const [view,id,key]=location.hash.slice(1).split('/');if(!view||view==='home'||view==='create'||view==='mine')return groupHome(view==='mine').catch(showGroupError);if(view==='organize')return organize(id).catch(showGroupError);if(view==='invite')return contribute(id,key).catch(showGroupError);if(view==='birthday'){try{const c=await api('/api/cards/'+id+'/reveal',{headers:keyHeader(key)});c.group=true;return reveal(c,key)}catch(error){return showGroupError(error)}}if(id==='demo')return reveal(demo,'demo');if(!['ready','reveal','manage','contribute'].includes(view)||!id||!key){location.hash='home';return}app.innerHTML=header()+'<main class="loading">Opening a little birthday love…</main>';try{const c=await api('/api/celebrations/'+id+'/'+(view==='ready'?'reveal':view),{headers:keyHeader(key)});if(view==='ready')ready(c,key);else if(view==='manage')ready(c,c.reveal);else if(view==='contribute'){app.innerHTML=header()+'<main class="ready"><h1>Make a personal wish instead.</h1><p>We’ve simplified Birthday Adda. Write a wish and send it straight to your friend.</p><a class="btn" href="#home">Write a birthday wish</a></main>'}else reveal(c,key)}catch(err){app.innerHTML=header()+'<main class="ready"><h1>One second…</h1><p>'+esc(err.message)+'</p><a class="btn" href="#home">Make a birthday wish</a></main>'}}

const signInLink = '<a class="btn" href="/signin-with-chatgpt?return_to=%2F%23mine" target="_top">Sign in with ChatGPT</a>';
function screen(content) {
  app.innerHTML = header() + '<main class="group-screen">' + content + '</main>' + footer();
}

function showGroupError(error) {
  screen('<section class="group-panel centered"><h1>Couldn’t open this card</h1><p>' + esc(error.message) + '</p><a class="btn light" href="#home">Back to Birthday Adda</a></section>');
}

function photoField() {
  return '<label class="upload-label">Add a photo (optional)<input name="photoFile" type="file" accept="image/jpeg,image/png,image/webp"><span class="field-note">JPG, PNG or WebP · up to 10 MB</span></label>';
}

function wireGroupForm(form, save) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type=submit]');
    const alert = form.querySelector('[role=alert]');
    const data = Object.fromEntries(new FormData(form));
    button.disabled = true;
    alert.textContent = '';
    try {
      try {
        data.photo = await readPhoto(data.photoFile?.name ? data.photoFile : null);
      } catch (error) {
        throw new Error(error.message.startsWith('Choose') ? error.message : 'This photo couldn’t be read. Choose another or remove it and try again.');
      }
      delete data.photoFile;
      await save(data);
    } catch (error) {
      alert.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

async function groupHome(listOnly = false) {
  const session = await api('/api/session');
  if (!session.signedIn) {
    screen('<section class="group-panel centered"><h1>Make a birthday card together</h1><p>Sign in to create a card, collect wishes, and share it when you’re ready.</p>' + signInLink + '<p class="field-note">Guests can contribute through an invitation link.</p></section>');
    return;
  }
  if (listOnly) {
    const { cards } = await api('/api/cards');
    screen('<section class="group-panel"><h1>Your birthday cards</h1><div class="card-list">' +
      (cards.length ? cards.map(card => '<a class="card-row" href="#organize/' + card.id + '">' + esc(card.name) + '’s birthday card <span>Open card</span></a>').join('') : '<p>Your cards will appear here after you create one.</p>') +
      '</div><a class="btn" href="#create">Create a card</a></section>');
    return;
  }
  screen('<section class="group-panel"><h1>Make a birthday card</h1><form id="group-form"><div class="row"><label>Birthday friend<input name="name" required maxlength="35" placeholder="Aarav"></label><label>Your name<input name="creator" required maxlength="35" placeholder="Isha"></label></div><label>Your birthday wish<textarea name="message" required maxlength="600" placeholder="Write a wish to start the card."></textarea></label><details><summary>Personal question and guest list (optional)</summary><div class="detail-fields"><label>Question for guests<input name="prompt" maxlength="120" placeholder="What’s your favourite memory with Aarav?"></label><label>Expected guests<input name="invited" maxlength="1200" placeholder="Meera, Rohan, Priya"><span class="field-note">Separate names with commas. Use the names guests will sign with.</span></label></div></details>' + photoField() + '<p class="error" role="alert"></p><button type="submit" class="btn">Create birthday card</button></form></section>');
  wireGroupForm($('#group-form'), async data => {
    const { id } = await api('/api/cards', { method:'POST', body:JSON.stringify(data) });
    location.hash = 'organize/' + id;
  });
}

async function organize(id) {
  const endpoint = '/api/cards/' + id;
  const card = await api(endpoint + '/organize');
  const invite = location.origin + '/#invite/' + id + '/' + card.invite;
  const recipient = card.published ? location.origin + '/#birthday/' + id + '/' + card.reveal : '';
  screen('<section class="group-panel"><a class="text-button" href="#mine">Your birthday cards</a><h1>' + esc(card.name) + '’s birthday card</h1><p class="card-status">' + (card.published ? 'Ready to send' : 'Collecting wishes') + ' · ' + (card.messages.length - 1) + ' guest ' + (card.messages.length === 2 ? 'wish' : 'wishes') + '</p><div class="actions">' +
    (card.published ? '<button class="btn" id="recipient-link">Copy birthday person’s link</button><a class="btn light" href="' + esc(recipient) + '">Preview card</a>' :
    '<button class="btn" id="invite-link">Copy guest invite link</button><button class="btn light" id="finish-card">Finish card</button>') +
    '</div><div class="group-activity"><details open><summary>Submitted wishes</summary><div class="wish-list">' +
    card.messages.map((wish, index) => '<details><summary>' + esc(wish.name) + (index === 0 ? ' (organizer)' : '') + (wish.photo ? ' · Photo' : '') + '</summary><p>' + esc(wish.memory) + '</p>' + (wish.photo ? '<img src="' + esc(wish.photo) + '" alt="Photo from ' + esc(wish.name) + '">' : '') + '</details>').join('') +
    '</div></details>' + (card.pending.length ? '<details><summary>' + card.pending.length + ' expected guests haven’t signed with their listed name</summary><p>' + card.pending.map(esc).join(', ') + '</p></details>' : '') +
    '</div><button class="text-button" id="refresh-card">Refresh wishes</button><p class="error" role="alert"></p></section>');
  $('#refresh-card').onclick = () => organize(id).catch(showGroupError);
  if ($('#invite-link')) $('#invite-link').onclick = () => copy(invite);
  if ($('#recipient-link')) $('#recipient-link').onclick = () => copy(recipient);
  if ($('#finish-card')) $('#finish-card').onclick = () => {
    const dialog = $('#modal');
    dialog.innerHTML = '<h2>Finish the birthday card?</h2><p>New wishes will close. You’ll get a separate link to send to ' + esc(card.name) + '.</p><div class="actions"><button class="btn light" id="keep-open">Keep collecting</button><button class="btn" id="confirm-finish">Finish card</button></div><p class="error" role="alert"></p>';
    dialog.showModal();
    $('#keep-open').onclick = () => dialog.close();
    $('#confirm-finish').onclick = async event => {
      event.target.disabled = true;
      try {
        await api(endpoint + '/publish', { method:'POST' });
        dialog.close();
        await organize(id);
      } catch (error) {
        dialog.querySelector('[role=alert]').textContent = error.message;
        event.target.disabled = false;
      }
    };
  };
}

async function contribute(id, key) {
  const endpoint = '/api/cards/' + id;
  const options = { headers:keyHeader(key) };
  const card = await api(endpoint + '/invite', options);
  if (card.published) {
    screen('<section class="group-panel centered"><h1>The card is finished</h1><p>New wishes are closed. You can still wish ' + esc(card.name) + ' directly.</p></section>');
    return;
  }
  screen('<section class="group-panel"><h1>Wish ' + esc(card.name) + ' a happy birthday</h1><form id="group-form"><label>Your name<input name="name" required maxlength="40"></label><label>' + esc(card.prompt || 'Your birthday wish') + '<textarea name="message" required maxlength="600"></textarea></label>' + photoField() + '<p class="field-note">The organizer and anyone with the finished card link can see your wish and photo.</p><p class="error" role="alert"></p><button class="btn" type="submit">Add my wish</button></form></section>');
  const submission = crypto.randomUUID();
  wireGroupForm($('#group-form'), async data => {
    await api(endpoint + '/wishes', { ...options, method:'POST', body:JSON.stringify({ ...data, submission }) });
    screen('<section class="group-panel centered"><h1>Your wish is in</h1><p>It’ll be part of ' + esc(card.name) + '’s birthday card.</p></section>');
  });
}

window.addEventListener('hashchange',route);route();
