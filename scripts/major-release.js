const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// Configuration
const packageJsonPath = path.resolve(__dirname, '../package.json');
const configPath = path.resolve(__dirname, '../pushy-config.json');

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

    // 1. Load Pushy Config (可选)
    let pushyConfig = null;
    if (fs.existsSync(configPath)) {
      try {
        pushyConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        console.warn(`⚠️  无法读取 pushy-config.json: ${error.message}`);
        console.log("💡 提示: Pushy 相关操作将跳过，稍后可手动操作\n");
      }
    } else {
      console.warn('⚠️  pushy-config.json 未找到');
      console.log("💡 提示: Pushy 相关操作将跳过，稍后可手动操作\n");
    }

    // 2. Bump Version (更新APP版本 + 更新JS版本)
    console.log("📦 Step 1: 更新版本号（APP版本 + JS版本）...");
    require('./bump-version.js'); 
    delete require.cache[require.resolve(packageJsonPath)];
    const packageJson = require(packageJsonPath);
    const version = packageJson.version;
    console.log(`✅ 版本号已更新到: ${version}\n`);

    // 3. Git Tag
    console.log("🏷️  Step 2: Git 提交和打 Tag...");
    try {
      await runCommand('git', ['add', 'src/config/version.ts', 'package.json', 'ios/MyCrossPlatformApp.xcodeproj/project.pbxproj']);
      await runCommand('git', ['commit', '-m', `chore: bump version to ${version} (major release)`]);
      await runCommand('git', ['tag', `v${version}`]);
      console.log(`✅ Git tag v${version} 已创建\n`);
    } catch (e) {
      console.warn(`⚠️  Git 操作失败（可能没有变更或 tag 已存在）: ${e.message}\n`);
    }

    // 4. Pod Install
    console.log("🥥 Step 3: Pod Install...");
    await runCommand('pod', ['install'], { cwd: path.resolve(__dirname, '../ios') });
    console.log("✅ Pod Install 完成\n");

    // 5. Login to Pushy (可选，失败不影响流程)
    let pushyLoggedIn = false;
    if (pushyConfig && pushyConfig.email && pushyConfig.password) {
      console.log("🔐 Step 4: 登录 Pushy...");
      try {
        await runCommand('npx', ['react-native-update-cli', 'login'], {
          inputs: [
            { prompt: 'email:', value: pushyConfig.email, sent: false },
            { prompt: 'password:', value: pushyConfig.password, sent: false }
          ],
          successMatch: '欢迎使用 pushy 热更新服务'
        });
        console.log("✅ Pushy 登录成功\n");
        pushyLoggedIn = true;
      } catch (error) {
        console.warn(`⚠️  Pushy 登录失败: ${error.message}`);
        console.log("💡 提示: 稍后可以手动登录 Pushy 并上传 IPA 文件\n");
        pushyLoggedIn = false;
      }
    } else {
      console.log("🔐 Step 4: 跳过 Pushy 登录（配置不可用）");
      console.log("💡 提示: 稍后可以手动登录 Pushy 并上传 IPA 文件\n");
    }

    // 6. Build IPA (Manual Interaction Required)
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
    } else if (!pushyLoggedIn) {
      console.log("⚠️  由于 Pushy 未登录，跳过 IPA 上传");
      console.log("💡 提示: 稍后可以手动登录 Pushy 并上传 IPA 文件\n");
    } else {
      // 7. Upload IPA to Pushy (可选，失败不影响流程)
      console.log("\n📤 Step 6: 上传 IPA 文件到 Pushy...");
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
    console.log(`   - 版本号: ${version}`);
    console.log(`   - APP版本: ${version} (已更新)`);
    console.log(`   - JS版本: ${version} (已更新)`);
    console.log(`   - Git Tag: v${version}`);
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
