import axios from 'axios';
import { getCloudbaseConfig } from '../../config/cloudbase';
import { authService } from '../auth/authService';
import { AlbumListResponse } from '../../types/model/album';
import { CategoryConfigResponse } from '../../types/model/config';

// 获取腾讯云开发配置
const CLOUDBASE_CONFIG = getCloudbaseConfig();

// 云函数基础URL
const CLOUD_FUNCTION_BASE_URL = 'https://startup-2gn33jt0ca955730-1257391807.ap-shanghai.app.tcloudbase.com';

export interface GetAlbumListParams {
  page?: number;
  page_size?: number;
  function_types?: string[];
  theme_styles?: string[];
  activity_tags?: string[];
  sort_by?: 'default' | 'likes' | 'created_at';
}

export class AlbumService {
  /**
   * 获取相册列表
   * 调用云函数: getAlbumList
   */
  async getAlbumList(params: GetAlbumListParams): Promise<AlbumListResponse> {
    try {
      const token = authService.getCurrentAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const requestData = {
        page: params.page || 1,
        page_size: params.page_size || 20,
        function_types: params.function_types,
        theme_styles: params.theme_styles,
        activity_tags: params.activity_tags,
        sort_by: params.sort_by || 'default',
      };

      console.log('📤 请求 albumList:', requestData);

      const response = await axios.post(
        `${CLOUD_FUNCTION_BASE_URL}/getAlbumList`,
        requestData,
        {
          timeout: CLOUDBASE_CONFIG.API.TIMEOUT,
          headers,
        }
      );

      console.log('📥 响应 albumList:', response.data);

      if (response.data && response.data.code === 200) {
        return response.data;
      } else {
        throw new Error(response.data?.message || '获取相册列表失败');
      }
    } catch (error: any) {
      console.error('❌ 获取相册列表失败:', error);
      
      if (error.response) {
        throw new Error(error.response.data?.message || `服务器错误: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('网络连接失败，请检查网络后重试');
      } else {
        throw new Error(error.message || '获取相册列表失败');
      }
    }
  }

  /**
   * 获取维度配置
   * 调用云函数: getCategoryConfig
   */
  async getCategoryConfig(): Promise<CategoryConfigResponse> {
    try {
      const token = authService.getCurrentAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('📤 请求 category (getCategoryConfig)');

      const response = await axios.post(
        `${CLOUD_FUNCTION_BASE_URL}/getCategoryConfig`,
        {},
        {
          timeout: CLOUDBASE_CONFIG.API.TIMEOUT,
          headers,
        }
      );

      console.log('📥 响应 category:', response.data);

      if (response.data && response.data.code === 200) {
        return response.data;
      } else {
        throw new Error(response.data?.message || '获取维度配置失败');
      }
    } catch (error: any) {
      console.error('❌ 获取维度配置失败:', error);
      
      if (error.response) {
        throw new Error(error.response.data?.message || `服务器错误: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('网络连接失败，请检查网络后重试');
      } else {
        throw new Error(error.message || '获取维度配置失败');
      }
    }
  }
}

export const albumService = new AlbumService();


