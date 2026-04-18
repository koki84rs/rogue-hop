# Rogue Hop セットアップ手順（初心者向け）

この手順書は、**プログラミング未経験者がゼロから Rogue Hop を公開URLで友人に遊んでもらうまで**の全工程を書いたもの。Claude Code（僕）が実行できる部分と、君が手を動かす必要がある部分を明記する。

---

## 全体の流れ

1. ローカルで動くゲームを作る（僕が進める、君の作業ほぼなし）
2. GitHubにコードを上げる（君が1度だけアカウント操作する）
3. Netlifyに連携して公開URLを得る（君が1度だけアカウント操作する）
4. 以降、コード変更は自動で公開URLに反映される

---

## Part 1: 用語の最小限説明

| 用語 | 役割 | 例え |
|---|---|---|
| **Node.js** | JavaScript を PC 上で動かすためのソフト | Wordを動かすためのMacと同じで、コードを動かすための土台 |
| **npm** | Node.js のライブラリ管理ツール | AppStoreのコマンド版。`npm install xxx` で部品を取得 |
| **Phaser 3** | ゲームを作るためのライブラリ（部品集） | ゲーム作りのレゴブロック |
| **Vite** | 開発中に自動でブラウザをリロードしてくれる便利ツール | 書いた瞬間に結果が見えるエディタ |
| **TypeScript** | バグを減らすためのJavaScript改良版 | 変数の「型」を事前チェックしてくれる |
| **Git** | コードの変更履歴を管理するツール | Word の「変更履歴」の超高性能版 |
| **GitHub** | Git のコードをクラウドに置くサービス | Dropbox のコード専用版 |
| **Netlify** | GitHub のコードを自動で公開URLにしてくれるサービス | GitHub にpushすると勝手に URL が更新される魔法 |

---

## Part 2: 現時点の環境チェック（済み）

僕が確認済み：

- ✅ Node.js v20.15.0
- ✅ npm 10.7.0
- ✅ git 2.50.1
- ✅ iCloud Drive に自作アプリフォルダあり

→ **追加インストール不要**。すぐ開発に入れる。

---

## Part 3: プロジェクト初期化（僕がやる）

1. Phaser 3 + Vite + TypeScript のテンプレートで初期化
2. 必要なパッケージインストール
3. タップジャンプの最小版を実装
4. ローカル動作確認

君がやることは **ブラウザで http://localhost:5173 を開いて確認するだけ**。

---

## Part 4: GitHub セットアップ（君の作業、1度だけ）

### 4.1 GitHub アカウントにログイン

1. https://github.com/ にアクセス
2. Sign in（すでにアカウント作成済みのはず）

### 4.2 リポジトリを作成

1. 右上の「**+**」アイコン → 「New repository」
2. 以下を入力：
   - **Repository name**: `rogue-hop`
   - **Description**: `Minimalist roguelite jump action for mobile web`
   - **Public / Private**: どちらでも（Public推奨：友人にソースも見せられる）
   - **Add a README file**: ❌ チェックしない（ローカルに既にあるため）
   - **Add .gitignore**: ❌ チェックしない（これも既にある）
3. 「Create repository」

### 4.3 SSH キーの設定（推奨、パスワード入力なしで push できる）

※ すでに設定済みの場合はスキップ

1. Mac のターミナルで実行:
   ```bash
   ls -la ~/.ssh
   ```
   - `id_ed25519.pub` または `id_rsa.pub` があれば既存あり
   - なければ作成:
     ```bash
     ssh-keygen -t ed25519 -C "your-email@example.com"
     # Enter を3回押す（デフォルトでOK）
     ```
2. 公開鍵を取得:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # 表示された内容を全部コピー
   ```
3. GitHub: 右上のアイコン → Settings → SSH and GPG keys → New SSH key
4. Title: `MacBook`、Key: コピーした内容を貼り付け → Add SSH key

**またはSSHが難しければ HTTPS + Personal Access Token でも可**（後で説明可能）

### 4.4 ローカルリポジトリと GitHub を接続

これは僕がやる。君がリポジトリURLを教えてくれたら、`git remote add` と初回 push を実行する。

---

## Part 5: Netlify 連携（君の作業、1度だけ）

### 5.1 Netlify にログイン

1. https://app.netlify.com/ にアクセス
2. すでにアカウントがあるのでログイン（GitHub連携推奨：GitHub の認証情報でそのまま入れる）

### 5.2 サイトを追加

1. ダッシュボードで「**Add new site**」→「**Import an existing project**」
2. 「Deploy with GitHub」を選択 → GitHub 連携を承認
3. リポジトリ一覧から `rogue-hop` を選択
4. Build settings:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - （これらは僕が設定した `netlify.toml` で自動入力される）
5. 「Deploy site」

### 5.3 公開URL取得

デプロイが完了すると自動で URL が発行される（例: `https://rogue-hop-xxx.netlify.app`）。

カスタムドメインを設定したい場合は Netlify の設定で後から変更可能。

---

## Part 6: 以降の開発フロー

一度セットアップが済めば、以降の作業は超シンプル：

1. 僕がコードを編集・新機能追加
2. Git で変更をコミット → GitHub に push
3. Netlify が自動ビルド → 公開 URL が更新される
4. 君は URL を更新するだけで最新版を確認できる

**君の出番はほぼ遊んで感想をくれることだけ**。

---

## よくあるトラブル

### ターミナルで「permission denied」が出る

`sudo` を頭につけずに、まずは `cd` で正しいディレクトリに移動してから実行しているか確認する。基本的に `sudo` は使わない。

### `npm install` が遅い／失敗する

ネット環境の問題が多い。時間を置いて再実行。

### iCloud Drive のパスに日本語が含まれていて動かない

本来は避けたいが、実害が出た時は `~/code/rogue-hop/` など別パスに移動する。現状は問題なく動くはず。

### ブラウザで localhost:5173 が開かない

- 開発サーバー（`npm run dev`）が起動しているか確認
- ポート5173が他のアプリで使われていないか（`lsof -i :5173`）

---

## 困ったら

僕（Claude Code）に聞く。エラーメッセージをそのまま貼れば、大体そこから原因を追える。
