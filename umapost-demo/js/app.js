// 参加者のスマホ画面
(function () {
  var U = window.U, Net = window.Net, app = document.getElementById('app');
  var S = null, T = [], count = 0, sel = null, tab = 'race', joined = !!U.name(), busy = false;
  var hitShown = {}, toldHit = {}, counts = {}, lastKey = '', lastCheer = 0, toastTimer = 0;

  function mine() { return T.filter(function (t) { return t.race_no === S.race_no && t.user_id === U.uid(); })[0]; }
  function raceTickets() { return T.filter(function (t) { return t.race_no === S.race_no; }); }
  function toast(msg) { var el = document.getElementById('toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2600); }
  function cd() { if (!S || !S.next_at) return ''; var s = Math.max(0, Math.ceil((Date.parse(S.next_at) - Date.now()) / 1000)); return s + '秒'; }

  // ---------- 各画面 ----------
  function vJoin() {
    return '<div class="view center"><p class="kick">みんなで競馬を楽しむアプリ</p><h1 style="font-size:52px">うまポスト</h1>' +
      '<p>会場のみんなと、架空のレースを予想してみよう。</p>' +
      '<input class="name" id="nm" maxlength="12" placeholder="ニックネーム（なくてもOK）">' +
      '<button class="btn" data-act="join">参加する</button>' +
      '<p class="note">これはデモです。お金は一切かかりません。<br>登場する馬とレースは架空のものです。</p></div>';
  }
  function vLobby() {
    return '<div class="view center"><div class="big-emoji">🏇</div><h2>まもなく始まります</h2>' +
      '<p>' + U.esc(U.name()) + ' さん、ようこそ！<br>スクリーンを見ながら待っててね。</p><span class="pill">いま ' + count + ' 人が参加中</span></div>';
  }
  function vBet() {
    var m = mine(), pick = sel || (m && m.horse) || null;
    var h = '<div class="view"><p class="kick">' + S.race_no + 'レース' + (S.free ? '　しめきりまで <span data-cd>' + cd() + '</span>' : '') + '</p><h2>1着になるのは、<br>どの馬？</h2><div class="grid">';
    U.HORSES.forEach(function (x) {
      h += '<button class="hcard' + (pick === x.n ? ' on' : '') + '" data-act="pick" data-n="' + x.n + '"><div class="band" style="background:' + x.bg + ';color:' + x.fg + (x.n === 1 ? ';border-bottom:3px solid #1F2B25' : '') + '">' + x.n + '</div>' +
        '<div class="body"><b>' + x.name + '</b><small>' + x.trait + '</small></div></button>';
    });
    h += '</div>';
    if (m && (!sel || sel === m.horse)) h += '<div class="panel center"><p class="kick">ポスト完了！ スクリーンの山を見てね</p><div style="margin-top:10px">' + U.ticket(m, { own: true }) + '</div><p class="note" style="margin-top:8px">しめきりまでは、えらび直せます。</p></div>';
    else h += '<div class="sticky"><button class="btn" data-act="post"' + (pick && !busy ? '' : ' disabled') + '>' + (pick ? pick + '番を' + (m ? 'えらび直す' : 'ポストする') : '馬をえらんでね') + '</button></div>';
    return h + '</div>';
  }
  function vRace() {
    var m = mine(), h = '<div class="view center"><p class="kick">' + S.race_no + 'レース 出走中</p><h2>スクリーンを見て、<br>応援しよう！</h2>';
    h += m ? U.ticket(m, { own: true }) : '<p class="note">このレースは予想していません。応援だけでも送れます。</p>';
    h += '<div class="cheers"><button data-act="cheer" data-k="clap"><i>👏</i>拍手</button><button data-act="cheer" data-k="go"><i>📣</i>いけ！</button><button data-act="cheer" data-k="wow"><i>😲</i>おお！</button></div>';
    return h + '<p class="note">ボタンを押すと、スクリーンに届きます。</p></div>';
  }
  function vResult() {
    var r = S.result || [], m = mine(), win = m && r[0] === m.horse, lab = ['1着', '2着', '3着'];
    var hits = raceTickets().filter(function (t) { return t.horse === r[0]; }).length;
    var h = '<div class="view"><p class="kick">' + S.race_no + 'レース 結果' + (S.free ? '　次のレースまで <span data-cd>' + cd() + '</span>' : '') + '</p>';
    h += '<h2>' + (win ? '的中！おめでとう！' : (m ? '惜しい！' : '結果発表')) + '</h2><div class="panel">';
    for (var i = 0; i < 3 && i < r.length; i++) { var x = U.horse(r[i]); h += '<div class="rank"><small>' + lab[i] + '</small><span class="num" style="background:' + x.bg + ';color:' + x.fg + '">' + x.n + '</span>' + x.name + '</div>'; }
    h += '</div><div class="center" style="display:flex;flex-direction:column;gap:10px"><span class="pill y">会場の的中 ' + hits + ' 人</span></div>';
    if (m) h += '<div class="center" style="display:flex;justify-content:center">' + U.ticket(m, { own: true, stamp: win }) + '</div>';
    if (win) h += '<button class="btn ghost" data-act="again">的中の演出をもう一度見る</button>';
    if (!S.free) h += '<p class="note center">このあと、アプリを自由に触れる時間があります。</p>';
    return h + '</div>';
  }
  function vPlaza() {
    var list = raceTickets().slice().reverse(), h = '<div class="view"><p class="kick">ひろば　' + S.race_no + 'レースの馬券 ' + list.length + '枚</p><h2>みんなの馬券</h2><div class="plaza">';
    if (!list.length) h += '<p class="note">まだ馬券がありません。「レース」で予想をポストしてみよう。</p>';
    list.forEach(function (t) {
      var c = counts[t.id] || {};
      h += '<div class="post"><div class="who"><span>' + U.esc(t.name) + (t.user_id === U.uid() ? '（じぶん）' : '') + '</span></div>' + U.ticket(t, { own: t.user_id === U.uid() }) + '<div class="reacts">';
      U.REACTS.forEach(function (r) { h += '<button data-act="react" data-id="' + t.id + '" data-k="' + r.id + '">' + r.icon + ' ' + (c[r.id] || 0) + '</button>'; });
      h += '</div></div>';
    });
    return h + '</div></div>';
  }
  function vSkin() {
    var cur = U.skin(), h = '<div class="view"><p class="kick">券面の着せ替え</p><h2>馬券のデザインを<br>えらぼう</h2><div class="skins">';
    U.SKINS.forEach(function (s) { h += '<button class="' + (cur === s.id ? 'on' : '') + '" data-act="skin" data-s="' + s.id + '">' + U.ticket({ horse: 5, race_no: S.race_no, name: U.name(), skin: s.id }) + s.label + '</button>'; });
    return h + '</div><p class="note">えらんだデザインは、次にポストする馬券から使われます。</p></div>';
  }
  function vAbout() {
    return '<div class="view"><p class="kick">うまポストとは</p><h2>買った馬券を、<br>みんなの場にポスト。</h2>' +
      '<div class="panel"><div class="rank">📷　撮って、ポスト</div><div class="rank">🎫　レースに馬券が集まる</div><div class="rank">👏　拍手・応援・驚きを送り合う</div><div class="rank">💮　当たると的中の演出</div></div>' +
      '<button class="btn ghost" data-act="again">的中の演出を見てみる</button>' +
      '<a class="btn" href="' + U.esc(U.cfg.APP_URL || '#') + '" target="_blank" rel="noopener">本物を使ってみる</a>' +
      '<p class="note">このデモは架空のレースです。お金はかかりません。<br>20歳未満の方は馬券を購入できません。</p></div>';
  }
  function vFree() {
    var body = tab === 'plaza' ? vPlaza() : tab === 'skin' ? vSkin() : tab === 'about' ? vAbout() : (S.stage === 'race' ? vRace() : S.stage === 'result' ? vResult() : vBet());
    var tabs = [['race', '🏇', 'レース'], ['plaza', '🎫', 'ひろば'], ['skin', '🎨', '着せ替え'], ['about', '📱', 'アプリ']];
    var h = body + '<div class="tabs">';
    tabs.forEach(function (t) { h += '<button class="' + (tab === t[0] ? 'on' : '') + '" data-act="tab" data-t="' + t[0] + '"><i>' + t[1] + '</i>' + t[2] + '</button>'; });
    return h + '</div>';
  }

  function render() {
    if (!S) { app.innerHTML = '<div class="view center"><p>読み込み中…</p></div>'; return; }
    var key = joined ? '' : 'join';
    if (key === 'join' && lastKey === 'join') return; // 入力中の名前を消さない
    lastKey = key;
    var top = '<div class="top"><span class="dela">うまポスト</span><span>' + (S.free ? '自由タイム' : 'デモ') + '・' + count + '人</span></div>';
    var body = !joined ? vJoin() : !Net.ready() ? '<div class="view center"><div class="big-emoji">📡</div><h2>つないでいます…</h2><p class="note">スクリーンの準備ができると始まります。</p></div>' : S.free ? vFree() : S.stage === 'bet' ? vBet() : S.stage === 'race' ? vRace() : S.stage === 'result' ? vResult() : vLobby();
    var y = window.scrollY; app.innerHTML = top + body; window.scrollTo(0, y);
  }

  // ---------- 的中の演出 ----------
  var hit = document.getElementById('hit'), hc = hit.querySelector('canvas'), conf = [], confRaf = 0;
  function showHit(t) {
    document.getElementById('hitTicket').innerHTML = '<div class="hitwrap">' + U.ticket(t, { own: true, big: true }) + '<div class="stamp out">的中</div></div>';
    document.getElementById('hitMsg').textContent = U.horse(t.horse).n + '番 ' + U.horse(t.horse).name + ' が1着！';
    hit.classList.remove('shake'); void hit.offsetWidth; hit.classList.add('on', 'shake');
    if (navigator.vibrate) setTimeout(function () { navigator.vibrate([60, 40, 120]); }, 900);
    setTimeout(burst, 1000);
  }
  function burst() {
    var W = hc.width = hit.clientWidth, H = hc.height = hit.clientHeight, g = hc.getContext('2d');
    var col = ['#F2B01E', '#FFFFFF', '#E68BB4', '#E8742C', '#2F6FA8', '#D2352B', '#B9D9C2'];
    conf = []; for (var i = 0; i < 140; i++) { var a = Math.random() * 6.283, v = 200 + Math.random() * 700; conf.push({ x: W / 2, y: H * 0.42, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 300, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, c: col[i % col.length], w: 8 + Math.random() * 8 }); }
    var t0 = 0; cancelAnimationFrame(confRaf);
    (function step(ts) {
      var dt = t0 ? Math.min(0.05, (ts - t0) / 1000) : 0; t0 = ts; g.clearRect(0, 0, W, H); var alive = false;
      conf.forEach(function (p) { p.vy += 900 * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y < H + 40) alive = true; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.w * 0.8, p.w, p.w * 1.6); g.restore(); });
      if (alive && hit.classList.contains('on')) confRaf = requestAnimationFrame(step);
    })(0);
  }
  document.getElementById('hitClose').onclick = function () { hit.classList.remove('on'); };

  function onStage() {
    if (!S || !joined || S.stage !== 'result' || !S.result) return;
    var m = mine(), k = S.epoch + ':' + S.race_no;
    if (m && m.horse === S.result[0] && !hitShown[k]) { hitShown[k] = 1; showHit(m); }
    if (S.free && !toldHit[k]) {
      toldHit[k] = 1;
      var w = raceTickets().filter(function (t) { return t.horse === S.result[0] && t.user_id !== U.uid(); });
      if (w.length) setTimeout(function () { toast('💮 ' + w[0].name + ' さんの馬券が的中！' + (w.length > 1 ? '（ほか' + (w.length - 1) + '人）' : '')); }, 400);
    }
  }

  // ---------- 操作 ----------
  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return; var a = b.dataset.act;
    if (a === 'join') { var v = (document.getElementById('nm').value || '').trim().slice(0, 12); U.name(v || 'ゲスト' + (100 + Math.random() * 900 | 0)); joined = true; render(); onStage(); }
    else if (a === 'pick') { if (S.stage !== 'bet') return; sel = +b.dataset.n; render(); }
    else if (a === 'post') {
      var m = mine(), pick = sel || (m && m.horse); if (!pick || busy || S.stage !== 'bet') return; busy = true; render();
      Net.postTicket({ race_no: S.race_no, user_id: U.uid(), name: U.name(), horse: pick, skin: U.skin() }).then(function () { sel = null; busy = false; toast('🎫 ポストしました！'); render(); })
        .catch(function () { busy = false; toast('送信に失敗しました。もう一度押してください'); render(); });
    }
    else if (a === 'cheer') { var now = Date.now(); if (now - lastCheer < 350) return; lastCheer = now; var mm = mine(); Net.cheer({ k: b.dataset.k, n: mm ? mm.horse : 0 }); if (navigator.vibrate) navigator.vibrate(20); }
    else if (a === 'react') { Net.react({ id: b.dataset.id, k: b.dataset.k, from: U.name(), uid: U.uid() }); }
    else if (a === 'tab') { tab = b.dataset.t; window.scrollTo(0, 0); render(); }
    else if (a === 'skin') { U.skin(b.dataset.s); render(); toast('デザインを変えました'); }
    else if (a === 'again') { showHit(mine() || { horse: 5, race_no: S.race_no, name: U.name(), skin: U.skin() }); }
  });

  setInterval(function () { var t = cd(); document.querySelectorAll('[data-cd]').forEach(function (el) { el.textContent = t; }); }, 500);

  Net.init({
    role: 'p',
    onState: function (s) { var p = S; S = s; if (p && (p.race_no !== s.race_no || p.epoch !== s.epoch)) { sel = null; counts = {}; } if (p && p.free !== s.free) tab = 'race'; render(); onStage(); },
    onTickets: function (t) { T = t; render(); onStage(); },
    onPresence: function (n) { count = n; if (S) render(); },
    onReact: function (p) {
      var c = counts[p.id] = counts[p.id] || {}; c[p.k] = (c[p.k] || 0) + 1;
      var t = T.filter(function (x) { return x.id === p.id; })[0], r = U.REACTS.filter(function (x) { return x.id === p.k; })[0];
      if (t && r && t.user_id === U.uid() && p.uid !== U.uid()) toast(r.icon + ' ' + p.from + ' さんから' + r.label + '！');
      if (S && S.free && tab === 'plaza') render();
    },
    onLink: function (ok) { document.getElementById('link').style.display = ok ? 'none' : 'block'; }
  }).catch(function (e) { app.innerHTML = '<div class="view center"><h2>つながりませんでした</h2><p class="note">' + U.esc(e && e.message || e) + '</p><button class="btn" onclick="location.reload()">読み込み直す</button></div>'; });
  render();
})();
