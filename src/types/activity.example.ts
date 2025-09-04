import { Activity, ActivityType, ActivityStatus, AlbumLevel } from './model/activity';

/**
 * 示例活动数据
 * 对应 test.json 的数据结构
 */
export const exampleActivity: Activity = {
  activity_type: ActivityType.ALBUM,
  activity_status: ActivityStatus.ACTIVE,
  activiy_id: 'at_1888958525505814528',
  album_id_list: [
    {
      album_id: 'album_1888958525505814528',
      album_name: 'album_1888958525505814528',
      album_description: 'album_1888958525505814528',
      album_image: 'album_1888958525505814528',
      level: AlbumLevel.PREMIUM,
      price: 100,
      template_list: [
        {
          template_id: 'template_1888958525505814528',
          template_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
          template_name: 'template_1888958525505814528',
          template_description: 'template_1888958525505814528'
        },
        {
          template_id: 'template_1888958525505814529',
          template_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
          template_name: 'template_1888958525505814529',
          template_description: 'template_1888958525505814529'
        },
        {
          template_id: 'template_1888958525505814530',
          template_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
          template_name: 'template_1888958525505814530',
          template_description: 'template_1888958525505814530'
        }
      ]
    },
    {
      album_id: 'album_1888958525505814529',
      album_name: 'album_1888958525505814529',
      album_description: 'album_1888958525505814529',
      album_image: 'album_1888958525505814529',
      level: AlbumLevel.PREMIUM,
      price: 200,
      template_list: [
        {
          template_id: 'template_1888958525505814528',
          template_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
          template_name: 'template_1888958525505814528',
          template_description: 'template_1888958525505814528'
        },
        {
          template_id: 'template_1888958525505814529',
          template_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
          template_name: 'template_1888958525505814529',
          template_description: 'template_1888958525505814529'
        },
        {
          template_id: 'template_1888958525505814530',
          template_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
          template_name: 'template_1888958525505814530',
          template_description: 'template_1888958525505814530'
        }
      ]
    }
  ]
};

/**
 * 使用示例：获取免费相册
 */
export const getFreeAlbums = (activity: Activity) => {
  return activity.album_id_list.filter(album => album.level === AlbumLevel.FREE);
};

/**
 * 使用示例：获取付费相册
 */
export const getPremiumAlbums = (activity: Activity) => {
  return activity.album_id_list.filter(album => album.level === AlbumLevel.PREMIUM);
};

/**
 * 使用示例：根据模板ID查找相册
 */
export const findAlbumByTemplateId = (activity: Activity, templateId: string) => {
  return activity.album_id_list.find(album => 
    album.template_list.some(template => template.template_id === templateId)
  );
};

/**
 * 使用示例：获取所有模板
 */
export const getAllTemplates = (activity: Activity) => {
  return activity.album_id_list.flatMap(album => album.template_list);
};
