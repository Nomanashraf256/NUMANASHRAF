import { DurableObject } from 'cloudflare:workers';

const codes = /^[A-Za-z0-9_-]{24}$/;
const tokens = /^[A-Za-z0-9_-]{32}$/;
const uuid = /^[a-f0-9-]{36}$/;
const limit = 12 * 1024 * 1024;
const types = new Set(['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm',
  'video/quicktime','application/pdf','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
const random = size => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(size))))
  .replaceAll('+','-').replaceAll('/','_');
const json = data => Response.json(data, {headers:{'Cache-Control':'no-store'}});
const fail = status => new Response(null, {status});
const cursor = value => Number.isSafeInteger(Number(value)) ? Math.max(0, Number(value)) : 0;
const word = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const language = value => value === 'tr' ? 'tr' : 'en';
const digest = async token => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(token))), byte => byte.toString(16).padStart(2,'0')).join('');
const auth = request => request.headers.get('Authorization')?.match(/^Bearer ([\w-]{24})\.([\w-]{32})$/);
const protectedRoutes = new Set(['/history','/changes','/room-details','/media','/tts','/assistant']);
function send(socket, event) {
  try { socket.send(JSON.stringify(event)); } catch { /* disconnected */ }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/ws') {
      if (request.headers.get('Origin') !== url.origin) return fail(403);
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return fail(426);
      const creating = url.searchParams.get('create') === '1';
      const code = creating ? random(18) : url.searchParams.get('room');
      if (!codes.test(code || '')) return fail(400);
      url.searchParams.set('room', code);
      return env.ROOMS.getByName(code).fetch(new Request(url, request));
    }
    if (url.pathname === '/admin/room') {
      const code = url.searchParams.get('room') || '';
      if (!codes.test(code) || !env.MIGRATION_SECRET) return fail(404);
      const provided = request.headers.get('Authorization') || '';
      const expected = 'Bearer '+env.MIGRATION_SECRET;
      const a = new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(provided)));
      const b = new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(expected)));
      if (!crypto.subtle.timingSafeEqual(a,b)) return fail(403);
      return env.ROOMS.getByName(code).fetch(request);
    }
    if (protectedRoutes.has(url.pathname) || url.pathname.startsWith('/media/')) {
      const credentials = auth(request);
      if (!credentials) return fail(403);
      return env.ROOMS.getByName(credentials[1]).fetch(request);
    }
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set('Referrer-Policy','no-referrer');
    response.headers.set('X-Content-Type-Options','nosniff');
    response.headers.set('Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob: data:; frame-ancestors 'none'");
    return response;
  }
};

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), code TEXT, shared INTEGER, revision INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, token TEXT UNIQUE, name TEXT, lang TEXT, role TEXT, removed INTEGER DEFAULT 0,
         delivered INTEGER DEFAULT 0, read INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS messages (seq INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, revision INTEGER, data TEXT);
      CREATE INDEX IF NOT EXISTS message_revision ON messages(revision);
      CREATE VIRTUAL TABLE IF NOT EXISTS search USING fts5(original,translated,correction);
      CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY, message TEXT, reporter TEXT, reason TEXT, resolved INTEGER DEFAULT 0);
    `);
  }
  one(query, ...args) { return this.sql.exec(query, ...args).toArray()[0]; }
  settings() { return this.one('SELECT * FROM settings WHERE id=1'); }
  member(id) { return this.one('SELECT * FROM members WHERE id=? AND removed=0', id); }
  async authenticate(token) {
    return tokens.test(token || '') ? this.one('SELECT * FROM members WHERE token=?', await digest(token)) : null;
  }
  decode(row) { return row && {...JSON.parse(row.data), seq:row.seq, revision:row.revision}; }
  message(key) { return typeof key === 'string' ? this.decode(this.one('SELECT * FROM messages WHERE key=?', key)) : null; }
  sockets() { return this.ctx.getWebSockets().filter(ws => ws.deserializeAttachment()?.member); }
  broadcast(event, filter = () => true) {
    for (const ws of this.sockets()) if (filter(ws.deserializeAttachment().member)) send(ws,event);
  }
  presence() {
    const sockets = this.sockets();
    const ids = [...new Set(sockets.map(ws => ws.deserializeAttachment().member))];
    const call = this.call();
    const selected = [...new Set([...(call?.members || []).filter(id => ids.includes(id)), ...ids])].slice(0,2);
    const members = selected.map(id => this.member(id)).filter(Boolean)
      .map(({id,name,lang,role}) => ({id,name,lang,role,online:true}));
    this.broadcast({type:'presence', count:ids.length, members});
  }
  call() { return this.sockets().map(ws => ws.deserializeAttachment().call).find(Boolean) || null; }
  setCall(call, ids, reason = false) {
    for (const ws of this.sockets()) {
      const attachment = ws.deserializeAttachment();
      if (ids.includes(attachment.member)) {
        ws.serializeAttachment({...attachment, call});
        send(ws,{type:'call', call, reason});
      }
    }
  }
  save(message) {
    this.ctx.storage.transactionSync(() => {
      const revision = this.one('UPDATE settings SET revision=revision+1 WHERE id=1 RETURNING revision').revision;
      const row = this.one(`INSERT INTO messages(key,revision,data) VALUES(?,?,?)
        ON CONFLICT(key) DO UPDATE SET revision=excluded.revision,data=excluded.data RETURNING seq`,
        message.key, revision, JSON.stringify(message));
      message.seq = row.seq;
      message.revision = revision;
      this.sql.exec('DELETE FROM search WHERE rowid=?', row.seq);
      if (!message.deleted) this.sql.exec('INSERT INTO search(rowid,original,translated,correction) VALUES(?,?,?,?)',
        row.seq, message.original || '', message.translated || '', message.correction || '');
    });
    this.broadcast({type:'message',message});
  }
  history(params) {
    const before = cursor(params.get('before')), after = cursor(params.get('after'));
    const filters = ['seq>?'], args = [after];
    if (before) { filters.push('seq<?'); args.push(before); }
    const query = word(params.get('q'),120);
    const terms = query.match(/[\p{L}\p{N}]+/gu);
    if (terms?.length) {
      filters.push('seq IN (SELECT rowid FROM search WHERE search MATCH ?)');
      args.push(terms.map(term => '"'+term+'"*').join(' AND '));
    } else if (query) {
      filters.push("instr(data->>'original',?)>0"); args.push(query);
    }
    if (params.get('media') === '1') filters.push("data->>'kind' IN ('media','voice') AND data->>'deleted' IS NULL");
    if (params.get('pins') === '1') filters.push("data->>'pinned'=1");
    const rows = this.sql.exec('SELECT * FROM messages WHERE '+filters.join(' AND ')+
      (after ? ' ORDER BY seq ASC' : ' ORDER BY seq DESC')+' LIMIT 41', ...args).toArray();
    const page = rows.slice(0,40).map(row => this.decode(row));
    return {messages:after ? page : page.reverse(), more:rows.length>40};
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/ws') {
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      pair[1].serializeAttachment({code:url.searchParams.get('room'), create:url.searchParams.get('create')==='1'});
      return new Response(null,{status:101,webSocket:pair[0]});
    }
    if (url.pathname === '/admin/room') return this.archive(request,url);
    const credentials = auth(request);
    const member = credentials && await this.authenticate(credentials[2]);
    if (!member || member.removed) return fail(403);
    if (request.method === 'GET' && url.pathname === '/history') return json(this.history(url.searchParams));
    if (request.method === 'GET' && url.pathname === '/changes') {
      const through = Math.min(this.settings().revision,cursor(url.searchParams.get('through')));
      const rows = this.sql.exec('SELECT * FROM messages WHERE revision>? AND revision<=? ORDER BY revision LIMIT 41',
        cursor(url.searchParams.get('after')),through).toArray();
      const page = rows.slice(0,40);
      return json({messages:page.map(row=>this.decode(row)),more:rows.length>40,version:page.at(-1)?.revision ?? through});
    }
    if (request.method === 'GET' && url.pathname === '/room-details') return this.details(url.searchParams, member);
    if (request.method === 'POST' && url.pathname === '/media') return this.upload(request,url,member);
    if (request.method === 'GET' && url.pathname.startsWith('/media/')) return this.download(decodeURIComponent(url.pathname.slice(7)));
    if (request.method === 'POST' && url.pathname === '/tts') {
      const data = await request.json();
      const text = word(data.text,1500);
      if (!text || data.lang!=='en' || !this.env.AI) return fail(503);
      try {
        const result = await this.env.AI.run('@cf/deepgram/aura-2-en',{text});
        return new Response(result,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store'}});
      } catch { return fail(503); }
    }
    return fail(404);
  }
  async archive(request,url) {
    const code = url.searchParams.get('room');
    const table = url.searchParams.get('table');
    const allowed = {settings:['id','code','shared','revision'],members:['id','token','name','lang','role','removed','delivered','read'],
      messages:['seq','key','revision','data'],reports:['id','message','reporter','reason','resolved']};
    if (table==='media') {
      const key = url.searchParams.get('key') || '';
      if (!/^[a-f0-9]{16}:[a-f0-9-]{32,36}$/.test(key)) return fail(400);
      if (request.method==='GET') return this.download(key);
      if (request.method!=='PUT' || this.settings()?.shared || this.sockets().length) return fail(409);
      if (!this.message(key) || cursor(request.headers.get('Content-Length'))>limit) return fail(400);
      const bytes = await request.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength>limit) return fail(413);
      await this.env.MEDIA.put(this.objectKey(key),bytes);
      return json({saved:true});
    }
    const fields = Object.hasOwn(allowed,table) && allowed[table];
    if (!fields) return fail(400);
    if (request.method==='GET') {
      const rows = this.sql.exec('SELECT rowid AS position,* FROM '+table+
        ' WHERE rowid>? ORDER BY rowid LIMIT 40',cursor(url.searchParams.get('after'))).toArray();
      return json(rows);
    }
    if (request.method!=='POST') return fail(405);
    const rows = await request.json();
    if (!Array.isArray(rows) || rows.length>40) return fail(400);
    // Import only into a non-public room, then enable sharing explicitly after verification.
    if (this.sockets().length || this.settings()?.shared) return fail(409);
    this.ctx.storage.transactionSync(() => {
      for (const row of rows) {
        if (table==='settings' && (row.code!==code || row.id!==1)) throw Error('Room mismatch');
        this.sql.exec('INSERT OR REPLACE INTO '+table+'('+fields.join(',')+') VALUES('+
          fields.map(()=>'?').join(',')+')',...fields.map(field=>field==='shared'?0:row[field] ?? null));
        if (table==='messages') {
          const item = JSON.parse(row.data);
          this.sql.exec('DELETE FROM search WHERE rowid=?',row.seq);
          if (!item.deleted) this.sql.exec('INSERT INTO search(rowid,original,translated,correction) VALUES(?,?,?,?)',
            row.seq,item.original || '',item.translated || '',item.correction || '');
        }
      }
    });
    return json({imported:rows.length});
  }
  async join(ws, state, data) {
    if (data.type !== (state.create ? 'create' : 'join')) return ws.close(1008,'Invalid room operation');
    let settings = this.settings();
    if (state.create && settings || !state.create && !settings) {
      send(ws,{type:'error',error:'missing'}); return ws.close(1008,'Room unavailable');
    }
    let member = await this.authenticate(data.token);
    if (member?.removed || !state.create && !settings.shared && !member) {
      send(ws,{type:'error',error:member?.removed?'removed':'missing'});
      return ws.close(1008,'Room unavailable');
    }
    let token = data.token;
    if (!member) {
      token = random(24);
      const hash = await digest(token);
      const id = Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>n.toString(16).padStart(2,'0')).join('');
      this.ctx.storage.transactionSync(() => {
        if (state.create) this.sql.exec('INSERT INTO settings(id,code,shared) VALUES(1,?,1)',state.code);
        this.sql.exec('INSERT INTO members(id,token,name,lang,role) VALUES(?,?,?,?,?)',
          id,hash,word(data.name,40)||'Guest',language(data.lang),state.create?'owner':'guest');
      });
      member = this.member(id);
      settings = this.settings();
    }
    const call = this.call();
    for (const old of this.sockets()) if (old.deserializeAttachment().member === member.id) old.close(1000,'Reconnected');
    const ownCall = call?.members.includes(member.id) ? call : null;
    ws.serializeAttachment({member:member.id,call:ownCall});
    send(ws,{type:'room',code:settings.code,token,id:member.id,name:member.name,role:member.role,lang:member.lang,
      ice:JSON.parse(this.env.ICE_SERVERS || '[]'),assistant:false,call:ownCall,version:settings.revision,shared:Boolean(settings.shared),
      ...this.history(new URLSearchParams({after:cursor(data.after)}))});
    this.presence();
  }
  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > 2_100_000) return ws.close(1009,'Message too large');
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      const state = ws.deserializeAttachment();
      if (!state.member) return await this.join(ws,state,data);
      const member = this.member(state.member);
      if (!member) return ws.close(1008,'Membership unavailable');
      const staff = ['owner','moderator'].includes(member.role);
      const call = state.call;
      const onlyCall = id => call?.members.includes(id) && id !== member.id;
      const key = uuid.test(data.id || '') ? member.id+':'+data.id : null;
      switch (data.type) {
        case 'text':
        case 'voice': {
          if (!key) return;
          const prior = this.message(key);
          if (prior) return send(ws,{type:'message',message:prior});
          const message = {key,id:data.id,sender:member.id,sender_name:member.name,lang:member.lang,
            kind:data.type,original:word(data.text,1500),translated:'',status:'done',time:Date.now()};
          this.decorate(message,data);
          if (data.type === 'voice') {
            const audio = this.audio(data);
            if (!audio) return;
            // The keyed object write is conditional, so a retry cannot replace the original attachment.
            await this.env.MEDIA.put(this.objectKey(key),audio,{onlyIf:{etagDoesNotMatch:'*'}});
            const saved = this.message(key);
            if (saved) return send(ws,{type:'message',message:saved});
            message.mime = data.mime;
            message.original = 'Voice message';
          } else if (!message.original) return;
          this.save(message);
          this.ctx.waitUntil(this.enrich(message,data.type==='voice'?this.audio(data):null));
          return;
        }
        case 'typing': {
          const now = Date.now();
          if (now - (state.typing || 0) < 500) return;
          ws.serializeAttachment({...state,typing:now});
          return this.broadcast({type:'typing',id:member.id,name:member.name,active:data.active===true},id=>id!==member.id);
        }
        case 'language':
          this.sql.exec('UPDATE members SET lang=? WHERE id=?',language(data.lang),member.id);
          return this.presence();
        case 'receipt': {
          const latest = this.one('SELECT coalesce(max(seq),0) seq FROM messages').seq;
          const delivered = Math.min(latest,cursor(data.delivered));
          this.sql.exec('UPDATE members SET delivered=max(delivered,?),read=max(read,?) WHERE id=?',
            delivered,Math.min(delivered,cursor(data.read)),member.id);
          return;
        }
        case 'moderate': {
          const target = this.member(word(data.member,32));
          if (!staff || !target || target.role==='owner' || target.id===member.id) return;
          if (data.operation==='remove' && (member.role==='owner' || target.role!=='moderator')) {
            this.sql.exec('UPDATE members SET removed=1 WHERE id=?',target.id);
            for (const socket of this.sockets()) if (socket.deserializeAttachment().member===target.id) {
              send(socket,{type:'error',error:'removed'}); socket.close(1008,'Removed');
            }
          } else if (member.role==='owner' && ['promote','demote','admit'].includes(data.operation)) {
            const role = {promote:'moderator',demote:'guest',admit:'member'}[data.operation];
            this.sql.exec('UPDATE members SET role=? WHERE id=?',role,target.id);
            this.broadcast({type:'role',role},id=>id===target.id);
          }
          return this.broadcast({type:'participantsChanged'});
        }
        case 'sharing':
          if (member.role==='owner') {
            const enabled = data.enabled===true;
            this.sql.exec('UPDATE settings SET shared=?',enabled?1:0);
            this.broadcast({type:'sharing',enabled});
          }
          return;
        case 'resolve':
          if (staff) this.sql.exec('UPDATE reports SET resolved=1 WHERE id=?',cursor(data.report));
          return;
        case 'ring': {
          if (this.call()) return;
          const ids = [...new Set(this.sockets().map(socket=>socket.deserializeAttachment().member))];
          if (ids.length===2) this.setCall({id:crypto.randomUUID(),caller:member.id,state:'ringing',members:ids},ids);
          return;
        }
        case 'accept':
          if (call?.state==='ringing' && call.caller!==member.id)
            this.setCall({...call,state:'active',started:Date.now()},call.members);
          return;
        case 'leave':
        case 'hangup':
          if (call) this.setCall(null,call.members,data.reason==='declined');
          if (data.type==='leave') ws.close(1000,'Left');
          return;
        case 'signal':
          if (call?.state==='active' && data.call===call.id) this.broadcast(data,onlyCall);
          return;
        case 'phrase':
          if (call?.state==='active' && call.id===data.call && key) await this.caption(data,member,call,key);
          return;
        case 'preview': {
          const text = word(data.text,1500);
          const translation = text && await this.translate(text,member.lang);
          return send(ws,{type:'preview', ref:data.ref, status:translation?'done':'later', text:translation});
        }
      }
      const message = this.message(data.key);
      if (!message || message.deleted) return;
      const own = message.sender===member.id;
      const value = data.value;
      if (data.type==='report' && word(value,300)) {
        this.sql.exec('INSERT INTO reports(message,reporter,reason) VALUES(?,?,?)',message.key,member.id,word(value,300));
        return send(ws,{type:'reported'});
      }
      if (data.type==='forward') return await this.forward(ws,message,data);
      if (data.type==='edit' && own && message.kind==='text' && word(value,1500)) {
        Object.assign(message,{original:word(value,1500),translated:'',edited:true});
      } else if (data.type==='delete' && (staff || own)) {
        const media = ['media','voice'].includes(message.kind);
        Object.assign(message,{deleted:true,original:'',translated:'',correction:'',reactions:{},reply:null,pinned:false});
        this.save(message);
        if (media) await this.env.MEDIA.delete(this.objectKey(message.key));
        return;
      } else if (data.type==='pin' && staff) message.pinned = value===true;
      else if (data.type==='correction' && word(value,300)) message.correction = word(value,300);
      else if (data.type==='reaction' && ['👍','❤️','😂','🙌'].includes(value)) {
        message.reactions ||= {};
        if (message.reactions[member.id]===value) delete message.reactions[member.id];
        else message.reactions[member.id]=value;
      } else return;
      this.save(message);
      if (data.type==='edit') this.ctx.waitUntil(this.enrich(message,null));
    } catch (error) {
      console.error('Room event failed',error?.name);
      send(ws,{type:'error',error:'busy'});
    }
  }
  webSocketClose(ws) {
    ws.serializeAttachment({});
    this.presence();
  }
  webSocketError(ws) {
    ws.close(1011,'Connection failed');
    this.webSocketClose(ws);
  }
  audio(data) {
    if (typeof data.audio!=='string' || data.audio.length>2_000_000 ||
        !/^audio\/(webm|ogg|mp4|wav)(;[a-zA-Z0-9=., -]+)?$/.test(data.mime || '')) return null;
    try { return Uint8Array.from(atob(data.audio),letter=>letter.charCodeAt(0)); } catch { return null; }
  }
  async translate(text, lang) {
    try {
      const result = await this.env.AI.run('@cf/meta/m2m100-1.2b',
        {text,source_lang:lang,target_lang:lang==='en'?'tr':'en'});
      return result.translated_text || '';
    } catch { return ''; }
  }
  async enrich(message,audio) {
    try {
      const original = audio ? (await this.env.AI.run('@cf/openai/whisper',{audio:[...audio]})).text : message.original;
      if (!original) return;
      const translated = await this.translate(original,message.lang);
      const current = this.message(message.key);
      if (!current || current.deleted || current.original!==message.original) return;
      this.save({...current, original, translated});
    } catch { /* Original chat and voice attachment stay available. */ }
  }
  async caption(data,member,call,key) {
    const audio = this.audio(data);
    if (!audio) return;
    try {
      const result = await this.env.AI.run('@cf/openai/whisper',{audio:[...audio]});
      const original = result.text || '';
      const translated = await this.translate(original,member.lang);
      if (this.call()?.id===call.id && original) this.broadcast({type:'message',message:{kind:'phrase',call:call.id,
        key,id:data.id,sender:member.id,lang:member.lang,original,translated,status:'done',time:Date.now()}},
      id=>call.members.includes(id));
    } catch { /* Speech service unavailable. */ }
  }
  decorate(message,data) {
    const reply = this.message(data.reply);
    if (reply && !reply.deleted) message.reply = {original:reply.original.slice(0,160),
      translated:reply.translated.slice(0,160), lang:reply.lang};
    if (Array.isArray(data.mentions)) message.mentions = [...new Set(data.mentions.slice(0,20)
      .filter(id=>typeof id==='string' && /^[a-f0-9]{16}$/.test(id)))];
  }
  objectKey(key) { return this.settings().code+'/'+key; }
  async upload(request,url,member) {
    const id = url.searchParams.get('id');
    const mime = request.headers.get('Content-Type');
    const length = cursor(request.headers.get('Content-Length'));
    if (!uuid.test(id || '') || !types.has(mime)) return fail(400);
    if (!length || length > limit) return fail(413);
    const key = member.id+':'+id;
    if (this.message(key)) return json({key});
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength!==length) return fail(400);
    if (!this.member(member.id)) return fail(403);
    await this.env.MEDIA.put(this.objectKey(key),bytes,{onlyIf:{etagDoesNotMatch:'*'}});
    if (this.message(key)) return json({key});
    const message = {key,id,sender:member.id,sender_name:member.name,kind:'media',lang:member.lang,
      original:word(url.searchParams.get('name'),120)||mime,translated:'',mime,status:'done',time:Date.now()};
    this.decorate(message,{reply:url.searchParams.get('reply')});
    this.save(message);
    return json({key});
  }
  async download(key) {
    const item = this.message(key);
    if (!item || item.deleted || !['media','voice'].includes(item.kind)) return fail(404);
    const object = await this.env.MEDIA.get(this.objectKey(key));
    if (!object) return fail(404);
    const mime = item.mime.split(';')[0];
    return new Response(object.body,{headers:{'Content-Type':mime,'Cache-Control':'no-store',
      'Content-Disposition':/^(image|video|audio)\//.test(mime)?'inline':'attachment','X-Content-Type-Options':'nosniff'}});
  }
  async forward(ws,message,data) {
    if (!codes.test(data.room || '') || !tokens.test(data.token || '') || !uuid.test(data.id || '')) return;
    const destination = data.room===this.settings().code ? this : this.env.ROOMS.getByName(data.room);
    if (await destination.acceptForward(data.token,data.id,message,
      ['media','voice'].includes(message.kind)?this.objectKey(message.key):null)) send(ws,{type:'forwarded'});
  }
  async acceptForward(token,id,source,objectKey) {
    const target = await this.authenticate(token);
    if (!target || target.removed || !uuid.test(id)) return false;
    const key = target.id+':'+id;
    if (this.message(key)) return true;
    if (objectKey) {
      const object = await this.env.MEDIA.get(objectKey);
      if (!object) return false;
      await this.env.MEDIA.put(this.objectKey(key),object.body,{onlyIf:{etagDoesNotMatch:'*'}});
      if (this.message(key)) return true;
    }
    const {lang,kind,original,translated,mime} = source;
    this.save({key,id,sender:target.id,sender_name:target.name,lang,kind,original,translated,mime,
      forwarded:true,status:'done',time:Date.now()});
    return true;
  }
  details(params,member) {
    if (params.has('message')) {
      const item = this.message(params.get('message'));
      return item ? json({seq:item.seq}) : fail(404);
    }
    if (params.has('receipt')) {
      const seq = cursor(params.get('receipt'));
      const item = this.decode(this.one('SELECT * FROM messages WHERE seq=?',seq));
      if (!item || item.sender!==member.id) return fail(403);
      return json(this.one(`SELECT count(*) FILTER (WHERE delivered>=?) delivered,
        count(*) FILTER (WHERE read>=?) read FROM members WHERE id<>? AND removed=0`,seq,seq,member.id));
    }
    return json({participants:this.sql.exec('SELECT id,name,role,removed FROM members WHERE id>? ORDER BY id LIMIT 50',
      word(params.get('after'),32)).toArray(),
      reports:['owner','moderator'].includes(member.role)?this.sql.exec(
        'SELECT id,message,reason FROM reports WHERE resolved=0 ORDER BY id LIMIT 50').toArray():[]});
  }
}
