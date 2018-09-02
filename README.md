# Google Apps Script を複数のドキュメントに一斉に仕込むためのスクリプト

## 前提

下記のようなフォルダ構造になっていることを前提としています。当てはまらない場合は`Code.gs`の`collectTargetDocuments()`を適当に書き換えてください。

- 親フォルダ
  - 子フォルダ 1
    - スクリプトを仕込みたいドキュメント
    - 古いドキュメント
    - それ以外のドキュメント
  - 子フォルダ 2
    - スクリプトを仕込みたいドキュメント
    - ...
  - 管理対象外フォルダ

## 使い方

1. `Code.gs`、`appsscript.json`をこのフォルダ内にあるものと置き換える
   - スクリプトエディタでは「表示＞マニフェストファイルを表示」が有効になっていないと表示されないので注意
1. ファイル名の頭に`dist/`を付けて仕込みたいスクリプトを書く
1. `dist/appsscript.json`は HTML ファイル`dist/appsscript.json.html`として作成する必要がある。Apps Script の仕様
1. `Code.gs`に所要の設定を書き込む
1. メニューの「リソース＞ Google の拡張サービス」から Google API コンソールを開く
1. 「Google Drive API」と「Apps Script API」を有効にする
1. `Code.gs`の`deploy()`を蹴る

### clasp を使う場合

1. `dist/`以下に仕込みたいスクリプトを入れる
   - Apps Script と clasp の仕様で`*.gs`、`*.html`とルート直下の`appsscript.json`しかアップロードできない
   - `*.js`も一応アップロードは可能だが、`*.gs`へとアップロード時にリネームされる
   - `*.js`も Apps Script として正しいものでないとバリデーションエラーになり、アップロードに失敗する
   - 他のファイルは`*.html`にリネームする必要がある
   - `dist/appsscript.json`は`dist/appsscript.json.html`にリネームする必要がある。そのままだとアップロードできないので
     - このファイルは必須
1. `.env.example`を`.env`にコピーする
1. `.env`を編集する
1. `yarn deploy:push` (あるいは`npm run deploy:push`) を叩く
1. ブラウザにスクリプトエディタが表示されるので、所要の設定を書き込む
1. メニューの「リソース＞ Google の拡張サービス」から Google API コンソールを開く
1. 「Google Drive API」と「Apps Script API」を有効にする
1. `Code.gs`の`deploy()`を蹴る

## その他注意事項

- `.gitignore`で`.clasp.json`をバージョン管理対象から外しています
- [Error 400: invalid_scope · Issue #303 · google/clasp](https://github.com/google/clasp/issues/303#issuecomment-417403202)
  - 2018-09-02 現在、clasp のソースを少しいじらないとログインに失敗する模様
  - `sed -i 's!^.*https://www.googleapis.com/auth/logging.read!// \0!' node_modules/@google/clasp/src/auth.js`

## ライセンス

パブリックドメイン、CC0 と Unlicense のトリプルライセンスとします。

- Unlicense http://unlicense.org
- CC0 https://creativecommons.org/publicdomain/zero/1.0/deed.ja
