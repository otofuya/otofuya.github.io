// 3ページ共通の道具
(function () {
  var C = window.DEMO_CONFIG || {};
  var q = new URLSearchParams(location.search);
  var U = {};
  U.cfg = C;
  U.code = q.get('e') || C.EVENT_CODE || 'demo';
  U.key = q.get('key') || '';
  U.mock = q.get('mock') === '1' || !C.SUPABASE_URL || !C.SUPABASE_ANON_KEY;

  U.HORSES = [
    { n: 1, name: 'ハシルンデス', trait: 'スタートが速い', bg: '#FFFFFF', fg: '#1F2B25', coat: '#7A4422' },
    { n: 2, name: 'ニンジンダイスキ', trait: '前半から飛ばす', bg: '#1F2B25', fg: '#FFFFFF', coat: '#3A2A20' },
    { n: 3, name: 'マッスグイク', trait: 'まっすぐ走る', bg: '#D2352B', fg: '#FFFFFF', coat: '#5A3A22' },
    { n: 4, name: 'ノンビリボーイ', trait: 'マイペース', bg: '#2F6FA8', fg: '#FFFFFF', coat: '#8E8A86' },
    { n: 5, name: 'ミンナノユメ', trait: '最後にグンと伸びる', bg: '#F2C230', fg: '#1F2B25', coat: '#9A5A2A' },
    { n: 6, name: 'ゴールハアッチ', trait: '方向おんち？', bg: '#2F8656', fg: '#FFFFFF', coat: '#4A3020' },
    { n: 7, name: 'イッショニミヨウ', trait: 'みんなと走るのが好き', bg: '#E8742C', fg: '#FFFFFF', coat: '#6B3F1F' },
    { n: 8, name: 'ポストキング', trait: '直線が得意', bg: '#E68BB4', fg: '#1F2B25', coat: '#2E2420' }
  ];
  // 1レース目はプレゼンの結果発表スライドと同じ着順にする
  U.FIXED = [5, 8, 1, 3, 7, 2, 6, 4];
  U.SKINS = [
    { id: 'normal', label: 'いつもの券面' }, { id: 'silver', label: 'シルバー' }, { id: 'gold', label: 'ゴールド' },
    { id: 'aurora', label: 'オーロラ' }, { id: 'sakura', label: '桜' }
  ];
  U.REACTS = [{ id: 'clap', icon: '👏', label: '拍手' }, { id: 'cheer', icon: '📣', label: '応援' }, { id: 'wow', icon: '😲', label: '驚き' }];

  U.horse = function (n) { return U.HORSES[n - 1] || U.HORSES[0]; };
  U.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  U.shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.random() * (i + 1) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  U.iso = function (ms) { return new Date(ms).toISOString(); };

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } return null; }
  var memId = null;
  U.uid = function () {
    if (q.get('uid')) return q.get('uid'); // 動作確認用
    var v = ls('umademo_uid') || memId;
    if (!v) { v = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); memId = v; ls('umademo_uid', v); }
    return v;
  };
  U.name = function (v) { var k = 'umademo_name' + (q.get('uid') || ''); if (v !== undefined) { ls(k, v); return v; } return ls(k) || ''; };
  U.skin = function (v) { var k = 'umademo_skin' + (q.get('uid') || ''); if (v !== undefined) { ls(k, v); return v; } return ls(k) || 'normal'; };

  // 馬券 1 枚の HTML（単勝）
  U.ticket = function (t, opt) {
    opt = opt || {};
    var h = U.horse(t.horse);
    return '<div class="tk skin-' + U.esc(t.skin || 'normal') + (opt.own ? ' own' : '') + (opt.big ? ' big' : '') + (opt.stamp ? ' stamped' : '') + '">' +
      '<div class="tk-l"><b>デモ競馬</b><span class="tk-r"><i>' + (t.race_no || 1) + '</i>レース</span><em>' + U.esc(t.name || 'ゲスト') + '</em></div>' +
      '<div class="tk-c"><span>単</span><span>勝</span></div>' +
      '<div class="tk-m"><span class="num" style="background:' + h.bg + ';color:' + h.fg + '">' + h.n + '</span>' +
      '<small>' + h.name + '</small></div>' +
      (opt.stamp ? '<div class="stamp">的中</div>' : '') + '</div>';
  };
  // 進行役の合言葉が合っているか（config の HOST_KEY_SHA256 が空なら常に OK）
  U.keyOk = function () {
    var want = String(C.HOST_KEY_SHA256 || '').toLowerCase();
    if (!want) return Promise.resolve(true);
    if (!U.key || !window.crypto || !crypto.subtle) return Promise.resolve(false);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(U.key)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('') === want;
    });
  };
  window.U = U;
})();
