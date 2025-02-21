const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

exports.default = async function(context) {
  // macOSビルドの場合のみ処理を実行
  if (context.electronPlatformName !== 'darwin') {
    return;
  }

  const outDir = context.outDir;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(outDir, `${appName}.app`);

  // .appディレクトリが存在することを確認
  if (!fs.existsSync(appPath)) {
    console.error('App directory not found:', appPath);
    return;
  }

  // zipファイルのパスを設定
  const zipPath = path.join(outDir, `${appName}.zip`);

  // 既存のzipファイルがあれば削除
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  try {
    // アプリケーションの拡張属性を処理
    console.log('Cleaning extended attributes from app bundle...');
    execSync(`xattr -cr "${appPath}"`, {
      stdio: 'inherit'
    });

    // quarantine属性の削除を試行
    console.log('Removing quarantine attribute...');
    execSync(`xattr -d com.apple.quarantine "${appPath}" || true`, {
      stdio: 'inherit'
    });

    // Info.plistの更新
    const infoPlistPath = path.join(appPath, 'Contents/Info.plist');
    if (fs.existsSync(infoPlistPath)) {
      console.log('Updating Info.plist...');
      execSync(`defaults write "${infoPlistPath}" LSFileQuarantineEnabled -bool false`, {
        stdio: 'inherit'
      });
    }

    // noqtnフラグを使用してzip作成（quarantine属性を含めない）
    console.log('Creating zip file without quarantine attributes...');
    execSync(`ditto -c -k --noqtn --keepParent "${appPath}" "${zipPath}"`, {
      stdio: 'inherit'
    });

    // 作成したzipファイルの拡張属性もクリーン
    console.log('Cleaning zip file attributes...');
    execSync(`xattr -cr "${zipPath}"`, {
      stdio: 'inherit'
    });

    console.log('Successfully created and cleaned zip file:', zipPath);
  } catch (error) {
    console.error('Error during zip creation:', error);
    throw error;
  }
};