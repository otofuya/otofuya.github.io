// 進行役のボタン。?key=進行役の合言葉 を付けて開く。
(function () {
  var U = window.U, Net = window.Net, S = null, T = [], count = 0, tt = 0, allowed = false;
  function $(id) { return document.getElementById(id); }
  function toast(m) { var e = $('toast'); e.textContent = m; e.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { e.classList.remove('on'); }, 2400); }
  var LAB = { lobby: '受付', bet: '予想', race: 'レース', result: '結果' };
  function ui() {
    if (!S) return;
    $('sStage').textContent = (S.free ? '自由・' : '') + LAB[S.stage] + (S.stage === 'lobby' ? '' : ' ' + S.race_no + 'R');
    $('sCount').textContent = count; $('sTickets').textContent = T.filter(function (t) { return t.race_no === S.race_no; }).length;
    document.querySelectorAll('[data-go]').forEach(function (b) { var g = b.dataset.go; b.classList.toggle('now', S.free ? g === 'free' : g === S.stage); });
  }
  function send(p) { return Net.setState(p).then(function () { toast('切り替えました'); }).catch(function (e) { toast('失敗: ' + (e && e.message || e)); }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]'); if (!b || !S) return; if (!allowed) { toast('合言葉が合っていません'); return; } var g = b.dataset.go, now = Date.now();
    if (g === 'lobby') send({ stage: 'lobby', free: false, result: null, next_at: null });
    else if (g === 'bet') send({ stage: 'bet', free: false, result: null, next_at: null, race_no: S.stage === 'result' ? S.race_no + 1 : S.race_no });
    else if (g === 'race') send({ stage: 'race', next_at: null, result: (S.race_no === 1 && !S.free) ? U.FIXED : U.shuffle([1, 2, 3, 4, 5, 6, 7, 8]) });
    else if (g === 'result') { if (!S.result) { toast('先に「レース開始」を押してください'); return; } send({ stage: 'result', next_at: null }); }
    else if (g === 'free') send({ free: true, stage: 'bet', race_no: S.stage === 'lobby' ? S.race_no : S.race_no + 1, result: null, next_at: U.iso(now + (U.cfg.BET_SECONDS || 45) * 1000) });
    else if (g === 'stopfree') send({ free: false, stage: 'lobby', result: null, next_at: null });
    else if (g === 'reset') { if (confirm('馬券をすべて消して、最初の受付に戻します。よろしいですか？')) Net.reset().then(function () { toast('最初に戻しました'); }).catch(function (e) { toast('失敗: ' + (e && e.message || e)); }); }
  });
  var base = new URL('.', location.href).toString(), k = encodeURIComponent(U.key), e = encodeURIComponent(U.code), m = Net.mock && new URLSearchParams(location.search).get('mock') === '1' ? '&mock=1' : '';
  $('links').innerHTML = '<b>スクリーン用</b>（会場に映す。自由タイムの自動進行も担当）<br>' + base + 'screen.html?e=' + e + (U.key ? '&key=' + k : '') + m + '<br><br><b>参加者用</b>（スクリーンのQRと同じ）<br>' + base + 'index.html?e=' + e + m;
  var w = '';
  if (Net.mock) w += '<div class="warn">お試しモードです（Supabase 未設定）。同じブラウザのタブどうしだけでつながります。</div>';
  $('warn').innerHTML = w;
  U.keyOk().then(function (ok) { allowed = ok; if (!ok) $('warn').innerHTML += '<div class="warn">URL の <b>?key=</b> が合っていません。ボタンは効きません。</div>'; });
  Net.init({
    role: 'h',
    onState: function (s) { S = s; ui(); }, onTickets: function (t) { T = t; ui(); }, onPresence: function (n) { count = n; ui(); }
  }).catch(function (e) { $('warn').innerHTML = '<div class="warn">つながりません: ' + U.esc(e && e.message || e) + '</div>'; });
})();
