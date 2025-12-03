import { mockAlbumList, mockCategoryConfig } from '../../mock/new_mock_data';
import { AlbumListResponse, AlbumRecord } from '../../types/model/album';
import { CategoryConfigResponse } from '../../types/model/config';

// 模拟网络延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
   * 获取相册列表 (Mock implementation)
   * 实际调用云函数: getAlbumList
   */
  async getAlbumList(params: GetAlbumListParams): Promise<AlbumListResponse> {
    await delay(600); // Simulate 600ms latency

    let filtered = [...mockAlbumList];

    // 1. 筛选 Function Type
    if (params.function_types && params.function_types.length > 0) {
      filtered = filtered.filter(album => 
        params.function_types!.includes(album.function_type)
      );
    }

    // 2. 筛选 Theme Style
    if (params.theme_styles && params.theme_styles.length > 0) {
      filtered = filtered.filter(album => 
        // album.theme_styles 包含 请求的 theme_styles 中任意一个
        album.theme_styles.some(style => params.theme_styles!.includes(style))
      );
    }

    // 3. 筛选 Activity Tags
    if (params.activity_tags && params.activity_tags.length > 0) {
      filtered = filtered.filter(album => 
        album.activity_tags.some(tag => params.activity_tags!.includes(tag))
      );
    }

    // 4. 排序
    filtered.sort((a, b) => {
      if (params.sort_by === 'likes') {
        return b.likes - a.likes;
      } else if (params.sort_by === 'created_at') {
        return b.created_at - a.created_at;
      } else {
        // Default: sort_weight desc -> likes desc -> created_at desc
        if (b.sort_weight !== a.sort_weight) return b.sort_weight - a.sort_weight;
        if (b.likes !== a.likes) return b.likes - a.likes;
        return b.created_at - a.created_at;
      }
    });

    // 5. 分页
    const page = params.page || 1;
    const pageSize = params.page_size || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filtered.slice(start, end);

    return {
      code: 200,
      message: 'Success (Mock)',
      data: {
        albums: paginated,
        total: filtered.length,
        has_more: end < filtered.length
      }
    };
  }

  /**
   * 获取维度配置 (Mock implementation)
   * 实际调用云函数: getCategoryConfig
   */
  async getCategoryConfig(): Promise<CategoryConfigResponse> {
    await delay(400);
    return {
      code: 200,
      message: 'Success (Mock)',
      data: mockCategoryConfig
    };
  }
}

export const albumService = new AlbumService();


