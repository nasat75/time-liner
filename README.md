# time-liner

![compile](https://github.com/75asa/time-liner/workflows/compile/badge.svg)
![Release Drafter](https://github.com/75asa/time-liner/workflows/Release%20Drafter/badge.svg)

## 概要

- 指定の slack チャンネルを別のチャンネルに転送してくれる SlackApp

## 導入

- git clone
- [slack api](https://api.slack.com/apps) から slackApp を作る
- 以下のスコープを OAuth & Permissions より選択
  - bot
    - channels:history
    - channels:read
    - chat:write
    - files:read
    - im:history
    - incoming-webhook
    - users.profile:read
    - users:read
    - users:read:email
    - eam:read
  - user
    - chat:write
    - links:read
    - links:write
    - files:write
- `$cp .env.example .env`
  - .env 項目
    - `SLACK_WORKSPACE`に slack のワークスペース名
    - `CHANNEL_NAME`に転送先の slack チャンネル名
    - `PORT`にリスニングしたい番号（入れなければデフォルトでは _3000_）
    - Basic information
      - `Signing Secret`を`SLACK_SIGNING_SECRET`
    - OAuth & Permission
      - `OAuth Access Token`を`SLACK_OAUTH_TOKEN`
      - `Bot User OAuth Access Token`を`SLACK_SIGNING_SECRET`
- ローカルで以下を実施
  - `$ yarn` | `$ npm i`
  - `ngrok`を Homebrew でインストール（入ってない方のみ）
  - `$ ngrok http ${n}` でポート番号指定して ngrok を立ち上げる
  - CLI に出てきた URL を slackApp の InteractiveComponents に貼り付け
- slackApp で以下を設定
  - Interactive Components
    - RequestURL に ngrok の URL を貼り付け
  - Event Subscriptions
    - RequestURL に `${ngrokのURL}/slack/events` を貼り付け
    - Subscribe to bot events に 以下を選択し追加
      - message.channels
      - message.im
- `ngrok`はセッションが切れたら都度再起動し slackApp の RequestURL を新規 URL で更新

## デバッグ

任意の位置にブレークポイントを設定後、デバッガから`Attach to Bolt`を実行。
`$npm run dev:watch`で本アプリをデバッグ実行。

### 参考

[VSCode で Bolt for TypeScript をホットリロード+デバッグ実行させてみよう](https://qiita.com/tk_zawa/items/6a4144e1dd3c3618b139)

## ビルド

- heroku の pipeline を使用

## 注意
