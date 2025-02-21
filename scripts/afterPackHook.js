const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

exports.default = async function(context) {
  const platform = context.packager.platform.name;
  
  if (platform === 'mac') {
    const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
    console.log('Checking app bundle:', appPath);

    try {
      // アプリバンドルの整合性チェック
      execSync(`codesign --verify --deep --strict --verbose=2 "${appPath}"`, {
        stdio: 'inherit'
      });
      console.log('Code signing verification passed');

      // ファイル権限と拡張属性の設定
      execSync(`chmod -R a+r "${appPath}"`, {
        stdio: 'inherit'
      });
      execSync(`xattr -cr "${appPath}"`, {
        stdio: 'inherit'
      });
      execSync(`xattr -d com.apple.quarantine "${appPath}" || true`, {
        stdio: 'inherit'
      });
      console.log('File permissions and attributes updated');

      // Info.plistの確認と更新
      const infoPlistPath = path.join(appPath, 'Contents/Info.plist');
      if (fs.existsSync(infoPlistPath)) {
        // Info.plistの検証
        execSync(`plutil -lint "${infoPlistPath}"`, {
          stdio: 'inherit'
        });
        console.log('Info.plist validation passed');

        // LSFileQuarantineEnabledをfalseに設定
        execSync(`defaults write "${infoPlistPath}" LSFileQuarantineEnabled -bool false`, {
          stdio: 'inherit'
        });
        console.log('Updated quarantine settings in Info.plist');
      }

      // バンドルの構造チェック
      const contentsPath = path.join(appPath, 'Contents');
      const macOSPath = path.join(contentsPath, 'MacOS');
      const resourcesPath = path.join(contentsPath, 'Resources');

      if (!fs.existsSync(contentsPath) || !fs.existsSync(macOSPath) || !fs.existsSync(resourcesPath)) {
        throw new Error('Invalid app bundle structure');
      }

      console.log('App bundle structure validation passed');
    } catch (error) {
      console.error('Error during app bundle verification:', error);
      throw error;
    }
  }
};