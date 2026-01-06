/**
 * 水印工具函数
 * 用于为图片添加水印
 */

// 安全导入 react-native-image-marker
let ImageMarker: any;
let Position: any;
let ImageFormat: any;
let TextBackgroundType: any;

try {
  const markerModule = require('react-native-image-marker');
  ImageMarker = markerModule.default;
  Position = markerModule.Position;
  ImageFormat = markerModule.ImageFormat;
  TextBackgroundType = markerModule.TextBackgroundType;
  console.log('✅ react-native-image-marker模块加载成功');
} catch (error) {
  console.error('❌ react-native-image-marker模块加载失败:', error);
  ImageMarker = null;
  Position = null;
  ImageFormat = null;
  TextBackgroundType = null;
}

/**
 * 为图片添加水印
 * @param imagePath 本地图片路径
 * @returns Promise<string> 返回带水印的图片路径
 */
export async function addWatermarkToImage(imagePath: string): Promise<string> {
  try {
    if (!ImageMarker || !Position || !ImageFormat || !TextBackgroundType) {
      console.warn('⚠️ [Watermark] react-native-image-marker不可用，跳过水印');
      return imagePath;
    }
    
    console.log('🎨 [Watermark] 开始添加水印');
    console.log('🎨 [Watermark] 原始图片路径:', imagePath);
    
    const options = {
      backgroundImage: {
        src: imagePath,
        scale: 1,
      },
      watermarkTexts: [{
        text: '© 美颜换换 · FaceGlow AI',
        position: {
          position: Position.bottomRight,
        },
        style: {
          color: '#fff',
          fontSize: 20,
          fontName: 'Helvetica Neue-Bold',
          shadowStyle: {
            dx: 10,
            dy: 10,
            radius: 10,
            color: '#6450B0',
          },
        },
      }],
      underline: true,
      bold: true,
      scale: 1,
      quality: 100,
      filename: 'watermarked',
      saveFormat: ImageFormat.png,
    };
    
    const result = await ImageMarker.markText(options);
    console.log('✅ [Watermark] 水印添加成功');
    console.log('✅ [Watermark] 带水印图片路径:', result);

    return result;
  } catch (error) {
    console.error('❌ [Watermark] 添加水印失败:', error);
    // 如果添加水印失败，返回原图片路径
    return imagePath;
  }
}

