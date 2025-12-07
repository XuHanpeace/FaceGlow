const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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
        
        if (options.successMatch && str.includes(options.successMatch)) {
          console.log("\n✅ Success condition met. Proceeding...");
          proc.kill(); 
          resolve(output);
          return;
        }

        if (options.inputs) {
          options.inputs.forEach((inputConfig) => {
            if (!inputConfig.sent && str.includes(inputConfig.prompt)) {
              console.log(`\n⌨️  Providing input for: "${inputConfig.prompt}"`);
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
      if (code === 0 || code === null) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    console.log("🚀 开始小版本发布流程...\n");

    // 1. 加载 Pushy 配置
    if (!fs.existsSync(configPath)) {
      console.error('❌ Error: pushy-config.json not found.');
      process.exit(1);
    }
    const pushyConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // 2. 小版本号 +1
    console.log("📦 Step 1: 更新版本号（小版本 +1）...");
    require('./bump-version.js');
    delete require.cache[require.resolve(packageJsonPath)];
    const packageJson = require(packageJsonPath);
    const newVersion = packageJson.version;
    console.log(`✅ 版本号已更新到: ${newVersion}\n`);

    // 3. Git 提交和打 Tag
    console.log("🏷️  Step 2: Git 提交和打 Tag...");
    try {
      await runCommand('git', ['add', 'src/config/version.ts', 'package.json', 'ios/MyCrossPlatformApp.xcodeproj/project.pbxproj']);
      await runCommand('git', ['commit', '-m', `chore: bump version to ${newVersion}`]);
      await runCommand('git', ['tag', `v${newVersion}`]);
      console.log(`✅ Git tag v${newVersion} 已创建\n`);
    } catch (e) {
      console.warn(`⚠️  Git 操作失败（可能没有变更或 tag 已存在）: ${e.message}\n`);
    }

    // 4. 登录 Pushy
    console.log("🔐 Step 3: 登录 Pushy...");
    await runCommand('npx', ['react-native-update-cli', 'login'], {
      inputs: [
        { prompt: 'email:', value: pushyConfig.email, sent: false },
        { prompt: 'password:', value: pushyConfig.password, sent: false }
      ],
      successMatch: '欢迎使用 pushy 热更新服务'
    });
    console.log("✅ Pushy 登录成功\n");

    // 5. 打包并上传 JS Bundle
    console.log("📦 Step 4: 打包并上传 JS Bundle...");
    const bundleDescription = `Patch release ${newVersion}`;
    
    // 使用 pushy bundle 命令（类似 pushy-hot-update.sh）
    let bundleOutput = '';
    try {
      bundleOutput = await runCommand('npx', ['react-native-update-cli', 'bundle', '--platform', 'ios', '--rncli', '--name', newVersion, '--description', bundleDescription, '--metaInfo', 'none', '--packageVersion', newVersion], {
        inputs: [
          { prompt: '(Y/N)', value: 'Y', sent: false },
          { prompt: '是否现在将此热更应用到原生包上', value: 'Y', sent: false },
          { prompt: '输入原生包 id', value: '', sent: false } // 可能需要手动输入
        ]
      });
      console.log("✅ JS Bundle 上传成功\n");
    } catch (error) {
      console.warn('⚠️  Bundle 上传可能完成，但绑定可能需要手动操作\n');
      console.log('💡 如果绑定失败，请在 Pushy 后台手动绑定到版本:', newVersion);
    }

    // 6. 尝试提取 Bundle ID
    const bundleIdMatch = bundleOutput.match(/已成功上传新热更包 \(id: (\d+)\)/);
    if (bundleIdMatch) {
      console.log(`✅ Bundle 上传成功! Bundle ID: ${bundleIdMatch[1]}`);
      console.log(`💡 如果绑定失败，请在 Pushy 后台手动绑定:`);
      console.log(`   - Bundle ID: ${bundleIdMatch[1]}`);
      console.log(`   - Native Version: ${newVersion}`);
    }

    console.log("\n🎉🎉🎉 小版本发布完成！ 🎉🎉🎉");
    console.log(`\n📊 版本信息:`);
    console.log(`   - 版本号: ${newVersion}`);
    console.log(`   - JS Bundle: 已上传`);
    console.log(`   - Git Tag: v${newVersion}`);

  } catch (error) {
    console.error('\n❌ 发布失败:', error);
    process.exit(1);
  }
}

main();

