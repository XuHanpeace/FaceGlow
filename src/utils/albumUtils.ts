/**
 * Album 工具函数
 * 用于基于 AlbumRecord 生成 AlbumList 等操作
 * 后续补充新 Album 时可能会用到
 */

import { AlbumRecord } from '../types/model/album';
import { Album } from '../types/model/activity';

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

