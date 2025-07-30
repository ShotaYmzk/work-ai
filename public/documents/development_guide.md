# 開発ガイド - WorkAI Platform

## 開発環境セットアップ

### 必要な環境
- Node.js 18以上
- npm または pnpm
- Git

### インストール手順

1. リポジトリをクローン
```bash
git clone https://github.com/company/work-ai.git
cd work-ai
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.example .env.local
```

4. 開発サーバーを起動
```bash
npm run dev
```

## プロジェクト構成

```
work-ai/
├── app/              # Next.js App Router
├── components/       # React コンポーネント
├── lib/             # ユーティリティ関数
├── hooks/           # カスタムフック
└── public/          # 静的ファイル
```

## コーディング規約

### TypeScript
- 厳密な型定義を推奨
- any型の使用は避ける
- インターフェースを活用

### React
- 関数コンポーネントを使用
- カスタムフックで状態管理
- プロップスの型定義を必須とする

### スタイリング
- Tailwind CSSを使用
- 一貫したデザインシステム
- レスポンシブデザイン対応

## テスト戦略

### 単体テスト
- Jest + React Testing Library
- コンポーネントのテスト
- ユーティリティ関数のテスト

### 統合テスト
- API エンドポイントのテスト
- E2E テスト (Playwright)

## デプロイメント

### 本番環境
- Vercel を使用
- 自動デプロイメント
- 環境変数の管理

### ステージング環境
- 開発ブランチから自動デプロイ
- テスト用データベース使用

## トラブルシューティング

### よくある問題

1. **APIキーエラー**
   - .env.local ファイルの確認
   - Gemini API キーの有効性を確認

2. **ビルドエラー**
   - node_modules の再インストール
   - Next.js キャッシュのクリア

3. **パフォーマンス問題**
   - バンドルサイズの最適化
   - 画像の最適化
   - コード分割の実装 