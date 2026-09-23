/* ppcham Integrated Visual Bundle v1
   Illustration + Human Factors UI.
   Visual / interaction layer only.
   Does NOT modify battle calculations, team-building logic, DB values, or saved team data.
*/
(() => {
  if (window.PPChamIntegratedVisualBundle) return;

  const style = document.createElement("style");
  style.id = "ppcham-integrated-visual-style-v1";
  style.textContent = "/* ppcham Human Factors UI Patch v2\n   Additive visual layer only. No battle/team/data logic changes. */\n\n:root{\n  --ux-touch:48px;\n  --ux-gap:10px;\n  --ux-bottom-nav-h:68px;\n}\n\n/* Preserve space for bottom thumb navigation */\nbody{\n  padding-bottom:calc(var(--ux-bottom-nav-h) + 18px + env(safe-area-inset-bottom));\n  overscroll-behavior-y:contain;\n}\n.app{\n  padding-bottom:20px!important;\n}\n\n/* Bottom thumb-zone navigation */\n.tabs{\n  position:fixed!important;\n  left:50%;\n  bottom:calc(8px + env(safe-area-inset-bottom));\n  transform:translateX(-50%);\n  width:min(calc(100% - 18px),680px);\n  z-index:9999;\n  margin:0!important;\n  padding:6px!important;\n  border-radius:18px!important;\n  background:rgba(232,236,244,.94)!important;\n  box-shadow:0 12px 34px rgba(15,23,42,.22)!important;\n  backdrop-filter:blur(16px);\n  -webkit-backdrop-filter:blur(16px);\n}\n.tab{\n  min-height:48px;\n  padding:10px 8px!important;\n  font-size:13px!important;\n  touch-action:manipulation;\n}\n\n/* Larger reliable hit targets */\nbutton,.btn,.select,input.search,select,input[type=\"number\"]{\n  min-height:44px;\n}\n.remove-slot{\n  min-width:34px!important;\n  min-height:34px!important;\n}\n.loadout-btn{\n  min-height:34px!important;\n  padding:7px 9px!important;\n}\n\n/* Reduce accidental taps / improve feedback */\n.btn,.tab,.slot,.pick-card,.move,.remove-slot,.loadout-btn{\n  -webkit-tap-highlight-color:transparent;\n}\n.btn:active,.tab:active,.slot:active,.pick-card:active,.move:active{\n  transform:scale(.985);\n}\n\n/* Visual hierarchy */\n.section>h3{\n  font-size:17px!important;\n  letter-spacing:-.02em;\n}\n.hint{\n  max-width:62ch;\n  line-height:1.6!important;\n}\n.slot{\n  min-height:124px!important;\n}\n.name{\n  font-size:14px!important;\n}\n\n/* Build screen: key decisions first */\n#priorityDiagnosis,\n#environmentMatchups,\n#improvementRoadmap{\n  border-width:2px!important;\n}\n#priorityDiagnosis h3::before{content:\"① \";opacity:.5}\n#environmentMatchups h3::before{content:\"② \";opacity:.5}\n#improvementRoadmap h3::before{content:\"③ \";opacity:.5}\n\n.ux-detail-hidden{\n  display:none!important;\n}\n#uxDetailToggle{\n  width:100%;\n  margin:12px 0 4px;\n  min-height:48px;\n  border:1px solid #d0d5dd;\n  border-radius:14px;\n  background:#fff;\n  color:#475467;\n  font-weight:850;\n}\n\n/* Battle: glance-first cockpit */\n#battle .section:first-child{\n  display:flex;\n  flex-direction:column;\n}\n\n#uxBattleGlance{\n  order:2;\n  display:grid;\n  grid-template-columns:repeat(3,minmax(0,1fr));\n  gap:8px;\n  margin-top:10px;\n}\n.ux-glance-card{\n  background:#111827;\n  color:#fff;\n  border-radius:15px;\n  padding:10px;\n  min-height:74px;\n}\n.ux-glance-card span{\n  display:block;\n  font-size:9px;\n  color:#cbd5e1;\n  margin-bottom:5px;\n}\n.ux-glance-card b{\n  display:block;\n  font-size:13px;\n  line-height:1.35;\n  overflow-wrap:anywhere;\n}\n.ux-glance-card[data-state=\"good\"]{background:#0f6b50}\n.ux-glance-card[data-state=\"warn\"]{background:#9a5b0b}\n.ux-glance-card[data-state=\"bad\"]{background:#9f2f2f}\n\n#battle .battle-grid{order:1;}\n#battle .quick-match{order:3;}\n#battle .speed-box{order:4;}\n#battle .battle-tools{order:5;}\n#battle .battle-settings{order:6;}\n#battle .section:first-child > .section{order:7;}\n#battle .selection-panel{order:8;}\n#battle .calc-panel{order:9;}\n\n#battle .battle-tools{\n  display:grid;\n  grid-template-columns:1fr 1fr;\n  gap:8px;\n  margin-top:10px;\n}\n#battle .battle-tools::before{\n  content:\"判断の根拠\";\n  grid-column:1/-1;\n  font-size:11px;\n  font-weight:900;\n  color:#667085;\n}\n#battle .battle-card{\n  min-height:72px;\n  border-width:1px;\n}\n#battle .battle-card b{\n  display:block;\n  font-size:10px;\n  color:#667085;\n  margin-bottom:5px;\n}\n#battle .battle-card span{\n  font-size:13px;\n  font-weight:850;\n  line-height:1.35;\n}\n\n/* Battle controls should be comfortable to read */\n#battle .fighter .select,\n#battle .fighter .search,\n#battle .battle-settings select{\n  font-size:16px;\n}\n\n/* Selection actions: recommendation dominates */\n#recommendSelection{\n  min-height:52px!important;\n  font-weight:900!important;\n}\n#clearMySelection,\n#clearOpponentTeam{\n  opacity:.82;\n}\n\n/* Keep long technical panels visually secondary */\n.db-status,.data-import,.evidence-panel,.matrix-box,.core-box,.core-tune,\n.core-fix,.tune-box,.swap-box{\n  scroll-margin-top:12px;\n}\n\n/* Accessibility */\n:focus-visible{\n  outline:3px solid rgba(65,100,246,.35)!important;\n  outline-offset:2px;\n}\n@media (prefers-reduced-motion: reduce){\n  *,*::before,*::after{\n    scroll-behavior:auto!important;\n    transition:none!important;\n    animation:none!important;\n  }\n}\n\n/* Phone ergonomics */\n@media (max-width:560px){\n  /* Tabs are now bottom-fixed; don't waste vertical viewport on sticky brand */\n  .top{\n    position:static!important;\n    padding-top:10px!important;\n    padding-bottom:4px!important;\n  }\n  .top .brand{font-size:19px!important}\n  .top .sub{font-size:10px!important}\n\n  .team{\n    grid-template-columns:repeat(2,minmax(0,1fr))!important;\n    gap:8px!important;\n  }\n  .slot{\n    padding:10px!important;\n    min-height:120px!important;\n  }\n\n  /* Self/opponent read vertically instead of squeezing two cards */\n  #battle .battle-grid{\n    grid-template-columns:1fr!important;\n    gap:8px!important;\n  }\n  #battle .vs{\n    padding:0!important;\n    height:22px;\n    display:flex;\n    align-items:center;\n    justify-content:center;\n    font-size:10px;\n  }\n\n  #uxBattleGlance{\n    grid-template-columns:1fr 1fr!important;\n  }\n  #uxBattleGlance .ux-glance-card:first-child{\n    grid-column:1/-1;\n  }\n\n  #battle .battle-tools{\n    grid-template-columns:1fr!important;\n  }\n  #battle .battle-tools::before{\n    grid-column:1!important;\n  }\n\n  .move-list{\n    grid-template-columns:1fr 1fr!important;\n    gap:7px!important;\n  }\n  .move{\n    min-height:64px!important;\n  }\n\n  .six-grid{\n    grid-template-columns:repeat(3,minmax(0,1fr))!important;\n    gap:6px!important;\n  }\n\n  .selection-actions{\n    display:grid!important;\n    grid-template-columns:1fr!important;\n    gap:7px!important;\n  }\n  .selection-actions .btn{\n    width:100%;\n  }\n\n  .calc-grid,.modifier-row,.power-row{\n    grid-template-columns:1fr 1fr!important;\n  }\n}\n\n@media (max-width:380px){\n  #uxBattleGlance{\n    grid-template-columns:1fr!important;\n  }\n  #uxBattleGlance .ux-glance-card:first-child{\n    grid-column:auto;\n  }\n  .calc-grid,.modifier-row,.power-row{\n    grid-template-columns:1fr!important;\n  }\n}\n\n\n/* ppcham Human Factors UI Patch v3\n   Information architecture only. No calculation/data logic changes. */\n\n#uxBuildFlowLabel,\n#uxDiagSummary{\n  background:#fff;\n  border:1px solid var(--line);\n  border-radius:16px;\n  padding:12px;\n  margin-top:10px;\n  box-shadow:var(--shadow);\n}\n\n#uxBuildFlowLabel{\n  display:grid;\n  grid-template-columns:repeat(3,minmax(0,1fr));\n  gap:8px;\n}\n.ux-flow-step{\n  background:#f7f8fb;\n  border-radius:12px;\n  padding:9px;\n  min-height:66px;\n}\n.ux-flow-step span{\n  display:block;\n  font-size:9px;\n  color:#667085;\n  margin-bottom:4px;\n}\n.ux-flow-step b{\n  display:block;\n  font-size:12px;\n  line-height:1.35;\n}\n\n#uxDiagSummary .ux-diag-kicker{\n  font-size:9px;\n  color:#667085;\n  font-weight:850;\n}\n#uxDiagSummary .ux-diag-title{\n  margin-top:4px;\n  font-size:16px;\n  font-weight:950;\n}\n#uxDiagSummary .ux-diag-body{\n  margin-top:7px;\n  font-size:11px;\n  line-height:1.55;\n  color:#475467;\n}\n\n#diag .panel{\n  margin-top:10px;\n}\n#diag #issues{\n  border-width:2px;\n}\n#diag #issues::before{\n  content:\"優先して見るところ\";\n  display:block;\n  font-size:10px;\n  color:#667085;\n  font-weight:900;\n  margin-bottom:8px;\n}\n\n@media(max-width:560px){\n  #uxBuildFlowLabel{\n    grid-template-columns:1fr;\n  }\n  .ux-flow-step{\n    min-height:auto;\n  }\n}\n\n\n/* ppcham Human Factors UI Patch v4\n   Navigation continuity only. No battle/team/data logic changes. */\n\n.tab{\n  position:relative;\n}\n.tab.ux-has-position::after{\n  content:\"\";\n  position:absolute;\n  right:10px;\n  top:9px;\n  width:5px;\n  height:5px;\n  border-radius:999px;\n  background:#98a2b3;\n  opacity:.65;\n}\n.tab.active::after{\n  opacity:0;\n}\n\n#uxBackToTop{\n  position:fixed;\n  right:14px;\n  bottom:calc(84px + env(safe-area-inset-bottom));\n  z-index:9998;\n  width:44px;\n  height:44px;\n  border:1px solid #d0d5dd;\n  border-radius:999px;\n  background:rgba(255,255,255,.95);\n  box-shadow:0 8px 22px rgba(15,23,42,.16);\n  color:#475467;\n  font-weight:900;\n  display:none;\n  align-items:center;\n  justify-content:center;\n}\n#uxBackToTop.show{\n  display:flex;\n}\n\n@media(max-width:560px){\n  #uxBackToTop{\n    right:10px;\n    width:42px;\n    height:42px;\n  }\n}\n";
  document.head.appendChild(style);

  window.PPChamIntegratedVisualBundle = {
    version: 1,
    loadedAt: new Date().toISOString(),
    logicTouched: false
  };
})();

/* ppcham — Pokémon asset map v1 | 347 Champions DB entries */
(() => {
  const entries = [
    ["フシギバナ", "3"],
    ["メガフシギバナ", "10033"],
    ["リザードン", "6"],
    ["メガリザードンX", "10034"],
    ["メガリザードンY", "10035"],
    ["カメックス", "9"],
    ["メガカメックス", "10036"],
    ["スピアー", "15"],
    ["メガスピアー", "10090"],
    ["ピジョット", "18"],
    ["メガピジョット", "10073"],
    ["アーボック", "24"],
    ["ピカチュウ", "25"],
    ["ライチュウ", "26"],
    ["アローラライチュウ", "10100"],
    ["メガライチュウX", "10304"],
    ["メガライチュウY", "10305"],
    ["ピクシー", "36"],
    ["メガピクシー", "10278"],
    ["キュウコン", "38"],
    ["アローラキュウコン", "10104"],
    ["プクリン", "40"],
    ["ラフレシア", "45"],
    ["ペルシアン", "53"],
    ["アローラペルシアン", "10108"],
    ["ニャイキング", "863"],
    ["ウインディ", "59"],
    ["ヒスイウインディ", "10230"],
    ["ニョロトノ", "186"],
    ["フーディン", "65"],
    ["メガフーディン", "10037"],
    ["カイリキー", "68"],
    ["ウツボット", "71"],
    ["メガウツボット", "10279"],
    ["ヤドラン", "80"],
    ["メガヤドラン", "10071"],
    ["ガラルヤドラン", "10165"],
    ["ヤドキング", "199"],
    ["ガラルヤドキング", "10172"],
    ["カモネギ", "83"],
    ["ネギガナイト", "865"],
    ["ゲンガー", "94"],
    ["メガゲンガー", "10038"],
    ["ハガネール", "208"],
    ["メガハガネール", "10072"],
    ["ドサイドン", "464"],
    ["ガルーラ", "115"],
    ["メガガルーラ", "10039"],
    ["スターミー", "121"],
    ["メガスターミー", "10280"],
    ["バリヤード", "122"],
    ["バリコオル", "866"],
    ["ハッサム", "212"],
    ["メガハッサム", "10046"],
    ["バサギリ", "900"],
    ["カイロス", "127"],
    ["メガカイロス", "10040"],
    ["ケンタロス", "128"],
    ["パルデアケンタロス(コンバット種)", "10250"],
    ["パルデアケンタロス(ブレイズ種)", "10251"],
    ["パルデアケンタロス(ウォーター種)", "10252"],
    ["ギャラドス", "130"],
    ["メガギャラドス", "10041"],
    ["メタモン", "132"],
    ["シャワーズ", "134"],
    ["サンダース", "135"],
    ["ブースター", "136"],
    ["エーフィ", "196"],
    ["ブラッキー", "197"],
    ["リーフィア", "470"],
    ["グレイシア", "471"],
    ["ニンフィア", "700"],
    ["プテラ", "142"],
    ["メガプテラ", "10042"],
    ["カビゴン", "143"],
    ["カイリュー", "149"],
    ["メガカイリュー", "10281"],
    ["メガニウム", "154"],
    ["メガメガニウム", "10282"],
    ["バクフーン", "157"],
    ["ヒスイバクフーン", "10233"],
    ["オーダイル", "160"],
    ["メガオーダイル", "10283"],
    ["アリアドス", "168"],
    ["デンリュウ", "181"],
    ["メガデンリュウ", "10045"],
    ["マリルリ", "184"],
    ["リキキリン", "981"],
    ["フォレトス", "205"],
    ["グライオン", "472"],
    ["ハリーセン", "211"],
    ["ハリーマン", "904"],
    ["ヘラクロス", "214"],
    ["メガヘラクロス", "10047"],
    ["マニューラ", "461"],
    ["オオニューラ", "903"],
    ["マンムー", "473"],
    ["エアームド", "227"],
    ["メガエアームド", "10284"],
    ["ヘルガー", "229"],
    ["メガヘルガー", "10048"],
    ["アヤシシ", "899"],
    ["バンギラス", "248"],
    ["メガバンギラス", "10049"],
    ["ジュカイン", "254"],
    ["メガジュカイン", "10065"],
    ["バシャーモ", "257"],
    ["メガバシャーモ", "10050"],
    ["ラグラージ", "260"],
    ["メガラグラージ", "10064"],
    ["ペリッパー", "279"],
    ["サーナイト", "282"],
    ["メガサーナイト", "10051"],
    ["エルレイド", "475"],
    ["メガエルレイド", "10068"],
    ["ヤミラミ", "302"],
    ["メガヤミラミ", "10066"],
    ["クチート", "303"],
    ["メガクチート", "10052"],
    ["ボスゴドラ", "306"],
    ["メガボスゴドラ", "10053"],
    ["チャーレム", "308"],
    ["メガチャーレム", "10054"],
    ["ライボルト", "310"],
    ["メガライボルト", "10055"],
    ["ロズレイド", "407"],
    ["マルノーム", "317"],
    ["サメハダー", "319"],
    ["メガサメハダー", "10070"],
    ["バクーダ", "323"],
    ["メガバクーダ", "10087"],
    ["コータス", "324"],
    ["チルタリス", "334"],
    ["メガチルタリス", "10067"],
    ["ミロカロス", "350"],
    ["ポワルン", "351"],
    ["ポワルン(たいようのすがた)", "10013"],
    ["ポワルン(あまみずのすがた)", "10014"],
    ["ポワルン(ゆきぐものすがた)", "10015"],
    ["ジュペッタ", "354"],
    ["メガジュペッタ", "10056"],
    ["チリーン", "358"],
    ["メガチリーン", "10306"],
    ["アブソル", "359"],
    ["メガアブソル", "10057"],
    ["メガアブソルZ", "10307"],
    ["オニゴーリ", "362"],
    ["メガオニゴーリ", "10074"],
    ["ユキメノコ", "478"],
    ["メガユキメノコ", "10285"],
    ["ボーマンダ", "373"],
    ["メガボーマンダ", "10089"],
    ["メタグロス", "376"],
    ["メガメタグロス", "10076"],
    ["ドダイトス", "389"],
    ["ゴウカザル", "392"],
    ["エンペルト", "395"],
    ["ムクホーク", "398"],
    ["メガムクホーク", "10308"],
    ["レントラー", "405"],
    ["ラムパルド", "409"],
    ["トリデプス", "411"],
    ["ミミロップ", "428"],
    ["メガミミロップ", "10088"],
    ["ミカルゲ", "442"],
    ["ガブリアス", "445"],
    ["メガガブリアス", "10058"],
    ["メガガブリアスZ", "10309"],
    ["ルカリオ", "448"],
    ["メガルカリオ", "10059"],
    ["メガルカリオZ", "10310"],
    ["カバルドン", "450"],
    ["ドクロッグ", "454"],
    ["ユキノオー", "460"],
    ["メガユキノオー", "10060"],
    ["ロトム", "479"],
    ["ヒートロトム", "10008"],
    ["ウォッシュロトム", "10009"],
    ["フロストロトム", "10010"],
    ["スピンロトム", "10011"],
    ["カットロトム", "10012"],
    ["ジャローダ", "497"],
    ["エンブオー", "500"],
    ["メガエンブオー", "10286"],
    ["ダイケンキ", "503"],
    ["ヒスイダイケンキ", "10236"],
    ["ミルホッグ", "505"],
    ["レパルダス", "510"],
    ["ヤナッキー", "512"],
    ["バオッキー", "514"],
    ["ヒヤッキー", "516"],
    ["ムシャーナ", "518"],
    ["ドリュウズ", "530"],
    ["メガドリュウズ", "10287"],
    ["タブンネ", "531"],
    ["メガタブンネ", "10069"],
    ["ローブシン", "534"],
    ["ペンドラー", "545"],
    ["メガペンドラー", "10288"],
    ["エルフーン", "547"],
    ["イダイトウ♂", "902"],
    ["イダイトウ♀", "10248"],
    ["ワルビアル", "553"],
    ["ズルズキン", "560"],
    ["メガズルズキン", "10289"],
    ["デスカーン", "563"],
    ["デスバーン", "867"],
    ["ダストダス", "569"],
    ["ゾロアーク", "571"],
    ["ヒスイゾロアーク", "10239"],
    ["ランクルス", "579"],
    ["バイバニラ", "584"],
    ["エモンガ", "587"],
    ["シビルドン", "604"],
    ["メガシビルドン", "10290"],
    ["シャンデラ", "609"],
    ["メガシャンデラ", "10291"],
    ["ツンベアー", "614"],
    ["マッギョ", "618"],
    ["ガラルマッギョ", "10180"],
    ["ゴルーグ", "623"],
    ["メガゴルーグ", "10313"],
    ["サザンドラ", "635"],
    ["ウルガモス", "637"],
    ["ブリガロン", "652"],
    ["メガブリガロン", "10292"],
    ["マフォクシー", "655"],
    ["メガマフォクシー", "10293"],
    ["ゲッコウガ", "658"],
    ["メガゲッコウガ", "10294"],
    ["ホルード", "660"],
    ["ファイアロー", "663"],
    ["ビビヨン", "666"],
    ["カエンジシ", "668"],
    ["メガカエンジシ", "10295"],
    ["フラエッテ(えいえんのはな)", "10061"],
    ["メガFloette", "10296"],
    ["フラージェス", "671"],
    ["ゴーゴート", "673"],
    ["ゴロンダ", "675"],
    ["トリミアン", "676"],
    ["ニャオニクス♂", "678"],
    ["メガMeowstic-M", "10314"],
    ["メガMeowstic-F", "10326"],
    ["ギルガルド", "681"],
    ["フレフワン", "683"],
    ["ペロリーム", "685"],
    ["カラマネロ", "687"],
    ["メガカラマネロ", "10297"],
    ["ガメノデス", "689"],
    ["メガガメノデス", "10298"],
    ["ドラミドロ", "691"],
    ["メガドラミドロ", "10299"],
    ["ブロスター", "693"],
    ["エレザード", "695"],
    ["ガチゴラス", "697"],
    ["アマルルガ", "699"],
    ["ルチャブル", "701"],
    ["メガルチャブル", "10300"],
    ["デデンネ", "702"],
    ["ヌメルゴン", "706"],
    ["ヒスイヌメルゴン", "10242"],
    ["クレッフィ", "707"],
    ["オーロット", "709"],
    ["パンプジン", "711"],
    ["パンプジン(ちいさいサイズ)", "10027"],
    ["パンプジン(おおきいサイズ)", "10028"],
    ["パンプジン(とくだいサイズ)", "10029"],
    ["クレベース", "713"],
    ["ヒスイクレベース", "10243"],
    ["オンバーン", "715"],
    ["ジュナイパー", "724"],
    ["ヒスイジュナイパー", "10244"],
    ["ガオガエン", "727"],
    ["アシレーヌ", "730"],
    ["ドデカバシ", "733"],
    ["ケケンカニ", "740"],
    ["メガケケンカニ", "10315"],
    ["ルガルガン(まひるのすがた)", "745"],
    ["ルガルガン(まよなかのすがた)", "10126"],
    ["ルガルガン(たそがれのすがた)", "10152"],
    ["ドヒドイデ", "748"],
    ["バンバドロ", "750"],
    ["オニシズクモ", "752"],
    ["エンニュート", "758"],
    ["アマージョ", "763"],
    ["ヤレユータン", "765"],
    ["ナゲツケサル", "766"],
    ["グソクムシャ", "768"],
    ["メガグソクムシャ", "10316"],
    ["ミミッキュ", "778"],
    ["ジジーロン", "780"],
    ["メガジジーロン", "10302"],
    ["ジャラランガ", "784"],
    ["ゴリランダー", "812"],
    ["エースバーン", "815"],
    ["インテレオン", "818"],
    ["アーマーガア", "823"],
    ["フォクスライ", "828"],
    ["アップリュー", "841"],
    ["タルップル", "842"],
    ["サダイジャ", "844"],
    ["ストリンダー(ハイなすがた)", "849"],
    ["ストリンダー(ローなすがた)", "10184"],
    ["オトスパス", "853"],
    ["ポットデス", "855"],
    ["ブリムオン", "858"],
    ["オーロンゲ", "861"],
    ["マホイップ", "869"],
    ["タイレーツ", "870"],
    ["メガタイレーツ", "10303"],
    ["バチンウニ", "871"],
    ["イエッサン♂", "876"],
    ["イエッサン♀", "10186"],
    ["モルペコ", "877"],
    ["ドラパルト", "887"],
    ["マスカーニャ", "908"],
    ["ラウドボーン", "911"],
    ["ウェーニバル", "914"],
    ["ハカドッグ", "972"],
    ["クエスパトラ", "956"],
    ["イルカマン", "964"],
    ["オリーヴァ", "930"],
    ["スコヴィラン", "952"],
    ["メガスコヴィラン", "10320"],
    ["ハラバリー", "939"],
    ["ミミズズ", "968"],
    ["イッカネズミ", "925"],
    ["セグレイブ", "998"],
    ["メガセグレイブ", "10325"],
    ["パーモット", "923"],
    ["キョジオーン", "934"],
    ["キラフロル", "970"],
    ["メガキラフロル", "10321"],
    ["マフィティフ", "943"],
    ["サーフゴー", "1000"],
    ["デカヌチャン", "959"],
    ["グレンアルマ", "936"],
    ["ソウブレイズ", "937"],
    ["ドドゲザン", "983"],
    ["コノヨザル", "979"],
    ["ヤバソチャ", "1013"],
    ["ブリジュラス", "1018"],
    ["カミツオロチ", "1019"],
    ["イキリンコ", "931"],
    ["ギルガルド(ブレードフォルム)", "10026"],
    ["イルカマン(マイティフォルム)", "10256"],
  ];
  const map = Object.fromEntries(entries);
  window.PPCHAM_POKEMON_ASSET_ID_MAP = Object.freeze(map);
  window.PPCHAM_POKEMON_ASSET_MAP = window.PPCHAM_POKEMON_ASSET_ID_MAP;
  window.PPCHAM_POKEMON_ASSET_ENTRIES = Object.freeze(entries.map(x => Object.freeze([...x])));
  window.PPChamPokemonAssetMapAudit = () => ({
    expected: 347,
    actual: entries.length,
    unique_names: new Set(entries.map(x => x[0])).size,
    status: entries.length === 347 && new Set(entries.map(x => x[0])).size === 347 ? 'PASS' : 'REVIEW'
  });
})();

/* ppcham Illustration Resolver v2
 * Illustration-only patch. No battle/core/environment logic.
 * Requires Pokémon name -> asset_id map to be registered via registerPokemonMap().
 */
(() => {
  if (window.PPChamIllustrationResolver?.version >= 2) return;

  const FALLBACK = 'pokeball.webp';

  const ITEM_MAP = Object.freeze({
    'きあいのタスキ':'focus-sash','オボンのみ':'sitrus-berry','いのちのたま':'life-orb',
    'たべのこし':'leftovers','こだわりスカーフ':'choice-scarf','きせきのタネ':'miracle-seed',
    'グラスシード':'grassy-seed','サイコシード':'psychic-seed','しろいハーブ':'white-herb',
    'ひかりのねんど':'light-clay','こうかくレンズ':'wide-lens','もくたん':'charcoal',
    'しんぴのしずく':'mystic-water','ミスティックウォーター':'mystic-water',
    'フェアリーフェザー':'fairy-feather','まがったスプーン':'twisted-spoon',
    'エアバルーン':'air-balloon','ゴツゴツメット':'rocky-helmet','ヨプのみ':'chople-berry',
    'オッカのみ':'occa-berry','ナモのみ':'colbur-berry','バコウのみ':'coba-berry','シュカのみ':'shuca-berry'
  });

  const TYPE_MAP = Object.freeze({
    'ノーマル':'normal','ほのお':'fire','みず':'water','でんき':'electric','くさ':'grass','こおり':'ice',
    'かくとう':'fighting','どく':'poison','じめん':'ground','ひこう':'flying','エスパー':'psychic','むし':'bug',
    'いわ':'rock','ゴースト':'ghost','ドラゴン':'dragon','あく':'dark','はがね':'steel','フェアリー':'fairy'
  });

  const pokemonMap = Object.assign(Object.create(null), window.PPCHAM_POKEMON_ASSET_ID_MAP || {});

  function norm(v){ return String(v ?? '').normalize('NFKC').trim(); }
  function fallback(alt='Poké Ball'){ return {kind:'fallback',key:'pokeball',path:FALLBACK,alt,fallback:true}; }

  function registerPokemonMap(map){
    if (!map || typeof map !== 'object') return 0;
    let n=0;
    for (const [name,id] of Object.entries(map)) {
      const k=norm(name);
      if (!k || id===null || id===undefined || id==='') continue;
      pokemonMap[k]=String(id);
      n++;
    }
    window.PPCHAM_POKEMON_ASSET_ID_MAP = pokemonMap;
    return n;
  }

  function pokemon(name, layer='icon'){
    const l = ['hero','icon','pixel'].includes(layer) ? layer : 'icon';
    const key = norm(name);
    const id = pokemonMap[key];
    if (!id) return fallback(key || 'Poké Ball');
    return {kind:'pokemon',layer:l,key,id,path:`pokemon_${l}_${id}.webp`,alt:key,fallback:false};
  }

  function item(name){
    const key=norm(name), slug=ITEM_MAP[key];
    return slug ? {kind:'item',key:slug,path:`item_${slug}.webp`,alt:key,fallback:false} : fallback(key||'Poké Ball');
  }

  function type(name){
    const key=norm(name), slug=TYPE_MAP[key];
    return slug ? {kind:'type',key:slug,path:`type_${slug}.webp`,alt:key,fallback:false} : fallback(key||'Poké Ball');
  }

  function resolve(kind, ref, opts={}){
    if (kind==='pokemon') return pokemon(ref, opts.layer || 'icon');
    if (kind==='item') return item(ref);
    if (kind==='type') return type(ref);
    return fallback(norm(ref)||'Poké Ball');
  }

  function esc(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
  function imgHTML(kind, ref, opts={}){
    const a=resolve(kind,ref,opts);
    const cls=opts.className || (kind==='pokemon' ? `ppcham-pkm-${a.layer||'icon'}` : `ppcham-${kind}-icon`);
    return `<img src="${esc(a.path)}" alt="${esc(opts.alt||a.alt)}" class="${esc(cls)}" loading="${opts.loading||'lazy'}" decoding="async" onerror="this.onerror=null;this.src='${FALLBACK}'">`;
  }

  function audit(){
    return {
      version:2,
      pokemon_registered:Object.keys(pokemonMap).length,
      item_registered:Object.keys(ITEM_MAP).length,
      type_registered:Object.keys(TYPE_MAP).length,
      fallback:FALLBACK,
      paths:{hero:'pokemon_hero_{asset_id}.webp',icon:'pokemon_icon_{asset_id}.webp',pixel:'pokemon_pixel_{asset_id}.webp',item:'item_{item-key}.webp',type:'type_{type-key}.webp'}
    };
  }

  window.PPChamIllustrationResolver={version:2,FALLBACK,registerPokemonMap,pokemon,item,type,resolve,imgHTML,audit};
  console.log('✅ PPCham Illustration Resolver v2 ready', audit());
})();


/* ppcham Human Factors UI Patch v2
   Interaction/display only. Does not alter calculations, DB values or saved team state. */
(() => {
  if(window.PPChamHumanFactorsUI?.version >= 2) return;

  const DETAIL_IDS = [
    "databaseStatus",
    "dataImportPanel",
    "evidencePanel",
    "environmentMatrix",
    "coreMatchups",
    "coreTuneSuggestions",
    "coreFixSuggestions",
    "tuningSuggestions",
    "swapSuggestions",
    "teamIdeas"
  ];

  function textOf(id){
    const el=document.getElementById(id);
    return (el?.textContent||"").replace(/\s+/g," ").trim() || "—";
  }

  function setupBuildProgressiveDisclosure(){
    const build=document.getElementById("build");
    if(!build) return;

    const existing=DETAIL_IDS.map(id=>document.getElementById(id)).filter(Boolean);
    if(!existing.length) return;

    let btn=document.getElementById("uxDetailToggle");
    if(!btn){
      existing.forEach(el=>el.classList.add("ux-detail-hidden"));
      btn=document.createElement("button");
      btn.id="uxDetailToggle";
      btn.type="button";
      btn.setAttribute("aria-expanded","false");
      btn.textContent="詳細データ・交換案を表示";

      const priority=document.getElementById("priorityDiagnosis");
      if(priority?.nextSibling){
        priority.parentElement.insertBefore(btn,priority.nextSibling);
      }else{
        (priority?.parentElement || build.querySelector(".section"))?.appendChild(btn);
      }
    }

    if(btn.dataset.uxBound==="1") return;
    btn.dataset.uxBound="1";

    btn.addEventListener("click",()=>{
      const open=btn.getAttribute("aria-expanded")!=="true";
      existing.forEach(el=>el.classList.toggle("ux-detail-hidden",!open));
      btn.setAttribute("aria-expanded",String(open));
      btn.textContent=open ? "詳細データを閉じる" : "詳細データ・交換案を表示";
      if(open) existing[0]?.scrollIntoView({behavior:"smooth",block:"nearest"});
    });
  }

  function createGlance(){
    const battle=document.getElementById("battle");
    const root=battle?.querySelector(":scope > .section");
    if(!root) return null;

    let box=document.getElementById("uxBattleGlance");
    if(box) return box;

    box=document.createElement("div");
    box.id="uxBattleGlance";
    box.setAttribute("aria-label","対戦中の要点");
    box.innerHTML=`
      <div class="ux-glance-card" id="uxGlanceMove">
        <span>まず見る</span><b>有効打：—</b>
      </div>
      <div class="ux-glance-card" id="uxGlanceSpeed">
        <span>速度</span><b>—</b>
      </div>
      <div class="ux-glance-card" id="uxGlanceWeak">
        <span>相手の弱点</span><b>—</b>
      </div>`;

    const grid=root.querySelector(".battle-grid");
    if(grid?.nextSibling) root.insertBefore(box,grid.nextSibling);
    else root.appendChild(box);
    return box;
  }

  function classifySpeed(text){
    const s=text.toLowerCase();
    if(/先手|速い|上/.test(s)) return "good";
    if(/後手|遅い|下/.test(s)) return "bad";
    if(/同速|不明|—/.test(s)) return "warn";
    return "";
  }

  function updateGlance(){
    createGlance();

    const move=textOf("bestMoveText");
    const weak=textOf("foeWeakText");
    const speed=(document.getElementById("speedBox")?.textContent||"")
      .replace(/\s+/g," ").trim() || "—";

    const gm=document.getElementById("uxGlanceMove");
    const gs=document.getElementById("uxGlanceSpeed");
    const gw=document.getElementById("uxGlanceWeak");

    if(gm) gm.querySelector("b").textContent=`有効打：${move}`;
    if(gs){
      gs.querySelector("b").textContent=speed;
      gs.dataset.state=classifySpeed(speed);
    }
    if(gw) gw.querySelector("b").textContent=weak;
  }

  function setupBattlePriority(){
    const battle=document.getElementById("battle");
    if(!battle) return;
    const root=battle.querySelector(":scope > .section");
    if(!root) return;

    const h=root.querySelector(":scope > h3");
    if(h) h.textContent="対戦中の判断";

    createGlance();
    updateGlance();

    if(root.dataset.uxObserver!=="1"){
      root.dataset.uxObserver="1";
      const observer=new MutationObserver(updateGlance);
      ["bestMoveText","foeWeakText","speedBox"].forEach(id=>{
        const el=document.getElementById(id);
        if(el) observer.observe(el,{childList:true,subtree:true,characterData:true});
      });
    }
  }

  function setupTabLabels(){
    document.querySelectorAll(".tab").forEach(tab=>{
      const k=tab.dataset.tab;
      if(k==="build") tab.setAttribute("aria-label","構築画面");
      if(k==="battle") tab.setAttribute("aria-label","対戦画面");
      if(k==="diag") tab.setAttribute("aria-label","診断画面");
    });
  }

  function init(){
    setupBuildProgressiveDisclosure();
    setupBattlePriority();
    setupTabLabels();
    document.documentElement.classList.add("ppcham-human-factors-ui-v2");
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init,{once:true});
  }else{
    init();
  }

  window.PPChamHumanFactorsUI={
    version:2,
    init,
    detailIds:[...DETAIL_IDS],
    audit(){
      return {
        version:2,
        bottomTabs:!!document.querySelector(".tabs"),
        battleGlance:!!document.getElementById("uxBattleGlance"),
        detailToggle:!!document.getElementById("uxDetailToggle"),
        logicTouched:false
      };
    }
  };
})();


/* ppcham Human Factors UI Patch v3
   Reorders existing DOM for readability; does not alter model decisions. */
(() => {
  if(window.PPChamHumanFactorsUI?.version >= 3) return;

  function moveBuildPriority(){
    const priority=document.getElementById("priorityDiagnosis");
    const roadmap=document.getElementById("improvementRoadmap");
    const env=document.getElementById("environmentMatchups");
    if(!priority || !roadmap) return;

    const parent=priority.parentElement;
    if(parent && roadmap.parentElement===parent){
      parent.insertBefore(priority,roadmap);
      if(env && env.parentElement===parent){
        parent.insertBefore(roadmap,env);
      }
    }

    if(!document.getElementById("uxBuildFlowLabel")){
      const box=document.createElement("div");
      box.id="uxBuildFlowLabel";
      box.innerHTML=`
        <div class="ux-flow-step"><span>STEP 1</span><b>何が問題かを見る</b></div>
        <div class="ux-flow-step"><span>STEP 2</span><b>どう直すかを見る</b></div>
        <div class="ux-flow-step"><span>STEP 3</span><b>環境相性で確認</b></div>`;
      priority.insertAdjacentElement("beforebegin",box);
    }
  }

  function diagSummaryText(){
    const issues=(document.getElementById("issues")?.textContent||"")
      .replace(/\s+/g," ").trim();
    const metrics=(document.getElementById("metrics")?.textContent||"")
      .replace(/\s+/g," ").trim();

    if(issues && !/問題なし|—/.test(issues)){
      return {
        title:"まず問題点を見る",
        body:issues.slice(0,180)
      };
    }
    if(metrics){
      return {
        title:"大きな問題は少なそう",
        body:"数値の詳細を下で確認できる。必要なら構築画面の改善プランへ戻って調整。"
      };
    }
    return {
      title:"6体を作ると診断が出る",
      body:"診断結果は、結論 → 問題点 → 数値詳細の順で表示する。"
    };
  }

  function updateDiagSummary(){
    const diag=document.getElementById("diag");
    if(!diag) return;
    const section=diag.querySelector(".section");
    if(!section) return;

    let box=document.getElementById("uxDiagSummary");
    if(!box){
      box=document.createElement("div");
      box.id="uxDiagSummary";
      const h=section.querySelector("h3");
      h?.insertAdjacentElement("afterend",box);
    }
    const t=diagSummaryText();
    box.innerHTML=`
      <div class="ux-diag-kicker">診断サマリー</div>
      <div class="ux-diag-title">${t.title}</div>
      <div class="ux-diag-body">${t.body}</div>`;
  }

  function reorderDiag(){
    const metrics=document.getElementById("metrics");
    const issues=document.getElementById("issues");
    if(!metrics || !issues) return;

    const parent=metrics.parentElement;
    if(parent && issues.parentElement===parent){
      parent.insertBefore(issues,metrics);
    }
    updateDiagSummary();

    if(parent?.dataset.uxDiagObserver!=="1"){
      parent.dataset.uxDiagObserver="1";
      const ob=new MutationObserver(updateDiagSummary);
      ob.observe(metrics,{childList:true,subtree:true,characterData:true});
      ob.observe(issues,{childList:true,subtree:true,characterData:true});
    }
  }

  function init(){
    moveBuildPriority();
    reorderDiag();

    const prev=window.PPChamHumanFactorsUI;
    window.PPChamHumanFactorsUI={
      ...(prev||{}),
      version:3,
      init,
      audit(){
        return {
          version:3,
          buildFlow:!!document.getElementById("uxBuildFlowLabel"),
          diagSummary:!!document.getElementById("uxDiagSummary"),
          issuesBeforeMetrics:
            !!document.getElementById("issues") &&
            !!document.getElementById("metrics") &&
            document.getElementById("issues").compareDocumentPosition(document.getElementById("metrics")) & Node.DOCUMENT_POSITION_FOLLOWING,
          logicTouched:false
        };
      }
    };
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init,{once:true});
  }else init();
})();


/* ppcham Human Factors UI Patch v4
   Remembers scroll per screen and adds a non-invasive back-to-top control. */
(() => {
  if(window.PPChamHumanFactorsUI?.version >= 4) return;

  const POS_KEY="ppcham_ui_scroll_v1";
  const screens=["build","battle","diag"];
  let restoring=false;

  function readPositions(){
    try{
      return JSON.parse(sessionStorage.getItem(POS_KEY)||"{}")||{};
    }catch(_){
      return {};
    }
  }

  function writePositions(obj){
    try{ sessionStorage.setItem(POS_KEY,JSON.stringify(obj)); }catch(_){}
  }

  function activeScreenId(){
    return document.querySelector(".screen.active")?.id || "build";
  }

  function saveCurrentPosition(){
    if(restoring) return;
    const id=activeScreenId();
    if(!screens.includes(id)) return;
    const p=readPositions();
    p[id]=Math.max(0,window.scrollY||0);
    writePositions(p);
    updateTabDots(p);
  }

  function restorePosition(id){
    const p=readPositions();
    const y=Number(p[id]||0);
    restoring=true;
    requestAnimationFrame(()=>{
      window.scrollTo({top:y,behavior:"auto"});
      setTimeout(()=>{restoring=false;},40);
    });
  }

  function updateTabDots(p=readPositions()){
    document.querySelectorAll(".tab").forEach(tab=>{
      const id=tab.dataset.tab;
      tab.classList.toggle("ux-has-position",Number(p[id]||0)>80);
    });
  }

  function bindTabs(){
    document.querySelectorAll(".tab").forEach(tab=>{
      if(tab.dataset.uxScrollBound==="1") return;
      tab.dataset.uxScrollBound="1";

      tab.addEventListener("pointerdown",saveCurrentPosition,{passive:true});
      tab.addEventListener("click",()=>{
        const id=tab.dataset.tab;
        if(screens.includes(id)) setTimeout(()=>restorePosition(id),0);
      });
    });
  }

  function setupBackToTop(){
    let btn=document.getElementById("uxBackToTop");
    if(!btn){
      btn=document.createElement("button");
      btn.id="uxBackToTop";
      btn.type="button";
      btn.setAttribute("aria-label","この画面の先頭へ戻る");
      btn.textContent="↑";
      document.body.appendChild(btn);
      btn.addEventListener("click",()=>{
        window.scrollTo({top:0,behavior:"smooth"});
        const p=readPositions();
        p[activeScreenId()]=0;
        writePositions(p);
        updateTabDots(p);
      });
    }

    const update=()=>{
      btn.classList.toggle("show",(window.scrollY||0)>500);
    };
    update();
    window.addEventListener("scroll",update,{passive:true});
  }

  function init(){
    bindTabs();
    setupBackToTop();
    updateTabDots();

    let timer=null;
    window.addEventListener("scroll",()=>{
      clearTimeout(timer);
      timer=setTimeout(saveCurrentPosition,120);
    },{passive:true});

    const prev=window.PPChamHumanFactorsUI;
    window.PPChamHumanFactorsUI={
      ...(prev||{}),
      version:4,
      init,
      audit(){
        return {
          version:4,
          remembersPerScreenScroll:true,
          backToTop:!!document.getElementById("uxBackToTop"),
          storedPositions:readPositions(),
          logicTouched:false
        };
      }
    };
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init,{once:true});
  }else init();
})();


/* integrated audit */
(() => {
  window.PPChamIntegratedVisualAudit = () => {
    const map = window.PPCHAM_POKEMON_ASSET_ID_MAP || window.PPCHAM_POKEMON_ASSET_MAP || {};
    return {
      bundleVersion: window.PPChamIntegratedVisualBundle?.version || 0,
      pokemonMapCount: Object.keys(map).length,
      resolverPresent: !!window.PPChamIllustrationResolver,
      uiVersion: window.PPChamHumanFactorsUI?.version || 0,
      fallback: window.PPChamIllustrationResolver?.fallback || "pokeball.webp",
      logicTouched: false
    };
  };
})();
