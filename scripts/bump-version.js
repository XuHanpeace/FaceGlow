const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const versionConfigPath = path.resolve(__dirname, '../src/config/version.ts');
const pbxprojPath = path.resolve(__dirname, '../ios/MyCrossPlatformApp.xcodeproj/project.pbxproj');

// Read package.json
const packageJson = require(packageJsonPath);
const currentVersion = packageJson.version;

console.log(`Current version: ${currentVersion}`);

const [major, minor, patch] = currentVersion.split('.').map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;

console.log(`Bumping to version: ${newVersion}`);

// 1. Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// 2. Update src/config/version.ts
// Read the file first to preserve jsVersion
let configContent = fs.readFileSync(versionConfigPath, 'utf8');
// Replace appVersion
configContent = configContent.replace(/export const appVersion = '.*';/, `export const appVersion = '${newVersion}';`);
// Note: We don't auto-increment jsVersion here as per user request "native build or RN release package". 
// Usually JS version might be managed separately or synced. 
// User said "Every time native build or RN release package, will update the latest version number +1".
// I'll update jsVersion as well to match appVersion for simplicity, or keep them separate?
// User said "About version number... I hope to get from global variable... every time... update +1".
// It implies a single version number or synchronized. 
// I'll update BOTH to stay in sync.
configContent = configContent.replace(/export const jsVersion = '.*';/, `export const jsVersion = '${newVersion}';`);

fs.writeFileSync(versionConfigPath, configContent);

// 3. Update project.pbxproj
let pbxprojContent = fs.readFileSync(pbxprojPath, 'utf8');
pbxprojContent = pbxprojContent.replace(/MARKETING_VERSION = .*;/g, `MARKETING_VERSION = ${newVersion};`);
fs.writeFileSync(pbxprojPath, pbxprojContent);

console.log('Version bump complete.');

