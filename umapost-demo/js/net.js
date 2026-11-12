// 通信の層。テーブルは使わず、メッセージのやりとりだけで全員の画面をそろえる。
// - スクリーンと進行役のタブが「いまの状態」を持ち、5秒ごとに全員へ配り直す。
// - 参加者は馬券を1通送るだけ。届いていなければ自動で送り直す。
// Supabase の URL とキーがあればそれを使い、なければ同じブラウザのタブどうしでつなぐ。
(function () {
  var U = window.U, cb = {}, role = 'p', me = '', keeper = false, tx = null, up = false;
  var DEF = { stage: 'lobby', free: false, race_no: 1, result: null, next_at: null, epoch: 0, v: 0 };
  var state = Object.assign({}, DEF, { v: -1 }), tickets = {};
  var K = 'umademo:' + U.code + ':';

  function list() { return Object.keys(tickets).map(function (k) { return tickets[k]; }).sort(function (a, b) { return a.at - b.at; }); }
  function emitState() { if (cb.onState) cb.onState(Object.assign({}, state)); }
  function emitTickets() { if (cb.onTickets) cb.onTickets(list()); }
  function newer(a, b) { return a.epoch > b.epoch || (a.epoch === b.epoch && a.v > b.v); }
  function store(k, v) { try { if (v === undefined) { var s = localStorage.getItem(K + k); return s ? JSON.parse(s) : null; } localStorage.setItem(K + k, JSON.stringify(v)); } catch (e) { } return null; }
  function save() {
    if (keeper) store('keeper', { s: state, t: list() });
    else store('mine:' + U.uid(), list().filter(function (t) { return t.user_id === U.uid(); }));
  }
  function mergeTicket(t) {
    if (!t || t.epoch !== state.epoch) return false;
    var k = t.race_no + '|' + t.user_id, o = tickets[k]; if (o && o.at >= t.at) return false;
    tickets[k] = t; return true;
  }
  function applySnap(p) {
    var sc = false, tc = false;
    if (p.s && newer(p.s, state)) { if (p.s.epoch !== state.epoch) { Object.keys(tickets).forEach(function (k) { if (tickets[k].epoch !== p.s.epoch) delete tickets[k]; }); tc = true; } state = p.s; sc = true; }
    if (p.s && p.s.epoch === state.epoch) (p.t || []).forEach(function (t) { if (mergeTicket(t)) tc = true; });
    if (sc) emitState(); if (tc) emitTickets(); if (sc || tc) save();
    // 自分の馬券が相手に届いていなければ送り直す
    if (!keeper && p.s && p.s.epoch === state.epoch) {
      var got = {}; (p.t || []).forEach(function (t) { got[t.race_no + '|' + t.user_id] = t.at; });
      list().forEach(function (t) { if (t.user_id === U.uid() && !(got[t.id] >= t.at)) tx.send('ticket', t); });
    }
  }
  function sendSnap() { if (keeper && up) tx.send('snap', { s: state, t: list() }); }
  function onMsg(m) {
    if (!m || m.from === me) return;
    if (m.t === 'snap') applySnap(m.p);
    else if (m.t === 'hello') { if (keeper) setTimeout(sendSnap, 50 + Math.random() * 250); }
    else if (m.t === 'ticket') { if (mergeTicket(m.p)) { emitTickets(); save(); } }
    else if (m.t === 'cheer') { if (cb.onCheer) cb.onCheer(m.p); }
    else if (m.t === 'react') { if (cb.onReact) cb.onReact(m.p); }
  }
  function onUp(ok) {
    up = ok; if (cb.onLink) cb.onLink(ok);
    if (ok) { tx.send('hello', {}); if (keeper) sendSnap(); }
  }

  // ---------- つなぎ方 1: 同じブラウザのタブどうし（お試し） ----------
  function LocalTx() {
    var bc = null, peers = {};
    function count() { var now = Date.now(), n = 0; for (var id in peers) if (now - peers[id] < 7000) n++; if (cb.onPresence) cb.onPresence(n); }
    return {
      start: function () {
        if (!window.BroadcastChannel) { onUp(false); return; }
        bc = new BroadcastChannel(K);
        bc.onmessage = function (e) { var m = e.data || {}; if (m.t === 'ping') { peers[m.from] = Date.now(); count(); } else onMsg(m); };
        function ping() { if (role === 'p') { peers[me] = Date.now(); bc.postMessage({ t: 'ping', from: me }); } count(); }
        ping(); setInterval(ping, 2500); onUp(true);
      },
      send: function (t, p) { if (bc) bc.postMessage({ t: t, p: p, from: me }); }
    };
  }

  // ---------- つなぎ方 2: Supabase Realtime（本番） ----------
  function SupaTx() {
    var ch = null;
    return {
      start: function () {
        var sb = window.supabase.createClient(U.cfg.SUPABASE_URL, U.cfg.SUPABASE_ANON_KEY, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 20 } } });
        ch = sb.channel('umademo:' + U.code, { config: { broadcast: { self: false }, presence: { key: me } } });
        ch.on('broadcast', { event: 'm' }, function (m) { onMsg(m.payload); })
          .on('presence', { event: 'sync' }, function () {
            var st = ch.presenceState(), n = 0; for (var k in st) (st[k] || []).forEach(function (x) { if (x.role === 'p') n++; });
            if (cb.onPresence) cb.onPresence(n);
          })
          .subscribe(function (s) { var ok = s === 'SUBSCRIBED'; if (ok) ch.track({ role: role }); onUp(ok); });
      },
      send: function (t, p) { if (ch && up) ch.send({ type: 'broadcast', event: 'm', payload: { t: t, p: p, from: me } }); }
    };
  }

  window.Net = {
    mock: U.mock,
    init: function (opts) {
      cb = opts || {}; role = cb.role || 'p'; keeper = role !== 'p';
      me = U.uid() + ':' + role + ':' + Math.random().toString(36).slice(2, 7);
      if (keeper) { var k = store('keeper'); if (k && k.s) { state = k.s; (k.t || []).forEach(function (t) { tickets[t.id] = t; }); } else state = Object.assign({}, DEF); }
      else { (store('mine:' + U.uid()) || []).forEach(function (t) { tickets[t.id] = t; }); }
      tx = U.mock ? LocalTx() : SupaTx();
      try { tx.start(); } catch (e) { return Promise.reject(e); }
      if (keeper) setInterval(sendSnap, 5000);
      else setInterval(function () { if (up && state.v < 0) tx.send('hello', {}); }, 3000);
      emitState(); emitTickets();
      return Promise.resolve();
    },
    ready: function () { return state.v >= 0; },
    state: function () { return Object.assign({}, state); },
    tickets: list,
    // 場面の切り替え（スクリーンと進行役だけが使う）
    setState: function (p) { state = Object.assign({}, state, p, { v: Date.now() }); save(); sendSnap(); emitState(); return Promise.resolve(); },
    reset: function () { var now = Date.now(); state = Object.assign({}, DEF, { epoch: now, v: now }); tickets = {}; save(); sendSnap(); emitState(); emitTickets(); return Promise.resolve(); },
    postTicket: function (t) {
      if (state.v < 0) return Promise.reject(new Error('まだつながっていません'));
      var x = { id: t.race_no + '|' + t.user_id, race_no: t.race_no, user_id: t.user_id, name: t.name, horse: t.horse, skin: t.skin, epoch: state.epoch, at: Date.now() };
      mergeTicket(x); save(); tx.send('ticket', x); emitTickets(); return Promise.resolve();
    },
    cheer: function (p) { tx.send('cheer', p); if (cb.onCheer) cb.onCheer(p); },
    react: function (p) { tx.send('react', p); if (cb.onReact) cb.onReact(p); }
  };
})();
