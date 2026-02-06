/**
 * 任务系统类型定义
 */

// 任务类型枚举
export enum TaskType {
  SELFIE_UPLOAD = 'selfie_upload',       // 自拍上传
  SPRING_CREATION = 'spring_creation',   // 春节写真创作
  VIDEO_CREATION = 'video_creation',     // 视频创作
  WORK_SHARE = 'work_share',             // 作品转发
  WORK_DOWNLOAD = 'work_download',       // 作品下载
}

// 任务定义接口
export interface TaskDefinition {
  id: string;           // 任务ID
  title: string;        // 任务标题
  description: string;  // 任务描述
  icon: string;         // FontAwesome 图标名称
  iconBgColor: string;  // 图标背景颜色
  rewardAmount: number; // 奖励美美币数量
  targetCount: number;  // 目标完成次数
  taskType: TaskType;   // 任务类型
  sortOrder: number;    // 排序顺序
}

// 任务进度接口
export interface TaskProgress {
  taskId: string;           // 任务ID
  currentCount: number;     // 当前完成次数
  isCompleted: boolean;     // 是否已完成（达到目标次数）
  isRewardClaimed: boolean; // 是否已领取奖励
  completedAt?: number;     // 完成时间戳
  claimedAt?: number;       // 领取奖励时间戳
}

// 任务状态（用于UI展示）
export type TaskStatus = 'pending' | 'completed' | 'claimed';

// 任务与进度组合（用于UI展示）
export interface TaskWithProgress extends TaskDefinition {
  progress: TaskProgress;
  status: TaskStatus;
}

// 任务存储数据结构
export interface TaskStorageData {
  version: number;              // 数据版本号
  progressMap: Record<string, TaskProgress>; // 任务进度映射
  lastUpdated: number;          // 最后更新时间
}

// 新人任务配置
export const NEWCOMER_TASKS: TaskDefinition[] = [
  {
    id: 'task_selfie_upload',
    title: '上传自拍照',
    description: '上传3张自拍照，解锁更多玩法',
    icon: 'camera',
    iconBgColor: '#FF6B9D',
    rewardAmount: 30,
    targetCount: 3,
    taskType: TaskType.SELFIE_UPLOAD,
    sortOrder: 1,
  },
  {
    id: 'task_spring_creation',
    title: '春节写真创作',
    description: '使用春节模板创作3次写真',
    icon: 'star',
    iconBgColor: '#FF4444',
    rewardAmount: 20,
    targetCount: 3,
    taskType: TaskType.SPRING_CREATION,
    sortOrder: 2,
  },
  {
    id: 'task_video_creation',
    title: '视频创作',
    description: '创作1个“视频写真”作品',
    icon: 'video-camera',
    iconBgColor: '#9B59B6',
    rewardAmount: 15,
    targetCount: 1,
    taskType: TaskType.VIDEO_CREATION,
    sortOrder: 3,
  },
  {
    id: 'task_work_share',
    title: '分享作品',
    description: '分享作品给好友3次',
    icon: 'share-alt',
    iconBgColor: '#3498DB',
    rewardAmount: 15,
    targetCount: 3,
    taskType: TaskType.WORK_SHARE,
    sortOrder: 4,
  },
  {
    id: 'task_work_download',
    title: '下载作品',
    description: '下载3个作品到相册',
    icon: 'download',
    iconBgColor: '#2ECC71',
    rewardAmount: 10,
    targetCount: 3,
    taskType: TaskType.WORK_DOWNLOAD,
    sortOrder: 5,
  },
];

// 计算总奖励金额
export const getTotalRewardAmount = (): number => {
  return NEWCOMER_TASKS.reduce((sum, task) => sum + task.rewardAmount, 0);
};

// 根据任务类型获取任务定义
export const getTaskByType = (taskType: TaskType): TaskDefinition | undefined => {
  return NEWCOMER_TASKS.find(task => task.taskType === taskType);
};

// 根据任务ID获取任务定义
export const getTaskById = (taskId: string): TaskDefinition | undefined => {
  return NEWCOMER_TASKS.find(task => task.id === taskId);
};
