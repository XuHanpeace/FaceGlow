const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const configPath = path.resolve(__dirname, '../pushy-config.json');
const packageJsonPath = path.resolve(__dirname, '../package.json');

// Helper: Run Command
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🏃 Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });

    let output = '';

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

    proc.on('close', (code) => {
      if (code === 0 || code === null) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

// Helper: Extract information from output using regex
function extractInfo(output, patterns) {
  const result = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = output.match(pattern);
    if (match) {
      result[key] = match[1] || match[0];
    }
  }
  return result;
}

async function main() {
  try {
    console.log("🚀 Starting Hot Update Publishing Process...\n");

    // 1. Load Pushy Config
    if (!fs.existsSync(configPath)) {
      console.error('❌ Error: pushy-config.json not found.');
      process.exit(1);
    }
    const pushyConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // 2. Bump JS Version (only JS version, not app version)
    console.log("📦 Step 1: Bumping JS Version...");
    require('./bump-js-version.js');
    delete require.cache[require.resolve('./bump-js-version.js')];
    
    // Read updated JS version
    const versionConfigPath = path.resolve(__dirname, '../src/config/version.ts');
    const versionConfig = fs.readFileSync(versionConfigPath, 'utf8');
    const jsVersionMatch = versionConfig.match(/export const jsVersion = '(.*)';/);
    const jsVersion = jsVersionMatch ? jsVersionMatch[1] : 'unknown';
    console.log(`✅ JS version bumped to: ${jsVersion}\n`);

    // 3. Login to Pushy
    console.log("🔐 Step 2: Logging in to Pushy...");
    await runCommand('npx', ['react-native-update-cli', 'login'], {
      inputs: [
        { prompt: 'email:', value: pushyConfig.email, sent: false },
        { prompt: 'password:', value: pushyConfig.password, sent: false }
      ],
      successMatch: '欢迎使用 pushy 热更新服务'
    });

    // 4. Upload JS Bundle
    console.log("\n📦 Step 3: Uploading JS Bundle...");
    let bundleOutput = '';
    try {
      bundleOutput = await runCommand('npx', ['react-native-update-cli', 'bundle', '--platform', 'ios'], {
        inputs: [
          { prompt: '(Y/N)', value: 'Y', sent: false },
          { prompt: 'upload', value: 'Y', sent: false },
          { prompt: '输入版本名称', value: jsVersion, sent: false },
          { prompt: '输入版本描述', value: `Hot update for JS version ${jsVersion}`, sent: false },
          { prompt: '输入自定义的 meta info', value: 'none', sent: false }
        ]
      });
    } catch (error) {
      // If upload fails, try to extract bundle ID from error output
      console.warn('⚠️  Upload command may have completed with warnings:', error.message);
    }

    // Extract bundle ID from output
    const bundleIdMatch = bundleOutput.match(/已成功上传新热更包 \(id: (\d+)\)/);
    if (!bundleIdMatch) {
      console.error('❌ Could not extract bundle ID from output. Please bind manually in Pushy dashboard.');
      console.log('\n📋 Next steps:');
      console.log('   1. Go to Pushy dashboard');
      console.log('   2. Find the uploaded bundle');
      console.log('   3. Bind it to the native package version');
      process.exit(1);
    }

    const bundleId = bundleIdMatch[1];
    console.log(`✅ Bundle uploaded successfully! Bundle ID: ${bundleId}`);

    // 5. Get current app version to find native package
    const packageJson = require(packageJsonPath);
    const appVersion = packageJson.version;
    console.log(`\n📱 Step 4: Binding to native package version ${appVersion}...`);

    // 6. List native packages to find the matching one
    console.log("🔍 Finding native package...");
    let nativePackageId = null;
    
    // Try to bind automatically
    // The CLI will prompt for native package ID, we need to provide it
    // First, let's try to get it from a previous upload or ask user
    console.log("\n⚠️  Auto-binding requires native package ID.");
    console.log("   Please check Pushy dashboard for the native package ID.");
    console.log(`   Native version should be: ${appVersion}`);
    console.log("\n💡 Tip: You can also bind manually in Pushy dashboard:");
    console.log(`   - Bundle ID: ${bundleId}`);
    console.log(`   - Native Version: ${appVersion}`);

    // Try interactive binding
    try {
      await runCommand('npx', ['react-native-update-cli', 'bind', bundleId], {
        inputs: [
          { prompt: '输入原生包 id', value: '', sent: false } // Will need manual input
        ]
      });
      console.log("✅ Binding completed!");
    } catch (error) {
      console.warn('\n⚠️  Auto-binding failed. Please bind manually:');
      console.log(`   Bundle ID: ${bundleId}`);
      console.log(`   Native Version: ${appVersion}`);
    }

    console.log("\n🎉🎉🎉 Hot Update Published! 🎉🎉🎉");
    console.log(`\n📊 Summary:`);
    console.log(`   - JS Version: ${jsVersion}`);
    console.log(`   - Bundle ID: ${bundleId}`);
    console.log(`   - Native Version: ${appVersion}`);
    console.log(`\n📱 App will automatically check for updates on next launch.`);

  } catch (error) {
    console.error('\n❌ Hot Update Publishing Failed:', error);
    process.exit(1);
  }
}

main();

