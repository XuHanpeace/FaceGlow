#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TARGET_WIDTH = 1242;
const TARGET_HEIGHT = 2688;

// 检查是否安装了 sharp（更现代的图片处理库）
let useSharp = false;
try {
  require.resolve('sharp');
  useSharp = true;
} catch (e) {
  // sharp 未安装，使用 sips
}

// 使用 sips 处理图片（macOS 自带）
function resizeWithSips(inputPath, outputPath) {
  try {
    // 先获取原始图片尺寸
    const getDimension = (dim) => {
      const output = execSync(`sips -g ${dim} "${inputPath}"`, { encoding: 'utf8' });
      const match = output.match(/: (\d+)/);
      return match ? parseInt(match[1]) : null;
    };

    const origWidth = getDimension('pixelWidth');
    const origHeight = getDimension('pixelHeight');

    if (!origWidth || !origHeight) {
      throw new Error('无法获取图片尺寸');
    }

    // 计算缩放比例，保持宽高比
    const scaleWidth = TARGET_WIDTH / origWidth;
    const scaleHeight = TARGET_HEIGHT / origHeight;
    const scale = Math.max(scaleWidth, scaleHeight); // 使用较大的比例，确保完全覆盖

    const newWidth = Math.round(origWidth * scale);
    const newHeight = Math.round(origHeight * scale);

    // 先缩放到目标尺寸或更大
    const tempPath = outputPath + '.tmp';
    execSync(`sips -z ${newHeight} ${newWidth} "${inputPath}" --out "${tempPath}"`, { stdio: 'ignore' });

    // 计算裁剪位置（居中）
    const cropX = Math.round((newWidth - TARGET_WIDTH) / 2);
    const cropY = Math.round((newHeight - TARGET_HEIGHT) / 2);

    // 裁剪到精确尺寸（sips 使用 cropToHeightWidth 和 --cropOffset）
    // 注意：sips 的裁剪功能有限，我们使用不同的方法
    // 先调整到目标尺寸，可能会略微变形，但尺寸准确
    execSync(`sips --resampleHeightWidthMax ${TARGET_HEIGHT} ${TARGET_WIDTH} "${inputPath}" --out "${tempPath}"`, { stdio: 'ignore' });
    
    // 尝试精确裁剪
    try {
      execSync(`sips --cropToHeightWidth ${TARGET_HEIGHT} ${TARGET_WIDTH} "${tempPath}" --out "${outputPath}"`, { stdio: 'ignore' });
    } catch (e) {
      // 如果裁剪失败，直接使用调整后的文件
      fs.copyFileSync(tempPath, outputPath);
    }

    // 清理临时文件
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    // 验证最终尺寸
    const finalWidth = getDimension('pixelWidth');
    const finalHeight = getDimension('pixelHeight');

    return {
      success: finalWidth === TARGET_WIDTH && finalHeight === TARGET_HEIGHT,
      width: finalWidth,
      height: finalHeight
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 使用 sharp 处理图片（如果已安装）
function resizeWithSharp(inputPath, outputPath) {
  try {
    const sharp = require('sharp');
    
    return sharp(inputPath)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'cover', // 覆盖模式，会裁剪以填满
        position: 'center' // 居中裁剪
      })
      .toFile(outputPath)
      .then(() => {
        // 验证尺寸
        return sharp(outputPath).metadata();
      })
      .then(metadata => {
        return {
          success: metadata.width === TARGET_WIDTH && metadata.height === TARGET_HEIGHT,
          width: metadata.width,
          height: metadata.height
        };
      })
      .catch(error => {
        return {
          success: false,
          error: error.message
        };
      });
  } catch (error) {
    return Promise.resolve({
      success: false,
      error: error.message
    });
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🖼️  APP预览模版图片尺寸调整工具');
    console.log(`目标尺寸: ${TARGET_WIDTH} × ${TARGET_HEIGHT}px\n`);
    console.log('使用方法:');
    console.log('  node scripts/resize-preview-images.js <图片1> [图片2] [图片3] [图片4] ...\n');
    console.log('示例:');
    console.log('  node scripts/resize-preview-images.js preview1.png preview2.png preview3.png preview4.png\n');
    console.log('提示: 如需更精确的处理，请安装 sharp:');
    console.log('  npm install --save-dev sharp\n');
    process.exit(1);
  }

  let processed = 0;
  let failed = 0;

  console.log(`🖼️  开始处理 ${args.length} 张图片...`);
  console.log(`目标尺寸: ${TARGET_WIDTH} × ${TARGET_HEIGHT}px\n`);

  for (const inputFile of args) {
    // 检查文件是否存在
    if (!fs.existsSync(inputFile)) {
      console.log(`❌ 文件不存在: ${inputFile}`);
      failed++;
      continue;
    }

    // 检查文件类型
    const ext = path.extname(inputFile).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
      console.log(`⚠️  跳过非图片文件: ${inputFile}`);
      continue;
    }

    // 生成输出文件名
    const dir = path.dirname(inputFile);
    const filename = path.basename(inputFile, ext);
    const outputFile = path.join(dir, `${filename}_${TARGET_WIDTH}x${TARGET_HEIGHT}${ext}`);

    process.stdout.write(`📸 处理中: ${path.basename(inputFile)} ... `);

    try {
      let result;
      if (useSharp) {
        result = await resizeWithSharp(inputFile, outputFile);
      } else {
        result = resizeWithSips(inputFile, outputFile);
      }

      if (result.success) {
        console.log(`✅ 成功 (${result.width} × ${result.height}px)`);
        console.log(`   保存为: ${outputFile}`);
        processed++;
      } else if (result.width && result.height) {
        console.log(`⚠️  尺寸不完全匹配 (${result.width} × ${result.height}px)`);
        console.log(`   文件已保存: ${outputFile}`);
        processed++;
      } else {
        console.log(`❌ 失败: ${result.error || '未知错误'}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 处理完成:');
  console.log(`   ✅ 成功: ${processed} 张`);
  if (failed > 0) {
    console.log(`   ❌ 失败: ${failed} 张`);
  }
  console.log('');

  if (!useSharp && processed > 0) {
    console.log('💡 提示: 安装 sharp 可以获得更精确的处理效果:');
    console.log('   npm install --save-dev sharp\n');
  }
}

main().catch(error => {
  console.error('❌ 发生错误:', error);
  process.exit(1);
});
