const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load credentials
const configPath = path.resolve(__dirname, '../pushy-config.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: pushy-config.json not found.');
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function runCommand(command, args, inputs = []) {
  return new Promise((resolve, reject) => {
    console.log(`🏃 Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';

    proc.stdout.on('data', (data) => {
      const str = data.toString();
      output += str;
      process.stdout.write(str);

      // Handle inputs
      inputs.forEach((inputConfig) => {
        if (!inputConfig.sent && str.includes(inputConfig.prompt)) {
          console.log(`⌨️  Providing input for: "${inputConfig.prompt}"`);
          proc.stdin.write(inputConfig.value + '\n');
          inputConfig.sent = true; // Ensure we only send once per prompt occurrence? 
          // For login, email and password appear once.
          // For bundle, Y appears once.
        }
      });
    });

    proc.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    // 1. Attempt Login
    console.log('🔐 Attempting Login...');
    await runCommand('npx', ['react-native-update-cli', 'login'], [
      { prompt: 'email:', value: config.email, sent: false },
      { prompt: 'password:', value: config.password, sent: false }
    ]);
    console.log('✅ Login completed.');

    // 2. Bundle and Upload
    console.log('📦 Bundling and Uploading...');
    // Note: The prompt might be "是否现在上传此热更包?(Y/N)" or "Upload now?(Y/N)"
    // We'll match typical patterns.
    await runCommand('npx', ['react-native-update-cli', 'bundle', '--platform', 'ios'], [
      { prompt: '(Y/N)', value: 'Y', sent: false },
      { prompt: 'upload', value: 'Y', sent: false } // Fallback if prompt text varies
    ]);
    console.log('🎉 Process finished successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
