# Audio Recorder Pro

Electronを使用したオーディオ録音アプリケーション。CoreAudioを直接使用してシステムオーディオデバイスを制御し、フォールバックとしてswitchaudio-osxをサポートします。

## 技術スタック

- Electron
- React
- TypeScript
- Vite
- CoreAudio (ネイティブモジュール)
- Node.js

## システム要件

- macOS 10.15以上
- Node.js 18.0.0以上
- Python 3.9 (ビルド用)

## 依存関係

### 必須
- Python 3.9
```bash
brew install python@3.9
```

### 開発環境
- node-gyp (ネイティブモジュールビルド用)
- setuptools (Python依存)
```bash
pip3.9 install setuptools
```

## インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd rec-agent

# 依存関係のインストール
npm install

# ネイティブモジュールのビルド
cd native && npm install && npm run build
cd ..
```

## 開発

```bash
# 開発モードで実行
npm run start

# ビルド
npm run electron:build
```

## アーキテクチャ

### オーディオデバイス制御

アプリケーションは2つのオーディオデバイス制御方式をサポートしています：

1. CoreAudio (プライマリ)
   - macOSのCoreAudioフレームワークを直接使用
   - より安定したパフォーマンス
   - システム権限が必要

2. switchaudio-osx (フォールバック)
   - CoreAudioが使用できない場合のバックアップ
   - 外部依存として含まれる
   - より簡単な実装

### ディレクトリ構造

```
rec-agent/
├── native/           # ネイティブモジュール (CoreAudio実装)
├── electron/         # Electronメインプロセス
├── src/             # Reactアプリケーション
└── bin/             # switchaudio-osxバイナリ
```

## ビルド設定

### 開発環境

```bash
# 必要なPython環境の設定
export PYTHON=/opt/homebrew/opt/python@3.9/bin/python3.9

# ネイティブモジュールのビルド
cd native && npm install && npm run build
cd ..

# アプリケーションの起動
npm run start
```

### プロダクションビルド

```bash
# アプリケーションのビルド
npm run electron:build
```

ビルドされたアプリケーションは`release`ディレクトリに生成されます。

## 権限要求

アプリケーションは以下の権限を要求します：

- オーディオデバイスへのアクセス
- システムイベントの制御

これらの権限は`build/entitlements.mac.plist`で定義されています。

## トラブルシューティング

### ネイティブモジュールのビルドエラー

Python 3.9が必要です：
```bash
brew install python@3.9
pip3.9 install setuptools
export PYTHON=/opt/homebrew/opt/python@3.9/bin/python3.9
```

### オーディオデバイスへのアクセスエラー

システム環境設定でアプリケーションに必要な権限が付与されていることを確認してください。