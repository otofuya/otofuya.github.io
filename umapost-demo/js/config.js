// うまポスト 会場デモの設定
// SUPABASE_URL と SUPABASE_ANON_KEY が空のあいだは「お試しモード」
// （同じブラウザのタブどうしだけでつながる）で動きます。
window.DEMO_CONFIG = {
  SUPABASE_URL: '',        // 例: https://xxxxxxxx.supabase.co
  SUPABASE_ANON_KEY: '',   // anon（公開用）キー。service_role キーは絶対に入れない
  EVENT_CODE: 'demo',      // 部屋の名前。変えると別の部屋になる
  HOST_KEY_SHA256: '2ad9045dc6cad4ccc3e586f253109caf2a238c4601940d736084c53d6ae0b44b',     // 進行役の合言葉の SHA-256。空なら合言葉なしで進行ページが使える
  APP_URL: 'https://uma-free.com/', // 「本物を使ってみる」の行き先
  BET_SECONDS: 45,         // 自由タイム: 予想を受け付ける秒数
  RESULT_SECONDS: 12       // 自由タイム: 結果を見せる秒数
};
