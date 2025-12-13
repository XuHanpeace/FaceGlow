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
            if (!inputConfig.sent) {
              // 更灵活的匹配：检查提示文本是否包含在输出中（忽略大小写和标点）
              const promptLower = inputConfig.prompt.toLowerCase().replace(/[?:]/g, '');
              const strLower = str.toLowerCase();
              if (strLower.includes(promptLower)) {
                let inputValue = inputConfig.value;
                
                // 如果是原生包 ID 且需要自动选择，尝试从输出中提取第一个匹配的包 ID
                if (inputConfig.autoSelect && inputValue === '' && strLower.includes('原生包 id')) {
                  // 尝试从表格中提取第一个包 ID（格式：|   85317   |  1.3.6   |）
                  const idMatch = str.match(/\|\s+(\d+)\s+\|\s+[\d.]+\s+\|/);
                  if (idMatch) {
                    inputValue = idMatch[1];
                    console.log(`\n⌨️  自动选择原生包 ID: ${inputValue}`);
                  } else {
                    console.log(`\n⚠️  无法自动选择原生包 ID，请手动输入`);
                  }
                }
                
                console.log(`\n⌨️  Providing input for: "${inputConfig.prompt}"`);
                proc.stdin.write(inputValue + '\n');
                inputConfig.sent = true;
              }
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

    // 2. 读取当前原生版本号（appVersion）
    const versionConfigPath = path.resolve(__dirname, '../src/config/version.ts');
    let versionConfig = fs.readFileSync(versionConfigPath, 'utf8');
    const appVersionMatch = versionConfig.match(/export const appVersion = '(.*)';/);
    const appVersion = appVersionMatch ? appVersionMatch[1] : packageJson.version;
    
    // 3. 更新 JS 版本号（只更新 jsVersion，不更新 appVersion）
    console.log("📦 Step 1: 更新 JS 版本号（小版本 +1）...");
    require('./bump-js-version.js');
    delete require.cache[require.resolve(versionConfigPath)];
    versionConfig = fs.readFileSync(versionConfigPath, 'utf8');
    const jsVersionMatch = versionConfig.match(/export const jsVersion = '(.*)';/);
    const newJsVersion = jsVersionMatch ? jsVersionMatch[1] : appVersion;
    console.log(`✅ JS 版本号已更新到: ${newJsVersion}`);
    console.log(`📱 原生版本号保持为: ${appVersion}\n`);

    // 4. Git 提交和打 Tag（只提交 version.ts，不提交 package.json 和 project.pbxproj）
    console.log("🏷️  Step 2: Git 提交和打 Tag...");
    try {
      await runCommand('git', ['add', 'src/config/version.ts']);
      await runCommand('git', ['commit', '-m', `chore: bump JS version to ${newJsVersion}`]);
      await runCommand('git', ['tag', `js-v${newJsVersion}`]);
      console.log(`✅ Git tag js-v${newJsVersion} 已创建\n`);
    } catch (e) {
      console.warn(`⚠️  Git 操作失败（可能没有变更或 tag 已存在）: ${e.message}\n`);
    }

    // 5. 打包并上传 JS Bundle（如果未登录会自动报错）
    console.log("📦 Step 3: 打包并上传 JS Bundle...");
    const bundleDescription = `Patch release ${newJsVersion}`;
    
    // 使用 pushy bundle 命令（类似 pushy-hot-update.sh）
    // 注意：--packageVersion 应该使用原生版本号（appVersion），而不是 JS 版本号
    // 注意：即使传了参数，pushy 还是会交互式询问，需要处理所有输入
    let bundleOutput = '';
    let bundleSuccess = false;
    try {
      // 注意：原生包 ID 需要根据实际列表选择，这里先尝试自动选择匹配 appVersion 的第一个包
      // 如果自动选择失败，用户需要手动输入
      bundleOutput = await runCommand('pushy', ['bundle', '--platform', 'ios', '--rncli', '--name', newJsVersion, '--description', bundleDescription, '--metaInfo', 'none', '--packageVersion', appVersion], {
        inputs: [
          { prompt: '是否现在上传此热更包', value: 'y', sent: false },
          { prompt: '输入版本名称', value: newJsVersion, sent: false },
          { prompt: '输入版本描述', value: bundleDescription, sent: false },
          { prompt: '输入自定义的 meta info', value: '', sent: false },
          { prompt: '是否现在将此热更应用到原生包上', value: 'y', sent: false },
          { prompt: '输入原生包 id', value: '', sent: false, autoSelect: true } // autoSelect 表示尝试自动选择
        ]
      });
      
      // 检查输出中是否包含成功标识
      if (bundleOutput.includes('已成功上传新热更包') || bundleOutput.includes('上传成功')) {
        bundleSuccess = true;
        console.log("✅ JS Bundle 上传成功\n");
      } else {
        throw new Error('Bundle 上传未找到成功标识');
      }
    } catch (error) {
      console.error('\n❌ Bundle 上传失败:', error.message);
      console.error('错误详情:', error);
      console.error('\n💡 请检查:');
      console.error('   1. 是否已登录 Pushy (运行: npm run pushy:login 或 pushy login)');
      console.error('   2. 网络连接是否正常');
      console.error('   3. Pushy 服务是否可用');
      throw error; // 重新抛出错误，让外层 catch 处理
    }

    // 6. 尝试提取 Bundle ID
    const bundleIdMatch = bundleOutput.match(/已成功上传新热更包 \(id: (\d+)\)/);
    if (bundleIdMatch) {
      console.log(`✅ Bundle 上传成功! Bundle ID: ${bundleIdMatch[1]}`);
      console.log(`💡 如果绑定失败，请在 Pushy 后台手动绑定:`);
      console.log(`   - Bundle ID: ${bundleIdMatch[1]}`);
      console.log(`   - Native Version: ${appVersion}`);
    }

    console.log("\n🎉🎉🎉 JS 热更新发布完成！ 🎉🎉🎉");
    console.log(`\n📊 版本信息:`);
    console.log(`   - JS 版本号: ${newJsVersion}`);
    console.log(`   - 原生版本号: ${appVersion}`);
    console.log(`   - JS Bundle: ${bundleSuccess ? '已上传' : '上传失败'}`);
    console.log(`   - Git Tag: js-v${newJsVersion}`);

  } catch (error) {
    console.error('\n❌ 发布失败:', error);
    process.exit(1);
  }
}

main();

