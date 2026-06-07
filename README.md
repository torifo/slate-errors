# Slate Errors

<!-- tech-stack:start (auto-generated) -->
<p align="center">
  <img src="https://img.shields.io/badge/Astro-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
</p>
<!-- tech-stack:end -->

放課後の黒板で、HTTPエラーを学び直す。

> エラーは間違いではない、発見である。

「Slate Errors」は、HTTP ステータスコード (4xx / 5xx) を **黒板＋チョークの世界観** で日本語学習できるリファレンスサイトです。エラーの意味、原因、対処法を「先生・生徒・職員室」のメタファーでやさしく解き直します。

- 全 40 件の RFC 標準 4xx / 5xx エラーを網羅
- 日本語ファースト、Fuse.js による高速サジェスト検索 (シノニム対応)
- 完全静的 (Astro + MDX)、無料ホスティング (GitHub Pages)
- 黒板テーマ ＋ チョーク UI (Tailwind v4 / Inter / M PLUS Rounded 1c / JetBrains Mono)

## ローカル開発

```bash
pnpm install
pnpm dev              # http://localhost:4321/slate-errors/
pnpm build            # 本番ビルド (astro check + astro build)
pnpm preview          # 本番想定の base path でプレビュー
pnpm test             # Vitest (lib + content schema)
pnpm check            # astro check (型 / コンテンツ整合性)
pnpm check:content    # MDX フロントマター検証 (重複コード / 孤立 related 検出)
```

Node.js は `>=22.12.0` が必要です。パッケージマネージャは pnpm。

## コンテンツの追加・編集

### 既存ページを直す

1. `src/content/errors/<code>.mdx` を編集する
2. `pnpm dev` でプレビュー、`pnpm check:content` で整合性確認
3. コミット (Conventional Commits 推奨: `content: ...`)

### 新しいエラーページを追加する

1. `src/content/errors/_template.mdx` をコピーして `<code>.mdx` を作成
2. フロントマター必須項目 (`code` / `name` / `nameJa` / `category` / `summary` / `synonyms` 等) を埋める
3. 本文セクション (TL;DR / 学校での例え / 何が起きたか / 直し方 / 確認するもの 等) を執筆
4. `popular: true` を付けるとトップページの「よくあるエラー」に出る
5. `related: [400, 500]` で関連エラーを相互リンク
6. `pnpm check:content` で重複コード・孤立 related が無いか確認
7. `pnpm build` で全ページが正しく生成されることを確認

詳しい執筆ガイド: [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md)

## デプロイ (GitHub Pages)

`main` への push で `.github/workflows/deploy.yml` が走り、GitHub Pages へ自動公開されます。

初回セットアップ:

1. GitHub に `torifo/slate-errors` リポジトリを作成
2. Settings → Pages → Source = **GitHub Actions** に設定
3. ローカルから:
   ```bash
   git remote add origin git@github.com:torifo/slate-errors.git
   git push -u origin main
   ```
4. Actions タブで `deploy` ワークフローの完了を待つ
5. https://torifo.github.io/slate-errors/ が公開される

`base` パス (`/slate-errors/`) は `astro.config.mjs` で設定済みです。別リポジトリ名にする場合は同ファイルと `package.json` の `preview` スクリプトを更新してください。

## 詳細ドキュメント

- 設計仕様: [`docs/superpowers/specs/2026-05-13-slate-errors-design.md`](docs/superpowers/specs/2026-05-13-slate-errors-design.md)
- 実装計画: [`docs/superpowers/plans/2026-05-13-slate-errors.md`](docs/superpowers/plans/2026-05-13-slate-errors.md)
- コンテンツ執筆ガイド: [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md)
- コンテンツ進捗管理: [`docs/CONTENT_PROGRESS.md`](docs/CONTENT_PROGRESS.md)

## 技術スタック

| 領域 | 技術 |
| --- | --- |
| フレームワーク | [Astro 6](https://astro.build/) (静的生成 / Content Collections) |
| コンテンツ | MDX 5 (`@astrojs/mdx`) |
| スタイル | Tailwind CSS v4 (`@tailwindcss/vite`) + カスタム黒板テーマ |
| 検索 | [Fuse.js](https://fusejs.io/) (クライアントサイド、ビルド時 `search-index.json` 生成) |
| サイトマップ | `@astrojs/sitemap` |
| テスト | [Vitest 4](https://vitest.dev/) |
| 型・整合性 | TypeScript 5 / `astro check` / 自作 `check:content` |
| ホスティング | GitHub Pages (`actions/deploy-pages@v4`) |
| フォント | Inter / M PLUS Rounded 1c / JetBrains Mono (Google Fonts) |

## ライセンス

未定 (コンテンツは原則 CC BY 4.0 を想定)。商用利用時はご相談ください。
