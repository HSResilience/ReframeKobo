# リフレーム工房：PWA化 デプロイ手順

## 用意したファイル

| ファイル | 役割 |
|---|---|
| `index.html` | アプリ本体（これまでの`nega-posi.html`と同内容） |
| `manifest.json` | アプリ名・アイコン・配色などをOSに伝える設定 |
| `sw.js` | 更新をすぐ反映しつつ、オフラインでも開けるようにするサービスワーカー |
| `manual.html` | 使い方ガイド（アプリ内の「使い方ガイド」リンク先） |
| `privacy.html` / `terms.html` | プライバシーポリシーと利用規約（アプリのホーム画面の下と、Googleの同意画面からリンク） |
| `beta/index.html` | テスト用のベータ版（新しい機能を本番の前に試す場所） |
| `es/` | スペイン語版（別のチャットで管理。日本語版の作業では触らない） |
| `icon-192.png` / `icon-512.png` | ホーム画面アイコン（通常版） |
| `icon-maskable-192.png` / `icon-maskable-512.png` | ホーム画面アイコン（Android用の安全余白付き版） |

**これらのファイルは、必ず同じフォルダに一緒に置いてください。** `manifest.json`や`sw.js`、`manual.html`は、同じ階層にある`index.html`やアイコンを相対パスで参照しています。

---

## 1. ホスティング先を用意する（HTTPS必須）

PWAはHTTPS配信が必須です（`localhost`での動作確認は例外的にOK）。無料で手軽な選択肢：

- **Cloudflare Pages**：以前Workersを使った流れで、同じCloudflareアカウントでそのまま使えます
- **Netlify** / **Vercel**：フォルダをドラッグ&ドロップするだけで公開できる手軽さ
- **GitHub Pages**：GitHubにリポジトリを作り、ファイルを置くだけ

どれも無料枠で十分です。

## 2. ファイルをまとめてアップロードする

上記いずれかのサービスで、新しいプロジェクト（サイト）を作成し、すべてのファイルを同じ階層にアップロードしてください。

## 3. 動作確認

1. 発行されたURL（例：`https://reframe-koubou.pages.dev`）にスマホのブラウザでアクセス
2. Safari（iPhone）なら共有ボタン→「ホーム画面に追加」、Chrome（Android）なら「アプリをインストール」の案内が出ます
3. ホーム画面のアイコンから開き、ブラウザのアドレスバーが出ない「アプリらしい」表示になっていれば成功です
4. 機内モードにしてアプリを開き、画面の外枠（ホーム画面など）が表示されればオフラインキャッシュも機能しています（AIが絡む機能は通信が必要なので動きません）

---

## 既存のAPIキー保護(Cloudflare Workersプロキシ)との関係

以前作った`reframe-proxy-worker.js`を使う設定にしている場合は、`index.html`内の`API_ENDPOINT`がそのプロキシのURLを指しているか、念のため確認してください。PWA化そのものとは別の話ですが、公開して誰でも使える状態にするなら必須の設定です。

## うまく動かない時によくある原因

- ファイルが別々のフォルダに分かれている（`manifest.json`や`sw.js`は`index.html`と同じ階層が必須）
- HTTPSではなくHTTPで配信している
- ブラウザのキャッシュが古いままになっている（一度サービスワーカーを登録解除するか、シークレットウィンドウで確認）

## アプリを更新するとき

- `index.html`や`manual.html`を差し替えるだけで、通信できる状態で次に開いたときに、最新の内容が反映されます（画面ファイルは「ネットワーク優先」で取得し、圏外のときだけ保存済みのコピーで開きます）。
- アイコンなどの画像は、速さを優先して保存済みのものを使います。アイコンを変えたときは、`sw.js`の`CACHE_VERSION`（例：`'v3'`）の数字を1つ上げてアップロードしてください。古いキャッシュが自動で消えます。
- 新しいバージョンに切り替わると、アプリが一度だけ自動で読み込み直されます。
- 以前の`sw.js`（保存済みの内容を常に優先する方式）を使っていた端末では、最初の1回だけ反映されないことがあります。そのときは、キャッシュを消すか、サイトを削除して入れ直してください。

## 公開時の注意：AIの接続先

`index.html`内の`API_ENDPOINT`が、Cloudflare WorkersのプロキシのURLを指していることを、差し替えのたびに確認してください。初期値（`https://api.anthropic.com/v1/messages`）のままだと、公開サイトでAIが使えず、簡易版の表示になります。

---

## ログインとクラウド保存（Supabase）

- ログインとデータの保存先は、Supabaseのプロジェクト「Reframe-Kobo」です。アプリには、公開してよい「Project URL」と「Publishable key」だけを入れています。`service_role`（secret）キーは、アプリにもGitHubにも置きません。
- 表とアクセス制限は、`supabase-stage1.sql` と `supabase-stage1b-passphrase.sql` で作りました（実行済み）。
- 合言葉を変えるときは、`supabase-stage1b-passphrase.sql` の一番下の「9」の手順で、古い合言葉を使えなくしてから、新しい合言葉を登録します。すでに確認が済んだ人は、そのまま使えます。
- Supabaseの「Authentication」→「URL Configuration」の「Redirect URLs」に、`https://hsresilience.github.io/ReframeKobo/**` と `https://hsresilience.github.io/ReframeKobo/beta/**` が入っている必要があります。
- 一般の方がログインできるようにするには、Google Cloudの「Google Auth Platform」→「対象」で「本番環境に公開」にします（「テスト」のままだと、テストユーザーしかログインできません）。

## アプリの組み立て方（開発用）

本番の`index.html`とベータ版の`beta/index.html`は、元のファイル（`nega-posi.html`）に、ログインと同期の部品（`cloud-sync.js`）を組み込んで作ります。この組み立て用のファイルは、Claudeの作業フォルダ（`outputs/build/`）に置いてあり、GitHubには置いていません。

```
python3 build/build_app.py prod   # → index.html（本番）
python3 build/build_app.py beta   # → beta-index.html（ベータ版。beta/index.html に置く）
```

本番は、AIの接続先を、Cloudflare WorkersのプロキシのURLに置き換えます。ベータ版は、上に「ベータ版」の帯が出て、サービスワーカーを登録しません。

## AIの利用条件（ログインと1日の上限）

- AIの中継役（Cloudflare Workers の reframe-proxy）は、アプリから届く「ログインの証明」をSupabaseで確かめ、合言葉の確認が済んだ人だけにAIを使わせます。プログラムは `reframe-proxy-worker.js`。
- 1日の上限は20回（日本時間の0時に戻る）。回数を変えるときは、`supabase-stage1c-ai-quota.sql` の `ai_daily_limit()` の数字を書き換えて、SQL Editorで実行します。
- ログインしていない人や、回数を使い切った人は、Aは簡易版、Bは自分で書き換える欄で、そのまま使えます。
- スペイン語版（es/）も同じ中継役を使っているため、スペイン語版にログインを入れるまでは、スペイン語版のAIは使えません。

## 購入者特典とお試し（段階2）

- 設定は、Supabaseの `promo_config` の表（1行）にあります。`supabase-stage2-promo.sql` で作りました。
  - 発売日 `release_at`: 2026年12月30日（60日を数え始める日）
  - 受付期限 `entry_deadline`: 2027年1月31日 23:59（日本時間）。延ばすときは、ファイルの中の update の例のとおりに書き換えて実行
  - 特典の日数 `promo_days`: 60日　／　お試しの回数 `trial_total`: 通算10回
- 受付期限までに合言葉の確認を済ませた人は、発売日（またはその後に確認した日）から60日間、1日20回まで。受付期限のあとの人は、通算10回まで。
- 状況の確認: ファイルの一番下の select の例を、SQL Editorで実行すると、全員分の状況が見られます。
