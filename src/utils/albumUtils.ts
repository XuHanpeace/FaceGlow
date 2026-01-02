/**
 * Album 工具函数
 * 用于基于 AlbumRecord 生成 AlbumList 等操作
 * 后续补充新 Album 时可能会用到
 */

import { AlbumRecord } from '../types/model/album';
import { Album } from '../types/model/activity';
import { TaskExecutionType } from '../types/model/album';

export type AlbumMediaInfo = {
  /**
   * 是否为“视频相册”（图生视频 / 视频特效）
   * 注意：这里的判断会基于 normalizeTaskExecutionType 做兼容（旧数据 sync/async 也能稳定推断）
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
 * 将旧的 task_execution_type (sync/async) 映射到新的具体类型
 * 
 * 兼容性处理：旧模板可能只有 'sync' 或 'async'，需要根据 function_type 推断出具体的任务类型
 * 
 * 映射规则：
 * - sync + portrait → sync_portrait (个人写真换脸)
 * - sync + group_photo → sync_group_photo (多人合拍换脸)
 * - async + image_to_image → async_image_to_image (图生图)
 * - async + image_to_video → async_image_to_video (图生视频)
 * - async + video_effect → async_video_effect (视频特效)
 * - async + portrait_style_redraw → async_portrait_style_redraw (人像风格重绘)
 * 
 * 如果已经是新的具体类型，直接返回
 * 如果无法确定，使用默认值：
 *   - sync → sync_portrait (默认个人写真)
 *   - async → async_image_to_image (默认图生图)
 * 
 * @param taskExecutionType - 任务执行类型（可能是旧的 sync/async 或新的具体类型）
 * @param functionType - 功能类型（用于推断具体的任务类型）
 * @returns 映射后的任务执行类型
 */
export function normalizeTaskExecutionType(
  taskExecutionType: string | undefined,
  functionType?: string
): TaskExecutionType {
  // 如果已经是新的具体类型，直接返回
  const newTypes: TaskExecutionType[] = [
    TaskExecutionType.SYNC_PORTRAIT,
    TaskExecutionType.SYNC_GROUP_PHOTO,
    TaskExecutionType.ASYNC_IMAGE_TO_IMAGE,
    TaskExecutionType.ASYNC_IMAGE_TO_VIDEO,
    TaskExecutionType.ASYNC_VIDEO_EFFECT,
    TaskExecutionType.ASYNC_PORTRAIT_STYLE_REDRAW,
    TaskExecutionType.ASYNC_DOUBAO_IMAGE_TO_IMAGE, // 豆包图生图（独立执行类型）
  ];
  
  if (taskExecutionType && newTypes.includes(taskExecutionType as TaskExecutionType)) {
    return taskExecutionType as TaskExecutionType;
  }

  // 处理旧的 sync/async 类型
  if (taskExecutionType === 'sync') {
    // 根据 function_type 推断具体的同步任务类型
    if (functionType === 'group_photo') {
      return TaskExecutionType.SYNC_GROUP_PHOTO;
    }
    // 默认个人写真
    return TaskExecutionType.SYNC_PORTRAIT;
  }

  if (taskExecutionType === 'async') {
    // 根据 function_type 推断具体的异步任务类型
    if (functionType === 'image_to_video') {
      return TaskExecutionType.ASYNC_IMAGE_TO_VIDEO;
    }
    if (functionType === 'video_effect') {
      return TaskExecutionType.ASYNC_VIDEO_EFFECT;
    }
    if (functionType === 'portrait_style_redraw') {
      return TaskExecutionType.ASYNC_PORTRAIT_STYLE_REDRAW;
    }
    // 默认图生图
    return TaskExecutionType.ASYNC_IMAGE_TO_IMAGE;
  }

  // 如果 task_execution_type 为空或未知，根据 function_type 推断
  if (!taskExecutionType && functionType) {
    if (functionType === 'portrait' || functionType === 'group_photo') {
      // 个人写真和多人合拍默认使用同步任务
      return functionType === 'group_photo' 
        ? TaskExecutionType.SYNC_GROUP_PHOTO 
        : TaskExecutionType.SYNC_PORTRAIT;
    }
    if (functionType === 'image_to_image') {
      return TaskExecutionType.ASYNC_IMAGE_TO_IMAGE;
    }
    if (functionType === 'image_to_video') {
      return TaskExecutionType.ASYNC_IMAGE_TO_VIDEO;
    }
    if (functionType === 'video_effect') {
      return TaskExecutionType.ASYNC_VIDEO_EFFECT;
    }
    if (functionType === 'portrait_style_redraw') {
      return TaskExecutionType.ASYNC_PORTRAIT_STYLE_REDRAW;
    }
  }

  // 最终默认值：如果无法确定，默认使用同步个人写真
  return TaskExecutionType.SYNC_PORTRAIT;
}

/**
 * 统一判断：是否为视频相册
 * - 只通过“标准化后的 task_execution_type”判断（兼容旧数据/缺省字段）
 */
export function isVideoAlbum(
  album: Pick<AlbumRecord, 'task_execution_type' | 'function_type'>
): boolean {
  const normalized = normalizeTaskExecutionType(album.task_execution_type, album.function_type);
  return (
    normalized === TaskExecutionType.ASYNC_IMAGE_TO_VIDEO ||
    normalized === TaskExecutionType.ASYNC_VIDEO_EFFECT
  );
}

/**
 * 统一获取相册封面图（只返回图片 URL）
 * - 优先 `template_list[0].template_url`
 * - 兜底 `album_image`
 */
export function getAlbumCoverImageUrl(
  album: Pick<AlbumRecord, 'album_image' | 'template_list'>
): string {
  const templateUrl = album.template_list?.[0]?.template_url;
  if (typeof templateUrl === 'string' && templateUrl.length > 0) return templateUrl;
  return album.album_image;
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
    'album_image' | 'template_list' | 'task_execution_type' | 'function_type' | 'preview_video_url'
  >
): AlbumMediaInfo {
  return {
    isVideoAlbum: isVideoAlbum(album),
    coverImageUrl: getAlbumCoverImageUrl(album),
    previewVideoUrl: getAlbumPreviewVideoUrl(album),
  };
}


