
const API_URL = 'http://localhost:3000';               
const LOGIN_PAGE = '../login/login.html';                    
const getToken = () => localStorage.getItem('token');  

let currentUser = { id: null, name: '' };            

const messagesEl = document.getElementById('messages');
const loaderEl = document.getElementById('loader');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send');
const jumpBtn = document.getElementById('jump');
const jumpCount = document.getElementById('jump-count');

let messages = [];     
let unseen = 0;
let lastRendered = { day: null, userId: null };


const NEAR_BOTTOM_PX = 80;
const isNearBottom = () =>
  messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < NEAR_BOTTOM_PX;

const scrollToBottom = (smooth = true) =>
  messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });

const formatTime = d =>
  new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function dayLabel(d) {
  const date = new Date(d), today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}


function colorFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 45%)`;
}


function buildMessage(m, prev) {
  const frag = document.createDocumentFragment();
  const day = dayLabel(m.createdAt);
  const prevDay = prev ? dayLabel(prev.createdAt) : null;

  if (day !== prevDay) {
    const d = document.createElement('div');
    d.className = 'day';
    d.textContent = day;
    frag.appendChild(d);
  }

  const mine = m.userId === currentUser.id;
  const same = prev && prev.userId === m.userId && day === prevDay;

  const el = document.createElement('article');
  el.className = `msg ${mine ? 'mine' : 'theirs'}${same ? ' same' : ''}`;

  if (!mine && !same) {
    const s = document.createElement('div');
    s.className = 'sender';
    s.textContent = m.name;
    s.style.color = colorFor(m.name);
    el.appendChild(s);
  }

  const t = document.createElement('span');
  t.className = 'text';
  t.textContent = m.text;               

  const time = document.createElement('time');
  time.className = 'time';
  time.dateTime = new Date(m.createdAt).toISOString();
  time.textContent = formatTime(m.createdAt);

  el.append(t, time);
  frag.appendChild(el);
  return frag;
}

function appendMessage(m) {
  if (messages.some(x => x.id === m.id)) return;
  const wasNearBottom = isNearBottom();
  const mine = m.userId === currentUser.id;
  const prev = messages[messages.length - 1];
  messages.push(m);
  messagesEl.appendChild(buildMessage(m, prev));

  if (mine || wasNearBottom) {
    scrollToBottom();
  } else {
    unseen++;
    jumpCount.textContent = unseen;
    jumpBtn.hidden = false;
  }
}


function prependMessages(older) {
  if (!older.length) return;
  const prevHeight = messagesEl.scrollHeight;
  messages = [...older, ...messages];
  
  messagesEl.querySelectorAll('.msg, .day').forEach(n => n.remove());
  let prev = null;
  for (const m of messages) {
    messagesEl.appendChild(buildMessage(m, prev));
    prev = m;
  }
  messagesEl.style.scrollBehavior = 'auto';
  messagesEl.scrollTop = messagesEl.scrollHeight - prevHeight;
  messagesEl.style.scrollBehavior = '';
}


messagesEl.addEventListener('scroll', () => {
  if (isNearBottom()) {
    unseen = 0;
    jumpBtn.hidden = true;
  }
  if (messagesEl.scrollTop < 40) loadOlder();
});
jumpBtn.addEventListener('click', () => scrollToBottom());

let loadingOlder = false;
async function loadOlder() {
  if (loadingOlder || !messages.length) return;
  loadingOlder = true;
  loaderEl.hidden = false;
  try {
    const older = await fetchOlderMessages(messages[0]);
    prependMessages(older);
  } finally {
    loaderEl.hidden = true;
    loadingOlder = false;
  }
}


function autoGrow() {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
  sendBtn.disabled = !inputEl.value.trim();
}
inputEl.addEventListener('input', autoGrow);
inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {   
    e.preventDefault();
    send();
  }
});
sendBtn.addEventListener('click', send);

async function send() {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';
  autoGrow();
  inputEl.focus();

  try {
    const msg = await postMessage(text);
    appendMessage(msg);
  } catch (err) {
    inputEl.value = text;                  
    autoGrow();
    alert(err.message || 'Could not send message');
  }
}


function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: getToken() };
}

function handleAuthFailure(res) {
  if (res.status === 401) {
    window.location.href = LOGIN_PAGE;
    throw new Error('Please log in again');
  }
}

async function postMessage(text) {
  const res = await fetch(`${API_URL}/chat/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message: text }),
  });
  handleAuthFailure(res);
  const body = await res.json();
  if (!res.ok) throw new Error(body.message);
  return body.data;                          
}

async function fetchOlderMessages(oldest) {
  return [];                                 // pagination comes later; all messages load at start
}


async function init() {
  if (!getToken()) { window.location.href = LOGIN_PAGE; return; }

  const res = await fetch(`${API_URL}/chat/messages`, { headers: authHeaders() });
  handleAuthFailure(res);
  const body = await res.json();
  if (!res.ok) { alert(body.message); return; }

  currentUser = body.currentUser;
  let prev = null;
  for (const m of body.data) {
    messages.push(m);
    messagesEl.appendChild(buildMessage(m, prev));
    prev = m;
  }
  scrollToBottom(false);
  autoGrow();
  const socket = io(API_URL);
  socket.on('connect', () => console.log('Connected to server:', socket.id));
  socket.on('disconnect', () => console.log('Disconnected from server'));
  socket.on('connect_error', (err) => console.log('Socket error:', err.message));
  socket.on('newMessage', (msg) => appendMessage(msg));
}
init().catch(err => alert('Could not load chat: ' + err.message));