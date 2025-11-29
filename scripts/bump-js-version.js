const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const versionConfigPath = path.resolve(__dirname, '../src/config/version.ts');

// Read package.json to get current appVersion
const packageJson = require(packageJsonPath);
const currentAppVersion = packageJson.version;

// Read version.ts to get current jsVersion
let configContent = fs.readFileSync(versionConfigPath, 'utf8');
const jsVersionMatch = configContent.match(/export const jsVersion = '(.*)';/);
const currentJsVersion = jsVersionMatch ? jsVersionMatch[1] : currentAppVersion;

console.log(`Current app version: ${currentAppVersion}`);
console.log(`Current JS version: ${currentJsVersion}`);

// Parse JS version and increment patch
const [major, minor, patch] = currentJsVersion.split('.').map(Number);
const newJsVersion = `${major}.${minor}.${patch + 1}`;

console.log(`Bumping JS version to: ${newJsVersion}`);

// Update src/config/version.ts - only update jsVersion, keep appVersion unchanged
configContent = configContent.replace(/export const jsVersion = '.*';/, `export const jsVersion = '${newJsVersion}';`);
fs.writeFileSync(versionConfigPath, configContent);

console.log('JS version bump complete.');

