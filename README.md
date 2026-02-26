# Shadow9 - English Shadowing Practice App

Shadow9は、Engoo Daily Newsの記事を使った英語シャドーイング練習アプリです。高品質な音声読み上げとAI発音レビュー機能により、効果的な英語学習をサポートします。

## 主な機能

### 📰 記事閲覧
- Engoo Daily Newsの記事をカテゴリ別に閲覧
- 難易度レベル（4-9）で記事を選択
- カテゴリフィルター（Business & Politics、Science & Technology、Health & Lifestyle、Culture & Society、Travel & Experiences）

### 🎧 音声再生
- OpenAI TTS APIによる高品質な音声生成
- 再生速度調整（0.5x、0.75x、1.0x、1.25x、1.5x）
- 10秒戻る/進む機能
- プログレスバーで再生位置を確認

### 🎤 録音機能
- expo-audioを使った高品質な録音
- ワンタップで録音開始/停止
- 録音後、自動的にAIレビューへ

### 🤖 AI発音レビュー
- OpenAI Whisper APIによる音声認識
- GPT APIによる詳細なフィードバック生成
- 以下の項目を評価：
  - 発音（Pronunciation）
  - イントネーション（Intonation）
  - リズム（Rhythm）
  - 流暢さ（Fluency）
- 0-100のスコア表示
- 具体的な改善提案

### 📊 学習進捗管理
- 学習ストリーク（連続学習日数）
- 週間学習時間
- 平均スコア
- 練習履歴の閲覧

### 🎨 スクリプト表示
- 英文のみ表示
- 英文+日本語訳表示
- 非表示（リスニングに集中）
- ワンタップで切り替え可能

## 技術スタック

### フロントエンド
- **React Native 0.81** with Expo SDK 54
- **TypeScript 5.9**
- **Expo Router 6** - ファイルベースルーティング
- **NativeWind 4** - Tailwind CSS for React Native
- **expo-audio** - 音声再生・録音
- **tRPC** - 型安全なAPI通信

### バックエンド
- **Node.js** with Express
- **tRPC** - API層
- **OpenAI TTS API** - 音声生成
- **OpenAI Whisper API** - 音声認識
- **OpenAI GPT API** - フィードバック生成
- **S3** - 音声ファイルストレージ

### データストレージ
- **AsyncStorage** - ローカルデータ保存
- 記事データ、練習履歴、学習統計、ユーザー設定

## プロジェクト構造

```
shadowing-app/
├── app/                      # Expo Router画面
│   ├── (tabs)/              # タブナビゲーション
│   │   ├── index.tsx        # ホーム画面（記事一覧）
│   │   └── history.tsx      # 学習履歴画面
│   ├── article/[id].tsx     # 記事詳細画面
│   ├── practice/[id].tsx    # 練習画面
│   └── review/[id].tsx      # レビュー画面
├── components/              # 再利用可能なコンポーネント
│   └── screen-container.tsx # SafeAreaラッパー
├── hooks/                   # カスタムフック
│   └── use-audio-practice.ts # 音声再生・録音フック
├── lib/                     # ユーティリティ
│   ├── storage.ts           # AsyncStorageヘルパー
│   ├── trpc.ts              # tRPCクライアント
│   └── utils.ts             # 汎用ユーティリティ
├── types/                   # TypeScript型定義
│   └── index.ts             # 共通型定義
├── data/                    # サンプルデータ
│   └── sample-articles.ts   # サンプル記事
├── server/                  # バックエンドAPI
│   ├── routers.ts           # tRPCルーター
│   └── storage.ts           # S3ストレージヘルパー
└── assets/                  # 静的アセット
    └── images/              # アプリアイコン、スプラッシュ

## 開発の開始

### 前提条件
- Node.js 22.x
- pnpm 9.x
- Expo Go アプリ（iOS/Android）

### インストール

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

### Expo Goでの実行

1. スマートフォンにExpo Goアプリをインストール
2. 開発サーバー起動後に表示されるQRコードをスキャン
3. アプリが自動的に起動

### Web版の実行

```bash
pnpm dev:metro
```

ブラウザで `http://localhost:8081` にアクセス

## 使い方

### 1. 記事を選択
ホーム画面から興味のある記事を選択します。カテゴリフィルターで絞り込むことも可能です。

### 2. 記事を確認
記事詳細画面で内容を確認し、「Start Practice」ボタンをタップします。

### 3. シャドーイング練習
- 「▶」ボタンで音声を再生
- 再生速度を調整（初心者は0.5xから始めるのがおすすめ）
- スクリプト表示モードを切り替え
- 音声に合わせてシャドーイング

### 4. 録音
- 「⏺ Start Recording」ボタンをタップ
- シャドーイングしながら自分の声を録音
- 「⏹ Stop & Review」ボタンで録音を停止

### 5. AIレビューを確認
- 自動的にレビュー画面に遷移
- スコアとフィードバックを確認
- 改善提案を参考に次回の練習に活かす

### 6. 学習履歴を確認
- 「History」タブで学習進捗を確認
- ストリーク（連続学習日数）を維持
- 平均スコアの向上を目指す

## 今後の改善予定

- [ ] Engoo Daily Newsスクレイパーの実装（自動記事取得）
- [ ] 難易度フィルター機能
- [ ] 文章ごとのリピート再生機能
- [ ] 現在再生中の文のハイライト表示
- [ ] 録音音声の再生機能
- [ ] スコア推移グラフ
- [ ] ダークモード対応の改善
- [ ] プッシュ通知（学習リマインダー）

## ライセンス

MIT License

## クレジット

- **Engoo Daily News** - 記事コンテンツ
- **OpenAI** - TTS、Whisper、GPT API
- **Expo** - モバイルアプリフレームワーク
