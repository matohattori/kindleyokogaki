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
