# Slate Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「教室・放課後の黒板」をテーマにしたHTTPエラー解説サイトを構築し、GitHub Pagesに公開する。RFC標準4xx/5xx全40件のエラーページを揃え、検索とブラウジングの両方で辿れる。

**Architecture:** Astro 5 + Content Collections (Zod型付け) + Tailwind v4 (CSS-first @theme) + Fuse.jsクライアント検索 + GitHub Actions自動デプロイ。コンテンツはMDX、frontmatter駆動の拡張要素を Astro コンポーネントで描画。

**Tech Stack:** Astro 5, MDX, TypeScript, Tailwind CSS v4, Fuse.js, Vitest, pnpm, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-05-13-slate-errors-design.md`

**Total tasks:** 54（Phase A-K）

---

## 重要な原則（実装中ずっと意識）

1. **教室メタファー**: コンテンツでは 教室・黒板・チョーク・放課後 の語彙を使う。**合奏/合唱/楽譜/演奏 は使わない**。
2. **ブラウザデフォルト禁止**: `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>` はすべてチョーク調にスタイル上書き。
3. **DRY**: `getCollection('errors')` の直叩きは `lib/errors.ts` 経由のみ。`import.meta.env.BASE_URL` の直書きは `lib/url.ts` の `url()` 経由のみ。
4. **YAGNI**: スコープ外（1xx/2xx/3xx, 多言語切替UI, ダークモード切替, アニメーション）に手を出さない。
5. **TDD**: 純粋関数（`lib/`配下）はVitestで先にテストを書く。Astroコンポーネントは `astro check` + 手動視覚確認。
6. **コミット**: 各タスク末尾でコミット。Co-Authored-By不要。バイリンガル風メッセージ（`feat: do X / Xを実装`）。

---

# Phase A: プロジェクトブートストラップ

## Task 1: Git 初期化と Astro プロジェクト作成

**Files:**
- Create: `.git/`, `package.json`, `tsconfig.json`, `astro.config.mjs`（初期版、後で書き換え）, `src/`, `public/`, `.gitignore`

- [ ] **Step 1: Git 初期化**

```bash
cd /Users/akito-shoji/dev/web/slate-errors
git init
git branch -M main
```

Expected: `Initialized empty Git repository`

- [ ] **Step 2: 既存の `.claude/` と `.superpowers/` を gitignore に追加（先回り）**

`.gitignore`（プロジェクトルートに新規作成）:
```gitignore
# Astro
.astro/
dist/

# Node
node_modules/
.DS_Store

# Env
.env
.env.local
.env.*.local

# Editor / OS
*.log
.vscode/

# Claude / Superpowers
.claude/
.superpowers/
```

- [ ] **Step 3: pnpm で Astro プロジェクトを既存ディレクトリに初期化**

```bash
pnpm create astro@latest . -- --template minimal --typescript strict --no-install --no-git
```

Expected: `Project initialized!` 系のメッセージ。`src/pages/index.astro` などが作成される。

注意: 既に `docs/` `.claude/` `.superpowers/` が存在しても上書きしない設定。プロンプトが出たら `Yes` で続行。

- [ ] **Step 4: pnpm install を実行**

```bash
pnpm install
```

Expected: 依存解決完了、`pnpm-lock.yaml` 生成。

- [ ] **Step 5: dev server で初期画面を確認**

```bash
pnpm dev
```

ブラウザで `http://localhost:4321/` を開いて Astro のミニマルテンプレートが表示されることを確認。確認後 `Ctrl+C` で停止。

- [ ] **Step 6: 初期コミット**

```bash
git add .
git commit -m "chore: bootstrap Astro project / Astroプロジェクトを初期化"
```

---

## Task 2: tsconfig にパスエイリアス `@/*` を追加

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: tsconfig.json を確認**

現状を Read で確認。Astro デフォルトは `astro/tsconfigs/strict` を extends している。

- [ ] **Step 2: paths を追加**

`tsconfig.json` に以下を追加（`compilerOptions` 内）：
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 3: 動作確認**

```bash
pnpm exec astro check
```

Expected: `0 errors, 0 warnings`

- [ ] **Step 4: コミット**

```bash
git add tsconfig.json
git commit -m "feat: add @/* path alias / @/* パスエイリアス追加"
```

---

## Task 3: Tailwind CSS v4 と Vitest をインストール

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: 依存追加**

```bash
pnpm add tailwindcss @tailwindcss/vite
pnpm add @astrojs/mdx @astrojs/sitemap @astrojs/check
pnpm add fuse.js
pnpm add -D vitest @types/node
```

Expected: `package.json` の `dependencies` / `devDependencies` が更新される。

- [ ] **Step 2: vitest.config.ts を作成**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 3: package.json scripts 追加**

`package.json` の `scripts` を以下に置換：
```json
"scripts": {
  "dev": "astro dev",
  "build": "astro check && astro build",
  "preview": "astro preview --base /slate-errors",
  "check": "astro check",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Vitest スモークテスト**

```bash
pnpm test
```

Expected: `No test files found` (まだテストがないので正常)。ワークフローが動くことを確認。

- [ ] **Step 5: コミット**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "feat: install tailwindcss v4, mdx, fuse.js, vitest / 依存パッケージ追加"
```

---

## Task 4: astro.config.mjs を本実装で書き換え

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: ファイル全置換**

`astro.config.mjs`:
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

- [ ] **Step 2: ビルド成功確認**

```bash
pnpm build
```

Expected: ビルド成功。`dist/` が生成され、`dist/_assets/` の階層がある。

- [ ] **Step 3: preview で base 付き URL 確認**

```bash
pnpm preview
```

ブラウザで `http://localhost:4321/slate-errors/` を開き、初期ページが表示されることを確認。`Ctrl+C` で停止。

- [ ] **Step 4: コミット**

```bash
git add astro.config.mjs
git commit -m "feat: configure astro for github pages with /slate-errors base / GH Pages 用 astro 設定"
```

---

## Task 5: README スケルトンと docs ディレクトリ確認

**Files:**
- Create/Modify: `README.md`
- Verify: `docs/` ディレクトリ構成

- [ ] **Step 1: README.md を作成（プレースホルダ最小版、Task 37で完全化）**

`README.md`:
```markdown
# Slate Errors

放課後の黒板で、HTTPエラーを学び直す。

> エラーは間違いではない、発見である。

## 開発

\`\`\`bash
pnpm install
pnpm dev      # http://localhost:4321/slate-errors/
pnpm build    # ビルド
pnpm preview  # 本番想定の URL でプレビュー
pnpm test     # Vitest 実行
\`\`\`

## 詳細

- 設計ドキュメント: \`docs/superpowers/specs/2026-05-13-slate-errors-design.md\`
- 実装計画: \`docs/superpowers/plans/2026-05-13-slate-errors.md\`
- コンテンツ執筆ガイド: \`docs/CONTENT_GUIDE.md\` (Task 11 で作成)
```

- [ ] **Step 2: コミット**

```bash
git add README.md
git commit -m "docs: add README skeleton / README スケルトン追加"
```

---

# Phase B: スタイリングシステム

## Task 6: global.css に @theme トークン定義

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: ファイル作成**

`src/styles/global.css`:
```css
@import "tailwindcss";

/* ─────────────────────────────────────────────
 * Theme tokens — Tailwind v4 CSS-first
 * ───────────────────────────────────────────── */
@theme {
  /* Colors (OKLCH) */
  --color-board-deep:     oklch(0.22 0.04 145);
  --color-board-mid:      oklch(0.28 0.05 145);
  --color-board-edge:     oklch(0.18 0.03 145);
  --color-frame-walnut:   oklch(0.38 0.06 60);
  --color-frame-shadow:   oklch(0.22 0.04 60);
  --color-chalk-white:    oklch(0.94 0.01 80);
  --color-chalk-amber:    oklch(0.84 0.14 85);
  --color-chalk-pink:     oklch(0.82 0.10 10);
  --color-chalk-mint:     oklch(0.85 0.10 165);
  --color-chalk-dust:     oklch(0.70 0.02 80);

  /* Fonts */
  --font-display:  "Finger Paint", "Kiwi Maru", system-ui, sans-serif;
  --font-body:     "Kiwi Maru", "Hiragino Maru Gothic ProN", "Yu Gothic", system-ui, sans-serif;
  --font-mono:     ui-monospace, "SFMono-Regular", "Menlo", monospace;

  /* Type scale */
  --text-xs: 0.78rem;
  --text-sm: 0.9rem;
  --text-base: 1rem;
  --text-lg: 1.18rem;
  --text-xl: 1.4rem;
  --text-2xl: 1.75rem;
  --text-3xl: 2.2rem;
  --text-4xl: 3rem;
  --text-5xl: 4.5rem;

  /* Misc */
  --radius-chalk: 0.25rem;
  --shadow-board: inset 0 0 80px rgba(0, 0, 0, 0.35);
  --shadow-frame: 0 6px 0 var(--color-frame-shadow), 0 12px 24px rgba(0, 0, 0, 0.4);
  --ease-chalk: cubic-bezier(0.4, 0, 0.2, 1);
}

/* ─────────────────────────────────────────────
 * Base layer
 * ───────────────────────────────────────────── */
@layer base {
  /* @font-face フォールバック */
  @font-face {
    font-family: "Finger Paint";
    font-display: swap;
    src: local("Finger Paint");
  }
  @font-face {
    font-family: "Kiwi Maru";
    font-display: swap;
    src: local("Kiwi Maru");
  }

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

  ::selection {
    background: var(--color-chalk-amber);
    color: var(--color-board-deep);
  }

  h1, h2, h3 {
    font-family: var(--font-display);
    color: var(--color-chalk-amber);
    letter-spacing: 0.03em;
  }

  :not(pre) > code {
    background: rgba(255, 255, 255, 0.06);
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-chalk);
    padding: 0.05em 0.35em;
    font-family: var(--font-mono);
    font-size: 0.92em;
  }

  :focus-visible {
    outline: 2px dashed var(--color-chalk-amber);
    outline-offset: 4px;
  }

  /* デフォルト無効化 */
  button, input, select, textarea {
    font: inherit;
    color: inherit;
    background: transparent;
    border: none;
  }

  a {
    color: var(--color-chalk-amber);
    text-decoration: underline wavy var(--color-chalk-amber);
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
    transition: color 150ms var(--ease-chalk);
  }
  a:hover {
    color: var(--color-chalk-white);
    text-decoration-color: var(--color-chalk-white);
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: ビルド確認**

```bash
pnpm build
```

Expected: ビルド成功。

- [ ] **Step 3: コミット**

```bash
git add src/styles/global.css
git commit -m "feat: add @theme tokens and base layer / @theme トークンとベース層追加"
```

---

## Task 7: chalkboard.css にチョーク表現を実装

**Files:**
- Create: `src/styles/chalkboard.css`

- [ ] **Step 1: ファイル作成**

`src/styles/chalkboard.css`:
```css
/* ─────────────────────────────────────────────
 * Chalkboard surface
 * ───────────────────────────────────────────── */
.chalkboard {
  position: relative;
  background-color: var(--color-board-deep);
  background-image:
    repeating-linear-gradient(
      105deg,
      rgba(255, 255, 255, 0.012) 0 2px,
      transparent 2px 9px
    ),
    radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1.2px);
  background-size: auto, 14px 14px;
  box-shadow: var(--shadow-board);
  border-radius: var(--radius-chalk);
}

.chalkboard-frame {
  padding: 1.25rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow-frame);
  background-image:
    linear-gradient(180deg, rgba(255,255,255,0.04), transparent 30%),
    repeating-linear-gradient(
      90deg,
      rgba(0,0,0,0.06) 0 1px,
      transparent 1px 7px
    ),
    linear-gradient(180deg, var(--color-frame-walnut), var(--color-frame-shadow));
}

/* ─────────────────────────────────────────────
 * Chalk text effects
 * ───────────────────────────────────────────── */
.chalk-text {
  text-shadow:
    0 0 1px rgba(255, 255, 255, 0.15),
    0 0 6px rgba(244, 236, 216, 0.08);
}
.chalk-text-amber {
  text-shadow:
    0 0 1px rgba(242, 201, 76, 0.3),
    0 0 8px rgba(242, 201, 76, 0.12);
}
.chalk-numeral {
  font-family: var(--font-display);
  font-size: var(--text-5xl);
  color: var(--color-chalk-amber);
  text-shadow:
    0 1px 0 rgba(0,0,0,0.4),
    0 0 12px rgba(242, 201, 76, 0.2);
  letter-spacing: 0.06em;
}

.eraser-mark {
  height: 1.5rem;
  background:
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.05) 20%,
      rgba(255, 255, 255, 0.08) 50%,
      rgba(255, 255, 255, 0.05) 80%,
      transparent 100%
    );
  filter: blur(2px);
  border: none;
  margin: 2rem 0;
}

.chalk-underline {
  text-decoration: underline wavy var(--color-chalk-amber);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 6px;
}

/* ─────────────────────────────────────────────
 * Chalk buttons & inputs (デフォルト上書きのチョーク版)
 * ───────────────────────────────────────────── */
.btn-chalk {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  font-family: var(--font-display);
  font-size: var(--text-base);
  color: var(--color-chalk-amber);
  background: rgba(0, 0, 0, 0.18);
  border: 2px dashed var(--color-chalk-amber);
  border-radius: var(--radius-chalk);
  text-shadow: 0 0 6px rgba(242, 201, 76, 0.15);
  transition: all 200ms var(--ease-chalk);
  cursor: pointer;
  position: relative;
}
.btn-chalk::after {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1.2px);
  background-size: 14px 14px;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0.6;
}
.btn-chalk:hover {
  background: rgba(242, 201, 76, 0.1);
  transform: translateY(-1px);
}
.btn-chalk:active { transform: translateY(0); }
.btn-chalk[disabled] { opacity: 0.4; cursor: not-allowed; }
.btn-chalk--ghost {
  color: var(--color-chalk-white);
  border-color: var(--color-chalk-dust);
  background: transparent;
}

.input-chalk {
  width: 100%;
  padding: 0.85rem 1.1rem 0.85rem 3rem;
  font-family: var(--font-body);
  font-size: var(--text-lg);
  color: var(--color-chalk-white);
  background: rgba(0, 0, 0, 0.25);
  border: 1.5px dashed var(--color-chalk-dust);
  border-radius: var(--radius-chalk);
  transition: all 200ms var(--ease-chalk);
}
.input-chalk::placeholder {
  color: var(--color-chalk-dust);
  font-style: italic;
}
.input-chalk:focus {
  outline: none;
  border-color: var(--color-chalk-amber);
  box-shadow: 0 0 0 3px rgba(242, 201, 76, 0.15);
  background: rgba(0, 0, 0, 0.35);
}

/* ─────────────────────────────────────────────
 * MDX 本文用 (prose-chalk)
 * ───────────────────────────────────────────── */
.prose-chalk {
  color: var(--color-chalk-white);
  font-size: var(--text-lg);
  line-height: 1.85;
  max-width: 64ch;
}
.prose-chalk h2 {
  font-family: var(--font-display);
  color: var(--color-chalk-amber);
  font-size: var(--text-2xl);
  margin: 2.5rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed rgba(242, 201, 76, 0.3);
}
.prose-chalk h3 {
  font-family: var(--font-display);
  color: var(--color-chalk-amber);
  font-size: var(--text-xl);
  margin: 2rem 0 0.75rem;
}
.prose-chalk p {
  margin: 0.85rem 0;
}
.prose-chalk ol, .prose-chalk ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}
.prose-chalk ol li, .prose-chalk ul li {
  margin: 0.4rem 0;
}
.prose-chalk strong {
  color: var(--color-chalk-amber);
  font-weight: 500;
}
.prose-chalk blockquote {
  border-left: 3px dashed var(--color-chalk-dust);
  padding-left: 1rem;
  color: var(--color-chalk-dust);
  font-style: italic;
  margin: 1.5rem 0;
}
.prose-chalk pre {
  background: rgba(0, 0, 0, 0.35);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-chalk);
  padding: 1rem;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
}
```

- [ ] **Step 2: コミット**

```bash
git add src/styles/chalkboard.css
git commit -m "feat: add chalkboard textures, chalk text/button/input styles, prose-chalk / 黒板テクスチャとチョーク表現追加"
```

---

# Phase C: コンテンツ基盤

## Task 8: Content Collections スキーマ定義

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: ファイル作成**

`src/content/config.ts`:
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

- [ ] **Step 2: 型生成**

```bash
pnpm exec astro sync
```

Expected: `.astro/types.d.ts` 生成。

- [ ] **Step 3: コミット**

```bash
git add src/content/config.ts .astro/types.d.ts
git commit -m "feat: define errors content collection schema / errors コレクションのスキーマ定義"
```

---

## Task 9: lib/url.ts と Vitest テスト

**Files:**
- Create: `src/lib/url.ts`
- Create: `src/lib/__tests__/url.test.ts`

- [ ] **Step 1: テストを先に書く**

`src/lib/__tests__/url.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { url } from '../url';

// import.meta.env.BASE_URL をモック
vi.stubGlobal('import.meta.env', { BASE_URL: '/slate-errors/' });

describe('url()', () => {
  it('combines base with path', () => {
    expect(url('errors/404/')).toBe('/slate-errors/errors/404/');
  });

  it('handles leading slash in path', () => {
    expect(url('/errors/404/')).toBe('/slate-errors/errors/404/');
  });

  it('handles trailing slash on base', () => {
    // base=/slate-errors/ でも結果は重複しない
    expect(url('search-index.json')).toBe('/slate-errors/search-index.json');
  });

  it('handles empty path', () => {
    expect(url('')).toBe('/slate-errors/');
  });
});
```

- [ ] **Step 2: テスト実行で失敗確認**

```bash
pnpm test
```

Expected: FAIL "Cannot find module '../url'"

- [ ] **Step 3: 実装**

`src/lib/url.ts`:
```ts
export const url = (path: string): string => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return clean === '' ? `${base}/` : `${base}/${clean}`;
};
```

- [ ] **Step 4: テスト実行で成功確認**

```bash
pnpm test
```

Expected: 4 tests PASS.

- [ ] **Step 5: コミット**

```bash
git add src/lib/url.ts src/lib/__tests__/url.test.ts
git commit -m "feat: add url() helper for base path / base path 付与ヘルパー"
```

---

## Task 10: lib/errors.ts と Vitest テスト

**Files:**
- Create: `src/lib/errors.ts`
- Create: `src/lib/__tests__/errors.test.ts`

ここでは `getCollection` をモック化してテストする。

- [ ] **Step 1: テストを書く**

`src/lib/__tests__/errors.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';

// astro:content の getCollection をモック
const mockEntries = [
  { id: '404', slug: '404', body: '', collection: 'errors', data: {
    code: 404, name: 'Not Found', nameJa: 'ページが見つかりません',
    category: 'client', summary: '...', synonyms: [], related: [410],
    commonCauses: [], references: [], popular: true, draft: false,
  }},
  { id: '500', slug: '500', body: '', collection: 'errors', data: {
    code: 500, name: 'Internal Server Error', nameJa: 'サーバー内部エラー',
    category: 'server', summary: '...', synonyms: [], related: [],
    commonCauses: [], references: [], popular: true, draft: false,
  }},
  { id: '403', slug: '403', body: '', collection: 'errors', data: {
    code: 403, name: 'Forbidden', nameJa: '禁止されています',
    category: 'client', summary: '...', synonyms: [], related: [],
    commonCauses: [], references: [], popular: false, draft: false,
  }},
  { id: '_TEMPLATE', slug: '_template', body: '', collection: 'errors', data: {
    code: 0, name: '', nameJa: '', category: 'client', summary: '',
    synonyms: [], related: [], commonCauses: [], references: [],
    popular: false, draft: true,
  }},
];

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async (_name: string, filter?: (e: any) => boolean) => {
    if (!filter) return mockEntries;
    return mockEntries.filter(filter);
  }),
}));

import {
  getAllErrors, getErrorByCode, getPopularErrors,
  getPrevNext, getRelated, groupByCategory,
} from '../errors';

describe('getAllErrors', () => {
  it('excludes drafts and template files', async () => {
    const errors = await getAllErrors();
    expect(errors.map(e => e.data.code).sort()).toEqual([403, 404, 500]);
  });

  it('returns sorted by code ascending', async () => {
    const errors = await getAllErrors();
    expect(errors.map(e => e.data.code)).toEqual([403, 404, 500]);
  });
});

describe('getErrorByCode', () => {
  it('returns the matching error', async () => {
    const e = await getErrorByCode(404);
    expect(e?.data.name).toBe('Not Found');
  });

  it('returns undefined for unknown code', async () => {
    const e = await getErrorByCode(999);
    expect(e).toBeUndefined();
  });
});

describe('getPopularErrors', () => {
  it('returns only popular: true entries', async () => {
    const popular = await getPopularErrors();
    expect(popular.map(e => e.data.code).sort()).toEqual([404, 500]);
  });
});

describe('getPrevNext', () => {
  it('returns previous and next by code order', async () => {
    const { prev, next } = await getPrevNext(404);
    expect(prev?.data.code).toBe(403);
    expect(next?.data.code).toBe(500);
  });

  it('returns undefined for first entry prev', async () => {
    const { prev } = await getPrevNext(403);
    expect(prev).toBeUndefined();
  });

  it('returns undefined for last entry next', async () => {
    const { next } = await getPrevNext(500);
    expect(next).toBeUndefined();
  });
});

describe('getRelated', () => {
  it('returns entries matching given codes', async () => {
    // 404 has related: [410] but 410 is not in mockEntries → empty
    const r1 = await getRelated([410]);
    expect(r1).toEqual([]);

    const r2 = await getRelated([404, 500]);
    expect(r2.map(e => e.data.code).sort()).toEqual([404, 500]);
  });

  it('preserves order of input codes', async () => {
    const r = await getRelated([500, 404]);
    expect(r.map(e => e.data.code)).toEqual([500, 404]);
  });
});

describe('groupByCategory', () => {
  it('splits entries by client/server', async () => {
    const all = await getAllErrors();
    const { client, server } = groupByCategory(all);
    expect(client.map(e => e.data.code)).toEqual([403, 404]);
    expect(server.map(e => e.data.code)).toEqual([500]);
  });
});
```

- [ ] **Step 2: テスト失敗確認**

```bash
pnpm test
```

Expected: FAIL "Cannot find module '../errors'"

- [ ] **Step 3: 実装**

`src/lib/errors.ts`:
```ts
import { getCollection, type CollectionEntry } from 'astro:content';

export type ErrorEntry = CollectionEntry<'errors'>;

const isPublishable = (e: ErrorEntry) =>
  !e.data.draft && !e.id.startsWith('_');

export async function getAllErrors(): Promise<ErrorEntry[]> {
  const entries = await getCollection('errors', isPublishable);
  return entries.sort((a, b) => a.data.code - b.data.code);
}

export async function getErrorByCode(code: number): Promise<ErrorEntry | undefined> {
  const all = await getAllErrors();
  return all.find(e => e.data.code === code);
}

export async function getPopularErrors(): Promise<ErrorEntry[]> {
  const all = await getAllErrors();
  return all.filter(e => e.data.popular);
}

export async function getPrevNext(
  code: number,
): Promise<{ prev?: ErrorEntry; next?: ErrorEntry }> {
  const all = await getAllErrors();
  const idx = all.findIndex(e => e.data.code === code);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? all[idx - 1] : undefined,
    next: idx < all.length - 1 ? all[idx + 1] : undefined,
  };
}

export async function getRelated(codes: number[]): Promise<ErrorEntry[]> {
  const all = await getAllErrors();
  const byCode = new Map(all.map(e => [e.data.code, e]));
  return codes
    .map(c => byCode.get(c))
    .filter((e): e is ErrorEntry => e !== undefined);
}

export function groupByCategory(entries: ErrorEntry[]): {
  client: ErrorEntry[];
  server: ErrorEntry[];
} {
  return {
    client: entries.filter(e => e.data.category === 'client'),
    server: entries.filter(e => e.data.category === 'server'),
  };
}
```

- [ ] **Step 4: テスト成功確認**

```bash
pnpm test
```

Expected: All tests PASS.

- [ ] **Step 5: コミット**

```bash
git add src/lib/errors.ts src/lib/__tests__/errors.test.ts
git commit -m "feat: add errors collection helpers with unit tests / errors ヘルパー関数とユニットテスト"
```

---

## Task 11: _TEMPLATE.mdx と CONTENT_GUIDE.md と CONTENT_PROGRESS.md

**Files:**
- Create: `src/content/errors/_TEMPLATE.mdx`
- Create: `docs/CONTENT_GUIDE.md`
- Create: `docs/CONTENT_PROGRESS.md`

- [ ] **Step 1: _TEMPLATE.mdx**

`src/content/errors/_TEMPLATE.mdx`:
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

{1-2段落。技術的説明をやさしい言葉で。教室メタファーは導入の1段落。}

## 黒板からのひとこと

{1段落: 教室・黒板・授業の比喩で、このエラーが「なぜ起きるのか」の本質を説明。}

{1段落: 原因のパターンを2-3個簡潔に。}

## 解決への歩み

大丈夫、次はこうしてみよう：

1. **{ステップ1}**：{1行説明}
2. **{ステップ2}**：{1行説明}
3. **{ステップ3}**：{1行説明}
4. **{管理者向け}**：{サーバー/インフラ視点}

<ResponseExample status={0} statusText="" />
```

- [ ] **Step 2: docs/CONTENT_GUIDE.md**

`docs/CONTENT_GUIDE.md`:
```markdown
# Slate Errors コンテンツ執筆ガイド

## 中心メタファー

**教室・放課後の黒板** — 合奏/合唱/楽譜/演奏の語彙は使わない。

使う語彙: 教室, 黒板, チョーク, 放課後, 授業, ノート, 先生, 振り返り, 宿題, つまずき, 隣の席

## 各エラーで必ずチェック

\`\`\`
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
\`\`\`

## トーン基準サンプル

404.mdx を「品質の基準」とする。これに比べて簡素にも饒舌にもならないこと。

## 書き方の流れ

1. \`src/content/errors/_TEMPLATE.mdx\` を複製してファイル名を `{コード}.mdx` に
2. frontmatter を埋める
3. 本文 3 セクションを書く
4. チェックリストを上から順に確認
5. \`pnpm build\` でZodバリデーションが通ることを確認
6. \`docs/CONTENT_PROGRESS.md\` の対応行をチェック
7. コミット
```

- [ ] **Step 3: docs/CONTENT_PROGRESS.md**

`docs/CONTENT_PROGRESS.md`:
```markdown
# Slate Errors コンテンツ進捗

## Phase 1: 旗艦 (0 / 4)
- [ ] 404 Not Found
- [ ] 500 Internal Server Error
- [ ] 403 Forbidden
- [ ] 502 Bad Gateway

## Phase 2: 主要 (0 / 11)
- [ ] 400 Bad Request
- [ ] 401 Unauthorized
- [ ] 405 Method Not Allowed
- [ ] 409 Conflict
- [ ] 410 Gone
- [ ] 413 Content Too Large
- [ ] 422 Unprocessable Content
- [ ] 429 Too Many Requests
- [ ] 501 Not Implemented
- [ ] 503 Service Unavailable
- [ ] 504 Gateway Timeout

## Phase 3: 残り (0 / 25)
### 4xx
- [ ] 402 Payment Required
- [ ] 406 Not Acceptable
- [ ] 407 Proxy Authentication Required
- [ ] 408 Request Timeout
- [ ] 411 Length Required
- [ ] 412 Precondition Failed
- [ ] 414 URI Too Long
- [ ] 415 Unsupported Media Type
- [ ] 416 Range Not Satisfiable
- [ ] 417 Expectation Failed
- [ ] 418 I'm a teapot
- [ ] 421 Misdirected Request
- [ ] 423 Locked
- [ ] 424 Failed Dependency
- [ ] 425 Too Early
- [ ] 426 Upgrade Required
- [ ] 428 Precondition Required
- [ ] 431 Request Header Fields Too Large
- [ ] 451 Unavailable For Legal Reasons

### 5xx
- [ ] 505 HTTP Version Not Supported
- [ ] 506 Variant Also Negotiates
- [ ] 507 Insufficient Storage
- [ ] 508 Loop Detected
- [ ] 510 Not Extended
- [ ] 511 Network Authentication Required
```

- [ ] **Step 4: コミット**

```bash
git add src/content/errors/_TEMPLATE.mdx docs/CONTENT_GUIDE.md docs/CONTENT_PROGRESS.md
git commit -m "docs: add content template, guide, progress tracker / コンテンツテンプレートと執筆ガイド"
```

---

## Task 12: lib/search.ts (検索インデックス生成ロジック)

**Files:**
- Create: `src/lib/search.ts`

- [ ] **Step 1: ファイル作成**

`src/lib/search.ts`:
```ts
import type { ErrorEntry } from './errors';
import { url } from './url';

export type SearchIndexEntry = {
  code: number;
  name: string;
  nameJa: string;
  summary: string;
  synonyms: string[];
  category: 'client' | 'server';
  url: string;
};

export const buildSearchIndex = (errors: ErrorEntry[]): SearchIndexEntry[] =>
  errors.map(e => ({
    code: e.data.code,
    name: e.data.name,
    nameJa: e.data.nameJa,
    summary: e.data.summary,
    synonyms: e.data.synonyms,
    category: e.data.category,
    url: url(`errors/${e.data.code}/`),
  }));
```

- [ ] **Step 2: ビルド確認**

```bash
pnpm exec astro check
```

Expected: 0 errors.

- [ ] **Step 3: コミット**

```bash
git add src/lib/search.ts
git commit -m "feat: add search index builder / 検索インデックス生成ヘルパー"
```

---

# Phase D: レイアウト + UI コンポーネント

## Task 13: BaseLayout.astro

**Files:**
- Create: `src/components/layout/BaseLayout.astro`

- [ ] **Step 1: ファイル作成**

`src/components/layout/BaseLayout.astro`:
```astro
---
import '@/styles/global.css';
import '@/styles/chalkboard.css';

interface Props {
  title: string;
  description?: string;
  path?: string;
}

const {
  title,
  description = "放課後の黒板で、HTTPエラーを学び直す。エラーは間違いではない、発見である。",
  path = "",
} = Astro.props;

const fullTitle = title === "Slate Errors" ? title : `${title} — Slate Errors`;
const canonical = new URL(path, Astro.site).href;
---
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />

    <title>{fullTitle}</title>

    {/* OG */}
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />

    {/* Fonts */}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="preload"
      as="style"
      href="https://fonts.googleapis.com/css2?family=Finger+Paint&family=Kiwi+Maru:wght@400;500&display=swap"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Finger+Paint&family=Kiwi+Maru:wght@400;500&display=swap"
    />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: コミット**

```bash
git add src/components/layout/BaseLayout.astro
git commit -m "feat: add BaseLayout with font preload, OG meta / BaseLayout 追加"
```

---

## Task 14: BlackboardFrame.astro

**Files:**
- Create: `src/components/layout/BlackboardFrame.astro`

- [ ] **Step 1: ファイル作成**

`src/components/layout/BlackboardFrame.astro`:
```astro
---
interface Props {
  size?: 'hero' | 'card' | 'panel';
  class?: string;
}

const { size = 'panel', class: className = '' } = Astro.props;

const sizeClass = {
  hero: 'p-8 md:p-12',
  card: 'p-4',
  panel: 'p-6',
}[size];
---
<div class={`chalkboard-frame ${className}`}>
  <div class={`chalkboard ${sizeClass}`}>
    <slot />
  </div>
</div>
```

- [ ] **Step 2: コミット**

```bash
git add src/components/layout/BlackboardFrame.astro
git commit -m "feat: add BlackboardFrame component / BlackboardFrame コンポーネント追加"
```

---

## Task 15: SiteHeader.astro と SiteFooter.astro

**Files:**
- Create: `src/components/layout/SiteHeader.astro`
- Create: `src/components/layout/SiteFooter.astro`

- [ ] **Step 1: SiteHeader.astro**

`src/components/layout/SiteHeader.astro`:
```astro
---
import { url } from '@/lib/url';

interface Props {
  currentPath?: string;
}
const { currentPath = '/' } = Astro.props;
const isHome = currentPath === '/' || currentPath === '/slate-errors/';
---
<header class="border-b border-dashed border-[var(--color-chalk-dust)] mb-8">
  <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
    <a href={url('')} class="!no-underline">
      <span class="font-[Finger_Paint] text-[var(--color-chalk-amber)] text-xl chalk-text-amber">
        Slate Errors
      </span>
    </a>
    {!isHome && (
      <nav class="flex gap-4 text-sm">
        <a href={url('errors/')}>全件</a>
      </nav>
    )}
  </div>
</header>
```

- [ ] **Step 2: SiteFooter.astro**

`src/components/layout/SiteFooter.astro`:
```astro
---
const year = new Date().getFullYear();
---
<footer class="mt-16 py-8 border-t border-dashed border-[var(--color-chalk-dust)]">
  <div class="max-w-5xl mx-auto px-4 text-center text-sm text-[var(--color-chalk-dust)]">
    <p>エラーは間違いではない、発見である。</p>
    <p class="mt-2">
      © {year} Slate Errors —
      <a href="https://github.com/" target="_blank" rel="noopener">GitHub</a>
    </p>
  </div>
</footer>
```

- [ ] **Step 3: コミット**

```bash
git add src/components/layout/SiteHeader.astro src/components/layout/SiteFooter.astro
git commit -m "feat: add SiteHeader and SiteFooter / ヘッダーとフッター追加"
```

---

## Task 16: HomeLayout.astro と ErrorLayout.astro

**Files:**
- Create: `src/layouts/HomeLayout.astro`
- Create: `src/layouts/ErrorLayout.astro`

- [ ] **Step 1: HomeLayout.astro**

`src/layouts/HomeLayout.astro`:
```astro
---
import BaseLayout from '@/components/layout/BaseLayout.astro';
import SiteHeader from '@/components/layout/SiteHeader.astro';
import SiteFooter from '@/components/layout/SiteFooter.astro';

interface Props {
  title?: string;
  description?: string;
}
const { title = "Slate Errors", description } = Astro.props;
---
<BaseLayout title={title} description={description} path="/">
  <SiteHeader currentPath="/" />
  <main class="max-w-5xl mx-auto px-4">
    <slot />
  </main>
  <SiteFooter />
</BaseLayout>
```

- [ ] **Step 2: ErrorLayout.astro**

`src/layouts/ErrorLayout.astro`:
```astro
---
import BaseLayout from '@/components/layout/BaseLayout.astro';
import SiteHeader from '@/components/layout/SiteHeader.astro';
import SiteFooter from '@/components/layout/SiteFooter.astro';
import type { ErrorEntry } from '@/lib/errors';

interface Props {
  entry: ErrorEntry;
}
const { entry } = Astro.props;
const title = `${entry.data.code} ${entry.data.name}`;
const description = entry.data.summary;
---
<BaseLayout title={title} description={description} path={`/errors/${entry.data.code}/`}>
  <SiteHeader currentPath={`/errors/${entry.data.code}/`} />
  <main class="max-w-3xl mx-auto px-4">
    <slot />
  </main>
  <SiteFooter />
</BaseLayout>
```

- [ ] **Step 3: コミット**

```bash
git add src/layouts/
git commit -m "feat: add HomeLayout and ErrorLayout / Home/ErrorLayout 追加"
```

---

## Task 17: UI 装飾コンポーネント (ChalkText, EraserMark)

**Files:**
- Create: `src/components/ui/ChalkText.astro`
- Create: `src/components/ui/EraserMark.astro`

- [ ] **Step 1: ChalkText.astro**

`src/components/ui/ChalkText.astro`:
```astro
---
interface Props { color?: 'white' | 'amber'; }
const { color = 'amber' } = Astro.props;
const cls = color === 'amber' ? 'chalk-text-amber' : 'chalk-text';
---
<span class={cls} style={color === 'amber' ? 'color: var(--color-chalk-amber);' : ''}>
  <slot />
</span>
```

- [ ] **Step 2: EraserMark.astro**

`src/components/ui/EraserMark.astro`:
```astro
---
---
<hr class="eraser-mark" aria-hidden="true" />
```

- [ ] **Step 3: コミット**

```bash
git add src/components/ui/
git commit -m "feat: add ChalkText and EraserMark UI components / UI装飾コンポーネント追加"
```

---

# Phase E: エラー表示コンポーネント

## Task 18: ErrorCard.astro

**Files:**
- Create: `src/components/error/ErrorCard.astro`

- [ ] **Step 1: ファイル作成**

`src/components/error/ErrorCard.astro`:
```astro
---
import type { ErrorEntry } from '@/lib/errors';
import { url } from '@/lib/url';

interface Props {
  entry: ErrorEntry;
  compact?: boolean;
}
const { entry, compact = false } = Astro.props;
const href = url(`errors/${entry.data.code}/`);
---
<a
  href={href}
  class={`block group !no-underline ${compact ? 'p-3' : 'p-5'} chalkboard rounded-[var(--radius-chalk)] hover:scale-[1.02] transition-transform`}
  style="border: 1px dashed rgba(255,255,255,0.15);"
>
  <div class="flex items-baseline gap-3">
    <span class={`chalk-text-amber font-[Finger_Paint] ${compact ? 'text-xl' : 'text-3xl'}`}>
      {entry.data.code}
    </span>
    <div>
      <div class="text-[var(--color-chalk-amber)] text-sm">{entry.data.name}</div>
      <div class="text-[var(--color-chalk-white)] text-base">{entry.data.nameJa}</div>
    </div>
  </div>
  {!compact && (
    <p class="mt-3 text-sm text-[var(--color-chalk-dust)] line-clamp-2">
      {entry.data.summary}
    </p>
  )}
</a>
```

- [ ] **Step 2: コミット**

```bash
git add src/components/error/ErrorCard.astro
git commit -m "feat: add ErrorCard component / ErrorCard 追加"
```

---

## Task 19: ErrorGroup.astro

**Files:**
- Create: `src/components/error/ErrorGroup.astro`

- [ ] **Step 1: ファイル作成**

`src/components/error/ErrorGroup.astro`:
```astro
---
import ErrorCard from './ErrorCard.astro';
import type { ErrorEntry } from '@/lib/errors';

interface Props {
  category: 'client' | 'server';
  entries: ErrorEntry[];
}
const { category, entries } = Astro.props;
const heading = category === 'client'
  ? '4xx — Client Errors（クライアント側のつまずき）'
  : '5xx — Server Errors（サーバー側のつまずき）';
---
<section class="my-12">
  <h2 class="text-2xl font-[Finger_Paint] chalk-text-amber mb-6 chalk-underline">
    {heading}
  </h2>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {entries.map(e => <ErrorCard entry={e} />)}
  </div>
</section>
```

- [ ] **Step 2: コミット**

```bash
git add src/components/error/ErrorGroup.astro
git commit -m "feat: add ErrorGroup component / ErrorGroup 追加"
```

---

## Task 20: ErrorHero.astro

**Files:**
- Create: `src/components/error/ErrorHero.astro`

- [ ] **Step 1: ファイル作成**

`src/components/error/ErrorHero.astro`:
```astro
---
import BlackboardFrame from '@/components/layout/BlackboardFrame.astro';
import type { ErrorEntry } from '@/lib/errors';

interface Props {
  entry: ErrorEntry;
}
const { entry } = Astro.props;
const categoryLabel = entry.data.category === 'client' ? 'Client Error' : 'Server Error';
---
<BlackboardFrame size="hero" class="my-8">
  <div class="text-center">
    <p class="text-sm text-[var(--color-chalk-dust)] uppercase tracking-widest">
      {categoryLabel}
    </p>
    <div class="chalk-numeral my-4">{entry.data.code}</div>
    <h1 class="font-[Finger_Paint] text-[var(--color-chalk-amber)] text-2xl chalk-text-amber">
      {entry.data.name}
    </h1>
    <p class="text-lg text-[var(--color-chalk-white)] mt-2">
      — {entry.data.nameJa}
    </p>
  </div>
</BlackboardFrame>
```

- [ ] **Step 2: コミット**

```bash
git add src/components/error/ErrorHero.astro
git commit -m "feat: add ErrorHero component / ErrorHero 追加"
```

---

## Task 21: PrevNext.astro

**Files:**
- Create: `src/components/error/PrevNext.astro`

- [ ] **Step 1: ファイル作成**

`src/components/error/PrevNext.astro`:
```astro
---
import { getPrevNext } from '@/lib/errors';
import { url } from '@/lib/url';

interface Props { code: number; }
const { code } = Astro.props;
const { prev, next } = await getPrevNext(code);
---
<nav class="my-12 flex justify-between gap-4 text-sm">
  {prev ? (
    <a href={url(`errors/${prev.data.code}/`)} class="flex-1 p-4 chalkboard !no-underline">
      <div class="text-[var(--color-chalk-dust)] text-xs">← 前のエラー</div>
      <div class="chalk-text-amber font-[Finger_Paint] text-lg mt-1">
        {prev.data.code} {prev.data.name}
      </div>
    </a>
  ) : <div class="flex-1" />}
  {next ? (
    <a href={url(`errors/${next.data.code}/`)} class="flex-1 p-4 chalkboard !no-underline text-right">
      <div class="text-[var(--color-chalk-dust)] text-xs">次のエラー →</div>
      <div class="chalk-text-amber font-[Finger_Paint] text-lg mt-1">
        {next.data.code} {next.data.name}
      </div>
    </a>
  ) : <div class="flex-1" />}
</nav>
```

- [ ] **Step 2: コミット**

```bash
git add src/components/error/PrevNext.astro
git commit -m "feat: add PrevNext navigation / PrevNext ナビゲーション追加"
```

---

## Task 22: RelatedErrors.astro

**Files:**
- Create: `src/components/error/RelatedErrors.astro`

- [ ] **Step 1: ファイル作成**

`src/components/error/RelatedErrors.astro`:
```astro
---
import { getRelated } from '@/lib/errors';
import ErrorCard from './ErrorCard.astro';

interface Props { codes: number[]; }
const { codes } = Astro.props;
const related = await getRelated(codes);
---
{related.length > 0 && (
  <section class="my-12">
    <h2 class="text-xl font-[Finger_Paint] chalk-text-amber mb-4">
      似ているケース
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {related.map(e => <ErrorCard entry={e} compact />)}
    </div>
  </section>
)}
```

- [ ] **Step 2: コミット**

```bash
git add src/components/error/RelatedErrors.astro
git commit -m "feat: add RelatedErrors component / RelatedErrors 追加"
```

---

## Task 23: CommonCauses.astro

**Files:**
- Create: `src/components/error/CommonCauses.astro`

- [ ] **Step 1: ファイル作成**

`src/components/error/CommonCauses.astro`:
```astro
---
interface CommonCause {
  title: string;
  hint?: string;
}
interface Props { causes: CommonCause[]; }
const { causes } = Astro.props;
---
<section class="my-8 chalkboard p-6">
  <h2 class="text-lg font-[Finger_Paint] chalk-text-amber mb-3">
    まずは確認: よくある原因 TOP{causes.length}
  </h2>
  <ol class="space-y-2">
    {causes.map((c, i) => (
      <li class="flex gap-3">
        <span class="chalk-text-amber font-[Finger_Paint] text-lg leading-none">
          ✓
        </span>
        <div>
          <div class="text-[var(--color-chalk-white)]">{c.title}</div>
          {c.hint && <div class="text-sm text-[var(--color-chalk-dust)]">{c.hint}</div>}
        </div>
      </li>
    ))}
  </ol>
</section>
```

- [ ] **Step 2: コミット**

```bash
git add src/components/error/CommonCauses.astro
git commit -m "feat: add CommonCauses checklist / よくある原因チェックリスト追加"
```

---

## Task 24: ResponseExample.astro

**Files:**
- Create: `src/components/error/ResponseExample.astro`

- [ ] **Step 1: ファイル作成**

`src/components/error/ResponseExample.astro`:
```astro
---
interface Props {
  status: number;
  statusText: string;
  body?: string;
  contentType?: string;
}
const {
  status,
  statusText,
  body = `<!DOCTYPE html>\n<html><body><h1>${status} ${statusText}</h1></body></html>`,
  contentType = 'text/html; charset=utf-8',
} = Astro.props;
---
<section class="my-8">
  <h3 class="text-lg font-[Finger_Paint] chalk-text-amber mb-3">
    実際にはこう見える
  </h3>
  <div class="chalkboard p-4">
    <p class="text-sm text-[var(--color-chalk-dust)] mb-2">$ リクエスト</p>
    <pre><code>curl -i https://example.com/some/path</code></pre>

    <p class="text-sm text-[var(--color-chalk-dust)] mt-4 mb-2">↓ レスポンス</p>
    <pre><code>HTTP/1.1 {status} {statusText}
Content-Type: {contentType}

{body}</code></pre>
  </div>
</section>
```

- [ ] **Step 2: コミット**

```bash
git add src/components/error/ResponseExample.astro
git commit -m "feat: add ResponseExample component / ResponseExample 追加"
```

---

## Task 25: References.astro

**Files:**
- Create: `src/components/error/References.astro`

- [ ] **Step 1: ファイル作成**

`src/components/error/References.astro`:
```astro
---
interface ReferenceLink {
  label: string;
  url: string;
  source: 'rfc' | 'mdn' | 'other';
}
interface Props { references: ReferenceLink[]; }
const { references } = Astro.props;
const sourceIcon = { rfc: '📄', mdn: '🔗', other: '📌' };
---
{references.length > 0 && (
  <section class="my-12">
    <h2 class="text-lg font-[Finger_Paint] chalk-text-amber mb-3">
      もっと知りたい
    </h2>
    <ul class="space-y-2">
      {references.map(r => (
        <li>
          <span class="mr-2">{sourceIcon[r.source]}</span>
          <a href={r.url} target="_blank" rel="noopener">{r.label}</a>
        </li>
      ))}
    </ul>
  </section>
)}
```

- [ ] **Step 2: コミット**

```bash
git add src/components/error/References.astro
git commit -m "feat: add References component / References 追加"
```

---

# Phase F: 検索

## Task 26: search-index.json.ts (ビルド時 JSON 生成)

**Files:**
- Create: `src/pages/search-index.json.ts`

- [ ] **Step 1: ファイル作成**

`src/pages/search-index.json.ts`:
```ts
import type { APIRoute } from 'astro';
import { getAllErrors } from '@/lib/errors';
import { buildSearchIndex } from '@/lib/search';

export const GET: APIRoute = async () => {
  const errors = await getAllErrors();
  const index = buildSearchIndex(errors);
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 2: コミット**

```bash
git add src/pages/search-index.json.ts
git commit -m "feat: generate search-index.json at build time / ビルド時に検索インデックス生成"
```

---

## Task 27: SearchBar.astro と SearchBox.astro

**Files:**
- Create: `src/components/search/SearchBar.astro`
- Create: `src/components/search/SearchBox.astro`

- [ ] **Step 1: SearchBar.astro (トップヒーロー用)**

`src/components/search/SearchBar.astro`:
```astro
---
---
<div class="relative max-w-2xl mx-auto my-8">
  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-chalk-dust)] text-xl">🔎</span>
  <input
    type="search"
    class="input-chalk"
    placeholder="コードか名前で探す... (例: 404, ページなし, timeout)"
    data-search-input
    autocomplete="off"
  />
  <ul
    class="absolute top-full left-0 right-0 mt-2 chalkboard hidden max-h-96 overflow-y-auto z-10"
    data-search-results
  ></ul>
</div>
<script>
  import('@/components/search/search.client.ts');
</script>
```

- [ ] **Step 2: SearchBox.astro (ヘッダ用、小サイズ)**

`src/components/search/SearchBox.astro`:
```astro
---
---
<button class="btn-chalk btn-chalk--ghost text-sm" data-search-trigger>
  🔎 検索
</button>
<dialog class="chalkboard-frame max-w-2xl w-[90%] backdrop:bg-black/60" data-search-dialog>
  <div class="chalkboard p-6">
    <div class="relative">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-chalk-dust)] text-xl">🔎</span>
      <input
        type="search"
        class="input-chalk"
        placeholder="コードか名前で探す..."
        data-search-input
        autocomplete="off"
      />
    </div>
    <ul class="mt-3 max-h-96 overflow-y-auto" data-search-results></ul>
  </div>
</dialog>
<script>
  import('@/components/search/search.client.ts');
</script>
```

- [ ] **Step 3: コミット**

```bash
git add src/components/search/SearchBar.astro src/components/search/SearchBox.astro
git commit -m "feat: add SearchBar and SearchBox UI / 検索UI追加"
```

---

## Task 28: search.client.ts (Fuse.js 統合)

**Files:**
- Create: `src/components/search/search.client.ts`

- [ ] **Step 1: ファイル作成**

`src/components/search/search.client.ts`:
```ts
import Fuse from 'fuse.js';
import type { SearchIndexEntry } from '@/lib/search';

const BASE = (() => {
  // <link rel="canonical"> から取得 → 失敗したら現在のパス先頭
  const m = location.pathname.match(/^(\/[^/]+)\//);
  return m ? m[1] : '';
})();

const indexUrl = `${BASE}/search-index.json`;

let fuse: Fuse<SearchIndexEntry> | null = null;
let loadPromise: Promise<void> | null = null;

const ensureIndex = async () => {
  if (fuse) return;
  if (!loadPromise) {
    loadPromise = fetch(indexUrl)
      .then(r => r.json() as Promise<SearchIndexEntry[]>)
      .then(data => {
        fuse = new Fuse(data, {
          keys: [
            { name: 'code', weight: 0.3, getFn: (e) => String(e.code) },
            { name: 'name', weight: 0.15 },
            { name: 'nameJa', weight: 0.4 },
            { name: 'synonyms', weight: 0.1 },
            { name: 'summary', weight: 0.05 },
          ],
          threshold: 0.4,
          ignoreLocation: true,
          minMatchCharLength: 1,
        });
      });
  }
  await loadPromise;
};

const renderResults = (results: SearchIndexEntry[], ul: HTMLElement) => {
  if (results.length === 0) {
    ul.innerHTML = '<li class="p-3 text-sm text-[var(--color-chalk-dust)]">該当なし</li>';
    return;
  }
  ul.innerHTML = results.slice(0, 10).map((e, i) => `
    <li>
      <a href="${e.url}" class="block p-3 hover:bg-white/5 !no-underline" data-result-index="${i}">
        <span class="chalk-text-amber font-[Finger_Paint] text-lg mr-3">${e.code}</span>
        <span class="text-[var(--color-chalk-white)]">${e.nameJa}</span>
        <span class="text-sm text-[var(--color-chalk-dust)] block ml-12">${e.name} — ${e.summary}</span>
      </a>
    </li>
  `).join('');
};

const debounce = <T extends unknown[]>(fn: (...args: T) => void, ms: number) => {
  let t: number | undefined;
  return (...args: T) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
};

const initInput = (input: HTMLInputElement) => {
  const wrapper = input.closest('[data-search-dialog], div')!;
  const ul = wrapper.querySelector<HTMLElement>('[data-search-results]');
  if (!ul) return;

  const handleInput = debounce(async () => {
    const q = input.value.trim();
    if (!q) {
      ul.innerHTML = '';
      ul.classList.add('hidden');
      return;
    }
    await ensureIndex();
    const results = fuse!.search(q).map(r => r.item);
    renderResults(results, ul);
    ul.classList.remove('hidden');
  }, 100);

  input.addEventListener('input', handleInput);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      ul.innerHTML = '';
      ul.classList.add('hidden');
      const dlg = input.closest('dialog');
      if (dlg && 'close' in dlg) (dlg as HTMLDialogElement).close();
    }
    if (e.key === 'Enter') {
      const first = ul.querySelector<HTMLAnchorElement>('a');
      if (first) first.click();
    }
  });
};

const initDialogTriggers = () => {
  document.querySelectorAll<HTMLElement>('[data-search-trigger]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dlg = document.querySelector<HTMLDialogElement>('[data-search-dialog]');
      if (dlg && 'showModal' in dlg) {
        dlg.showModal();
        dlg.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
      }
    });
  });
};

document.querySelectorAll<HTMLInputElement>('[data-search-input]').forEach(initInput);
initDialogTriggers();
```

- [ ] **Step 2: ビルド確認**

```bash
pnpm build
```

Expected: ビルド成功。`dist/search-index.json` が生成されている（コンテンツがまだ無くても空配列でOK）。

- [ ] **Step 3: コミット**

```bash
git add src/components/search/search.client.ts
git commit -m "feat: integrate Fuse.js fuzzy search / Fuse.js ファジー検索を統合"
```

---

# Phase G: ページ

## Task 29: トップページ index.astro

**Files:**
- Create/Modify: `src/pages/index.astro`

- [ ] **Step 1: ファイル作成（既存を全置換）**

`src/pages/index.astro`:
```astro
---
import HomeLayout from '@/layouts/HomeLayout.astro';
import BlackboardFrame from '@/components/layout/BlackboardFrame.astro';
import SearchBar from '@/components/search/SearchBar.astro';
import ErrorCard from '@/components/error/ErrorCard.astro';
import { getPopularErrors } from '@/lib/errors';
import { url } from '@/lib/url';

const popular = await getPopularErrors();
---
<HomeLayout>
  <BlackboardFrame size="hero" class="mt-8">
    <div class="text-center mb-8">
      <h1 class="font-[Finger_Paint] text-4xl md:text-5xl chalk-text-amber chalk-numeral !text-4xl md:!text-5xl">
        Slate Errors
      </h1>
      <p class="text-lg text-[var(--color-chalk-white)] mt-2">
        放課後の黒板で、HTTPエラーを学び直す
      </p>
      <p class="text-sm text-[var(--color-chalk-dust)] mt-1">
        エラーは間違いではない、発見である。
      </p>
    </div>

    <SearchBar />
  </BlackboardFrame>

  {popular.length > 0 && (
    <section class="my-16">
      <h2 class="text-2xl font-[Finger_Paint] chalk-text-amber mb-6 text-center chalk-underline">
        よく訪ねられるエラー
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {popular.map(e => <ErrorCard entry={e} />)}
      </div>
    </section>
  )}

  <div class="text-center mt-12">
    <a href={url('errors/')} class="btn-chalk">
      全件を見る →
    </a>
  </div>
</HomeLayout>
```

- [ ] **Step 2: コミット**

```bash
git add src/pages/index.astro
git commit -m "feat: implement top page with hero search / トップページ実装"
```

---

## Task 30: 全件一覧 errors/index.astro

**Files:**
- Create: `src/pages/errors/index.astro`

- [ ] **Step 1: ファイル作成**

`src/pages/errors/index.astro`:
```astro
---
import HomeLayout from '@/layouts/HomeLayout.astro';
import ErrorGroup from '@/components/error/ErrorGroup.astro';
import { getAllErrors, groupByCategory } from '@/lib/errors';

const all = await getAllErrors();
const { client, server } = groupByCategory(all);
---
<HomeLayout title="全件一覧" description="HTTPエラーコード全件の図書館型一覧。4xx/5xxごとにグループ化。">
  <header class="my-8 text-center">
    <h1 class="text-3xl font-[Finger_Paint] chalk-text-amber chalk-underline">
      全件一覧
    </h1>
    <p class="text-[var(--color-chalk-dust)] mt-2">
      4xx と 5xx、それぞれの黒板に並べました
    </p>
  </header>

  <ErrorGroup category="client" entries={client} />
  <ErrorGroup category="server" entries={server} />
</HomeLayout>
```

- [ ] **Step 2: コミット**

```bash
git add src/pages/errors/index.astro
git commit -m "feat: implement library-style errors index / 図書館型一覧ページ実装"
```

---

## Task 31: 詳細ページ errors/[code].astro

**Files:**
- Create: `src/pages/errors/[code].astro`

- [ ] **Step 1: ファイル作成**

`src/pages/errors/[code].astro`:
```astro
---
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
  return errors.map(e => ({
    params: { code: String(e.data.code) },
    props: { entry: e },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
---
<ErrorLayout entry={entry}>
  <ErrorHero entry={entry} />

  {entry.data.commonCauses.length > 0 && (
    <CommonCauses causes={entry.data.commonCauses} />
  )}

  <article class="prose-chalk mx-auto">
    <Content />
  </article>

  {entry.data.related.length > 0 && (
    <RelatedErrors codes={entry.data.related} />
  )}

  <References references={entry.data.references} />
  <PrevNext code={entry.data.code} />
</ErrorLayout>
```

- [ ] **Step 2: コミット**

```bash
git add src/pages/errors/[code].astro
git commit -m "feat: implement error detail dynamic page / エラー詳細ページ実装"
```

---

## Task 32: 自己言及 404.astro

**Files:**
- Create: `src/pages/404.astro`

- [ ] **Step 1: ファイル作成**

`src/pages/404.astro`:
```astro
---
import HomeLayout from '@/layouts/HomeLayout.astro';
import BlackboardFrame from '@/components/layout/BlackboardFrame.astro';
import { url } from '@/lib/url';
---
<HomeLayout title="404 — このページは黒板に書かれていません">
  <BlackboardFrame size="hero" class="my-12">
    <div class="text-center">
      <p class="text-sm text-[var(--color-chalk-dust)] uppercase tracking-widest">Client Error</p>
      <div class="chalk-numeral my-4">404</div>
      <h1 class="font-[Finger_Paint] chalk-text-amber text-2xl">Not Found</h1>
      <p class="text-lg text-[var(--color-chalk-white)] mt-2">— このページは黒板に書かれていません</p>
    </div>

    <div class="prose-chalk mx-auto mt-8 max-w-xl">
      <p>
        ふしぎなことに、いま開いているページが「404」そのものです。
        黒板に書かれていないURLにたどり着いたとき、サーバーは静かに首を横に振ります。
      </p>
      <p>
        気を取り直して、トップから探してみましょう。
      </p>

      <div class="text-center mt-8 flex gap-4 justify-center">
        <a href={url('')} class="btn-chalk">トップへ戻る</a>
        <a href={url('errors/404/')} class="btn-chalk btn-chalk--ghost">404 の解説を読む</a>
      </div>
    </div>
  </BlackboardFrame>
</HomeLayout>
```

- [ ] **Step 2: コミット**

```bash
git add src/pages/404.astro
git commit -m "feat: add self-referential 404 page / 自己言及型404ページ追加"
```

---

# Phase H: デプロイ

## Task 33: GitHub Actions ワークフロー

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: ファイル作成**

`.github/workflows/deploy.yml`:
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
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Build site
        run: pnpm build
        env:
          SITE_URL: https://${{ github.repository_owner }}.github.io
          BASE_PATH: /${{ github.event.repository.name }}

      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

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

- [ ] **Step 2: コミット**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add github pages deploy workflow / GH Pages デプロイワークフロー追加"
```

---

## Task 34: ローカル全体ビルド確認

**Files:** なし（検証のみ）

- [ ] **Step 1: クリーンビルド**

```bash
rm -rf dist .astro
pnpm build
```

Expected: ビルド成功。0 errors。

- [ ] **Step 2: preview で全URLを目視確認**

```bash
pnpm preview
```

ブラウザで以下のURLが正しく表示されることを確認：
- `http://localhost:4321/slate-errors/` — トップ（検索ヒーローと「全件を見る」ボタン）
- `http://localhost:4321/slate-errors/errors/` — 一覧（コンテンツ未投入なら空グループ）
- `http://localhost:4321/slate-errors/random-path` — 404 ページ（自己言及）

`Ctrl+C` で停止。

- [ ] **Step 3: 検索 JSON エンドポイント確認**

```bash
curl http://localhost:4321/slate-errors/search-index.json
```

Expected: `[]` (まだコンテンツがないので空配列)

注: 上記コマンドは preview 起動中に別ターミナルで実行。

- [ ] **Step 4: コミット（変更なしなのでスキップ）**

このタスクは検証のみ。コミット不要。

---

# Phase I: コンテンツ Phase 1 (旗艦4件)

ここからコンテンツ。各 MDX で **CONTENT_GUIDE のチェックリストを上から順に確認** すること。

## Task 35: 404.mdx (旗艦の旗艦・基準サンプル)

**Files:**
- Create: `src/content/errors/404.mdx`
- Modify: `docs/CONTENT_PROGRESS.md`

- [ ] **Step 1: ファイル作成**

`src/content/errors/404.mdx`:
```mdx
---
code: 404
name: "Not Found"
nameJa: "ページが見つかりません"
category: client
summary: 指定された URL に対応するページがサーバー上に存在しません。
synonyms: ["ページなし", "リンク切れ", "page not found", "URL 間違い", "見つからない"]
related: [410, 405, 301]
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

404 は「指定された URL に対応するページがサーバー上に見つからなかった」というサインです。
教室で「教科書の 38 ページを開いて」と言われたのに、その 38 ページが破られていた——そんな感覚に近いかもしれません。

サーバーは、URL という地図を頼りにファイルを探します。地図の場所に何もなければ、「ありませんでした」と正直に答えます。それが 404 です。

## 黒板からのひとこと

授業の前に、先生は必ず「今日のページはここだよ」と確認します。
Web でも同じで、URL（先生の指示）と サーバー上のリソース（実際の教科書のページ）が一致していないと、授業は始まりません。

「リソースが移動した」「URL を打ち間違えた」「リンクが古い」など、原因はいくつかあります。どれも黒板を消し忘れたまま次の授業を始めようとしたときに似ています。

## 解決への歩み

大丈夫、次はこうしてみよう：

1. **URL の綴りを確認**：typo は誰にでもある。大文字/小文字、末尾スラッシュも見直す
2. **リンク元を確認**：参照元が古いかもしれない。元のページを開いてリンクが今も生きているか
3. **サイト内検索やトップから探す**：ページが移動した可能性。新しい場所が見つかることが多い
4. **サーバーログを確認（管理者向け）**：意図せず削除していないか、リダイレクト設定が抜けていないか

<ResponseExample status={404} statusText="Not Found" />
```

- [ ] **Step 2: ビルド確認**

```bash
pnpm build
```

Expected: 0 errors。`dist/errors/404/index.html` が生成される。

- [ ] **Step 3: 視覚確認**

```bash
pnpm preview
```

`http://localhost:4321/slate-errors/errors/404/` を開いて、Hero/CommonCauses/本文/References が綺麗に並ぶことを確認。`Ctrl+C` で停止。

- [ ] **Step 4: PROGRESS 更新**

`docs/CONTENT_PROGRESS.md` の `- [ ] 404 Not Found` を `- [x] 404 Not Found` に変更。

- [ ] **Step 5: コミット**

```bash
git add src/content/errors/404.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 404 Not Found (flagship sample) / 404 旗艦サンプル追加"
```

---

## Task 36: 500.mdx

**Files:**
- Create: `src/content/errors/500.mdx`
- Modify: `docs/CONTENT_PROGRESS.md`

- [ ] **Step 1: ファイル作成**

`src/content/errors/500.mdx`:
```mdx
---
code: 500
name: "Internal Server Error"
nameJa: "サーバー内部のエラー"
category: server
summary: サーバー側で予期しない問題が起きて、リクエストに応えられませんでした。
synonyms: ["サーバーエラー", "500エラー", "internal server", "サーバー落ちた", "予期しないエラー"]
related: [502, 503, 504]
commonCauses:
  - title: アプリケーションコードでの未捕捉の例外
    hint: スタックトレースをログから探すのが最初の一歩
  - title: 外部サービス (DB, API) との通信失敗
    hint: 接続情報・タイムアウト・認可を順に疑う
  - title: 設定ファイルの誤りや環境変数の欠落
    hint: 直前のデプロイ差分が真っ先に怪しい
popular: true
rfc: "9110"
references:
  - label: "RFC 9110 §15.6.1"
    url: "https://www.rfc-editor.org/rfc/rfc9110#section-15.6.1"
    source: rfc
  - label: "MDN: 500 Internal Server Error"
    url: "https://developer.mozilla.org/ja/docs/Web/HTTP/Status/500"
    source: mdn
updatedAt: 2026-05-13
---

import ResponseExample from '@/components/error/ResponseExample.astro';

## 何が起きたのか？

500 は「サーバーの中で何か予期しない問題が起き、これ以上は答えられない」というサインです。
教室で言えば、先生が黒板に書こうとしたチョークが折れて、何も書けなくなってしまった——そんな状態に近いかもしれません。

クライアント（あなたのブラウザやアプリ）に非はなく、サーバー側で「想定していなかった事態」が起きています。原因はサーバーログを見ないとわからない、というのが 500 の難しさです。

## 黒板からのひとこと

授業中、先生が突然黙り込むことがあります。「ちょっと待ってね」と言いながら何かを思い出そうとしている。生徒からは何が起きているか見えませんが、先生の頭の中では何かが詰まっているのです。

500 はそれと似ています。サーバーは「答えられません」とだけ伝え、その理由は外側からは見えません。原因はログという「先生のメモ」の中にあります。

## 解決への歩み

大丈夫、次はこうしてみよう：

1. **時間を置いてリトライ**：一時的なエラーかもしれない。まずもう一度
2. **別のページや機能を試す**：サイト全体が落ちているのか、特定の機能だけかを切り分ける
3. **状況を管理者に伝える**：いつ・どこで・何をしたら出たか。スクリーンショットがあれば最強
4. **サーバーログを調査（管理者向け）**：直近のデプロイ差分、外部サービスのステータス、エラーログのスタックトレースを順に確認

<ResponseExample status={500} statusText="Internal Server Error" />
```

- [ ] **Step 2: ビルド + 視覚確認**

```bash
pnpm build && pnpm preview
```

`http://localhost:4321/slate-errors/errors/500/` で確認。

- [ ] **Step 3: PROGRESS 更新（500を `[x]`）+ コミット**

```bash
git add src/content/errors/500.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 500 Internal Server Error / 500 追加"
```

---

## Task 37: 403.mdx

**Files:**
- Create: `src/content/errors/403.mdx`
- Modify: `docs/CONTENT_PROGRESS.md`

- [ ] **Step 1: ファイル作成**

`src/content/errors/403.mdx`:
```mdx
---
code: 403
name: "Forbidden"
nameJa: "アクセスが許可されていません"
category: client
summary: リソースは存在しますが、あなたにはアクセスする権限がありません。
synonyms: ["権限なし", "アクセス禁止", "forbidden", "アクセス拒否", "見れない"]
related: [401, 405, 451]
commonCauses:
  - title: 認証はできているが、その操作の権限がない
    hint: ログインしているユーザーのロール/権限を確認
  - title: ファイルやディレクトリのパーミッション設定ミス
    hint: サーバー側のファイル権限 (chmod) や所有者を見直す
  - title: IP制限・地域制限・WAFのブロック
    hint: 別の回線/VPNで再現するかで切り分けられる
popular: true
rfc: "9110"
references:
  - label: "RFC 9110 §15.5.4"
    url: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.4"
    source: rfc
  - label: "MDN: 403 Forbidden"
    url: "https://developer.mozilla.org/ja/docs/Web/HTTP/Status/403"
    source: mdn
updatedAt: 2026-05-13
---

import ResponseExample from '@/components/error/ResponseExample.astro';

## 何が起きたのか？

403 は「リソースは確かに存在するけれど、あなたにはアクセスする権限がない」という拒否のサインです。
教室で言えば、職員室の前に立って「中を見せて」と頼んだとき、先生が「ここは生徒は入れない部屋なんだ」と扉を閉めるような状況です。

401（認証されていない）と違って、サーバーは「あなたが誰かは分かっている。その上で許可しない」と言っています。ログインし直しても解決しないのが 403 の特徴です。

## 黒板からのひとこと

教室には、先生用の引き出しや、特定のクラブの部室など、入れる人が決まっている場所があります。誰かを締め出すためではなく、役割の違いから生まれる仕切りです。

403 もそれと同じです。意地悪をされているのではなく、「いまのあなたの立場ではここは見えないことになっている」のです。立場を変える（権限を上げてもらう）か、別の入り口を探すのが解決の道です。

## 解決への歩み

大丈夫、次はこうしてみよう：

1. **正しいアカウントでログインしているか確認**：別のロールのアカウントが必要かもしれない
2. **権限を持つ人に申請する**：管理者やリソース所有者に「これにアクセスしたい」と相談
3. **URL/操作が本当に必要かを問い直す**：別の正規ルートで同じ目的を達成できる場合がある
4. **サーバー設定を確認（管理者向け）**：ファイル権限、ロール定義、WAFルール、IP allow/denyを順に確認

<ResponseExample status={403} statusText="Forbidden" />
```

- [ ] **Step 2-3: ビルド + PROGRESS + コミット**

同上のフロー。`docs/CONTENT_PROGRESS.md` の 403 をチェック。

```bash
git add src/content/errors/403.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 403 Forbidden / 403 追加"
```

---

## Task 38: 502.mdx + Phase 1 完了確認

**Files:**
- Create: `src/content/errors/502.mdx`
- Modify: `docs/CONTENT_PROGRESS.md`

- [ ] **Step 1: ファイル作成**

`src/content/errors/502.mdx`:
```mdx
---
code: 502
name: "Bad Gateway"
nameJa: "ゲートウェイから不正な応答"
category: server
summary: 中継サーバー（リバースプロキシなど）が、上流のサーバーから無効な応答を受け取りました。
synonyms: ["bad gateway", "ゲートウェイエラー", "502エラー", "プロキシ", "上流サーバー"]
related: [500, 503, 504]
commonCauses:
  - title: 上流アプリケーションサーバーが起動していない/落ちている
    hint: アプリプロセスの稼働状況とポートを確認
  - title: 上流サーバーが想定外の応答（壊れたヘッダ等）を返した
    hint: nginxのerror_logやアプリのアクセスログで詳細確認
  - title: タイムアウトや接続切断
    hint: keepalive、タイムアウト設定を見直す
popular: true
rfc: "9110"
references:
  - label: "RFC 9110 §15.6.3"
    url: "https://www.rfc-editor.org/rfc/rfc9110#section-15.6.3"
    source: rfc
  - label: "MDN: 502 Bad Gateway"
    url: "https://developer.mozilla.org/ja/docs/Web/HTTP/Status/502"
    source: mdn
updatedAt: 2026-05-13
---

import ResponseExample from '@/components/error/ResponseExample.astro';

## 何が起きたのか？

502 は「中継役のサーバーが、その先にいる本体サーバーから返ってきた答えを理解できなかった」というサインです。
教室で例えるなら、廊下に立つ伝令係が、隣の教室の先生に質問を持ち込んだら「もごもご……」と意味の通らない返事しか戻ってこなかった、そんな状況です。

リバースプロキシ（nginx, ALB, CDNなど）が前面に立つ構成で起きやすく、原因は「中継役」ではなく「奥にいる本体」にあることがほとんどです。

## 黒板からのひとこと

授業中、先生が誰かにメモを取りに行かせたとして、戻ってきたメモが破れていたら、教室全員に「読めなかった」と伝えるしかありません。これが 502 です。

伝令係を責めても何も解決しません。奥の教室で何が起きているか、誰がそこに居るか、紙が破れていないか——順に確認していきます。

## 解決への歩み

大丈夫、次はこうしてみよう：

1. **時間を置いて再アクセス**：上流サーバーの再起動などで一時的に発生していることがある
2. **別の機能・ページを確認**：特定のエンドポイントだけ502か、サイト全体かを切り分ける
3. **状況を管理者に伝える**：時刻、URL、繰り返し再現するか
4. **上流アプリの稼働状況を確認（管理者向け）**：プロセス起動、ポート開放、ヘルスチェック、プロキシのerror_logを順に

<ResponseExample status={502} statusText="Bad Gateway" />
```

- [ ] **Step 2: ビルド + 視覚確認**

```bash
pnpm build && pnpm preview
```

特に **トップページに 4 件すべての popular カードが並ぶ** ことを確認。`Ctrl+C`。

- [ ] **Step 3: PROGRESS 更新（4件すべて `[x]`、Phase 1 ヘッダーも `(4 / 4)` に）+ コミット**

```bash
git add src/content/errors/502.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 502 Bad Gateway, complete Phase 1 / 502 追加 + Phase 1 完了"
```

---

# Phase J: コンテンツ Phase 2 (主要 11件)

ここから先は、各タスク **2-3 件のエラーをまとめて執筆** する。MDX 構造は同じなので、frontmatter のテーブルを示し、本文は CONTENT_GUIDE のチェックリストに従って書く。

## Task 39: 4xx 認証/リクエスト系 (400, 401, 405)

**Files:**
- Create: `src/content/errors/400.mdx`, `401.mdx`, `405.mdx`
- Modify: `docs/CONTENT_PROGRESS.md`

各ファイルの frontmatter（必須項目のみ）:

| code | name | nameJa | category | summary | synonyms (例) | related | rfc |
|---|---|---|---|---|---|---|---|
| 400 | Bad Request | リクエストが正しくありません | client | リクエストの形式や内容にサーバーが理解できない問題があります。 | bad request, リクエスト不正, パラメータ間違い | [422, 411, 414] | 9110 |
| 401 | Unauthorized | 認証が必要です | client | 認証情報がないか、無効なため、リソースにアクセスできません。 | 認証エラー, ログインしてない, unauthorized, トークン切れ | [403, 407] | 9110 |
| 405 | Method Not Allowed | このメソッドは許可されていません | client | URLは存在しますが、使ったHTTPメソッド (GET/POST等) が許可されていません。 | method not allowed, メソッド不正, POST禁止 | [400, 501] | 9110 |

- [ ] **Step 1: 400.mdx を執筆**

`_TEMPLATE.mdx` を参考に作成。本文の構成:
- 「何が起きたのか？」: リクエストが文法的に間違っている / 必要なフィールドがない / JSONがパース不可 など。教室では「指示の書かれた紙が破れていて読めない」イメージ。
- 「黒板からのひとこと」: 先生（サーバー）が読めない指示にどう反応するか。リクエストの形式を整える大切さ。
- 「解決への歩み」: 1) リクエストボディとContent-Typeを確認、2) 必須パラメータを確認、3) APIドキュメントと突き合わせ、4) 管理者: バリデーションエラーログを確認

`commonCauses` の例:
```yaml
commonCauses:
  - title: JSON のシンタックスエラー
    hint: カンマ抜けや末尾カンマ、引用符の不整合
  - title: 必須パラメータの欠落
    hint: API仕様書とリクエストを照合
  - title: Content-Typeヘッダの不一致
    hint: application/json なのに form-urlencoded で送っていないか
```

- [ ] **Step 2: 401.mdx を執筆**

「身分証明書がない/期限切れ」のメタファー。職員室入口で身分証提示を求められる教室イメージ。
本文の解決ステップ: 1) ログイン状態を確認、2) トークン期限を確認、3) 認証ヘッダの綴り、4) 管理者: 認証サーバーのステータス。

- [ ] **Step 3: 405.mdx を執筆**

「正しい教室の入り口に来たけど、別の入り方をした」イメージ（GET用の入り口にPOSTで突入）。
解決: 1) 使用メソッド確認、2) APIドキュメント参照、3) Allowヘッダを見る、4) 管理者: ルーティング設定確認。

- [ ] **Step 4: ビルド + 視覚確認 + PROGRESS 更新**

```bash
pnpm build
```

検索ボックスで「ログイン」「method」が新コンテンツにヒットすることをpreviewで確認。

- [ ] **Step 5: コミット**

```bash
git add src/content/errors/400.mdx src/content/errors/401.mdx src/content/errors/405.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 400 401 405 (request/auth group) / 400/401/405 追加"
```

---

## Task 40: 4xx 状態/競合系 (409, 410, 422)

**Files:**
- Create: `src/content/errors/409.mdx`, `410.mdx`, `422.mdx`
- Modify: `docs/CONTENT_PROGRESS.md`

| code | name | nameJa | category | summary | synonyms | related |
|---|---|---|---|---|---|---|
| 409 | Conflict | 状態が競合しています | client | リソースの現在の状態と、リクエストが衝突しました。 | 競合, conflict, 同時編集, 楽観ロック | [412, 423, 428] |
| 410 | Gone | 永久に削除されました | client | リソースは存在しましたが、永久に削除されており、戻る予定もありません。 | gone, 削除済み, なくなった | [404, 301] |
| 422 | Unprocessable Content | 内容を処理できません | client | リクエストの形式は正しいですが、内容のセマンティクスに問題があります。 | unprocessable, バリデーションエラー, 422, 内容不正 | [400, 409] |

- [ ] **Step 1-3: 各 MDX を執筆**

- 409: 「同じ問題を二人が同時に黒板に書こうとした」イメージ。同時編集衝突、Etag mismatch等。
- 410: 「以前あった黒板の内容が、もう永久に消されている」イメージ。404と違って「戻ってこない」点を強調。
- 422: 「文法は合ってるけど、書いてあることが現実と合わない（マイナスの年齢など）」イメージ。バリデーションエラー。

- [ ] **Step 4: ビルド + コミット**

```bash
pnpm build
git add src/content/errors/409.mdx src/content/errors/410.mdx src/content/errors/422.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 409 410 422 (state/conflict group) / 409/410/422 追加"
```

---

## Task 41: 4xx サイズ/レート系 (413, 429)

**Files:**
- Create: `src/content/errors/413.mdx`, `429.mdx`
- Modify: `docs/CONTENT_PROGRESS.md`

| code | name | nameJa | summary | synonyms | related |
|---|---|---|---|---|---|
| 413 | Content Too Large | リクエストが大きすぎます | リクエストボディのサイズがサーバーの上限を超えています。 | too large, ペイロード超過, アップロード失敗, 413 | [414, 431] |
| 429 | Too Many Requests | リクエストが多すぎます | 短時間にあまりにも多くのリクエストを送ったため制限されました。 | rate limit, 429, レートリミット, リトライ過多 | [503, 408] |

両方 client。

- [ ] **Step 1-2: 執筆**

- 413: 「持参した宿題のノートが厚すぎて鞄に入らない」教室イメージ。multipart の上限、画像サイズ等。
- 429: 「先生に質問しすぎて『少し落ち着いて』と言われた」教室イメージ。指数バックオフを推奨。Retry-After ヘッダの存在を案内。

- [ ] **Step 3: コミット**

```bash
pnpm build
git add src/content/errors/413.mdx src/content/errors/429.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 413 429 (size/rate group) / 413/429 追加"
```

---

## Task 42: 5xx 主要 (501, 503, 504)

**Files:**
- Create: `src/content/errors/501.mdx`, `503.mdx`, `504.mdx`
- Modify: `docs/CONTENT_PROGRESS.md`

| code | name | nameJa | summary | synonyms | related |
|---|---|---|---|---|---|
| 501 | Not Implemented | 実装されていません | サーバーがそのリクエスト方法に対応していません。 | not implemented, 未実装, 501, 機能なし | [405, 502] |
| 503 | Service Unavailable | 一時的に利用できません | サーバーが過負荷またはメンテナンス中で応答できません。 | service unavailable, メンテナンス, 過負荷, 落ちてる | [502, 504, 429] |
| 504 | Gateway Timeout | ゲートウェイのタイムアウト | 中継サーバーが上流サーバーの応答を待ちきれませんでした。 | gateway timeout, タイムアウト, 504, 応答遅い | [502, 503, 408] |

すべて server。

- [ ] **Step 1-3: 執筆**

- 501: 「教室にまだその授業道具がない」イメージ。サポートしないHTTPメソッドや拡張機能。
- 503: 「先生が今は手が離せない、または学校全体がメンテナンス中」イメージ。Retry-Afterの説明、502との違い（こちらは「サーバーは生きてるが受けられない」）。
- 504: 「伝令係が上の階に質問しに行ったまま戻ってこない」イメージ。タイムアウト設定、上流の遅延、502との違い（こちらは「応答が来ない」）。

- [ ] **Step 4: ビルド + コミット**

```bash
pnpm build
git add src/content/errors/501.mdx src/content/errors/503.mdx src/content/errors/504.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 501 503 504 (server group) / 501/503/504 追加"
```

---

## Task 43: Phase 2 完了確認

**Files:** なし

- [ ] **Step 1: ビルドと一覧確認**

```bash
pnpm build && pnpm preview
```

`/slate-errors/errors/` で、Client errors に 6 件 (400/401/403/404/405/409/410/413/422/429 の合計10件)、Server errors に 5 件 (500/501/502/503/504) が並んでいることを確認。

(Phase1 4 + Phase2 11 = 計 15 件)

- [ ] **Step 2: 検索動作確認**

トップで「ログイン」「アップロード」「タイムアウト」「メンテナンス」と打って、それぞれ妥当なコードが上位に出ることを確認。

- [ ] **Step 3: PROGRESS のヘッダー更新**

`docs/CONTENT_PROGRESS.md` の `## Phase 2: 主要 (0 / 11)` を `(11 / 11)` に。

- [ ] **Step 4: コミット**

```bash
git add docs/CONTENT_PROGRESS.md
git commit -m "docs: mark Phase 2 complete / Phase 2 完了"
```

---

# Phase K: コンテンツ Phase 3 (残り 25件)

ここからは6タスクで25件をまとめて執筆。frontmatter は**短いサマリと synonyms をテーブルで提供**するので、本文は CONTENT_GUIDE と既存実装を参考に書く。

## Task 44: 4xx 残り認証/プロキシ (402, 407)

**Files:**
- Create: `src/content/errors/402.mdx`, `407.mdx`

| code | name | nameJa | summary | synonyms | related |
|---|---|---|---|---|---|
| 402 | Payment Required | 支払いが必要です | 将来的な支払い系拡張のために予約された、現状ほぼ未使用のステータス。 | payment, 支払い, 402, 課金 | [401, 403] |
| 407 | Proxy Authentication Required | プロキシ認証が必要です | クライアントとサーバーの間にあるプロキシで認証が必要です。 | proxy auth, 407, プロキシ認証 | [401, 403] |

- [ ] **Step 1-2: 執筆**

- 402: 「将来用に予約されている黒板スペース、まだ使われていない」イメージ。Stripe等の決済APIで稀に独自利用。
- 407: 「教室に入る前に、廊下にいる先生（プロキシ）にも身分証を見せる必要がある」イメージ。

- [ ] **Step 3: コミット**

```bash
git add src/content/errors/402.mdx src/content/errors/407.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 402 407 / 402/407 追加"
```

---

## Task 45: 4xx 残り状態/前提条件 (411, 412, 417, 421, 423, 424)

**Files:**
- Create: `src/content/errors/411.mdx`, `412.mdx`, `417.mdx`, `421.mdx`, `423.mdx`, `424.mdx`

| code | name | nameJa | summary | synonyms | related |
|---|---|---|---|---|---|
| 411 | Length Required | Content-Length が必要です | サーバーが Content-Length ヘッダを要求しているのに、ない。 | length required, 411, content-length | [400, 413] |
| 412 | Precondition Failed | 前提条件が満たされません | If-Match などの前提条件が満たされませんでした。 | precondition, 412, 楽観ロック失敗 | [428, 409] |
| 417 | Expectation Failed | Expect ヘッダの期待が果たせません | Expect ヘッダで指定された期待値をサーバーが満たせない。 | expectation, 417, expect ヘッダ | [400] |
| 421 | Misdirected Request | 宛先が違います | このサーバーで応答できないリクエストが届きました。 | misdirected, 421, ホスト違い | [400, 404] |
| 423 | Locked | リソースがロックされています | リソースが他者によってロックされ、編集できません。 | locked, 423, ロック | [409, 412] |
| 424 | Failed Dependency | 依存先が失敗しました | 直前の操作が失敗したため、このリクエストも実行できませんでした。 | failed dependency, 424, 依存失敗 | [409, 423] |

- [ ] **Step 1-6: 各 MDX を執筆（各エラー10-15分目安）**

教室メタファー例:
- 411: 「ノートを提出するときに『何ページ書いたか』を表紙に書いていないと先生が受け取らない」
- 412: 「『この紙がまだ書き換えられてないままなら更新して』と頼んだら、すでに別の人が書き換えていた」
- 417: 「『これができますか？』と聞いたら、先生が『その期待には応えられない』と答えた」
- 421: 「友達の教室の名前を間違って入って、その教室の先生に『うちじゃないよ』と言われた」
- 423: 「他の生徒が今その教科書を使っていて、書き込み禁止になっている」
- 424: 「前の課題で詰まったまま次に進めない、ドミノ倒しのような連鎖」

- [ ] **Step 7: ビルド + コミット**

```bash
pnpm build
git add src/content/errors/411.mdx src/content/errors/412.mdx src/content/errors/417.mdx src/content/errors/421.mdx src/content/errors/423.mdx src/content/errors/424.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 411 412 417 421 423 424 (state/precondition group) / 状態/前提条件群追加"
```

---

## Task 46: 4xx 残りサイズ/メディア (414, 415, 416, 426, 428, 431)

**Files:**
- Create: `src/content/errors/414.mdx`, `415.mdx`, `416.mdx`, `426.mdx`, `428.mdx`, `431.mdx`

| code | name | nameJa | summary | synonyms | related |
|---|---|---|---|---|---|
| 414 | URI Too Long | URIが長すぎます | URLの長さがサーバーの上限を超えています。 | uri too long, 414, URL長すぎ | [413, 431] |
| 415 | Unsupported Media Type | サポートされないメディアタイプです | リクエストの Content-Type にサーバーが対応していません。 | unsupported media, 415, content-type 非対応 | [400, 406] |
| 416 | Range Not Satisfiable | 範囲が満たせません | Range ヘッダで指定した範囲が、リソースの範囲外です。 | range, 416, レンジ要求失敗 | [206, 400] |
| 426 | Upgrade Required | プロトコル切替が必要です | より新しいプロトコル (HTTP/2, TLS等) への切替が必要です。 | upgrade required, 426, プロトコル更新 | [505] |
| 428 | Precondition Required | 前提条件が必要です | 楽観的ロックなどの前提条件 (If-Match) を含めずにリクエストはできません。 | precondition required, 428, etag必須 | [412, 409] |
| 431 | Request Header Fields Too Large | ヘッダが大きすぎます | リクエストヘッダの合計サイズがサーバー上限を超えています。 | header too large, 431, クッキー大きすぎ | [413, 414] |

- [ ] **Step 1-6: 各 MDX を執筆**

教室メタファー例:
- 414: 「黒板に書く質問が長すぎて、黒板の幅をはみ出している」
- 415: 「英語の授業に音楽の楽器を持ってきた」（Content-Type 不一致）
- 416: 「教科書の200ページから300ページを開いてと言ったが、教科書は150ページしかない」
- 426: 「黒板からホワイトボードへの切替時期。新しい道具で書いてくれと言われている」
- 428: 「『誰も先に書き換えていないことを確認してから書いて』とルールが決まった教室」
- 431: 「答案の表紙に書いた個人情報が長すぎて、回収用の箱に入らない」

- [ ] **Step 7: コミット**

```bash
pnpm build
git add src/content/errors/414.mdx src/content/errors/415.mdx src/content/errors/416.mdx src/content/errors/426.mdx src/content/errors/428.mdx src/content/errors/431.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 414 415 416 426 428 431 (size/media group) / サイズ/メディア群追加"
```

---

## Task 47: 4xx 残り受容/タイミング/お遊び/法的 (406, 408, 418, 425, 451)

**Files:**
- Create: `src/content/errors/406.mdx`, `408.mdx`, `418.mdx`, `425.mdx`, `451.mdx`

| code | name | nameJa | summary | synonyms | related |
|---|---|---|---|---|---|
| 406 | Not Acceptable | 受け入れ可能な形式がありません | クライアントが Accept ヘッダで要求した形式をサーバーが提供できません。 | not acceptable, 406, accept ヘッダ不一致 | [415, 400] |
| 408 | Request Timeout | リクエストのタイムアウト | サーバーがクライアントからの完全なリクエストを待ちきれませんでした。 | request timeout, 408, リクエストが遅い | [504, 429] |
| 418 | I'm a teapot | 私はティーポットです | RFC 2324 のジョークステータス。コーヒーを淹れろと言われたティーポット。 | teapot, 418, ジョーク, april fool | [400] |
| 425 | Too Early | 早すぎます | リクエストがまだ処理されるべき段階にありません。 | too early, 425, リプレイ攻撃防止 | [408, 503] |
| 451 | Unavailable For Legal Reasons | 法的理由で利用不可 | 法律や規制によって、このリソースは提供できません。 | legal reasons, 451, 法的理由, 検閲 | [403, 410] |

- [ ] **Step 1-5: 各 MDX を執筆**

- 406: 「英訳しか持っていない先生に『日本語で説明して』と頼んでも応じられない」
- 408: 「テストの解答用紙を出すのが遅すぎて、回収が締め切られた」
- 418: 「ジョークのようなコード。本文も少し遊び心を持たせて、けれどテンプレートからは外れない」
- 425: 「まだ授業が始まってないのに先生に質問してしまった、もう少し待って」
- 451: 「法律で禁じられているため、その本は校内には置けません」（Ray Bradburyの『華氏451』にちなんだ番号）

- [ ] **Step 6: コミット**

```bash
pnpm build
git add src/content/errors/406.mdx src/content/errors/408.mdx src/content/errors/418.mdx src/content/errors/425.mdx src/content/errors/451.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 406 408 418 425 451 (misc 4xx) / その他4xx追加"
```

---

## Task 48: 5xx 残り (505, 506, 507, 508, 510, 511)

**Files:**
- Create: `src/content/errors/505.mdx`, `506.mdx`, `507.mdx`, `508.mdx`, `510.mdx`, `511.mdx`

| code | name | nameJa | summary | synonyms | related |
|---|---|---|---|---|---|
| 505 | HTTP Version Not Supported | HTTPバージョン非対応 | クライアントが使ったHTTPバージョンをサーバーがサポートしていません。 | http version, 505, バージョン非対応 | [426, 501] |
| 506 | Variant Also Negotiates | バリアントも選択肢に | サーバー内部のコンテンツネゴシエーション設定が循環しています。 | variant, 506, ネゴシエーション | [500] |
| 507 | Insufficient Storage | ストレージ不足 | リクエストを完了するのに必要なストレージがサーバーにありません。 | insufficient storage, 507, ディスク満杯 | [500, 503] |
| 508 | Loop Detected | ループを検出 | サーバーがリクエスト処理中に無限ループを検出しました。 | loop detected, 508, 無限ループ | [500] |
| 510 | Not Extended | 拡張が必要 | リクエストに必要な拡張機能のサポートがサーバー側にありません。 | not extended, 510 | [501] |
| 511 | Network Authentication Required | ネットワーク認証が必要 | ネットワーク（Wi-Fi等）の認証が必要です。多くはキャプティブポータル。 | network auth, 511, wifi認証, captive portal | [401, 407] |

すべて server。

- [ ] **Step 1-6: 各 MDX を執筆**

教室メタファー例:
- 505: 「先生がもう使わなくなった旧版の教科書を持ってきた生徒に対応できない」
- 506: 「先生Aは『先生Bに聞いて』、先生Bは『先生Aに聞いて』と循環している」
- 507: 「黒板にスペースがもう残っていなくて、新しいことを書けない」
- 508: 「『前のリンクを参照』が永遠に続く参照地獄」
- 510: 「特定の道具を持参するルールだったが、生徒も先生もそれを忘れた」
- 511: 「廊下で『校内Wi-Fiの利用申請を出してから教室に入ってください』と止められた」

- [ ] **Step 7: コミット**

```bash
pnpm build
git add src/content/errors/505.mdx src/content/errors/506.mdx src/content/errors/507.mdx src/content/errors/508.mdx src/content/errors/510.mdx src/content/errors/511.mdx docs/CONTENT_PROGRESS.md
git commit -m "content: add 505 506 507 508 510 511 (rest of 5xx) / 5xx 残り追加"
```

---

## Task 49: 全件 draft 解除と PROGRESS 完了マーク

**Files:**
- Modify: 全 40 件の `src/content/errors/*.mdx`（draft 確認）
- Modify: `docs/CONTENT_PROGRESS.md`

- [ ] **Step 1: 全件 draft: false 確認**

```bash
grep -l "draft: true" src/content/errors/*.mdx | grep -v _TEMPLATE
```

Expected: 出力なし（_TEMPLATE のみが draft: true で正常）。

もし出力があれば、該当ファイルの frontmatter を `draft: false` に修正。

- [ ] **Step 2: PROGRESS を完成形に更新**

`docs/CONTENT_PROGRESS.md`:
```markdown
# Slate Errors コンテンツ進捗

**完了: 40 / 40** ✓

## Phase 1: 旗艦 (4 / 4) ✓
- [x] 404 Not Found
- [x] 500 Internal Server Error
- [x] 403 Forbidden
- [x] 502 Bad Gateway

## Phase 2: 主要 (11 / 11) ✓
（11件すべて [x]）

## Phase 3: 残り (25 / 25) ✓
（25件すべて [x]）
```

- [ ] **Step 3: ビルド確認**

```bash
pnpm build
```

Expected: 0 errors。`dist/errors/` 以下に 40 件すべてが生成されている。

```bash
ls dist/errors/ | wc -l
```

Expected: `41` (40件 + index)

- [ ] **Step 4: コミット**

```bash
git add src/content/errors/ docs/CONTENT_PROGRESS.md
git commit -m "content: complete all 40 errors / 全40件のコンテンツ完成"
```

---

# Phase L: 最終 QA とリリース準備

## Task 50: search-index の整合性確認

**Files:** なし（検証のみ）

- [ ] **Step 1: build 後の search-index.json を確認**

```bash
pnpm build
cat dist/search-index.json | python3 -m json.tool | head -20
```

Expected: 40件の JSON 配列。各エントリに `code, name, nameJa, summary, synonyms, category, url` がある。

- [ ] **Step 2: 件数確認**

```bash
cat dist/search-index.json | python3 -c "import json,sys; print(len(json.load(sys.stdin)))"
```

Expected: `40`

- [ ] **Step 3: preview で実際の検索動作を確認**

```bash
pnpm preview
```

トップページで「権限」「タイムアウト」「ジョーク」「ティーポット」と打って、それぞれ正しい候補が出る。`Esc` で閉じる、`Enter` で遷移するのが動く。`Ctrl+C`。

---

## Task 51: prev/next と related の整合性確認

**Files:**
- Create: `scripts/validate-content.ts`（任意の補助）
- 検証のみで OK

- [ ] **Step 1: 補助スクリプト作成**

`scripts/validate-content.ts`:
```ts
// pnpm exec tsx scripts/validate-content.ts で実行
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dir = 'src/content/errors';
const files = (await readdir(dir)).filter(f => f.endsWith('.mdx') && !f.startsWith('_'));

const codes = new Set<number>();
const relatedRefs: Array<{ from: number; to: number }> = [];
const popularCount: number[] = [];

for (const f of files) {
  const content = await readFile(join(dir, f), 'utf8');
  const codeM = content.match(/^code:\s*(\d+)/m);
  if (!codeM) { console.error(`No code in ${f}`); continue; }
  const code = Number(codeM[1]);

  if (codes.has(code)) console.error(`Duplicate code: ${code} in ${f}`);
  codes.add(code);

  const popularM = content.match(/^popular:\s*true/m);
  if (popularM) popularCount.push(code);

  const relatedM = content.match(/^related:\s*\[([^\]]*)\]/m);
  if (relatedM) {
    const nums = relatedM[1].split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    nums.forEach(n => relatedRefs.push({ from: code, to: n }));
  }
}

console.log(`Total errors: ${codes.size}`);
console.log(`Popular: ${popularCount.sort().join(', ')} (${popularCount.length} entries)`);

const orphans = relatedRefs.filter(r => !codes.has(r.to));
if (orphans.length > 0) {
  console.error(`Orphan related references:`);
  orphans.forEach(o => console.error(`  ${o.from} → ${o.to} (not found)`));
} else {
  console.log('All related references valid ✓');
}
```

- [ ] **Step 2: tsx 追加と実行**

```bash
pnpm add -D tsx
pnpm exec tsx scripts/validate-content.ts
```

Expected:
```
Total errors: 40
Popular: 403, 404, 500, 502 (4 entries)
All related references valid ✓
```

存在しない related 参照があれば修正してから再実行。

- [ ] **Step 3: コミット**

```bash
git add scripts/validate-content.ts package.json pnpm-lock.yaml
git commit -m "feat: add content validation script / コンテンツ検証スクリプト追加"
```

---

## Task 52: アクセシビリティ確認

**Files:** なし

- [ ] **Step 1: preview を起動**

```bash
pnpm build && pnpm preview
```

- [ ] **Step 2: Chrome DevTools で Lighthouse 実行**

`/slate-errors/`、`/slate-errors/errors/`、`/slate-errors/errors/404/` の3ページで Accessibility のスコアを測定。

Expected: いずれも 90 以上。

- [ ] **Step 3: 主要な指摘を修正**

特に：
- コントラスト不足（特に `chalk-dust` を使った補助テキスト）
- フォームの `<label>` 不在（検索 input に aria-label を追加）
- focus visible の見え方

修正例:
```astro
<input
  type="search"
  class="input-chalk"
  aria-label="エラーコードまたはキーワードで検索"
  ...
/>
```

- [ ] **Step 4: 修正後のスコアを再確認、コミット**

```bash
git add .
git commit -m "fix: improve accessibility - add aria-labels, contrast / アクセシビリティ改善"
```

---

## Task 53: README 完全版

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README 全置換**

`README.md`:
```markdown
# Slate Errors

放課後の黒板で、HTTPエラーを学び直す。

> エラーは間違いではない、発見である。

## サイトの考え方

「エラーを見て怖くなる」状態から、「エラーから学ぶ」状態へ移行する手助けをするサイトです。
RFC標準の HTTP エラーコード 4xx / 5xx 全 40件を、教室の黒板に書かれた振り返りメモのような語り口で解説しています。

各エラーページには：

- 「何が起きたのか？」 — 技術的な説明をやさしい言葉で
- 「黒板からのひとこと」 — 教室メタファーで本質を理解
- 「解決への歩み」 — 具体的な解決手順 + 管理者視点
- HTTP レスポンス例、関連エラー、よくある原因、RFC/MDN 参照

## ローカル開発

\`\`\`bash
pnpm install
pnpm dev      # http://localhost:4321/slate-errors/
pnpm build    # ビルド (astro check 込み)
pnpm preview  # 本番想定の URL でプレビュー
pnpm test     # Vitest 実行
\`\`\`

## コンテンツを追加する

1. \`src/content/errors/_TEMPLATE.mdx\` を複製して \`{コード}.mdx\` にリネーム
2. frontmatter を埋める（Zod スキーマで検証されます）
3. 本文を 3 セクション構成で執筆
4. \`docs/CONTENT_GUIDE.md\` のチェックリストを上から確認
5. \`pnpm build\` でバリデーションを通す
6. コミット

## デプロイ

main ブランチへの push で GitHub Actions が自動デプロイします（GitHub Pages）。

初回セットアップ：
1. リポジトリ Settings → Pages → Source = **GitHub Actions**
2. リポジトリ名は `slate-errors` を推奨（basePath と一致）

## 詳細ドキュメント

- 設計: \`docs/superpowers/specs/2026-05-13-slate-errors-design.md\`
- 実装計画: \`docs/superpowers/plans/2026-05-13-slate-errors.md\`
- コンテンツ執筆ガイド: \`docs/CONTENT_GUIDE.md\`
- コンテンツ進捗: \`docs/CONTENT_PROGRESS.md\`

## 技術スタック

- Astro 5 (Content Collections + MDX)
- Tailwind CSS v4 (CSS-first \`@theme\`)
- Fuse.js (クライアントファジー検索)
- Vitest (ユニットテスト)
- GitHub Actions (自動デプロイ)
- Fonts: Finger Paint, Kiwi Maru
```

- [ ] **Step 2: コミット**

```bash
git add README.md
git commit -m "docs: complete README with content guide and deployment / README 完全版"
```

---

## Task 54: 最終ビルド + リリース準備

**Files:** なし

- [ ] **Step 1: クリーンビルド**

```bash
rm -rf dist .astro
pnpm install --frozen-lockfile
pnpm build
```

Expected: 0 errors, 0 warnings。

- [ ] **Step 2: 全テスト実行**

```bash
pnpm test
```

Expected: All PASS。

- [ ] **Step 3: validate-content.ts 実行**

```bash
pnpm exec tsx scripts/validate-content.ts
```

Expected:
```
Total errors: 40
Popular: 403, 404, 500, 502 (4 entries)
All related references valid ✓
```

- [ ] **Step 4: preview で全件回遊**

```bash
pnpm preview
```

以下を手動チェック：

- トップ → 検索で「404」と入れて遷移できる
- トップ → 「全件を見る」→ 4xx と 5xx グループが表示される
- 404 詳細ページ → Hero / CommonCauses / 本文 / Related / References / PrevNext すべて表示
- 詳細ページの ← / → ナビで全40件を一周できる
- 存在しない URL を叩くと自己言及型 404 ページが出る
- font (Finger Paint, Kiwi Maru) がデフォルトに落ちていない（DevTools の Computed font で確認）
- 本文の `<a>`, `<button>`, `<input>` がブラウザデフォルトに見えない

問題があれば修正してから次へ。

- [ ] **Step 5: GitHub に push して Actions 確認**

```bash
git remote add origin git@github.com:<USERNAME>/slate-errors.git
git push -u origin main
```

GitHub の Actions タブでデプロイが成功することを確認。`username.github.io/slate-errors/` で公開された画面を確認。

- [ ] **Step 6: 完了タグ**

```bash
git tag -a v0.1.0 -m "Initial release: all 40 errors / 初回リリース"
git push origin v0.1.0
```

🎉 **完了**

---

## 自己レビュー結果

このプランは設計ドキュメントを以下のようにカバーしています：

| 設計セクション | カバータスク |
|---|---|
| §1 ビジョン (教室メタファー) | 重要原則 + Phase I-K の本文執筆指針 |
| §2 確定事項 (UI一貫性原則) | Task 6 (デフォルト無効化), Task 7 (チョーク UI) |
| §3 アーキテクチャ | Task 4 (astro.config), Task 8 (Collection), Task 26 (search-index) |
| §4 ディレクトリ/ルーティング | Task 1-32 全体 |
| §5 Content Collections スキーマ | Task 8 |
| §6 スタイリング | Task 6, 7 |
| §7 コンポーネント設計 | Task 13-25, 27-28 |
| §8 デプロイ | Task 4, 33, 54 |
| §9 コンテンツ執筆ワークフロー | Task 11 (ガイド), 35-49 (実執筆) |
| §10 スコープ外 | プラン全体で1xx-3xx を含めない |
| §11 リスク対策 | 重要原則, Task 51 (validate), Task 52 (a11y) |
| §12 完了の定義 | Task 54 (リリース手順) |

**プレースホルダ確認**: 各タスクに具体的な code/コマンド/ファイル内容を含めた。Phase 3 の content タスクは frontmatter テーブル + 本文の執筆指針（教室メタファー例）まで提供しているが、具体的な散文は実装時の判断に委ねる（テンプレート + ガイド + 旗艦4件のサンプルが品質基準）。

**型整合性**: `ErrorEntry`, `SearchIndexEntry`, `commonCause`, `referenceLink` 等の名前は Task 8 / 9 / 12 で定義し、後続タスクで一貫使用。`getAllErrors`, `getPrevNext`, `groupByCategory` 等の関数名も Task 10 で定義し、それ以降ぶれずに参照。

---

## 実行方法の選択

**プラン完成、`docs/superpowers/plans/2026-05-13-slate-errors.md` に保存しました。実行アプローチを2つから選んでください：**

**1. Subagent-Driven（推奨）** — タスクごとに新しいサブエージェントを派遣、レビューを挟む、高速反復。コンテンツ40件のような繰り返し作業に向く。

**2. Inline Execution** — このセッション内で `executing-plans` スキルを使って順次実行、チェックポイントごとに確認。

どちらで進めますか？
