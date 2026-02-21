# Kindle Web Horizontal Reader (Chrome Extension)

Kindle Web Reader (`read.amazon.co.jp`, `read.amazon.com`) の本文を横書きに強制する Chrome 拡張です。

## 使い方

1. このフォルダをダウンロードします。
2. Chrome で `chrome://extensions` を開きます。
3. 右上の「デベロッパーモード」を ON にします。
4. 「パッケージ化されていない拡張機能を読み込む」でこのフォルダを選択します。
5. Kindle Web Reader を開き、拡張アイコンから「横書きを有効にする」を ON/OFF します。

## 補足

- 初期状態は ON です。
- 設定は `chrome.storage.sync` に保存されます。
- Kindle 側の DOM 変更により、将来セレクタの調整が必要になる場合があります。


## 不具合時に確認したい情報

「横書きにならない」場合、次の情報があると原因特定が早くなります。

- 開いている Kindle Web Reader のURL（`read.amazon.co.jp` / `read.amazon.com` 以外かどうか）
- DevTools Console でのエラー
- DevTools Elements で本文要素に `writing-mode: vertical-rl` が残っているか
- 拡張ポップアップのトグル状態（ON/OFF）
- Kindle ページ遷移直後だけ効かないか、常時効かないか

必要なら以下の snippet を Console で実行して、現在ページに拡張スタイルが注入されているか確認できます。

```js
Boolean(document.getElementById("kindle-horizontal-style"));
```
