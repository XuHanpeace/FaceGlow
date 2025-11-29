const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const configPath = path.resolve(__dirname, '../pushy-config.json');

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

async function main() {
  try {
    console.log("🚀 Starting IPA Upload Process...\n");

    // 1. Load Pushy Config
    if (!fs.existsSync(configPath)) {
      console.error('❌ Error: pushy-config.json not found.');
      process.exit(1);
    }
    const pushyConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // 2. Get IPA path from command line or ask
    const ipaPath = process.argv[2];
    if (!ipaPath) {
      console.error('❌ Please provide IPA file path as argument.');
      console.log('Usage: node scripts/upload-ipa.js <path-to-ipa>');
      process.exit(1);
    }

    if (!fs.existsSync(ipaPath)) {
      console.error(`❌ IPA file not found at: ${ipaPath}`);
      process.exit(1);
    }

    // 3. Login to Pushy
    console.log("🔐 Step 1: Logging in to Pushy...");
    await runCommand('npx', ['react-native-update-cli', 'login'], {
      inputs: [
        { prompt: 'email:', value: pushyConfig.email, sent: false },
        { prompt: 'password:', value: pushyConfig.password, sent: false }
      ],
      successMatch: '欢迎使用 pushy 热更新服务'
    });

    // 4. Upload IPA
    console.log("\n📤 Step 2: Uploading IPA to Pushy...");
    await runCommand('npx', ['react-native-update-cli', 'uploadIpa', ipaPath]);
    console.log("\n✅ IPA Uploaded Successfully!");

    console.log("\n💡 Next steps:");
    console.log("   1. Go to Pushy dashboard and note the new native package ID");
    console.log("   2. Bind your hot update bundles to this new native package");
    console.log("   3. Or run: node scripts/publish-hot-update.js to upload and bind automatically");

  } catch (error) {
    console.error('\n❌ Upload Failed:', error);
    process.exit(1);
  }
}

main();

