import AsyncStorage from '@react-native-async-storage/async-storage';
import { CategoryConfigRecord } from '../../types/model/config';

export type CategoryCacheData = {
  version: number;
  ts: number;
  categories: CategoryConfigRecord[];
};

const CACHE_VERSION = 1;
const KEY_PREFIX = 'fg_category_cache_v1:';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24小时

function buildKey(): string {
  return KEY_PREFIX;
}

export async function readCategoryCache(
  ttlMs: number = DEFAULT_TTL_MS
): Promise<CategoryCacheData | null> {
  try {
    const key = buildKey();
    const cachedStr = await AsyncStorage.getItem(key);
    
    if (!cachedStr) {
      return null;
    }
    
    const data = JSON.parse(cachedStr) as CategoryCacheData;
    
    // 校验version
    if (data.version !== CACHE_VERSION) {
      return null;
    }
    
    // 校验ts
    if (!data.ts || typeof data.ts !== 'number') {
      return null;
    }
    
    // 校验categories数组
    if (!Array.isArray(data.categories)) {
      return null;
    }
    
    // 校验是否过期
    const now = Date.now();
    if (now - data.ts > ttlMs) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('[categoryCache] 读取缓存失败:', error);
    return null;
  }
}

export async function writeCategoryCache(
  categories: CategoryConfigRecord[]
): Promise<void> {
  try {
    const key = buildKey();
    const payload: CategoryCacheData = {
      version: CACHE_VERSION,
      ts: Date.now(),
      categories,
    };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    // 忽略写入错误
    console.warn('[categoryCache] 写入缓存失败:', error);
  }
}

