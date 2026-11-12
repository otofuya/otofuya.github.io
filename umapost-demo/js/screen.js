// 会場のスクリーン。?key=進行役の合言葉 を付けて開くと、自由タイムの自動進行も受け持つ。
(function () {
  var U = window.U, Net = window.Net, cv = document.getElementById('cv'), g = cv.getContext('2d');
  var W = 0, H = 0, D = 1, K = 1, S = null, T = [], count = 0, t0 = 0;
  var pile = [], fall = [], hm = [], seen = {}, pileKey = '', cheers = [], dust = [];
  var raceStart = 0, raceKey = '', raceDone = false, pending = '', driver = false;
  U.keyOk().then(function (ok) { driver = ok; });
  var F = '"M PLUS Rounded 1c","Hiragino Sans","Yu Gothic",Meiryo,sans-serif', FD = '"Dela Gothic One","Hiragino Sans",sans-serif';
  var SKIN = { normal: '#FCFCF7', silver: '#DDE1E6', gold: '#F2D777', aurora: '#E3E9FF', sakura: '#FBD3DF' };
  var GATE = 3, TR = 11;
  function $(id) { return document.getElementById(id); }

  function rs() { D = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight; K = H / 1080; cv.width = Math.round(W * D); cv.height = Math.round(H * D); rebuildPile(); }
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function el(x, y, a, b) { g.beginPath(); g.ellipse(x, y, a, b, 0, 0, 6.283); g.fill(); }

  // ---------- QR ----------
  var joinUrl = (function () { var u = new URL('index.html', location.href); u.search = ''; u.searchParams.set('e', U.code); if (new URLSearchParams(location.search).get('mock') === '1') u.searchParams.set('mock', '1'); return u.toString(); })();
  function drawQR(c) {
    var q = window.qrcode(0, 'M'); q.addData(joinUrl); q.make();
    var n = q.getModuleCount(), cell = 10, m = 2, x = c.getContext('2d'); c.width = c.height = (n + m * 2) * cell;
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#1F2B25';
    for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + m) * cell, (r + m) * cell, cell, cell);
  }
  drawQR($('qr')); drawQR($('qr2')); $('url').textContent = joinUrl.replace(/^https?:\/\//, '');

  // ---------- 馬券の山 ----------
  function geo() { return { cx: W * 0.66, cy: H * 0.6, rx: W * 0.27, ry: H * 0.3 }; }
  function ground() { var o = geo(); return o.cy + o.ry * 0.3; }
  function col(x) { return Math.max(0, Math.min(hm.length - 1, Math.round(x / (20 * K)))); }
  function surf(x) { return ground() - (hm[col(x)] || 0); }
  function foot(x, w) { var a = col(x - w / 2), b = col(x + w / 2); for (var i = a; i <= b; i++) { var u = (i * 20 * K - x) / (w / 2); hm[i] = (hm[i] || 0) + 12 * K * Math.max(0, 1 - u * u); } }
  function mk(t) { var o = geo(), s = (0.95 + Math.random() * 0.25) * K; return { t: t, s: s, bx: o.cx + (Math.random() - 0.5) * o.rx * 0.85, x: 0, y: -(100 + Math.random() * 200) * K, sp: (260 + Math.random() * 80) * K, half: 1 + Math.random(), amp: (60 + Math.random() * 70) * K, th: 0.25 + Math.random() * 0.2, ph: Math.random() * 2, el: 0, rot: 0 }; }
  function land(o) { o.rot = (Math.random() - 0.5) * 0.3; o.y = surf(o.x) - 124 * o.s * 0.42; foot(o.x, 210 * o.s * 0.8); pile.push(o); var mx = 0; for (var i = 0; i < hm.length; i++) mx = Math.max(mx, hm[i] || 0); if (mx > H * 0.42) { for (i = 0; i < hm.length; i++) hm[i] = Math.max(0, (hm[i] || 0) - 40 * K); for (i = 0; i < pile.length; i++) pile[i].y += 40 * K; } }
  function rebuildPile() { hm = []; for (var i = 0; i <= Math.ceil(W / (20 * K)); i++) hm.push(0); pile = []; fall = []; seen = {}; syncPile(true); }
  function syncPile(instant) {
    if (!S || !W) return;
    var key = S.epoch + ':' + S.race_no; if (key !== pileKey) { pileKey = key; hm = hm.map(function () { return 0; }); pile = []; fall = []; seen = {}; instant = true; }
    T.forEach(function (t) {
      if (t.race_no !== S.race_no) return;
      if (seen[t.id]) { seen[t.id].t = t; return; }
      var o = mk(t); seen[t.id] = o;
      if (instant) { o.x = o.bx; land(o); } else fall.push(o);
    });
  }
  function tk(o) {
    var t = o.t, s = o.s, w = 210 * s, h = 124 * s, x0 = -w / 2, y0 = -h / 2, hs = U.horse(t.horse);
    g.save(); g.translate(o.x, o.y); g.rotate(o.rot);
    g.shadowColor = 'rgba(21,40,30,0.25)'; g.shadowBlur = 10 * s; g.shadowOffsetY = 4 * s; rr(x0, y0, w, h, 8 * s); g.fillStyle = SKIN[t.skin] || SKIN.normal; g.fill(); g.shadowColor = 'transparent';
    g.lineWidth = 2 * s; g.strokeStyle = '#CFCBBD'; g.stroke();
    g.fillStyle = hs.bg; rr(x0 + 10 * s, y0 + 10 * s, 76 * s, h - 20 * s, 8 * s); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.stroke();
    g.fillStyle = hs.fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = Math.round(60 * s) + 'px ' + FD; g.fillText(String(hs.n), x0 + 48 * s, 4 * s);
    g.fillStyle = '#1A1A1A'; g.textAlign = 'left'; g.font = '800 ' + Math.round(24 * s) + 'px ' + F; g.fillText('単勝', x0 + 98 * s, y0 + 30 * s);
    g.font = '800 ' + Math.round(24 * s) + 'px ' + F; var nm = String(t.name || 'ゲスト'); if (nm.length > 5) nm = nm.slice(0, 4) + '…'; g.fillText(nm, x0 + 98 * s, y0 + 90 * s);
    g.restore();
  }
  function scenePile(dt) {
    var o = geo();
    g.fillStyle = 'rgba(21,40,30,0.10)'; el(o.cx, o.cy + 20 * K, o.rx * 1.02, o.ry * 1.02); g.fillStyle = '#4E9A5B'; el(o.cx, o.cy, o.rx, o.ry); g.fillStyle = '#B98558'; el(o.cx, o.cy, o.rx * 0.9, o.ry * 0.86); g.fillStyle = '#9CCB8A'; el(o.cx, o.cy, o.rx * 0.7, o.ry * 0.6);
    g.strokeStyle = '#FFFFFF'; g.lineWidth = 4 * K; g.beginPath(); g.ellipse(o.cx, o.cy, o.rx * 0.9, o.ry * 0.86, 0, 0, 6.283); g.stroke(); g.beginPath(); g.ellipse(o.cx, o.cy, o.rx * 0.7, o.ry * 0.6, 0, 0, 6.283); g.stroke();
    for (var i = fall.length - 1; i >= 0; i--) { var f = fall[i]; f.el += dt; var tau = f.el / f.half + f.ph, k = Math.floor(tau), fr = tau - k, e0 = (1 - Math.cos(Math.PI * fr)) / 2, cc = 2 * (k % 2 === 0 ? e0 : 1 - e0) - 1; f.y += f.sp * dt; f.x = f.bx + f.amp * 0.5 * cc; f.rot = -f.th * cc; if (f.y > 0 && f.y + 124 * f.s * 0.42 >= surf(f.x)) { fall.splice(i, 1); land(f); } }
    pile.forEach(tk); fall.forEach(tk);
  }

  // ---------- レース ----------
  function leg(ax, ay, p, c, dir, w) { var a1 = 0.6 * Math.sin(p), a2 = Math.max(0, Math.sin(p + 1.2)), kx = ax + 24 * Math.sin(a1), ky = ay + 24 * Math.cos(a1), b = a1 + dir * 0.9 * a2, fx = kx + 24 * Math.sin(b), fy = ky + 24 * Math.cos(b); g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke(); return [fx, fy]; }
  function horse(n, x, y, s, p, run) {
    var hs = U.horse(n), coat = hs.coat, dark = '#1E140C', sk = hs.bg; g.save(); g.translate(x, y); g.scale(-s, s); if (run) g.translate(0, -5 * Math.abs(Math.sin(p)));
    var q = run ? p : 0; leg(-34, 8, q + 0.6, dark, 1, 6); var hf = leg(30, 8, q + Math.PI + 0.6, dark, -1, 6);
    g.strokeStyle = dark; g.lineWidth = 7; g.beginPath(); g.moveTo(50, -10); g.quadraticCurveTo(70, -16 + 6 * Math.sin(q), 86, 4 + 8 * Math.sin(q + 1)); g.stroke();
    g.fillStyle = coat; g.beginPath(); g.ellipse(0, 0, 54, 21, 0, 0, 6.283); g.fill();
    g.beginPath(); g.moveTo(-40, -12); g.lineTo(-64, -48); g.lineTo(-50, -54); g.lineTo(-22, -14); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-64, -54); g.lineTo(-96, -38); g.lineTo(-98, -29); g.lineTo(-86, -27); g.lineTo(-56, -40); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-58, -54); g.lineTo(-56, -66); g.lineTo(-50, -54); g.closePath(); g.fill();
    g.strokeStyle = dark; g.lineWidth = 5; g.beginPath(); g.moveTo(-54, -54); g.lineTo(-28, -16); g.stroke();
    leg(-30, 10, q, coat, 1, 7); leg(34, 10, q + Math.PI, coat, -1, 7);
    g.fillStyle = '#FFFFFF'; g.fillRect(-2, -9, 28, 22);
    g.fillStyle = sk; g.strokeStyle = n === 1 ? '#1F2B25' : 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, -20); g.lineTo(-30, -46); g.lineTo(-18, -52); g.lineTo(6, -26); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = sk; g.lineWidth = 6; g.beginPath(); g.moveTo(-24, -46); g.lineTo(-46, -38 + 3 * Math.sin(q * 2)); g.stroke();
    g.fillStyle = '#F1D3B5'; g.beginPath(); g.arc(-30, -58, 8, 0, 6.283); g.fill(); g.fillStyle = sk; g.beginPath(); g.arc(-30, -60, 8.6, 3.14, 6.283); g.fill();
    g.restore(); return [x - hf[0] * s, y + hf[1] * s];
  }
  function tag(n, x, y, win) {
    var hs = U.horse(n), z = 52 * K; g.fillStyle = hs.bg; rr(x - z / 2, y - z / 2, z, z, 10 * K); g.fill(); g.lineWidth = 3 * K; g.strokeStyle = n === 1 ? '#1F2B25' : '#FFFFFF'; g.stroke();
    g.fillStyle = hs.fg; g.font = '900 ' + Math.round(34 * K) + 'px Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), x, y + 2 * K);
    if (win) { g.fillStyle = '#F2B01E'; rr(x - 46 * K, y - 76 * K, 92 * K, 42 * K, 21 * K); g.fill(); g.fillStyle = '#1F2B25'; g.font = '800 ' + Math.round(26 * K) + 'px ' + F; g.fillText('1着', x, y - 54 * K); }
  }
  function big(t, c) { g.font = Math.round(120 * K) + 'px ' + FD; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 16 * K; g.strokeStyle = '#FFFFFF'; g.strokeText(t, W * 0.5, H * 0.17); g.fillStyle = c; g.fillText(t, W * 0.5, H * 0.17); }
  var A = [0.06, 0.10, 0.0, -0.02, -0.09, 0.03, 0.02, -0.04], B = [0, 0.02, 0.03, -0.02, -0.03, -0.03, 0.03, 0.02];
  function sceneRace(dt) {
    var order = (S.result && S.result.length === 8) ? S.result : U.FIXED, rank = {}; order.forEach(function (n, i) { rank[n] = i; });
    var r = (performance.now() - raceStart) / 1000 - GATE, y0 = H * 0.27, xs = W * 0.145, xf = W * 0.87, x, i = 0, tags = [], lastFin = 0;
    g.fillStyle = '#2F8656'; for (x = 0; x < W + 80 * K; x += 64 * K) { g.beginPath(); g.arc(x, y0 - 18 * K, (36 + (i * 37) % 17) * K, 0, 6.283); g.fill(); i++; }
    var gr = g.createLinearGradient(0, y0, 0, H); gr.addColorStop(0, '#8CC27A'); gr.addColorStop(1, '#2F8656'); g.fillStyle = gr; g.fillRect(0, y0, W, H - y0);
    g.fillStyle = '#FFFFFF'; g.fillRect(0, y0 - 10 * K, W, 8 * K); for (x = 0; x < W; x += 150 * K) g.fillRect(x, y0 - 44 * K, 7 * K, 44 * K);
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(xf, y0, 8 * K, H - y0); g.fillStyle = '#D2352B'; g.fillRect(xf - 8 * K, y0 - 150 * K, 24 * K, 150 * K); g.fillStyle = '#FFFFFF'; g.fillRect(xf - 8 * K, y0 - 150 * K, 24 * K, 34 * K);
    for (var n = 1; n <= 8; n++) {
      var l = n - 1, s = K * (0.7 + l * 0.04), y = H * 0.36 + l * H * 0.082, ti = TR * (1 + 0.02 * rank[n]), nose; lastFin = Math.max(lastFin, ti);
      if (r <= 0) nose = xs; else if (r < ti) { var tau = r / ti; nose = xs + (xf - xs) * (tau + A[l] * Math.sin(Math.PI * tau) + B[l] * Math.sin(2 * Math.PI * tau)); } else nose = xf + (200 - 22 * rank[n]) * K * (1 - Math.exp(-(r - ti) * 1.1));
      var run = r > 0, p = Math.max(0, r) * 2 * Math.PI * 2.4 + n * 0.9, hoof = horse(n, nose - 98 * s, y, s, p, run);
      tags.push([n, nose - 184 * s - 44 * K, y - 8 * s, rank[n] === 0 && r > ti + 0.3]);
      if (run && r < ti + 1 && Math.random() < 0.45) dust.push({ x: hoof[0], y: hoof[1], vx: -(60 + Math.random() * 90) * K, vy: -(18 + Math.random() * 26) * K, l: 0.7, z: (6 + Math.random() * 7) * K });
    }
    for (i = dust.length - 1; i >= 0; i--) { var d = dust[i]; d.l -= dt; if (d.l <= 0) { dust.splice(i, 1); continue; } d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 40 * K * dt; g.fillStyle = 'rgba(150,120,80,' + (d.l * 0.6).toFixed(3) + ')'; g.fillRect(d.x, d.y, d.z, d.z); }
    if (dust.length > 300) dust.splice(0, dust.length - 300);
    tags.forEach(function (t) { tag(t[0], t[1], t[2], t[3]); });
    if (r < 0) big(String(Math.ceil(-r)), '#1F6E4A'); else if (r < 0.9) big('スタート！', '#D2352B'); else if (r > lastFin + 0.4) big('ゴール！', '#1F6E4A');
    if (r > lastFin + 2) raceDone = true;
  }

  // ---------- 応援の吹き出し ----------
  var ICON = { clap: '👏', go: 'いけ！', wow: 'おお！' };
  function addCheer(p) { if (!p || cheers.length > 90) return; var hs = p.n ? U.horse(p.n) : { bg: '#F2B01E', fg: '#1F2B25' }; cheers.push({ x: W * (0.08 + Math.random() * 0.84), y: H + 40 * K, v: (260 + Math.random() * 160) * K, t: ICON[p.k] || '👏', bg: hs.bg, fg: hs.fg, l: 2.6, w: Math.random() * 6 }); }
  function drawCheers(dt) {
    for (var i = cheers.length - 1; i >= 0; i--) {
      var c = cheers[i]; c.l -= dt; if (c.l <= 0) { cheers.splice(i, 1); continue; } c.y -= c.v * dt; var x = c.x + Math.sin(c.w + c.l * 3) * 20 * K, r = 46 * K;
      g.globalAlpha = Math.min(1, c.l * 1.5); g.fillStyle = c.bg; g.beginPath(); g.arc(x, c.y, r, 0, 6.283); g.fill(); g.lineWidth = 4 * K; g.strokeStyle = '#FFFFFF'; g.stroke();
      g.fillStyle = c.fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 ' + Math.round((c.t.length > 2 ? 26 : 44) * K) + 'px ' + F; g.fillText(c.t, x, c.y + 2 * K); g.globalAlpha = 1;
    }
  }

  // ---------- DOM の重ね表示 ----------
  var LAB = { lobby: '受付中', bet: '予想タイム', race: 'レース！', result: '結果発表' };
  function secs() { return S && S.next_at ? Math.max(0, Math.ceil((Date.parse(S.next_at) - Date.now()) / 1000)) : null; }
  function ui() {
    if (!S) return;
    var st = S.stage, n = T.filter(function (t) { return t.race_no === S.race_no; });
    $('stg').textContent = (st === 'lobby' ? '' : S.race_no + 'レース　') + LAB[st];
    $('cnt').textContent = '参加 ' + count + '人' + (st === 'lobby' ? '' : '　馬券 ' + n.length + '枚');
    $('lobbyCnt').textContent = 'いま ' + count + ' 人が参加中';
    $('lobby').classList.toggle('on', st === 'lobby'); $('result').classList.toggle('on', st === 'result'); $('votes').classList.toggle('on', st === 'bet');
    $('miniqr').style.display = (st === 'bet' || (S.free && st === 'result')) ? 'block' : 'none';
    document.querySelector('.sbar').style.color = st === 'result' ? '#fff' : ''; $('cnt').style.color = st === 'result' ? '#B9D9C2' : '';
    var b = $('banner'), s = secs();
    if (S.free && st !== 'race') { b.classList.add('on'); b.textContent = '自由タイム：スマホでいろいろ触ってみてね' + (s != null ? '　' + (st === 'bet' ? 'しめきりまで ' : '次のレースまで ') + s + '秒' : ''); } else b.classList.remove('on');
    if (st === 'bet') {
      var c = [0, 0, 0, 0, 0, 0, 0, 0], mx = 1; n.forEach(function (t) { c[t.horse - 1]++; }); c.forEach(function (v) { mx = Math.max(mx, v); });
      var h = '<h2 class="dela">どの馬が1着？</h2>'; U.HORSES.forEach(function (x, i) { h += '<div class="vrow"><span class="num" style="background:' + x.bg + ';color:' + x.fg + '">' + x.n + '</span><span class="nm">' + x.name + '</span><span class="bar" style="width:' + (c[i] / mx * 9).toFixed(2) + 'vw"></span>' + c[i] + '</div>'; });
      $('votes').innerHTML = h;
    }
    if (st === 'result' && S.result) {
      var r = S.result, a = U.horse(r[0]), w = n.filter(function (t) { return t.horse === r[0]; });
      $('result').innerHTML = '<h1 class="dela">結果発表！</h1><div class="first"><span class="num" style="background:' + a.bg + ';color:' + a.fg + '">' + a.n + '</span><div><small>1着</small><b>' + a.name + '</b></div></div>' +
        '<p class="rest">2着 ' + r[1] + '番 ' + U.horse(r[1]).name + '　／　3着 ' + r[2] + '番 ' + U.horse(r[2]).name + '</p>' +
        '<p class="hits">的中 ' + w.length + '人' + (w.length ? '、おめでとう！' : '') + '</p>' +
        '<p class="who">' + w.slice(0, 24).map(function (t) { return U.esc(t.name); }).join('　') + (w.length > 24 ? '　ほか' : '') + '</p>';
    }
  }

  // ---------- 自由タイムの自動進行（合言葉つきで開いたときだけ） ----------
  function drive() {
    if (!driver || !S || !S.free) return;
    var now = Date.now(), key = S.epoch + ':' + S.race_no + ':' + S.stage; if (pending === key) return;
    var cfg = U.cfg, go = null;
    if (S.stage === 'race') { if (raceDone) go = { stage: 'result', next_at: U.iso(now + (cfg.RESULT_SECONDS || 12) * 1000) }; }
    else if (S.next_at && now >= Date.parse(S.next_at)) {
      if (S.stage === 'bet') go = { stage: 'race', result: U.shuffle([1, 2, 3, 4, 5, 6, 7, 8]), next_at: null };
      else if (S.stage === 'result') go = { stage: 'bet', race_no: S.race_no + 1, result: null, next_at: U.iso(now + (cfg.BET_SECONDS || 45) * 1000) };
    }
    if (go) { pending = key; Net.setState(go).catch(function () { pending = ''; }); }
  }

  function onState() {
    var k = S.epoch + ':' + S.race_no + ':' + S.stage;
    if (S.stage === 'race' && raceKey !== k) { raceKey = k; raceStart = performance.now(); raceDone = false; dust = []; }
    syncPile(false); ui();
  }

  function frame(ts) {
    var dt = t0 ? Math.min(0.05, (ts - t0) / 1000) : 0; t0 = ts;
    g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, W, H);
    if (S) { if (S.stage === 'race') sceneRace(dt); else if (S.stage === 'bet') scenePile(dt); }
    drawCheers(dt); requestAnimationFrame(frame);
  }

  rs(); window.addEventListener('resize', rs);
  setInterval(function () { ui(); drive(); }, 400);
  Net.init({
    role: 's',
    onState: function (s) { S = s; onState(); },
    onTickets: function (t) { T = t; syncPile(false); ui(); },
    onPresence: function (n) { count = n; ui(); },
    onCheer: addCheer
  }).catch(function (e) { $('stg').textContent = 'つながりません: ' + (e && e.message || e); });
  requestAnimationFrame(frame);
})();
