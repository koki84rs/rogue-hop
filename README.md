# Rogue Hop

タップ1つで遊べる、プールが延々と増え続けるローグライトジャンプアクション。

- **プラットフォーム**: スマホWeb（将来 iOS/Android）
- **技術**: Phaser 3 + TypeScript + Vite
- **公開**: Netlify（URL共有）

## ドキュメント

- [ゲームデザインドキュメント](docs/GAME_DESIGN.md) — コンセプト・設計思想・仕様の全て
- [セットアップ手順](docs/SETUP.md) — 初心者向け環境構築ガイド

## よく使うコマンド

```bash
# 初回のみ
npm install

# 開発サーバー起動（ブラウザで http://localhost:5173 にアクセス）
npm run dev

# 本番ビルド（Netlify に上がるファイルを生成）
npm run build

# ビルド結果をローカルで確認
npm run preview
```

## ディレクトリ構造

```
rogue-hop/
├── docs/         ← ドキュメント
├── public/       ← 静的アセット（音声ファイル等）
├── src/          ← ソースコード
│   ├── scenes/   ← ゲームシーン
│   ├── entities/ ← プレイヤー・敵
│   ├── systems/  ← ゲームロジック
│   └── data/     ← 敵・能力・実績の定義（JSON）
└── index.html    ← エントリーHTML
```

## 開発状況

- [x] 企画書作成
- [ ] 環境セットアップ
- [ ] タップジャンプ最小版
- [ ] 敵1種（Walker）追加
- [ ] 敵5種全て
- [ ] 能力システム
- [ ] 能力10種全て
- [ ] ステージ進行
- [ ] ボス戦
- [ ] 実績システム
- [ ] メタ進行
- [ ] Netlify 公開
