ppcham Ready-to-Drop Package

このフォルダの中身を、index.html と同じ階層にそのまま置いてください。

配置後の形:

index.html
ppcham_complete_local_bundle_v3.js
assets/
  common/
    pokeball.webp
  pokemon/
    hero/
    icon/
  items/
  types/

index.html の </body> の直前に、まだ無ければ次の1行を追加してください:

<script src="./ppcham_complete_local_bundle_v3.js"></script>

画像を追加するときの名前:
- 大きいポケモン画像:
  assets/pokemon/hero/{pokemon_id}.webp
- 小さいポケモン画像:
  assets/pokemon/icon/{pokemon_id}.webp
- 持ち物:
  assets/items/{item_id}.webp
- タイプ:
  assets/types/{type_key}.webp

画像が無い場合:
assets/common/pokeball.webp が自動表示されます。

注意:
- ppcham本体は外部サイトへ画像を取りに行きません。
- 実画像はローカルに置く方式です。
- 既存のチーム・技・持ち物・性格・AP設定を壊さない設計です。
