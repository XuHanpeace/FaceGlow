const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// Configuration
const packageJsonPath = path.resolve(__dirname, '../package.json');
const versionConfigPath = path.resolve(__dirname, '../src/config/version.ts');
const pbxprojPath = path.resolve(__dirname, '../ios/MyCrossPlatformApp.xcodeproj/project.pbxproj');

// Helper: Read current versions
function getCurrentVersions() {
  const packageJson = require(packageJsonPath);
  const versionConfigContent = fs.readFileSync(versionConfigPath, 'utf8');
  
  const appVersionMatch = versionConfigContent.match(/export const appVersion = '(.+)';/);
  const jsVersionMatch = versionConfigContent.match(/export const jsVersion = '(.+)';/);
  
  return {
    packageVersion: packageJson.version,
    appVersion: appVersionMatch ? appVersionMatch[1] : packageJson.version,
    jsVersion: jsVersionMatch ? jsVersionMatch[1] : packageJson.version
  };
}

// Helper: Increment version (e.g., 1.3.6 -> 1.3.7)
function incrementVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

// Helper: Update versions in all files
function updateVersions(appVersion, jsVersion) {
  // 1. Update package.json (use appVersion as main version)
  const packageJson = require(packageJsonPath);
  packageJson.version = appVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  // 2. Update src/config/version.ts
  let configContent = fs.readFileSync(versionConfigPath, 'utf8');
  configContent = configContent.replace(/export const appVersion = '.*';/, `export const appVersion = '${appVersion}';`);
  configContent = configContent.replace(/export const jsVersion = '.*';/, `export const jsVersion = '${jsVersion}';`);
  fs.writeFileSync(versionConfigPath, configContent);
  
  // 3. Update project.pbxproj
  let pbxprojContent = fs.readFileSync(pbxprojPath, 'utf8');
  pbxprojContent = pbxprojContent.replace(/MARKETING_VERSION = .*;/g, `MARKETING_VERSION = ${appVersion};`);
  fs.writeFileSync(pbxprojPath, pbxprojContent);
}

// Helper: Run Command
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🏃 Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: options.interactive ? 'inherit' : ['pipe', 'pipe', 'pipe'],
      ...options
    });

    let output = '';

    if (!options.interactive) {
      proc.stdout.on('data', (data) => {
        const str = data.toString();
        output += str;
        process.stdout.write(str);
        
        // Check for success match to exit early
        if (options.successMatch && str.includes(options.successMatch)) {
          console.log("\n✅ Success condition met. Proceeding...");
          proc.kill(); 
          resolve(output);
          return;
        }

        // Handle Inputs if any
        if (options.inputs) {
          options.inputs.forEach((inputConfig) => {
            if (!inputConfig.sent && str.includes(inputConfig.prompt)) {
              console.log(`⌨️  Providing input for: "${inputConfig.prompt}"`);
              proc.stdin.write(inputConfig.value + '\n');
              inputConfig.sent = true;
            }
          });
        }
      });

      proc.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    }

    proc.on('close', (code) => {
      // If killed manually or exited successfully
      if (code === 0 || code === null) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

// Helper: Ask Question
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    console.log("🚀 开始大版本发布流程...\n");
    console.log("📋 大版本发布包含：");
    console.log("   1. 更新APP版本 + 更新JS版本");
    console.log("   2. xCode Archive 提交Apple审核");
    console.log("   3. ipa文件上传至pushy\n");

    // 1. Bump Version (更新APP版本 + 更新JS版本)
    console.log("📦 Step 1: 更新版本号（APP版本 + JS版本）...\n");
    
    // 读取当前版本
    const currentVersions = getCurrentVersions();
    console.log("📋 当前版本信息：");
    console.log(`   - APP版本: ${currentVersions.appVersion}`);
    console.log(`   - JS版本: ${currentVersions.jsVersion}`);
    console.log(`   - Package版本: ${currentVersions.packageVersion}\n`);
    
    // 让用户确认版本是否准确
    const confirmAnswer = await askQuestion("❓ 当前版本是否准确？\n   1. 准确（回车继续，将自动递增）\n   2. 不准确（输入 'n' 或 'no' 手动输入版本）\n   请选择: ");
    
    let appVersion, jsVersion;
    
    if (confirmAnswer.toLowerCase() === 'n' || confirmAnswer.toLowerCase() === 'no') {
      // 手动输入版本
      console.log("\n📝 请手动输入版本号：");
      appVersion = await askQuestion(`   APP版本 (当前: ${currentVersions.appVersion}): `);
      jsVersion = await askQuestion(`   JS版本 (当前: ${currentVersions.jsVersion}): `);
      
      // 验证版本格式
      const versionRegex = /^\d+\.\d+\.\d+$/;
      if (!versionRegex.test(appVersion) || !versionRegex.test(jsVersion)) {
        throw new Error('版本号格式不正确，应为 x.y.z 格式（如 1.3.6）');
      }
    } else {
      // 自动递增版本（独立递增）
      appVersion = incrementVersion(currentVersions.appVersion);
      jsVersion = incrementVersion(currentVersions.jsVersion);
      console.log(`\n🔄 自动递增版本：`);
      console.log(`   - APP版本: ${currentVersions.appVersion} -> ${appVersion}`);
      console.log(`   - JS版本: ${currentVersions.jsVersion} -> ${jsVersion}\n`);
    }
    
    // 更新版本
    updateVersions(appVersion, jsVersion);
    
    // 清除缓存并重新读取
    delete require.cache[require.resolve(packageJsonPath)];
    delete require.cache[require.resolve(versionConfigPath)];
    const packageJson = require(packageJsonPath);
    const version = packageJson.version;
    
    console.log(`✅ 版本号已更新:`);
    console.log(`   - APP版本: ${appVersion}`);
    console.log(`   - JS版本: ${jsVersion}`);
    console.log(`   - Package版本: ${version}\n`);

    // 2. Git Tag
    console.log("🏷️  Step 2: Git 提交和打 Tag...");
    try {
      await runCommand('git', ['add', 'src/config/version.ts', 'package.json', 'ios/MyCrossPlatformApp.xcodeproj/project.pbxproj']);
      await runCommand('git', ['commit', '-m', `chore: bump version to ${appVersion} (major release)`]);
      await runCommand('git', ['tag', `v${appVersion}`]);
      console.log(`✅ Git tag v${appVersion} 已创建\n`);
    } catch (e) {
      console.warn(`⚠️  Git 操作失败（可能没有变更或 tag 已存在）: ${e.message}\n`);
    }

    // 3. Pod Install
    console.log("🥥 Step 3: Pod Install...");
    await runCommand('pod', ['install'], { cwd: path.resolve(__dirname, '../ios') });
    console.log("✅ Pod Install 完成\n");

    // 4. Build IPA (Manual Interaction Required)
    console.log("📲 Step 5: xCode Archive 构建（需要手动操作）");
    console.log("   ⚠️  由于签名要求，无法自动构建 IPA");
    console.log("   ⚠️  正在打开 Xcode...\n");
    
    await runCommand('xed', ['ios/MyCrossPlatformApp.xcworkspace']);

    console.log("\n🛑  请在 Xcode 中执行以下操作：");
    console.log("   1. 选择 'Generic iOS Device' 或你的设备");
    console.log("   2. 菜单：Product -> Archive");
    console.log("   3. 在 Organizer 中：Distribute App -> App Store Connect");
    console.log("   4. 提交到 Apple 审核");
    console.log("   5. 同时导出 .ipa 文件到已知位置\n");
    
    const ipaPath = await askQuestion("📝 请输入导出的 .ipa 文件的完整路径: ");
    
    let ipaUploaded = false;
    if (!ipaPath || !fs.existsSync(ipaPath)) {
      console.warn("⚠️  IPA 文件未找到");
      console.log("💡 提示: 稍后可以手动上传 IPA 文件到 Pushy\n");
    } else {
      // 5. Upload IPA to Pushy (可选，失败不影响流程)
      console.log("\n📤 Step 5: 上传 IPA 文件到 Pushy...");
      try {
        await runCommand('npx', ['react-native-update-cli', 'uploadIpa', ipaPath]);
        console.log("✅ IPA 上传成功\n");
        ipaUploaded = true;
      } catch (error) {
        console.warn(`⚠️  IPA 上传失败: ${error.message}`);
        console.log("💡 提示: 稍后可以手动上传 IPA 文件到 Pushy\n");
        ipaUploaded = false;
      }
    }

    console.log("\n🎉🎉🎉 大版本发布流程完成！ 🎉🎉🎉");
    console.log(`\n📊 版本信息:`);
    console.log(`   - APP版本: ${appVersion} (已更新)`);
    console.log(`   - JS版本: ${jsVersion} (已更新)`);
    console.log(`   - Package版本: ${version}`);
    console.log(`   - Git Tag: v${appVersion}`);
    if (ipaPath && fs.existsSync(ipaPath)) {
      console.log(`   - IPA文件: ${ipaPath}`);
      if (ipaUploaded) {
        console.log(`   - Pushy上传: ✅ 已上传`);
      } else {
        console.log(`   - Pushy上传: ⚠️  未上传（需要手动上传）`);
      }
    } else {
      console.log(`   - IPA文件: ⚠️  未提供`);
    }
    console.log(`\n💡 下一步:`);
    console.log(`   - 在 App Store Connect 中查看审核状态`);
    if (!ipaUploaded) {
      console.log(`   - ⚠️  需要手动上传 IPA 文件到 Pushy:`);
      console.log(`     1. 运行: npm run pushy:login`);
      if (ipaPath && fs.existsSync(ipaPath)) {
        console.log(`     2. 运行: npm run publish:ipa ${ipaPath}`);
      } else {
        console.log(`     2. 运行: npm run publish:ipa <ipa文件路径>`);
      }
      console.log(`   - 在 Pushy 后台绑定热更新包到新版本`);
    } else {
      console.log(`   - 在 Pushy 后台绑定热更新包到新版本`);
    }

  } catch (error) {
    console.error('\n❌ 大版本发布失败:', error);
    process.exit(1);
  }
}

main();
