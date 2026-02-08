/**
 * Album 工具函数
 * 用于基于 AlbumRecord 生成 AlbumList 等操作
 * 后续补充新 Album 时可能会用到
 */

import { AlbumRecord } from '../types/model/album';
import { Album } from '../types/model/activity';

export type AlbumMediaInfo = {
  /**
   * 是否为“视频相册”（图生视频 / 视频特效）
   * 直接根据 task_execution_type（及兼容旧数据时的 function_type）判断
   */
  isVideoAlbum: boolean;
  /**
   * 相册封面图 URL（用于列表卡片、异步任务 activityImage 等）
   * 规则：优先 template_list[0].template_url，其次 album_image；绝不返回视频 URL
   */
  coverImageUrl: string;
  /**
   * 视频预览 URL（仅视频相册可能有；为空表示没有可播放视频，UI 需回退到图片）
   */
  previewVideoUrl: string | null;
};

function isProbablyVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.endsWith('.mp4') || lower.includes('.mp4?');
}

/**
 * 将 AlbumRecord 转换为 Album 格式
 * 用于兼容旧的 Activity 数据结构
 */
export function convertAlbumRecordToAlbum(record: AlbumRecord, activityId?: string): Album {
  return {
    album_id: record.album_id,
    album_name: record.album_name,
    album_description: record.album_description,
    album_image: record.album_image,
    price: record.price,
    original_price: record.original_price,
    level: record.level,
    template_list: record.template_list?.map(template => ({
      template_id: template.template_id,
      template_url: template.template_url,
      template_name: template.template_name,
      template_description: template.template_description,
      price: template.price,
      projectId: template.projectId,
    })) || [],
    // 保留 activityId 用于兼容
    activityId: activityId,
  };
}

/**
 * 将 AlbumRecord[] 转换为 Album[]
 * 用于批量转换
 */
export function convertAlbumRecordsToAlbums(
  records: AlbumRecord[],
  activityIdMap?: Map<string, string>
): Album[] {
  return records.map(record => {
    const activityId = activityIdMap?.get(record.album_id);
    return convertAlbumRecordToAlbum(record, activityId);
  });
}

/**
 * 从 AlbumRecord[] 生成 AlbumList
 * 用于后续补充新 Album 时快速生成列表
 */
export function generateAlbumListFromRecords(
  records: AlbumRecord[],
  activityId?: string
): Album[] {
  return records.map(record => convertAlbumRecordToAlbum(record, activityId));
}

/**
 * 判断是否为视频相册（图生视频 / 视频特效）
 * 直接根据 task_execution_type 判断；兼容旧数据：task_execution_type 为 async 时用 function_type 推断
 */
export function isVideoAlbum(
  album: Pick<AlbumRecord, 'task_execution_type' | 'function_type'>
): boolean {
  const t = album.task_execution_type;
  const f = album.function_type;
  if (t === 'async_image_to_video' || t === 'async_video_effect') return true;
  if (t === 'async' && (f === 'image_to_video' || f === 'video_effect')) return true;
  return false;
}

/**
 * 统一获取相册封面图（只返回图片 URL）
 * - 优先 `template_list[0].template_url`
 * - 兜底 `album_image`
 */
export function getAlbumCoverImageUrl(
  album: Pick<AlbumRecord, 'album_image' | 'template_list' | 'src_image' | 'result_image'>
): string {
  const templateUrl = album.template_list?.[0]?.template_url;
  if (typeof templateUrl === 'string' && templateUrl.length > 0 && !isProbablyVideoUrl(templateUrl)) return templateUrl;

  // 防御：有些历史/管理端数据可能把 album_image 写成了 mp4，封面必须回退到图片字段
  const albumImage = album.album_image;
  if (typeof albumImage === 'string' && albumImage.length > 0 && !isProbablyVideoUrl(albumImage)) return albumImage;

  const srcImage = album.src_image;
  if (typeof srcImage === 'string' && srcImage.length > 0 && !isProbablyVideoUrl(srcImage)) return srcImage;

  const resultImage = album.result_image;
  if (typeof resultImage === 'string' && resultImage.length > 0 && !isProbablyVideoUrl(resultImage)) return resultImage;

  // 最后兜底：返回空字符串，让上层显示占位（避免把视频 URL 当图片用）
  return '';
}

/**
 * 统一获取视频预览 URL（仅视频相册且字段存在时返回）
 */
export function getAlbumPreviewVideoUrl(
  album: Pick<AlbumRecord, 'task_execution_type' | 'function_type' | 'preview_video_url'>
): string | null {
  if (!isVideoAlbum(album)) return null;
  const url = album.preview_video_url;
  if (typeof url === 'string' && url.length > 0) return url;
  return null;
}

/**
 * 统一入口：一次性返回“是否视频相册 / 封面字段 / 预览字段”
 * 用于避免各处自行拼装逻辑导致字段混淆。
 */
export function getAlbumMediaInfo(
  album: Pick<
    AlbumRecord,
    'album_image' | 'template_list' | 'task_execution_type' | 'function_type' | 'preview_video_url' | 'src_image' | 'result_image'
  >
): AlbumMediaInfo {
  return {
    isVideoAlbum: isVideoAlbum(album),
    coverImageUrl: getAlbumCoverImageUrl(album),
    previewVideoUrl: getAlbumPreviewVideoUrl(album),
  };
}


