import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlbumRecord } from '../../types/model/album';

export type HomeAlbumCacheData = {
  version: number;
  ts: number;
  albums: AlbumRecord[];
  page: number;
  hasMore: boolean;
};

const CACHE_VERSION = 1;
const KEY_PREFIX = 'fg_home_album_cache_v1:';
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12小时

function buildKey(cacheKey: string): string {
  return `${KEY_PREFIX}${cacheKey}`;
}

export async function readHomeAlbumCache(
  cacheKey: string,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<HomeAlbumCacheData | null> {
  try {
    const key = buildKey(cacheKey);
    const cachedStr = await AsyncStorage.getItem(key);
    
    if (!cachedStr) {
      return null;
    }
    
    const data = JSON.parse(cachedStr) as HomeAlbumCacheData;
    
    // 校验version
    if (data.version !== CACHE_VERSION) {
      return null;
    }
    
    // 校验ts
    if (!data.ts || typeof data.ts !== 'number') {
      return null;
    }
    
    // 校验albums数组
    if (!Array.isArray(data.albums)) {
      return null;
    }
    
    // 校验是否过期
    const now = Date.now();
    if (now - data.ts > ttlMs) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('[homeAlbumCache] 读取缓存失败:', error);
    return null;
  }
}

export async function writeHomeAlbumCache(
  cacheKey: string,
  data: Omit<HomeAlbumCacheData, 'version' | 'ts'>
): Promise<void> {
  try {
    const key = buildKey(cacheKey);
    const payload: HomeAlbumCacheData = {
      version: CACHE_VERSION,
      ts: Date.now(),
      ...data,
    };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    // 忽略写入错误
    console.warn('[homeAlbumCache] 写入缓存失败:', error);
  }
}

