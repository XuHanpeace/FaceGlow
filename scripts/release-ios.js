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
             console.log("✅ Success condition met. Proceeding...");
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
    console.log("🚀 Starting Full iOS Release Process...");

    // 1. Load Pushy Config
    if (!fs.existsSync(configPath)) {
      console.error('❌ Error: pushy-config.json not found.');
      process.exit(1);
    }
    const pushyConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // 2. Bump Version
    console.log("\n📦 Step 1: Bumping Version...");
    require('./bump-version.js'); 
    delete require.cache[require.resolve(packageJsonPath)];
    const packageJson = require(packageJsonPath);
    const version = packageJson.version;
    console.log(`✅ Version bumped to: ${version}`);

    // 3. Git Tag
    console.log("\n🏷️  Step 2: Git Tagging...");
    try {
      await runCommand('git', ['add', '.']);
      await runCommand('git', ['commit', '-m', `chore: bump version to ${version}`]);
      await runCommand('git', ['tag', `v${version}`]);
      console.log(`✅ Git tag v${version} created.`);
    } catch (e) {
      console.warn(`⚠️  Git tagging failed (maybe no changes or tag exists): ${e.message}`);
    }

    // 4. Pod Install
    console.log("\n🥥 Step 3: Pod Install...");
    await runCommand('pod', ['install'], { cwd: path.resolve(__dirname, '../ios') });

    // 5. Login to Pushy
    console.log("\n🔐 Step 4: Logging in to Pushy...");
    // Use successMatch to ensure we don't hang if the process doesn't exit
    await runCommand('npx', ['react-native-update-cli', 'login'], {
      inputs: [
        { prompt: 'email:', value: pushyConfig.email, sent: false },
        { prompt: 'password:', value: pushyConfig.password, sent: false }
      ],
      successMatch: '欢迎使用 pushy 热更新服务' // Match the welcome message
    });

    // 6. Build IPA (Manual Interaction Required)
    console.log("\n📲 Step 5: Build IPA (Xcode Interaction Required)");
    console.log("   ⚠️  We cannot automatically build IPA due to signing requirements.");
    console.log("   ⚠️  Opening Xcode now...");
    
    await runCommand('xed', ['ios/MyCrossPlatformApp.xcworkspace']);

    console.log("\n🛑  ACTION REQUIRED IN XCODE:");
    console.log("   1. Select 'Generic iOS Device' or your device.");
    console.log("   2. Menu: Product -> Archive.");
    console.log("   3. In Organizer: Distribute App -> App Store Connect / Development -> Export.");
    console.log("   4. Save the .ipa file to a known location.");
    
    const ipaPath = await askQuestion("\n📝 Please paste the full path to the exported .ipa file: ");
    
    if (!ipaPath || !fs.existsSync(ipaPath)) {
        console.error("❌ IPA file not found at provided path.");
        // Ask if user wants to skip IPA upload
        const skip = await askQuestion("Do you want to skip IPA upload and proceed to JS Bundle upload? (y/n): ");
        if (skip.toLowerCase() !== 'y') {
            process.exit(1);
        }
    } else {
        // 7. Upload IPA
        console.log("\n📤 Step 6: Uploading IPA to Pushy...");
        await runCommand('npx', ['react-native-update-cli', 'uploadIpa', ipaPath]);
        console.log("✅ IPA Uploaded.");
    }

    // 8. Upload JS Bundle
    console.log("\n📦 Step 7: Uploading JS Bundle to Pushy...");
    let bundleOutput = '';
    try {
      bundleOutput = await runCommand('npx', ['react-native-update-cli', 'bundle', '--platform', 'ios'], {
        inputs: [
          { prompt: '(Y/N)', value: 'Y', sent: false },
          { prompt: 'upload', value: 'Y', sent: false },
          { prompt: '输入版本名称', value: version, sent: false },
          { prompt: '输入版本描述', value: `Initial bundle for version ${version}`, sent: false },
          { prompt: '输入自定义的 meta info', value: 'none', sent: false },
          { prompt: '是否现在将此热更应用到原生包上', value: 'Y', sent: false },
          { prompt: '输入原生包 id', value: '', sent: false } // Will need to extract from IPA upload or manual input
        ]
      });
    } catch (error) {
      console.warn('⚠️  Bundle upload completed with warnings. Please check binding manually.');
    }

    // Try to extract bundle ID and native package ID for reference
    const bundleIdMatch = bundleOutput.match(/已成功上传新热更包 \(id: (\d+)\)/);
    if (bundleIdMatch) {
      console.log(`\n✅ Bundle uploaded! Bundle ID: ${bundleIdMatch[1]}`);
      console.log(`\n💡 If binding failed, please bind manually in Pushy dashboard:`);
      console.log(`   - Bundle ID: ${bundleIdMatch[1]}`);
      console.log(`   - Native Version: ${version}`);
    }

    console.log("\n🎉🎉🎉 Full Release Process Completed! 🎉🎉🎉");

  } catch (error) {
    console.error('\n❌ Release Failed:', error);
    process.exit(1);
  }
}

main();
