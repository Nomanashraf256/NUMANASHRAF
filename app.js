const strings = {
  en: {
    title:'Talk across languages.', intro:'A private room for translated messages, voice notes and live calls in English and Turkish.',
    create:'Create a private room', inviteLabel:'Have an invite?', join:'Join room', code:'Room code or invite link',
    room:'Private room', copy:'Copy invite', copied:'Invite copied.', leave:'Leave', call:'Call', accept:'Accept', decline:'Decline',
    end:'End call', mute:'Mute', unmute:'Unmute', record:'🎙 Record', stop:'■ Stop recording', send:'Send',
    draft:'Write a message…', footer:'Two people per room · Room history is temporary',
    waiting:'Waiting for the other person', online:'Other person connected', offline:'Other person disconnected',
    reconnect:'Reconnecting…', missed:'The call was declined.', ringing:'Calling…', incoming:'Incoming call',
    active:'Live call', connecting:'Connecting audio…', mediaFailure:'Audio connection interrupted. Reconnecting…',
    listenMode:'Listen to', translated:'Translation', original:'Original audio', both:'Both', captureMode:'Speech capture',
    auto:'Automatic', push:'Push to talk', startPhrase:'Start speaking', stopPhrase:'Finish phrase',
    ready:'Listening for speech…', recording:'Recording…', translating:'Translating…', speaking:'Playing translation…',
    pending:'Processing…', transcription:'Could not transcribe the audio.', translation:'Could not translate the message.',
    retry:'Retry', show:'Show original', play:'Play translation', empty:'Invite someone or send the first message.',
    missing:'This room is unavailable or has expired.', full:'This room already has two participants.', busy:'Server busy. Try again.',
    secure:'Microphone access requires HTTPS or localhost.', denied:'Microphone access was denied. Allow it in browser settings and try again.',
    micError:'Microphone unavailable. Check your device and browser settings.', recordingError:'Recording failed. Try again.',
    mediaUnsupported:'This browser does not support audio recording.', autoFailure:'Automatic capture unavailable. Use push to talk.',
    playback:'Playback was blocked or unavailable. Tap Play translation to retry.', disconnected:'Connection lost. Please retry after reconnecting.',
    other:'Other person', you:'You', tooLarge:'Recording too large. Try a shorter message.',
    dual:'Show both languages', previewToggle:'Preview translation', emoji:'😊 Emoji',
    faces:'Faces', gestures:'Gestures', hearts:'Hearts', extras:'Symbols',
    typing:'Other person is typing…', previewPending:'Translating draft…',
    previewLater:'Preview waits until the call or current translation finishes.',
    messageLabel:'Message', captions:'Call captions', chat:'Messages',
  },
  tr: {
    title:'Farklı dillerde sohbet edin.', intro:'İngilizce ve Türkçe mesajlar, sesli notlar ve canlı aramalar için özel bir oda.',
    create:'Özel oda oluştur', inviteLabel:'Davetiniz var mı?', join:'Odaya katıl', code:'Oda kodu veya davet bağlantısı',
    room:'Özel oda', copy:'Daveti kopyala', copied:'Davet kopyalandı.', leave:'Ayrıl', call:'Ara', accept:'Kabul et', decline:'Reddet',
    end:'Aramayı bitir', mute:'Sesi kapat', unmute:'Sesi aç', record:'🎙 Kaydet', stop:'■ Kaydı durdur', send:'Gönder',
    draft:'Mesaj yazın…', footer:'Oda iki kişiliktir · Oda geçmişi geçicidir',
    waiting:'Diğer kişi bekleniyor', online:'Diğer kişi bağlandı', offline:'Diğer kişinin bağlantısı kesildi',
    reconnect:'Yeniden bağlanıyor…', missed:'Arama reddedildi.', ringing:'Aranıyor…', incoming:'Gelen arama',
    active:'Canlı arama', connecting:'Ses bağlantısı kuruluyor…', mediaFailure:'Ses bağlantısı kesildi. Yeniden bağlanıyor…',
    listenMode:'Dinleme seçeneği', translated:'Çeviri', original:'Özgün ses', both:'Her ikisi', captureMode:'Konuşma algılama',
    auto:'Otomatik', push:'Bas ve konuş', startPhrase:'Konuşmaya başla', stopPhrase:'Konuşmayı bitir',
    ready:'Konuşma bekleniyor…', recording:'Kaydediliyor…', translating:'Çevriliyor…', speaking:'Çeviri oynatılıyor…',
    pending:'İşleniyor…', transcription:'Ses yazıya dönüştürülemedi.', translation:'Mesaj çevrilemedi.',
    retry:'Tekrar dene', show:'Orijinali göster', play:'Çeviriyi dinle', empty:'Birini davet edin veya ilk mesajı gönderin.',
    missing:'Bu oda kullanılamıyor veya süresi dolmuş.', full:'Bu odada zaten iki kişi var.', busy:'Sunucu meşgul. Tekrar deneyin.',
    secure:'Mikrofon erişimi için HTTPS veya localhost gerekir.', denied:'Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verip tekrar deneyin.',
    micError:'Mikrofona ulaşılamıyor. Cihaz ve tarayıcı ayarlarını kontrol edin.', recordingError:'Kayıt başarısız. Tekrar deneyin.',
    mediaUnsupported:'Tarayıcınız ses kaydını desteklemiyor.', autoFailure:'Otomatik algılama kullanılamıyor. Bas ve konuş seçeneğini kullanın.',
    playback:'Ses oynatılamadı. Yeniden denemek için Çeviriyi dinle düğmesine dokunun.', disconnected:'Bağlantı kesildi. Yeniden bağlanınca tekrar deneyin.',
    other:'Diğer kişi', you:'Siz', tooLarge:'Kayıt çok büyük. Daha kısa bir mesaj deneyin.',
    dual:'İki dili göster', previewToggle:'Çeviriyi önizle', emoji:'😊 Emoji',
    faces:'Yüzler', gestures:'Hareketler', hearts:'Kalpler', extras:'Simgeler',
    typing:'Diğer kişi yazıyor…', previewPending:'Taslak çevriliyor…',
    previewLater:'Önizleme, arama veya mevcut çeviri bitince kullanılabilir.',
    messageLabel:'Mesaj', captions:'Arama altyazıları', chat:'Mesajlar',
  },
};

Object.assign(strings.en, {
  appearance:'Appearance', wallpaper:'Wallpaper', rotate:'Auto Rotate', shuffle:'Shuffle Now', solid:'Solid color',
  theme:'Theme', light:'Light', dark:'Dark', search:'Search this chat', noResults:'No matching messages.',
  emojiSearch:'Find emojis or paste an emoji', recent:'Recent', quick:'Quick phrases', reply:'Reply',
  cancel:'Cancel', menu:'Message actions', correction:'Suggest a correction', corrected:'Suggested correction',
  copyOriginal:'Copy original', copyTranslation:'Copy translation', favorite:'Save phrase', unfavorite:'Remove saved phrase',
  greetings:'Greetings', travel:'Travel', everyday:'Everyday', callHelp:'On a call', saved:'Saved phrases',
  originalVolume:'Original volume', translatedVolume:'Translation volume', speed:'Voice speed', replay:'Replay translation', captionsOnly:'Captions only', share:'Share invite', ended:'Call ended.',
});
Object.assign(strings.tr, {
  appearance:'Görünüm', wallpaper:'Duvar kâğıdı', rotate:'Otomatik değiştir', shuffle:'Şimdi değiştir', solid:'Düz renk',
  theme:'Tema', light:'Açık', dark:'Koyu', search:'Sohbette ara', noResults:'Eşleşen mesaj yok.',
  emojiSearch:'Emoji ara veya yapıştır', recent:'Son kullanılanlar', quick:'Hazır ifadeler', reply:'Yanıtla',
  cancel:'İptal', menu:'Mesaj işlemleri', correction:'Düzeltme öner', corrected:'Önerilen düzeltme',
  copyOriginal:'Orijinali kopyala', copyTranslation:'Çeviriyi kopyala', favorite:'İfadeyi kaydet', unfavorite:'Kayıtlı ifadeyi kaldır',
  greetings:'Selamlaşma', travel:'Seyahat', everyday:'Günlük', callHelp:'Arama sırasında', saved:'Kayıtlı ifadeler',
  originalVolume:'Özgün ses seviyesi', translatedVolume:'Çeviri ses seviyesi', speed:'Ses hızı', replay:'Çeviriyi tekrar dinle', captionsOnly:'Yalnızca altyazı', share:'Daveti paylaş', ended:'Arama sona erdi.',
});

const $ = id => document.getElementById(id);
let language = localStorage.getItem('connect-language') === 'tr' ? 'tr' : 'en';
const t = key => strings[language][key] || key;
const otherLanguage = lang => lang === 'en' ? 'tr' : 'en';
let ws, room, id, token, ice, reconnectTimer, peerMember, joined = false;
let noticeKey = '', callNoticeKey = '', recordKey = '';
let call, pc, generation, candidates = new Map(), callMic, audioContext, worklet;
let recovering = false, recoverTimer, mediaEpoch = 0, signalQueue = Promise.resolve();
let muted = false, recording, openingRecorder = false, playback = false, playbackEpoch = 0, capturing = false;
let phraseUploads = Promise.resolve();
const messages = new Map(), phrases = new Map(), automatic = new Set(), originals = new Map();
const speechQueue = [];
const peerAudio = $('peerAudio'), spokenAudio = $('spokenAudio');
let activeSpeechCancel;
let speechIdle;
let previewRef = 0, draftTimer, typingTimer, remoteTypingTimer;
let emojiGroup = 'faces';
const emojiGroups = {
  recent: '',
  faces: '😀 😃 😄 😁 😆 😂 🤣 😊 🙂 🙃 😉 😍 🥰 😘 😎 🤩 🥳 😇 🤔 🫡 😌 😅 😬 😴 😢 😭 😤 😠 😮 😱 🙄 🫠 🤯 🤗 🤭',
  gestures: '👍 👎 👏 🙌 🤝 👋 👌 ✌️ 🤞 🙏 💪 💯 🫶 👀 🤷 🤦 👏🏽 👍🏽 👋🏽 🙏🏽 🤝🏽',
  hearts: '❤️ 🩷 🧡 💛 💚 💙 🩵 💜 🤎 🖤 🩶 🤍 💔 💞 💕 💖 💝 💘 ❣️ 🌹 ✨',
  extras: '🎉 🎊 🎂 🎁 🏆 ⭐ 🌟 ✅ ❌ ⚠️ 🔥 💬 🎙️ 📞 🌍 🇹🇷 🇬🇧 🇺🇸 ☕ 🍵 🕒 📍 🙏 ✨',
};
$('dual').checked = localStorage.getItem('connect-dual') !== 'false';
$('previewToggle').checked = localStorage.getItem('connect-preview') === 'true';

function drawEmoji() {
  $('emojiTabs').replaceChildren();
  for (const key of Object.keys(emojiGroups)) {
    const button = action(key, () => { emojiGroup = key; drawEmoji(); });
    button.setAttribute('aria-pressed', String(key === emojiGroup));
    $('emojiTabs').append(button);
  }
  $('emojiGrid').replaceChildren();
  const query = $('emojiSearch').value.trim().toLowerCase();
  const names = {'😊':'smile gülümse', '😂':'laugh gülmek', '❤️':'heart love kalp aşk', '👍':'thumbs up likes beğeni', '👏':'clap alkış', '🎉':'party kutlama', '🇹🇷':'turkey türkiye'};
  const items = query ? [...new Set(Object.values(emojiGroups).join(' ').split(' '))].filter(icon => icon.includes(query) || names[icon]?.includes(query)) :
    (emojiGroup === 'recent' ? readList('connect-recent') : emojiGroups[emojiGroup].split(' '));
  for (const emoji of items.filter(Boolean)) {
    $('emojiGrid').append(action(emoji, () => {
      const draft = $('draft');
      if (draft.value.length - (draft.selectionEnd - draft.selectionStart) + emoji.length > draft.maxLength) return;
      draft.setRangeText(emoji, draft.selectionStart, draft.selectionEnd, 'end');
      draft.focus();
      const recent = [emoji, ...readList('connect-recent').filter(item => item !== emoji)].slice(0, 20);
      localStorage.setItem('connect-recent', JSON.stringify(recent));
      updateDraft();
    }));
  }
}
function updateDraft(announce = true) {
  const ref = ++previewRef;
  clearTimeout(draftTimer);
  clearTimeout(typingTimer);
  const text = $('draft').value.trim();
  const box = $('preview');
  box.hidden = !$('previewToggle').checked || !text;
  if (announce) {
    send({type:'typing', active:Boolean(text)});
    if (text) typingTimer = setTimeout(() => send({type:'typing', active:false}), 2200);
  }
  if (box.hidden) {
    box.textContent = '';
    return;
  }
  if (call) {
    box.textContent = t('previewLater');
    return;
  }
  box.textContent = t('previewPending');
  draftTimer = setTimeout(() => {
    if (!send({type:'preview', text, ref})) box.textContent = t('disconnected');
  }, 750);
}
function showTyping(active) {
  clearTimeout(remoteTypingTimer);
  $('typingStatus').textContent = active ? t('typing') : '';
  if (active) remoteTypingTimer = setTimeout(() => showTyping(false), 3000);
}


function notice(key) {
  noticeKey = key;
  $('notice').textContent = t(key);
}
function callNotice(key) {
  callNoticeKey = key;
  drawCall();
}
function recordNotice(key) {
  recordKey = key;
  $('recordStatus').textContent = t(key);
}
function online() {
  return ws?.readyState === WebSocket.OPEN && joined;
}
function send(payload) {
  if (!online()) return false;
  ws.send(JSON.stringify(payload));
  return true;
}
function labelUI() {
  document.documentElement.lang = language;
  $('locale').value = language;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  $('code').placeholder = t('code');
  $('draft').placeholder = t('draft');
  $('draft').setAttribute('aria-label', t('messageLabel'));
  $('messages').setAttribute('aria-label', t('chat'));
  $('captions').setAttribute('aria-label', t('captions'));
  notice(noticeKey);
  recordNotice(recordKey);
  drawPresence();
  drawCall();
  drawRecord();
  drawMessages();
  $('search').placeholder = t('search');
  $('search').setAttribute('aria-label', t('search'));
  $('emojiSearch').placeholder = t('emojiSearch');
  $('emojiSearch').setAttribute('aria-label', t('emojiSearch'));
  $('copy').textContent = t('share');
  drawEmoji();
  drawQuick();
  updateDraft(false);
}
function drawPresence() {
  $('presence').textContent = t(!online() ? 'reconnect' : peerMember?.online ? 'online' : peerMember ? 'offline' : 'waiting');
  $('call').disabled = !online() || !peerMember?.online || !!call;
  $('send').disabled = !online();
}
function drawRecord() {
  $('mic').disabled = openingRecorder || (!online() && !recording) || (recording && recording.kind !== 'voice');
  $('mic').textContent = t(recording?.kind === 'voice' ? 'stop' : 'record');
  $('phrase').disabled = muted || openingRecorder || (playback && !recording) || (recording && recording.kind !== 'phrase');
  $('phrase').textContent = t(recording?.kind === 'phrase' ? 'stopPhrase' : 'startPhrase');
}
function drawCall() {
  $('callPanel').hidden = !call;
  if (!call) return;
  const active = call.state === 'active';
  const caller = call.caller === id;
  $('callState').textContent = t(active ? 'active' : caller ? 'ringing' : 'incoming');
  $('accept').hidden = active || caller;
  $('decline').hidden = active || caller;
  $('end').hidden = !active && !caller;
  $('mute').hidden = !active;
  $('mute').textContent = t(muted ? 'unmute' : 'mute');
  $('callTools').hidden = !active;
  $('phrase').hidden = $('capture').value !== 'push';
  $('callNotice').textContent = t(callNoticeKey);
  drawRecord();
}
function element(tag, text, cls) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
function action(key, handler) {
  const button = element('button', t(key));
  button.type = 'button';
  button.onclick = handler;
  return button;
}
function messageText(message) {
  return message.lang === language ? message.original : message.translated || message.original;
}
function messageRow(message, caption) {
  const own = message.sender === id;
  const row = element(caption ? 'p' : 'article', '', caption ? '' : 'bubble' + (own ? ' mine' : ''));
  row.dataset.key = message.key;
  if (!caption) {
    const query = $('search').value.trim().toLocaleLowerCase(language);
    row.hidden = Boolean(query && ![message.original, message.translated, message.correction].some(value => value?.toLocaleLowerCase(language).includes(query)));
  }
  if (!caption) {
    const time = Number.isFinite(message.time) ? ' · ' +
      new Intl.DateTimeFormat(language, {hour:'numeric', minute:'2-digit'}).format(message.time) : '';
    row.append(element('small', t(own ? 'you' : 'other') + time));
    if (message.reply) row.append(element('blockquote', messageText(message.reply)));
    const body = element('div');
    linkText(body, messageText(message));
    row.append(body);
  } else {
    row.append(element('strong', t(own ? 'you' : 'other') + ' · '), document.createTextNode(messageText(message)));
  }
  if (message.status !== 'done') row.append(element(caption ? 'span' : 'div', ' ' + t(message.status)));
  if (message.status !== 'pending' && message.status !== 'done' && own)
    row.append(action('retry', () => send({type:'retry', id:message.id}) || notice('disconnected')));
  if (message.status === 'done' && (!caption && message.kind === 'voice' || caption && !own)) {
    row.append(action('play', () => {
      unlockAudio();
      enqueueSpeech(messageText(message), language, caption ? call?.id : null);
    }));
  }
  const secondary = message.lang === language ? message.translated : message.original;
  const showSecondary = message.status === 'done' && $('dual').checked && secondary && secondary !== messageText(message);
  if (showSecondary) {
    const second = element('span', secondary, caption ? 'caption-secondary' : 'secondary');
    second.lang = message.lang === language ? otherLanguage(language) : message.lang;
    row.append(second);
  }
  if (!caption && (message.audio || (!showSecondary && secondary && secondary !== messageText(message)))) {
    const details = element('details');
    details.append(element('summary', t(message.audio || message.lang !== language ? 'show' : 'translated')));
    const detailText = message.audio ? message.original : secondary;
    if (detailText) details.append(element('div', detailText));
    if (message.audio) {
      const audio = element('audio');
      audio.controls = true;
      audio.preload = 'none';
      if (!originals.has(message.key)) {
        const bytes = Uint8Array.from(atob(message.audio), char => char.charCodeAt(0));
        originals.set(message.key, URL.createObjectURL(new Blob([bytes], {type:message.mime})));
      }
      audio.src = originals.get(message.key);
      details.append(audio);
    }
    row.append(details);
  }
  if (!caption) {
    if (message.correction) row.append(element('div', t('corrected') + ' · ' + message.correction, 'secondary'));
    const options = element('details', '', 'message-actions');
    options.append(element('summary', t('menu')));
    options.append(action('reply', () => setReply(message)));
    if (message.original) options.append(action('copyOriginal', () => copyText(message.original)));
    if (message.translated) options.append(action('copyTranslation', () => copyText(message.translated)));
    if (message.translated) options.append(action('correction', () => {
      const value = window.prompt(t('correction'));
      if (value?.trim() && value.trim().length <= 300) send({type:'correction', key:message.key, value});
    }));
    for (const emoji of ['👍','❤️','😂','🙌']) {
      const count = Object.values(message.reactions || {}).filter(value => value === emoji).length;
      const button = action(emoji + (count ? ' ' + count : ''), () => send({type:'reaction', key:message.key, value:emoji}));
      button.setAttribute('aria-pressed', String(message.reactions?.[id] === emoji));
      options.append(button);
    }
    row.append(options);
  }
  return row;
}
function putRow(list, message, caption) {
  const row = messageRow(message, caption);
  const old = [...list.children].find(item => item.dataset.key === message.key);
  if (old) {
    const details = row.querySelector('details');
    if (details && old.querySelector('details')?.open) details.open = true;
    old.replaceWith(row);
  } else {
    list.querySelector('.empty')?.remove();
    list.append(row);
    list.scrollTop = list.scrollHeight;
  }
}
function drawMessages() {
  $('messages').replaceChildren();
  for (const message of messages.values()) putRow($('messages'), message, false);
  if (!messages.size) $('messages').append(element('p', t('empty'), 'empty'));
  else if (![...$('messages').children].some(row => !row.hidden)) $('messages').append(element('p', t('noResults'), 'empty'));
  $('captions').replaceChildren();
  for (const message of phrases.values()) putRow($('captions'), message, true);
}
function removeMessage(key) {
  if (originals.has(key)) URL.revokeObjectURL(originals.get(key));
  originals.delete(key);
  messages.delete(key);
  phrases.delete(key);
  automatic.delete(key);
  for (const list of [$('messages'), $('captions')]) {
    [...list.children].find(item => item.dataset.key === key)?.remove();
  }
}
function storeMessage(message) {
  if (message.kind === 'phrase') {
    if (call?.id !== message.call) return;
    phrases.set(message.key, message);
    if (message.sender !== id && message.status === 'done') $('replay').disabled = false;
    putRow($('captions'), message, true);
    for (const phrase of phrases.values()) {
      if (phrase.sender === id || automatic.has(phrase.key)) continue;
      if (phrase.status === 'pending') break;
      if (phrase.status !== 'done') continue;
      automatic.add(phrase.key);
      if (['translated', 'both'].includes($('hear').value)) enqueueSpeech(messageText(phrase), language, call.id);
    }
    if (pc?.connectionState === 'connected') reflectCapture();
  } else {
    messages.set(message.key, message);
    putRow($('messages'), message, false);
  }
}

function connect(type, code) {
  clearTimeout(reconnectTimer);
  joined = false;
  const old = ws;
  const connection = new WebSocket(new URL('/ws', location.href.replace(/^http/, 'ws')));
  ws = connection;
  old?.close();
  $('create').disabled = true;
  $('join').querySelector('button').disabled = true;
  let rejected = false;
  connection.onopen = () => connection.send(JSON.stringify({
    type, code, lang:language, token:code ? sessionStorage.getItem('connect:' + code) : null,
  }));
  connection.onmessage = ({data}) => {
    if (connection !== ws) return;
    enableLobby();
    const event = JSON.parse(data);
    if (event.type === 'room') {
      ({code:room, id, token, ice, lang:language} = event);
      sessionStorage.setItem('connect:' + room, token);
      history.replaceState(null, '', '#room=' + room);
      joined = true;
      $('lobby').hidden = true;
      $('room').hidden = false;
      changeWallpaper();
      for (const key of messages.keys()) removeMessage(key);
      for (const message of event.messages) messages.set(message.key, message);
      labelUI();
      notice('');
      updateCall(event.call);
    } else if (event.type === 'presence') {
      const previous = peerMember?.online;
      peerMember = event.members.find(member => member.id !== id);
      drawPresence();
      if (call?.state === 'active') {
        if (!peerMember?.online) {
          closePeer();
          callNotice('reconnect');
        } else if (!previous || !pc) {
          queueSignal(() => startOffer());
        }
      }
    } else if (event.type === 'typing') showTyping(event.active);
    else if (event.type === 'preview' && event.ref === previewRef) {
      $('preview').textContent = event.status === 'done' ? event.text :
        t(event.status === 'later' ? 'previewLater' : event.status);
      $('preview').lang = event.status === 'done' ? otherLanguage(language) : language;
    } else if (event.type === 'message') storeMessage(event.message);
    else if (event.type === 'remove') removeMessage(event.key);
    else if (event.type === 'call') {
      updateCall(event.call);
      if (event.reason) notice('missed');
    } else if (event.type === 'signal') queueSignal(() => handleSignal(event));
    else if (event.type === 'error') {
      if (!joined) {
        rejected = true;
        resetRoom();
      }
      notice(event.error);
    }
  };
  connection.onclose = () => {
    if (ws !== connection || rejected) return;
    enableLobby();
    joined = false;
    peerMember = null;
    closePeer();
    drawPresence();
    drawRecord();
    if (call) callNotice('reconnect');
    if (room) reconnectTimer = setTimeout(() => connect('join', room), 950);
    else notice('disconnected');
  };
}
function enableLobby() {
  $('create').disabled = false;
  $('join').querySelector('button').disabled = false;
}
function resetRoom() {
  const previous = ws;
  enableLobby();
  ws = null;
  previous?.close();
  clearTimeout(reconnectTimer);
  if (room) sessionStorage.removeItem('connect:' + room);
  room = id = token = peerMember = null;
  joined = false;
  updateCall(null);
  stopRecording(true);
  for (const key of messages.keys()) removeMessage(key);
  $('room').hidden = true;
  $('lobby').hidden = false;
  $('code').value = '';
  $('draft').value = '';
  $('search').value = '';
  setReply(null);
  updateDraft(false);
  showTyping(false);
  history.replaceState(null, '', location.pathname);
}

async function microphone() {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('secure');
  try {
    return await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true}});
  } catch (error) {
    throw new Error(error.name === 'NotAllowedError' ? 'denied' : 'micError');
  }
}
function unlockAudio() {
  if (!audioContext || audioContext.state === 'closed') {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) audioContext = new Context();
  }
  audioContext?.resume().catch(() => {});
  window.speechSynthesis?.getVoices();
}
async function signal(type, value) {
  if (call && generation) send({type:'signal', call:call.id, generation, signal:type, value});
}
function queueSignal(job) {
  signalQueue = signalQueue.then(job).catch(() => {
    if (call) {
      callNotice('mediaFailure');
      scheduleRecovery();
    }
  });
}
function closePeer() {
  const previous = pc;
  pc = null;
  if (previous) {
    previous.onconnectionstatechange = null;
    previous.close();
  }
  generation = null;
  peerAudio.srcObject = null;
  updateCapture();
}
function scheduleRecovery() {
  if (recovering || call?.caller !== id) return;
  recovering = true;
  recoverTimer = setTimeout(() => {
    recovering = false;
    if (call?.state === 'active' && peerMember?.online && pc?.connectionState !== 'connected') {
      closePeer();
      queueSignal(() => startOffer());
    }
  }, 3500);
}
function makePeer(nextGeneration) {
  closePeer();
  generation = nextGeneration;
  const current = new RTCPeerConnection({iceServers:ice});
  pc = current;
  for (const track of callMic.getAudioTracks()) current.addTrack(track, callMic);
  current.onicecandidate = event => {
    if (event.candidate && pc === current) signal('candidate', event.candidate.toJSON());
  };
  current.ontrack = event => {
    if (pc !== current) return;
    peerAudio.srcObject = event.streams[0] || new MediaStream([event.track]);
    updateAudioMode();
  };
  current.onconnectionstatechange = () => {
    if (pc !== current) return;
    if (current.connectionState === 'connected') reflectCapture();
    else if (['disconnected', 'failed'].includes(current.connectionState)) {
      callNotice('mediaFailure');
      if (call?.caller !== id) signal('restart', null);
      scheduleRecovery();
    }
    updateCapture();
  };
  return current;
}
async function startOffer() {
  if (!online() || !peerMember?.online || call?.state !== 'active' || call.caller !== id || pc || !callMic) return;
  const current = makePeer(crypto.randomUUID());
  callNotice('connecting');
  scheduleRecovery();
  await current.setLocalDescription(await current.createOffer());
  if (current === pc) await signal('description', current.localDescription.toJSON());
}
async function handleSignal(event) {
  if (call?.id !== event.call || call?.state !== 'active' || !callMic) return;
  if (event.signal === 'restart') {
    if (call.caller === id && event.generation === generation) {
      closePeer();
      await startOffer();
    }
    return;
  }
  if (event.signal === 'candidate') {
    if (pc?.remoteDescription && generation === event.generation) await pc.addIceCandidate(event.value);
    else if (candidates.size < 12 || candidates.has(event.generation)) {
      const pending = candidates.get(event.generation) || [];
      if (pending.length < 64) pending.push(event.value);
      candidates.set(event.generation, pending);
    }
    return;
  }
  if (event.signal !== 'description') return;
  const offer = event.value?.type === 'offer';
  if (offer && call.caller !== id) makePeer(event.generation);
  if (!pc || generation !== event.generation) return;
  const current = pc;
  await current.setRemoteDescription(event.value);
  for (const candidate of candidates.get(event.generation) || []) await current.addIceCandidate(candidate);
  candidates.clear();
  if (offer) {
    await current.setLocalDescription(await current.createAnswer());
    if (current === pc) await signal('description', current.localDescription.toJSON());
  }
}
async function armCall() {
  unlockAudio();
  const epoch = mediaEpoch;
  const stream = await microphone();
  if (epoch !== mediaEpoch || !online()) {
    stream.getTracks().forEach(track => track.stop());
    return false;
  }
  callMic?.getTracks().forEach(track => track.stop());
  callMic = stream;
  configureWorklet(stream);
  return true;
}
async function configureWorklet(stream) {
  try {
    await audioContext.audioWorklet.addModule('/assets/vad.js');
    if (stream !== callMic) return;
    const input = audioContext.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(audioContext, 'phrases');
    worklet = {input, node};
    input.connect(node);
    node.connect(audioContext.destination);
    node.port.onmessage = ({data}) => {
      if (!captureEnabled()) return;
      capturing = Boolean(data.listening);
      if (data.pcm) {
        uploadPhrase(wave(data.pcm, data.rate));
        speechIdle?.();
      }
      reflectCapture();
    };
    updateCapture();
  } catch {
    if (stream === callMic) {
      $('capture').value = 'push';
      callNotice('autoFailure');
    }
  }
}
function updateCall(next) {
  const oldId = call?.id;
  const wasActive = call?.state === 'active';
  call = next;
  if (!next && wasActive) notice('ended');
  if (!next) $('replay').disabled = true;
  drawCallTime();
  if (oldId !== next?.id) updateDraft(false);
  if (!next) {
    closePeer();
    mediaEpoch++;
    candidates.clear();
    clearTimeout(recoverTimer);
    recovering = false;
    if (recording?.kind === 'phrase') stopRecording(true);
    worklet?.input.disconnect();
    worklet?.node.disconnect();
    worklet = null;
    callMic?.getTracks().forEach(track => track.stop());
    callMic = null;
    muted = capturing = false;
    if (oldId || !room) cancelSpeech();
    phrases.clear();
    automatic.clear();
    $('captions').replaceChildren();
    drawPresence();
    drawCall();
    return;
  }
  if (next.state === 'active') {
    if (!callMic) {
      callNotice('connecting');
      armCall().then(ok => { if (ok) queueSignal(() => startOffer()); })
        .catch(error => { callNotice(error.message); send({type:'hangup'}); notice(error.message); });
    } else if (!pc) {
      callNotice('connecting');
      queueSignal(() => startOffer());
    }
  } else callNotice('');
  drawPresence();
  drawCall();
}
function captureEnabled() {
  return call?.state === 'active' && online() && pc?.connectionState === 'connected' &&
    !muted && !playback && !recording && $('capture').value === 'auto';
}
function updateCapture() {
  worklet?.node.port.postMessage(Boolean(captureEnabled()));
  if (!captureEnabled()) capturing = false;
  if (!capturing && recording?.kind !== 'phrase') speechIdle?.();
  for (const track of callMic?.getAudioTracks() || []) track.enabled = !muted && !playback;
  drawRecord();
}
function reflectCapture() {
  if (pc?.connectionState !== 'connected') return;
  const pending = [...phrases.values()].some(phrase => phrase.sender === id && phrase.status === 'pending');
  callNotice(playback ? 'speaking' : recording?.kind === 'phrase' || capturing ? 'recording' :
    pending ? 'translating' : $('capture').value === 'auto' && !muted ? 'ready' : '');
}
function updateAudioMode() {
  peerAudio.muted = ['translated','captions'].includes($('hear').value);
  if (!peerAudio.muted && peerAudio.srcObject) peerAudio.play().catch(() => notice('playback'));
}

function wave(samples, rate) {
  const divisor = Math.max(1, Math.round(rate / 16000));
  const frames = Math.floor(samples.length / divisor);
  const buffer = new ArrayBuffer(44 + frames * 2);
  const bytes = new DataView(buffer);
  for (const [index, value] of [[0,'RIFF'], [8,'WAVE'], [12,'fmt '], [36,'data']])
    for (let n = 0; n < value.length; n++) bytes.setUint8(index + n, value.charCodeAt(n));
  bytes.setUint32(4, buffer.byteLength - 8, true);
  bytes.setUint32(16, 16, true);
  bytes.setUint16(20, 1, true);
  bytes.setUint16(22, 1, true);
  bytes.setUint32(24, Math.round(rate / divisor), true);
  bytes.setUint32(28, Math.round(rate / divisor) * 2, true);
  bytes.setUint16(32, 2, true);
  bytes.setUint16(34, 16, true);
  bytes.setUint32(40, frames * 2, true);
  for (let i = 0; i < frames; i++) {
    let value = 0;
    for (let n = 0; n < divisor; n++) value += samples[i * divisor + n] / divisor;
    bytes.setInt16(44 + 2 * i, Math.max(-1, Math.min(1, value)) * 32767, true);
  }
  return new Blob([buffer], {type:'audio/wav'});
}
async function sendAudio(kind, blob, callId) {
  if (blob.size > 1_450_000) return notice('tooLarge');
  if (!blob.size) return notice('recordingError');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 8192)
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  if (kind === 'phrase' && call?.id !== callId) return;
  if (!send({type:kind, id:crypto.randomUUID(), mime:blob.type, audio:btoa(binary), call:callId}))
    notice('disconnected');
}
function uploadPhrase(blob) {
  const callId = call?.id;
  callNotice('translating');
  phraseUploads = phraseUploads.then(() => sendAudio('phrase', blob, callId)).catch(() => notice('recordingError'));
}
async function toggleRecording(kind) {
  if (recording?.kind === kind) return stopRecording();
  if (recording || openingRecorder) return;
  if (!window.MediaRecorder) return notice('mediaUnsupported');
  const myRoom = room;
  const myCall = call?.id;
  let stream;
  const ownStream = kind === 'voice';
  openingRecorder = true;
  drawRecord();
  try {
    stream = ownStream ? await microphone() : callMic;
    if (!stream || myRoom !== room || !online() || (!ownStream && myCall !== call?.id)) {
      if (ownStream) stream?.getTracks().forEach(track => track.stop());
      return;
    }
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    const state = {kind, recorder, stream, ownStream, discard:false};
    recording = state;
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => { stopRecording(true); notice('recordingError'); };
    recorder.onstop = () => {
      clearTimeout(state.timer);
      if (ownStream) stream.getTracks().forEach(track => track.stop());
      if (recording === state) recording = null;
      updateCapture();
      recordNotice('');
      playQueue();
      if (state.discard || room !== myRoom) return;
      const blob = new Blob(chunks, {type:recorder.mimeType || chunks[0]?.type});
      if (kind === 'phrase') uploadPhrase(blob);
      else sendAudio(kind, blob).catch(() => notice('recordingError'));
    };
    recorder.start();
    state.timer = setTimeout(() => { if (recording === state) stopRecording(); }, ownStream ? 15000 : 10000);
    updateCapture();
    if (ownStream) recordNotice('recording');
    else reflectCapture();
  } catch (error) {
    recording = null;
    if (ownStream) stream?.getTracks().forEach(track => track.stop());
    notice(strings.en[error.message] ? error.message : 'micError');
  } finally {
    openingRecorder = false;
    drawRecord();
  }
}
function stopRecording(discard = false) {
  if (!recording) return;
  recording.discard ||= discard;
  if (recording.recorder.state !== 'inactive') recording.recorder.stop();
}

function enqueueSpeech(text, lang, callId) {
  if (!text) return;
  speechQueue.push({text, lang, callId});
  playQueue();
}
function cancelSpeech() {
  speechQueue.length = 0;
  playbackEpoch++;
  activeSpeechCancel?.();
  speechIdle?.();
}
async function beginSpeech(epoch) {
  while (epoch === playbackEpoch && (capturing || recording?.kind === 'phrase')) {
    await new Promise(resolve => { speechIdle = resolve; });
    speechIdle = null;
  }
  if (epoch !== playbackEpoch) return false;
  playback = true;
  updateCapture();
  reflectCapture();
  return true;
}
async function localSpeech(job, epoch) {
  const response = await fetch('/tts', {method:'POST', signal:AbortSignal.timeout(10000), headers:{
    'Authorization':'Bearer ' + room + '.' + token, 'Content-Type':'application/json',
  }, body:JSON.stringify({text:job.text, lang:job.lang})});
  if (!response.ok) throw new Error('TTS');
  const blob = await response.blob();
  if (!await beginSpeech(epoch)) return;
  const url = URL.createObjectURL(blob);
  try {
    spokenAudio.src = url;
    spokenAudio.volume = Number($('translatedVolume').value);
    spokenAudio.playbackRate = Number($('speed').value);
    await new Promise((resolve, reject) => {
      activeSpeechCancel = () => { spokenAudio.pause(); resolve(); };
      spokenAudio.onended = resolve;
      spokenAudio.onerror = reject;
      spokenAudio.play().catch(reject);
    });
  } catch (error) {
    if (epoch !== playbackEpoch) return;
    if (audioContext?.state !== 'running') throw error;
    const buffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
    if (epoch !== playbackEpoch) return;
    await new Promise(resolve => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = Number($('speed').value);
      const gain = audioContext.createGain();
      gain.gain.value = Number($('translatedVolume').value);
      source.connect(gain).connect(audioContext.destination);
      source.onended = () => { source.disconnect(); gain.disconnect(); resolve(); };
      activeSpeechCancel = () => source.stop();
      source.start();
    });
  } finally {
    spokenAudio.onended = spokenAudio.onerror = null;
    spokenAudio.removeAttribute('src');
    URL.revokeObjectURL(url);
  }
}
async function speak(job, epoch) {
  const synth = window.speechSynthesis;
  const voice = synth?.getVoices().find(item => item.localService && item.lang.toLowerCase().split(/[-_]/)[0] === job.lang);
  if (voice) {
    if (!await beginSpeech(epoch)) return;
    try {
      await new Promise((resolve, reject) => {
        const speech = new SpeechSynthesisUtterance(job.text);
        speech.voice = voice;
        speech.volume = Number($('translatedVolume').value);
        speech.rate = Number($('speed').value);
        speech.lang = voice.lang;
        const finish = handler => () => { clearTimeout(timer); handler(); };
        const timer = setTimeout(() => { synth.cancel(); reject(new Error('TTS timeout')); }, 45000);
        speech.onend = finish(resolve);
        speech.onerror = finish(reject);
        activeSpeechCancel = finish(() => { synth.cancel(); resolve(); });
        synth.speak(speech);
      });
      return;
    } catch {
      if (epoch !== playbackEpoch) return;
    }
  }
  if (epoch === playbackEpoch) await localSpeech(job, epoch);
}
let playingQueue = false;
async function playQueue() {
  if (playingQueue || !speechQueue.length) return;
  playingQueue = true;
  while (speechQueue.length) {
    const job = speechQueue.shift();
    if (job.callId && job.callId !== call?.id) continue;
    try {
      await speak(job, playbackEpoch);
    } catch {
      notice('playback');
    } finally {
      activeSpeechCancel = null;
      if (playback) {
        // Give speaker echo a short moment to decay before reopening the mic.
        await new Promise(resolve => setTimeout(resolve, 150));
        playback = false;
        updateCapture();
        reflectCapture();
      }
    }
  }
  playingQueue = false;
}

let replyTo;
function setReply(message) {
  replyTo = message;
  $('replyBanner').hidden = !message;
  $('replyLabel').textContent = message ? t('reply') + ' · ' + messageText(message).slice(0, 160) : '';
  if (message) $('draft').focus();
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch { window.prompt(t('copyOriginal'), text); }
}
function linkText(node, text) {
  for (const [index, part] of text.split(/(https?:\/\/[^\s<>"']+)/gi).entries()) {
    if (index % 2 === 0) {
      node.append(document.createTextNode(part));
    } else {
      const url = part.replace(/[.,!?;:]+$/, '');
      const link = element('a', url);
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      node.append(link, document.createTextNode(part.slice(url.length)));
    }
  }
}
function readList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
const quickPhrases = [
  ['greetings','Hello!','Merhaba!'],
  ['greetings','Nice to meet you.','Tanıştığımıza memnun oldum.'],
  ['travel','Where is the nearest station?','En yakın istasyon nerede?'],
  ['travel','How much does this cost?','Bu ne kadar?'],
  ['everyday','Thanks for your help.','Yardımın için teşekkürler.'],
  ['everyday','I’ll message you later.','Sana daha sonra mesaj yazacağım.'],
  ['callHelp','Could you repeat that?','Bunu tekrar eder misin?'],
  ['callHelp','I can hear you.','Seni duyabiliyorum.'],
  ['callHelp','Please speak a little more slowly.','Lütfen biraz daha yavaş konuş.'],
];
function drawQuick() {
  const container = $('quickItems');
  const favorites = readList('connect-favorites');
  container.replaceChildren();
  for (const group of ['saved','greetings','travel','everyday','callHelp']) {
    const entries = quickPhrases.filter((item, index) => group === 'saved' ? favorites.includes(index) : item[0] === group);
    if (!entries.length) continue;
    container.append(element('strong', t(group)));
    for (const entry of entries) {
      const index = quickPhrases.indexOf(entry);
      const own = entry[language === 'en' ? 1 : 2];
      const other = entry[language === 'en' ? 2 : 1];
      const row = element('div', '', 'quick-row');
      const insert = action(own, () => {
        $('draft').value = own;
        $('quick').open = false;
        $('draft').focus();
        updateDraft();
      });
      insert.append(element('small', other));
      const saved = favorites.includes(index);
      const pin = action(saved ? '★' : '☆', () => {
        const values = saved ? favorites.filter(value => value !== index) : [...favorites, index];
        localStorage.setItem('connect-favorites', JSON.stringify(values));
        drawQuick();
      });
      pin.setAttribute('aria-label', t(saved ? 'unfavorite' : 'favorite'));
      row.append(insert, pin);
      container.append(row);
    }
  }
}
const scenes = ['istanbul','coast','london','aurora'];
let activeScene = localStorage.getItem('connect-last-wallpaper') || '';
function changeWallpaper(shuffle = false) {
  const mode = $('wallpaper').value;
  if (mode === 'auto' || shuffle) {
    const next = scenes.filter(scene => scene !== activeScene);
    activeScene = next[Math.floor(Math.random() * next.length)];
  } else activeScene = mode;
  document.body.dataset.wallpaper = activeScene;
  localStorage.setItem('connect-last-wallpaper', activeScene);
}
$('wallpaper').value = localStorage.getItem('connect-wallpaper') || 'auto';
if (!$('wallpaper').value) $('wallpaper').value = 'auto';
$('wallpaper').onchange = () => {
  localStorage.setItem('connect-wallpaper', $('wallpaper').value);
  changeWallpaper();
};
$('shuffle').onclick = () => {
  changeWallpaper(true);
  if ($('wallpaper').value !== 'auto') {
    $('wallpaper').value = activeScene;
    localStorage.setItem('connect-wallpaper', activeScene);
  }
};
$('theme').value = localStorage.getItem('connect-theme') === 'dark' ? 'dark' : 'light';
$('theme').onchange = () => {
  document.body.dataset.theme = $('theme').value;
  localStorage.setItem('connect-theme', $('theme').value);
};
$('theme').onchange();
changeWallpaper();
setInterval(() => {
  if ($('wallpaper').value === 'auto' && !document.hidden && !call) changeWallpaper();
}, 45000);
$('search').oninput = drawMessages;
$('emojiSearch').oninput = drawEmoji;
$('cancelReply').onclick = () => setReply(null);
function drawCallTime() {
  const started = call?.started;
  const seconds = started ? Math.max(0, Math.floor((Date.now() - started) / 1000)) : 0;
  $('callTime').textContent = started ? Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2,'0') : '';
}
setInterval(drawCallTime, 1000);
$('originalVolume').oninput = () => { peerAudio.volume = Number($('originalVolume').value); };
$('translatedVolume').oninput = () => { spokenAudio.volume = Number($('translatedVolume').value); };
$('speed').onchange = () => { spokenAudio.playbackRate = Number($('speed').value); };
$('replay').onclick = () => {
  const last = [...phrases.values()].reverse().find(phrase => phrase.sender !== id && phrase.status === 'done');
  if (last && call) {
    unlockAudio();
    enqueueSpeech(messageText(last), language, call.id);
  }
};

$('locale').onchange = () => {
  language = $('locale').value;
  localStorage.setItem('connect-language', language);
  send({type:'language', lang:language});
  labelUI();
};
$('create').onclick = () => { notice(''); connect('create'); };
$('join').onsubmit = event => {
  event.preventDefault();
  const value = $('code').value.trim();
  const code = value.match(/(?:^|#room=)([A-Za-z0-9_-]{24})$/)?.[1];
  if (!code) return notice('missing');
  notice('');
  connect('join', code);
};
$('copy').onclick = async () => {
  try {
    if (navigator.share) {
      try { await navigator.share({title:document.title, url:location.href}); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    await navigator.clipboard.writeText(location.href);
    notice('copied');
  } catch {
    window.prompt(t('code'), location.href);
  }
};
$('leave').onclick = () => { send({type:'leave'}); resetRoom(); notice(''); };
$('draft').addEventListener('input', () => updateDraft());
$('dual').onchange = () => {
  localStorage.setItem('connect-dual', String($('dual').checked));
  drawMessages();
};
$('previewToggle').onchange = () => {
  localStorage.setItem('connect-preview', String($('previewToggle').checked));
  updateDraft(false);
};
$('compose').onsubmit = event => {
  event.preventDefault();
  const text = $('draft').value.trim();
  if (text && send({type:'text', id:crypto.randomUUID(), text, reply:replyTo?.key})) {
    $('draft').value = '';
    $('emojiPicker').open = false;
    setReply(null);
    updateDraft();
    notice('');
  }
};
$('mic').onclick = () => toggleRecording('voice');
$('phrase').onclick = () => toggleRecording('phrase');
async function callAction(type, button) {
  notice('');
  button.disabled = true;
  try {
    if (await armCall() && !send({type})) throw new Error('disconnected');
  } catch (error) {
    notice(error.message);
  } finally {
    button.disabled = false;
    drawPresence();
  }
}
$('call').onclick = () => callAction('ring', $('call'));
$('accept').onclick = () => callAction('accept', $('accept'));
$('decline').onclick = () => send({type:'hangup', reason:'declined'});
$('end').onclick = () => send({type:'hangup'});
$('mute').onclick = () => {
  muted = !muted;
  if (muted && recording?.kind === 'phrase') stopRecording(true);
  updateCapture();
  reflectCapture();
  drawCall();
};
$('hear').onchange = () => {
  unlockAudio();
  if (['original','captions'].includes($('hear').value)) cancelSpeech();
  updateAudioMode();
};
$('capture').onchange = () => {
  unlockAudio();
  if ($('capture').value === 'auto' && !worklet) {
    $('capture').value = 'push';
    return callNotice('autoFailure');
  }
  if ($('capture').value === 'auto' && recording?.kind === 'phrase') stopRecording();
  updateCapture();
  reflectCapture();
  drawCall();
};
window.addEventListener('pagehide', () => { ws?.close(); callMic?.getTracks().forEach(track => track.stop()); });
labelUI();
const invite = location.hash.match(/^#room=([A-Za-z0-9_-]{24})$/)?.[1];
if (invite) {
  $('code').value = invite;
  if (sessionStorage.getItem('connect:' + invite)) connect('join', invite);
}
