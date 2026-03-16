# drop-player — ライブラリ利用者視点のレビュー

このドキュメントは、**drop-player を npm パッケージとして利用する側**の観点でレビューした結果です。

---

## 良い点

### 1. 明確な公開APIとドキュメント
- README に「Public API (for library consumers)」が明示され、`Player`・`defaultFeatures`・型・ユーティリティ・フォーマッターが整理されている。
- `sources` の型（string / MediaSource / MediaSource[] / null）と、features のフラグ一覧が分かりやすい。
- エラー名（`errorNoSources` など）と Ref API が一覧で説明されている。

### 2. 適切な package.json 設定
- `exports` でエントリと `styles.css` サブパスが定義され、`types` も export されている。
- `"type": "module"` で ESM のみ提供されており、現代的なバンドラーと相性が良い。
- `files: ["dist"]` で配布物が限定されている。
- `sideEffects` で CSS のみ side-effect ありと明示され、tree-shaking されやすい。
- peerDependencies で `react` / `react-dom` / `lucide-react` / `hls.js` / `waveform-data` が適切に分離されている。

### 3. TypeScript と型の提供
- `src/index.ts` でコンポーネント・型・ユーティリティが一括 export され、`vite-plugin-dts` で `dist/index.d.ts` が生成される。
- 利用側で `PlayerProps`・`PlayerRef`・`MediaSource` などをそのまま利用できる。

### 4. スタイルの扱い
- デフォルトスタイルを `import 'drop-player/styles.css'` で読み込む方式で、アプリのスタイルと分離しやすい。
- CSS 変数（`--drop-player-primary` など）でテーマを上書きできることが README に書かれている。

### 5. 機能フラグ
- `features` で UI 要素を細かくオン/オフでき、`defaultFeatures` をベースにした上書きが README で説明されている。

---

## 改善を推奨する点

### 1. 公開前にビルドが必須なのにスクリプトがない（重要）
- `files` に `dist` のみが含まれており、**パッケージにはビルド済みの `dist` が必須**です。
- しかし `prepare` や `prepublishOnly` がなく、`npm publish` 前に手動で `npm run build` を忘れると、利用者が `dist` のないパッケージをインストールして壊れます。

**推奨:** `package.json` に以下を追加する。

```json
"scripts": {
  "prepare": "npm run build",
  ...
}
```

または、CI で必ず `npm run build` してから publish する運用を明示する。  
（`prepare` は `npm install` （ルートで）でも走るため、リポジトリ clone 直後の開発体験も良くなります。）

### 2. 公開 API と export の範囲のずれ
- README の「Public API」では、内部・上級者向けとして「*Core / *CoreProps / *CoreRef は変更の可能性あり」と書かれている。
- 一方で `src/index.ts` では **AudioCore / ImageCore / PdfCore / VideoCore** および **AudioCoreProps, AudioCoreRef, VideoState, SourceEntry, NormalizedSources** など多くの「内部寄り」の型がそのまま export されている。
- 利用者が README だけを信じて `VideoCoreRef` などに依存すると、将来の破壊的変更の影響を受けやすい。

**推奨:**
- 利用者向けには **Player + defaultFeatures + 明示した型・ユーティリティのみ** を「安定 API」として README に揃え、それ以外は「上級者・内部用で変更の可能性あり」と明記する。
- あるいは、エントリを分けて `drop-player` = 安定 API のみ、`drop-player/core` = *Core 等の拡張 API にする方法もある（破壊的変更の影響範囲を分けやすい）。

### 3. ロケール・翻訳の拡張ができない
- `PlayerProps` の `locale` は `'en' | 'ja'` のみ。
- 翻訳のマージや追加ロケール用の API（例: `translations` や `locale` + カスタムキー）が公開されていないため、**利用者側で文言を差し替えたり新ロケールを追加したりする正式な方法がない**。

**推奨:**  
「現状は en/ja のみ」と README に明記する。  
将来的にカスタム文言や新ロケールが必要なら、`translations` や `getTranslations` に相当する props/API を検討すると利用者に優しい。

### 4. peerDependencies の「必要なときだけ入れたい」が伝わりにくい
- `hls.js` は HLS 再生時、`waveform-data` は音声波形表示時に必要。
- 両方とも peer になっており、**HLS も音声も使わない** 利用者でも peer 未インストールだと警告が出る可能性がある。

**推奨:**  
README の「Peer dependencies」で、「HLS を使う場合のみ hls.js を」、「音声波形を使う場合のみ waveform-data を」入れる旨を一文追加すると、意図が伝わりやすい。

### 5. ビルド時の minify: false
- `vite.config.ts` で `minify: false` のため、`dist/index.js` が minify されていない（約 155KB）。  
- 利用者側のバンドルではバンドラーが minify するため、多くの場合は問題になりにくいが、**CDN や `<script type="module">` でそのまま読み込む場合は未圧縮のまま**になる。

**推奨:**  
配布物として minify する場合は `minify: true`（または 'terser'/'esbuild'）にし、README に「本番ではアプリのバンドルに含めて minify する利用を推奨」などと書いておくとよい。

---

## 軽微な点・確認事項

### 1. CSS の実際のファイル名
- ビルド結果は `dist/index.css` で、`package.json` の `"./styles.css": "./dist/index.css"` により、`import 'drop-player/styles.css'` は正しく `dist/index.css` に解決される。  
→ 現状の設定で問題なし。

### 2. 開発時条件の export
- `exports` に `"development"` 条件があり、`tsconfig.json` に `"customConditions": ["development"]` がある。  
→ ライブラリ開発時用であり、利用者側の通常の `import` には影響しない。

### 3. sourcemap
- `sourcemap: true` で `index.js.map` が出力されている。  
→ 利用者側のデバッグに役立つ。`files` に `dist` だけ指定しているので、map も一緒に含まれる。

---

## まとめ（利用者視点）

- **インストール・基本的な使い方**（`Player` + `sources` + `import 'drop-player/styles.css'`）は README と export が揃っており、利用しやすい。
- **型** と **Ref API** がきちんと公開されており、TypeScript 利用者にも配慮されている。
- 改善すると良いのは、(1) **publish 前に必ずビルドされる仕組み（prepare 等）**、(2) **公開 API と export の範囲の一致・説明**、(3) **ロケール拡張の有無の明記**、(4) **peer のオプション性の説明** の4点。
- これらを反映すると、「ライブラリの使用者側」が安心して drop-player を採用し、長くメンテしやすくなります。
