# Slate Errors — Design Document

- **Status**: Approved (brainstorm phase complete)
- **Date**: 2026-05-13
- **Author**: Claude (with akito-shoji)
- **Scope**: 初期リリース全体（プロジェクト構成・スキーマ・スタイリング・コンポーネント・デプロイ・コンテンツ40件）

---

## 1. ビジョン

「**エラーは間違いではない、発見である**」を体現する、HTTPエラーコード解説サイト。

放課後の黒板に書かれた、優しい先生の振り返りメモのような佇まい。プログラミング初学者が「失敗の意味」を学び直し、「次の一歩」を踏み出せる場所にする。

### 中心メタファー：教室・放課後の黒板

**重要**: 当初ブリーフでは「合奏の練習」のメタファーが提示されたが、ブレストで明確に **「合奏ではなく教室」** に修正された。サイト名 `slate-errors`（slate=石板/黒板）、デザイン「放課後の黒板」、配色（黒板緑+チョーク琥珀）、フォント（Finger Paint, Kiwi Maru）すべてが教室・チョーク文化に整合する。

**使う語彙**: 教室、黒板、チョーク、放課後、授業、ノート、先生、振り返り、宿題、つまずき、隣の席
**使わない語彙**: 合奏、合唱、楽譜、譜面、小節、演奏、リハーサル、楽器

### 語り口（404 を例にした基準サンプル）

「バランス型・教育的」トーン。メタファーは導入の1段落、本体は技術的にきちんと、最後は具体的な手順 + 管理者視点。

```
## 何が起きたのか？

404は「指定されたURLに対応するページがサーバー上に
見つからなかった」というサインです。
教室で「教科書の38ページを開いて」と言われたのに、
その38ページが破られていた——そんな感覚に近いかもしれません。

## 黒板からのひとこと

授業の前に、先生は必ず「今日のページはここだよ」と確認します。
Webでも同じで、URL（先生の指示）と
サーバー上のリソース（実際の教科書のページ）が
一致していないと、授業は始まりません。

「リソースが移動した」「URLを打ち間違えた」
「リンクが古い」など、原因はいくつかあります。

## 解決への歩み

大丈夫、次はこうしてみよう：

1. **URLの綴りを確認**：typoは誰にでもある
2. **リンク元を確認**：参照元が古いかもしれない
3. **サイト内検索やトップから探す**：
   ページが移動した可能性
4. **サーバーログを確認（管理者向け）**：
   意図せず削除していないか
```

---

## 2. 確定事項サマリー

| 項目 | 決定 |
|---|---|
| 哲学・トーン | 「教室」メタファー / バランス型・教育的 |
| 情報設計 | C+A: トップは検索ファースト、`/errors/` は4xx/5xx グループの図書館型 |
| 検索 | コード+名前+サマリ+同義語、Fuse.js のクライアントファジー検索 |
| 詳細ページ構成 | ① 何が起きたのか？ ② 黒板からのひとこと ③ 解決への歩み + ④ HTTPレスポンス例 ⑤ 前後/関連リンク ⑥ よくある原因TOP3 ⑦ RFC/MDN参照 |
| 言語 | 日本語メイン + 英語サブタイトル（"404 Not Found — ページが見つかりません"） |
| コンテンツ範囲 | 初期リリースで RFC標準 4xx/5xx 全件（40件）を全文 |
| 配色 | 黒板緑 #1a2e1a / チョーク琥珀 #f2c94c |
| フォント | Finger Paint（見出し）/ Kiwi Maru（本文）— ブラウザデフォルト残さず |
| 配信 | GitHub Pages: `username.github.io/slate-errors/`（basePath `/slate-errors`） |

### UI 一貫性の絶対原則

**ブラウザデフォルトの見た目を一切残さない**：
- `<button>`, `<input>`, `<select>`, `<textarea>` はすべてチョーク調にカスタム（`.btn-chalk`, `.input-chalk`）
- `<a>` 要素もチョーク波線アンダーライン
- フォントは `@font-face` + `<link rel="preload">` で確実にロード保証

---

## 3. アーキテクチャ

**Astro 5 + Content Collections (typed) + MDXコンポーネント駆動**

| 観点 | 採用 | 棄却 | 理由 |
|---|---|---|---|
| コンテンツ管理 | Astro Content Collections + Zodスキーマ | 素のMDX | 型安全性、40件で破綻リスク回避 |
| 詳細ページ | 1テンプレート `[code].astro` で40件動的生成 | ページごとの個別 .astro | 量産効率 |
| 拡張要素 | `<ResponseExample>` `<CommonCauses>` `<Related>` `<References>` | 純Markdown | 見栄えと再利用性 |
| 検索 | ビルド時 `/search-index.json` 生成 + Fuse.js | Pagefind | オーバースペック回避 |
| スタイル | Tailwind v4 CSS-first（`@theme`）+ 自前ユーティリティ | プリセットテーマ | 独自性 |
| デプロイ | GitHub Actions + `actions/deploy-pages` | 手動 | 再現性 |

**コントラスト方針**: 黒板緑×チョーク色は低コントラストになりがち。本文は `chalk-white`（#f4ecd8寄り、コントラスト比約 7:1）に固定。琥珀色 `#f2c94c` は見出し・強調限定。

---

## 4. ディレクトリ構造とルーティング

```
slate-errors/
├── astro.config.mjs               # site, base, integrations (mdx, sitemap)
├── package.json
├── tsconfig.json
├── .github/workflows/deploy.yml   # GitHub Pages 用
├── public/
│   ├── favicon.svg                # チョークで描いた "?" 風
│   └── og-image.png               # 黒板の写真風 (1200x630)
├── src/
│   ├── content/
│   │   ├── config.ts              # Zod スキーマ定義 (errors collection)
│   │   └── errors/
│   │       ├── _TEMPLATE.mdx      # 量産用骨格 (collection filterで除外)
│   │       ├── 400.mdx
│   │       ├── 401.mdx
│   │       ├── ...                # 全 40 件
│   │       └── 511.mdx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BaseLayout.astro
│   │   │   ├── BlackboardFrame.astro
│   │   │   ├── SiteHeader.astro
│   │   │   └── SiteFooter.astro
│   │   ├── search/
│   │   │   ├── SearchBar.astro        # トップヒーロー用 (大)
│   │   │   ├── SearchBox.astro        # 全ページ共通 (小)
│   │   │   └── search.client.ts       # Fuse.js 初期化
│   │   ├── error/
│   │   │   ├── ErrorCard.astro
│   │   │   ├── ErrorGroup.astro
│   │   │   ├── ErrorHero.astro
│   │   │   ├── PrevNext.astro
│   │   │   ├── RelatedErrors.astro
│   │   │   ├── CommonCauses.astro
│   │   │   ├── ResponseExample.astro
│   │   │   └── References.astro
│   │   └── ui/
│   │       ├── ChalkText.astro
│   │       └── EraserMark.astro
│   ├── layouts/
│   │   ├── HomeLayout.astro
│   │   └── ErrorLayout.astro
│   ├── pages/
│   │   ├── index.astro            # / トップ (検索ヒーロー + 頻出4件)
│   │   ├── errors/
│   │   │   ├── index.astro        # /errors/ 図書館型一覧
│   │   │   └── [code].astro       # /errors/404/ 動的生成
│   │   ├── search-index.json.ts   # Fuse.js 用
│   │   └── 404.astro              # 自己言及デザイン (404解説そのものを表示)
│   ├── styles/
│   │   ├── global.css             # @import "tailwindcss"; @theme {...}
│   │   └── chalkboard.css
│   ├── lib/
│   │   ├── errors.ts              # getCollection ラッパー、prev/next 計算
│   │   ├── search.ts              # 検索インデックス生成ロジック
│   │   └── url.ts                 # base path 付与ヘルパ
│   └── env.d.ts
└── docs/
    ├── superpowers/specs/         # 設計ドキュメント
    │   └── 2026-05-13-slate-errors-design.md
    ├── CONTENT_GUIDE.md           # 執筆チェックリスト
    └── CONTENT_PROGRESS.md        # 40件の進捗
```

### ルーティング

| URL | ファイル | 内容 |
|---|---|---|
| `/` | `pages/index.astro` | 検索ヒーロー + 頻出4件 + 「全件を見る」リンク |
| `/errors/` | `pages/errors/index.astro` | 4xx/5xx グループの図書館型カード一覧 |
| `/errors/404/` | `pages/errors/[code].astro` | 詳細（動的生成、`getStaticPaths` で全40件） |
| `/search-index.json` | `pages/search-index.json.ts` | クライアント検索用 JSON |
| `/*`（未発見） | `pages/404.astro` | 自己言及：404解説をそのまま表示 |

`trailingSlash: 'always'`（GH Pages 互換）。

---

## 5. Content Collections スキーマ

### `src/content/config.ts`

```ts
import { defineCollection, z } from 'astro:content';

const errorCategory = z.enum(['client', 'server']);

const commonCause = z.object({
  title: z.string(),
  hint: z.string().optional(),
});

const referenceLink = z.object({
  label: z.string(),
  url: z.string().url(),
  source: z.enum(['rfc', 'mdn', 'other']).default('other'),
});

const errors = defineCollection({
  type: 'content',
  schema: z.object({
    code: z.number().int().min(400).max(599),
    name: z.string(),
    nameJa: z.string(),
    category: errorCategory,
    summary: z.string().max(120),
    synonyms: z.array(z.string()).default([]),
    related: z.array(z.number().int()).default([]),
    commonCauses: z.array(commonCause).max(3).default([]),
    references: z.array(referenceLink).default([]),
    popular: z.boolean().default(false),
    draft: z.boolean().default(false),
    updatedAt: z.coerce.date().optional(),
    rfc: z.string().optional(),
    icon: z.string().optional(),
  }),
});

export const collections = { errors };
```

### MDX ファイル例（`src/content/errors/404.mdx` 冒頭）

```mdx
---
code: 404
name: "Not Found"
nameJa: "ページが見つかりません"
category: client
summary: 指定された URL に対応するページがサーバー上に存在しません。
synonyms: ["ページなし", "リンク切れ", "page not found", "URL 間違い"]
related: [410, 301, 405]
commonCauses:
  - title: URL の打ち間違い (typo)
    hint: 大文字/小文字や末尾スラッシュも要チェック
  - title: リンク元の参照が古い
    hint: 移動・改名されたページを指している可能性
  - title: ページが意図せず削除された
    hint: 管理者はアクセスログとリリース履歴を確認
popular: true
rfc: "9110"
references:
  - label: "RFC 9110 §15.5.5"
    url: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.5"
    source: rfc
  - label: "MDN: 404 Not Found"
    url: "https://developer.mozilla.org/ja/docs/Web/HTTP/Status/404"
    source: mdn
updatedAt: 2026-05-13
---

import ResponseExample from '@/components/error/ResponseExample.astro';

## 何が起きたのか？
...本文...

<ResponseExample status={404} statusText="Not Found" />
```

### 補助関数 `lib/errors.ts`

```ts
export async function getAllErrors(): Promise<ErrorEntry[]>;
export async function getErrorByCode(code: number): Promise<ErrorEntry | undefined>;
export async function getPopularErrors(): Promise<ErrorEntry[]>;
export async function getPrevNext(code: number): Promise<{ prev?: ErrorEntry; next?: ErrorEntry }>;
export async function getRelated(codes: number[]): Promise<ErrorEntry[]>;
export function groupByCategory(errors: ErrorEntry[]): { client: ErrorEntry[]; server: ErrorEntry[] };
```

`pages/` と `components/error/` はこれらだけ呼び、`getCollection('errors')` 直叩きはしない。

---

## 6. スタイリング（Tailwind v4 + チョーク表現）

### `src/styles/global.css`（要点）

```css
@import "tailwindcss";

@theme {
  /* Colors (OKLCH) */
  --color-board-deep:     oklch(0.22 0.04 145);  /* #1a2e1a 相当 */
  --color-board-mid:      oklch(0.28 0.05 145);
  --color-board-edge:     oklch(0.18 0.03 145);
  --color-frame-walnut:   oklch(0.38 0.06 60);
  --color-frame-shadow:   oklch(0.22 0.04 60);
  --color-chalk-white:    oklch(0.94 0.01 80);   /* 本文 */
  --color-chalk-amber:    oklch(0.84 0.14 85);   /* #f2c94c, 見出し・強調 */
  --color-chalk-pink:     oklch(0.82 0.10 10);
  --color-chalk-mint:     oklch(0.85 0.10 165);
  --color-chalk-dust:     oklch(0.70 0.02 80);   /* 補助テキスト */

  /* Fonts */
  --font-display:  "Finger Paint", "Kiwi Maru", system-ui, sans-serif;
  --font-body:     "Kiwi Maru", "Hiragino Maru Gothic ProN", "Yu Gothic", system-ui, sans-serif;
  --font-mono:     ui-monospace, "SFMono-Regular", "Menlo", monospace;

  /* Type scale */
  --text-xs: 0.78rem;  --text-sm: 0.9rem;   --text-base: 1rem;
  --text-lg: 1.18rem;  --text-xl: 1.4rem;   --text-2xl: 1.75rem;
  --text-3xl: 2.2rem;  --text-4xl: 3rem;    --text-5xl: 4.5rem;

  /* Misc */
  --radius-chalk: 0.25rem;
  --shadow-board: inset 0 0 80px rgba(0, 0, 0, 0.35);
  --shadow-frame: 0 6px 0 var(--color-frame-shadow), 0 12px 24px rgba(0, 0, 0, 0.4);
  --ease-chalk: cubic-bezier(0.4, 0, 0.2, 1);
}

@layer base {
  /* @font-face フォールバック (local 優先) */
  @font-face { font-family: "Finger Paint"; font-display: swap; src: local("Finger Paint"); }
  @font-face { font-family: "Kiwi Maru"; font-display: swap; src: local("Kiwi Maru"); }

  html {
    background: var(--color-board-edge);
    color: var(--color-chalk-white);
    font-family: var(--font-body);
    line-height: 1.75;
    font-feature-settings: "palt";
    text-rendering: optimizeLegibility;
  }
  body {
    background: var(--color-board-deep);
    background-image:
      radial-gradient(circle at 30% 20%, rgba(255,255,255,0.03), transparent 60%),
      radial-gradient(circle at 80% 70%, rgba(255,255,255,0.02), transparent 60%);
    min-height: 100dvh;
  }
  ::selection { background: var(--color-chalk-amber); color: var(--color-board-deep); }
  h1, h2, h3 { font-family: var(--font-display); color: var(--color-chalk-amber); letter-spacing: 0.03em; }
  :not(pre) > code {
    background: rgba(255, 255, 255, 0.06);
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-chalk);
    padding: 0.05em 0.35em;
    font-family: var(--font-mono);
    font-size: 0.92em;
  }
  :focus-visible { outline: 2px dashed var(--color-chalk-amber); outline-offset: 4px; }

  /* デフォルトを完全に上書き */
  button, input, select, textarea {
    font: inherit; color: inherit; background: transparent; border: none;
  }
  a {
    color: var(--color-chalk-amber);
    text-decoration: underline wavy var(--color-chalk-amber);
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
    transition: color 150ms var(--ease-chalk);
  }
  a:hover { color: var(--color-chalk-white); text-decoration-color: var(--color-chalk-white); }
}
```

### `src/styles/chalkboard.css`（要点）

- `.chalkboard` — SVG noise風の背景（粒子 + 拭き跡）
- `.chalkboard-frame` — 木目テクスチャの額縁
- `.chalk-text`, `.chalk-text-amber` — 軽い text-shadow でチョーク粉感
- `.chalk-numeral` — 大きなコード番号用（詳細ページのヒーロー）
- `.eraser-mark` — 区切り線（黒板消しで一拭き）
- `.chalk-underline` — チョーク波線アンダーライン
- `.btn-chalk`, `.btn-chalk--ghost` — チョーク調ボタン（点線枠 + ホバーで琥珀発光）
- `.input-chalk` — チョーク調検索/テキスト入力（左に虫眼鏡スペース、フォーカスで琥珀グロー）
- `@media (prefers-reduced-motion: reduce)` 対応

完全な定義は実装時に `chalkboard.css` に展開する。

### フォント読み込み（`BaseLayout.astro` の `<head>`）

```astro
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Finger+Paint&family=Kiwi+Maru:wght@400;500&display=swap" />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Finger+Paint&family=Kiwi+Maru:wght@400;500&display=swap" />
```

---

## 7. コンポーネント設計

### レイアウト系

| Component | 責務 | props |
|---|---|---|
| `BaseLayout.astro` | `<html>`, `<head>`（font preload, OG, sitemap）, CSS import | `title`, `description`, `path` |
| `HomeLayout.astro` | トップページ専用（大ヒーロー領域） | (slot のみ) |
| `ErrorLayout.astro` | 詳細ページ専用（1カラム読み物） | `entry: ErrorEntry` |
| `BlackboardFrame.astro` | 木枠 + 黒板本体の額縁 | `size: 'hero' \| 'card' \| 'panel'` |
| `SiteHeader.astro` | 全ページ共通ヘッダ | `currentPath?: string` |
| `SiteFooter.astro` | コンセプト1行 + GitHubリンク + 最終更新 | (なし) |

### 検索系

| Component | 責務 |
|---|---|
| `SearchBar.astro` | トップヒーロー用、大きい入力。`.input-chalk` 継承、虫眼鏡SVG内蔵 |
| `SearchBox.astro` | 全ページ共通の小さい検索（ヘッダ右端）。クリックで `<dialog>` 開く |
| `search.client.ts` | Fuse.js 初期化、`/search-index.json` を fetch、結果描画。debounce 100ms。↑↓Enter Esc 対応 |

#### `search-index.json` のスキーマ

`pages/search-index.json.ts` がビルド時に生成する JSON 配列の各要素：

```ts
type SearchIndexEntry = {
  code: number;          // 404
  name: string;          // "Not Found"
  nameJa: string;        // "ページが見つかりません"
  summary: string;       // 1行説明
  synonyms: string[];    // ["ページなし", "リンク切れ", ...]
  category: 'client' | 'server';
  url: string;           // BASE_URL 付与済みパス: /slate-errors/errors/404/
};
```

Fuse.js の検索キー: `code`(数値→文字列化), `name`, `nameJa`, `summary`, `synonyms`。重みは `nameJa: 0.4`, `code: 0.3`, `name: 0.15`, `synonyms: 0.1`, `summary: 0.05` を初期値とし、実装後に調整。

### エラー表示系（MDX から呼ばれる）

| Component | 責務 | props |
|---|---|---|
| `ErrorCard.astro` | 一覧用カード | `entry: ErrorEntry`, `compact?: boolean` |
| `ErrorGroup.astro` | グループ見出し + カードグリッド | `category: 'client' \| 'server'`, `entries: ErrorEntry[]` |
| `ErrorHero.astro` | 詳細ページ上部、`.chalk-numeral` で大きなコード | `entry: ErrorEntry` |
| `PrevNext.astro` | ← prev / next → ナビ | `code: number` |
| `RelatedErrors.astro` | 「似ているケース」カード列 | `codes: number[]` |
| `CommonCauses.astro` | 「よくある原因 TOP3」チェックリスト | `causes: CommonCause[]` |
| `ResponseExample.astro` | curl + Headers/Body | `status: number`, `statusText: string`, `body?: string` |
| `References.astro` | RFC/MDN リンク（frontmatter から自動描画） | `references: ReferenceLink[]` |

### UI 装飾系

| Component | 責務 |
|---|---|
| `ChalkText.astro` | `<span class="chalk-text-amber">` MDX強調用 |
| `EraserMark.astro` | `<hr class="eraser-mark">` |

### 詳細ページの組み立て

```astro
---
// src/pages/errors/[code].astro
import { getCollection } from 'astro:content';
import ErrorLayout from '@/layouts/ErrorLayout.astro';
import ErrorHero from '@/components/error/ErrorHero.astro';
import CommonCauses from '@/components/error/CommonCauses.astro';
import PrevNext from '@/components/error/PrevNext.astro';
import RelatedErrors from '@/components/error/RelatedErrors.astro';
import References from '@/components/error/References.astro';

export async function getStaticPaths() {
  const errors = await getCollection('errors',
    ({ id, data }) => !data.draft && !id.startsWith('_'));
  return errors.map(e => ({ params: { code: String(e.data.code) }, props: { entry: e } }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
---
<ErrorLayout entry={entry}>
  <ErrorHero entry={entry} />
  {entry.data.commonCauses.length > 0 && <CommonCauses causes={entry.data.commonCauses} />}
  <article class="prose-chalk">
    <Content />
  </article>
  {entry.data.related.length > 0 && <RelatedErrors codes={entry.data.related} />}
  <References references={entry.data.references} />
  <PrevNext code={entry.data.code} />
</ErrorLayout>
```

---

## 8. デプロイ（GitHub Pages + Actions）

### `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE = process.env.SITE_URL ?? 'https://example.github.io';
const BASE = process.env.BASE_PATH ?? '/slate-errors';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
    assets: '_assets',
  },
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { '@': new URL('./src', import.meta.url).pathname },
    },
  },
});
```

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - name: Build site
        run: pnpm build
        env:
          SITE_URL: https://${{ github.repository_owner }}.github.io
          BASE_PATH: /${{ github.event.repository.name }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./dist }

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### URL ヘルパ `src/lib/url.ts`

```ts
export const url = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
```

すべての内部リンク・アセット参照・クライアント fetch でこの `url()` を使う。`import.meta.env.BASE_URL` の直書きは禁止。

### `package.json`（最小）

```json
{
  "name": "slate-errors",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview --base /slate-errors",
    "check": "astro check"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/sitemap": "^3.0.0",
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "fuse.js": "^7.0.0"
  }
}
```

### GH Pages 手動セットアップ（ワンタイム）

1. リポジトリ名を `slate-errors` で作成
2. **Settings → Pages → Source = GitHub Actions**
3. main ブランチに push で自動デプロイ

### 動作確認チェックリスト（実装後）

- [ ] `pnpm dev` で `/` トップが開ける
- [ ] `pnpm build && pnpm preview --base /slate-errors` で本番想定 URL でも動く
- [ ] GH Pages デプロイ後、`username.github.io/slate-errors/` で 404 にならない
- [ ] 内部リンクで全ページが繋がる
- [ ] 画像・favicon・font preload に Network タブで赤がない
- [ ] `/search-index.json` が正しく fetch される

---

## 9. コンテンツ執筆ワークフロー

### 対象 40 件

```
4xx Client Errors (29件):
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413,
  414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451

5xx Server Errors (11件):
  500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511
```

`popular: true` を付ける4件: **404, 500, 403, 502**（トップヒーロー表示）。

### 量産フェーズ分け

| フェーズ | 内容 | 件数 | 完了基準 |
|---|---|---|---|
| Phase 1: 旗艦4件 | popular 4件を満点品質 | 4 | 完成度の基準が確立 |
| Phase 2: 主要15件 | 開発で出会いやすい主要エラー | 11 (累計15) | 実用カバレッジ |
| Phase 3: 残り全件 | レアコード+418含む全件 | 25 (累計40) | 全網羅達成 |

### 執筆チェックリスト（`docs/CONTENT_GUIDE.md` に常設）

```
□ frontmatter 必須項目すべて埋まる (Zodで自動検出)
□ summary は 120字以内
□ synonyms に最低 日本語2 + 英語1
□ commonCauses は3件、各 title は名詞句で短く
□ 教室メタファー使用、合奏/合唱/楽譜/演奏 の語彙ゼロ
□ 「大丈夫、次はこうしてみよう」が「解決への歩み」冒頭にある
□ 「解決への歩み」最後のステップは管理者/インフラ視点
□ related に最低1つ (孤立記事を作らない)
□ references に RFC か MDN を最低1つ
□ <ResponseExample> が本文末にある
□ draft: false
```

### MDX テンプレート（`src/content/errors/_TEMPLATE.mdx`）

```mdx
---
code: 0
name: ""
nameJa: ""
category: client
summary: ""
synonyms: []
related: []
commonCauses:
  - title: ""
    hint: ""
  - title: ""
    hint: ""
  - title: ""
    hint: ""
popular: false
draft: true
rfc: ""
references:
  - label: "RFC 9110 §15.x.x"
    url: "https://www.rfc-editor.org/rfc/rfc9110#section-15"
    source: rfc
  - label: "MDN: {code}"
    url: "https://developer.mozilla.org/ja/docs/Web/HTTP/Status/{code}"
    source: mdn
updatedAt: 2026-05-13
---

import ResponseExample from '@/components/error/ResponseExample.astro';

## 何が起きたのか？
{1-2段落}

## 黒板からのひとこと
{1段落: 教室メタファーで本質}
{1段落: 原因パターン2-3個}

## 解決への歩み
大丈夫、次はこうしてみよう：

1. **{ステップ1}**：{1行説明}
2. **{ステップ2}**：{1行説明}
3. **{ステップ3}**：{1行説明}
4. **{管理者向け}**：{サーバー/インフラ視点}

<ResponseExample status={CODE} statusText="STATUS_TEXT" />
```

### 進捗管理（`docs/CONTENT_PROGRESS.md`）

3フェーズのチェックリスト。毎コミットで更新。

### バリデーション

- ビルド時 Zod で frontmatter 検証
- 補助スクリプト `scripts/validate-content.ts`（任意）：
  - 全 `related` 参照先が実在
  - `code` が一意
  - `popular: true` が想定数（4件）
  - リリース前に全件 `draft: false`

---

## 10. スコープ外（YAGNI）

明示的に **今回はやらない** こと：

- 1xx / 2xx / 3xx ステータスコード
- 非標準コード（Cloudflare 5xx, IIS, nginx独自など）
- ダークモード切替（サイト全体が黒板=dark専用）
- 多言語切替UI（日本語メイン+英語サブタイトルで決定済）
- ユーザーコメント・フォーラム・GitHub Discussions 連携
- Analytics
- 凝ったアニメーション（チョーク粉が舞う等）
- `@tailwindcss/typography`（チョーク表現と相性が悪く、自前 `prose-chalk` で代替）

---

## 11. リスクと対策

| リスク | 対策 |
|---|---|
| 40件の品質揺らぎ | Phase 1 旗艦4件で基準確立、CONTENT_GUIDE のチェックリスト必須化 |
| メタファーの混乱（合奏に戻る） | Memory に保存済み、CONTENT_GUIDE 冒頭にも明記 |
| basePath 由来の壊れリンク | `url()` ヘルパに集約、preview コマンドで本番想定確認 |
| コントラスト不足 | 本文は `chalk-white` 固定、琥珀は見出し限定。実装後 lighthouse でA11y確認 |
| ブラウザデフォルトの混入 | `@layer base` で `button/input/a` を強制上書き、レビュー時に必ず確認 |
| 40件量産の挫折 | 3フェーズ分割、Phase 1 完了で「動く・見れる」状態を作る |

---

## 12. 完了の定義

このプロジェクトの初期リリースは以下を満たしたら完了：

1. すべてのソース・設定ファイルがコミットされ、GitHub Actions で自動デプロイされる
2. `username.github.io/slate-errors/` で全機能が動作する
3. 40件のエラーページがすべて公開状態（`draft: false`）
4. CONTENT_GUIDE のチェックリストを全件で通過
5. lighthouse でアクセシビリティスコア 90+ を確保
6. README に「サイトのコンセプト」「ローカル開発手順」「コンテンツ追加方法」を記載
