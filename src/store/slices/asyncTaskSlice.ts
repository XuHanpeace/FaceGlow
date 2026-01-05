import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { asyncTaskService, BailianParams, TaskType } from '../../services/cloud/asyncTaskService';
import { userWorkService } from '../../services/database/userWorkService';
import { TaskStatus, UserWorkModel, ResultData } from '../../types/model/user_works';
import { fetchUserWorks, updateWorkItem } from './userWorksSlice';

// 任务信息接口
export interface AsyncTask {
  taskId: string;
  workId: string; // 关联的作品ID
  taskType: TaskType;
  status: TaskStatus;
  startTime: number;
  activityTitle: string;
  coverImage: string; // 用于悬浮条展示
  error?: string;
  resultImage?: string;
  updatedWork?: UserWorkModel; // 任务完成后的最新作品数据
}

/**
 * 异步任务错误接口
 */
export interface AsyncTaskError {
  /** 错误代码 */
  errCode: string;
  /** 错误消息 */
  message: string;
  /** 错误数据（如余额不足时的 currentBalance, requiredAmount） */
  data?: {
    currentBalance?: number;
    requiredAmount?: number;
  };
}

/**
 * 提示词数据接口
 */
export interface PromptData {
  text: string;
  srcImage?: string;
  resultImage?: string;
  styleTitle?: string;
  styleDesc?: string;
}

/**
 * 视频参数接口
 */
export interface VideoParams {
  duration?: number;
  fps?: number;
  resolution?: string; // 图生视频分辨率：480P、720P、1080P
  template?: string; // 视频特效模板
  style_type?: string; // 视频特效风格类型（向后兼容）
}

/**
 * 人像风格重绘参数接口
 */
export interface StyleRedrawParams {
  style_index?: number; // 风格索引（0-9为预设风格，-1为自定义风格）
  style_ref_url?: string; // 风格参考图URL（当style_index=-1时必填）
}

/**
 * 发起异步任务的参数接口
 */
export interface StartAsyncTaskPayload {
  /** 任务类型：图生图、图生视频、视频特效 */
  taskType: TaskType;
  /** 提示词文本 */
  prompt: string;
  /** 是否启用自定义提示词（图生视频使用） */
  enableCustomPrompt?: boolean;
  /** 用户自定义提示词（图生视频使用） */
  customPrompt?: string;
  /** 图片URL数组（图生图、图生视频使用） */
  images?: string[];
  /** 是否排除 result_image（豆包图生图使用，默认 false 即参考 result_image，保持历史版本兼容）
   * - true：仅使用用户自拍图 + prompt 生图，不参考 result_image
   * - false：使用用户自拍图 + result_image + prompt 生图（默认）
   */
  excludeResultImage?: boolean;
  /** 视频URL（视频特效使用） */
  videoUrl?: string;
  /** 音频URL（图生视频使用，可选） */
  audioUrl?: string;
  /** 活动ID */
  activityId: string;
  /** 相册ID */
  albumId?: string;
  /** 活动标题 */
  activityTitle: string;
  /** 活动描述 */
  activityDescription?: string;
  /** 活动图片 */
  activityImage?: string;
  /** 模板ID */
  templateId: string;
  /** 提示词数据（用于保存到数据库） */
  promptData?: PromptData;
  /** 模板价格（美美币），0表示免费 */
  price?: number;
  /** 视频参数 */
  videoParams?: VideoParams;
  /** 人像风格重绘参数 */
  styleRedrawParams?: StyleRedrawParams;
}

interface AsyncTaskState {
  tasks: AsyncTask[];
  isPanelOpen: boolean; // 面板开启状态
}

const initialState: AsyncTaskState = {
  tasks: [],
  isPanelOpen: false, // 面板默认关闭，通过悬浮条打开
};

/**
 * 后台处理豆包图生图任务
 */
async function processDoubaoTaskInBackground(params: {
  taskId: string;
  bailianParams: BailianParams;
  dispatch: (action: any) => void;
}) {
  const { taskId, bailianParams, dispatch } = params;
  
  try {
    console.log('[Redux] 开始后台处理豆包图生图任务:', taskId);
    
    // 调用 API
    const apiResponse = await asyncTaskService.callBailian(bailianParams);

    if (!apiResponse.success) {
      // 处理余额不足错误（特殊处理）
      if (apiResponse.errCode === 'INSUFFICIENT_BALANCE') {
        const error: AsyncTaskError = {
          errCode: 'INSUFFICIENT_BALANCE',
          message: apiResponse.errorMsg || '余额不足',
          data: {
            currentBalance: apiResponse.data?.currentBalance ?? 0,
            requiredAmount: apiResponse.data?.requiredAmount ?? 0,
          }
        };
        // 余额不足时，更新任务状态为失败，并记录错误信息
        const workResult = await userWorkService.getWorkByTaskId(taskId);
        if (workResult.success && workResult.data) {
          const work = workResult.data;
          const updateData: Partial<UserWorkModel> = {
            taskStatus: TaskStatus.FAILED,
          };
          await userWorkService.updateWork(work.record?._id!, updateData);
        }
        dispatch(updateDoubaoTaskStatus({
          taskId,
          status: TaskStatus.FAILED,
          error: `余额不足（需要${error.data?.requiredAmount}，当前${error.data?.currentBalance}）`
        }));
        return;
      }
      
      // 其他错误：更新任务状态为失败
      const workResult = await userWorkService.getWorkByTaskId(taskId);
      if (workResult.success && workResult.data) {
        const work = workResult.data;
        const updateData: Partial<UserWorkModel> = {
          taskStatus: TaskStatus.FAILED,
        };
        await userWorkService.updateWork(work.record?._id!, updateData);
      }
      
      // 更新 Redux 状态
      dispatch(updateDoubaoTaskStatus({
        taskId,
        status: TaskStatus.FAILED,
        error: apiResponse.errorMsg || '豆包图生图失败'
      }));
      return;
    }

    const resultUrl = apiResponse.data?.resultUrl;
    if (!resultUrl) {
      // 更新任务状态为失败
      const workResult = await userWorkService.getWorkByTaskId(taskId);
      if (workResult.success && workResult.data) {
        const work = workResult.data;
        const updateData: Partial<UserWorkModel> = {
          taskStatus: TaskStatus.FAILED,
        };
        await userWorkService.updateWork(work.record?._id!, updateData);
      }
      
      dispatch(updateDoubaoTaskStatus({
        taskId,
        status: TaskStatus.FAILED,
        error: '豆包图生图未返回结果URL'
      }));
      return;
    }

    // 更新作品记录
    const workResult = await userWorkService.getWorkByTaskId(taskId);
    if (workResult.success && workResult.data) {
      const work = workResult.data;
      const workId = work.record?._id!;

      // 解析 ext_data
      let extDataObj: any = {};
      try {
        extDataObj = JSON.parse(work.record?.ext_data || '{}');
      } catch (e) {}

      // 更新 result_data
      const resultData = work.record?.result_data || [];
      const newResultData = [...resultData];
      if (newResultData.length > 0) {
        newResultData[0] = {
          ...newResultData[0],
          result_image: resultUrl
        };
      }

      // 更新 ext_data
      extDataObj.result_url = resultUrl;
      extDataObj.task_status = TaskStatus.SUCCESS;

      const updateData: Partial<UserWorkModel> = {
        taskStatus: TaskStatus.SUCCESS,
        result_data: newResultData,
        ext_data: JSON.stringify(extDataObj),
        updatedAt: Date.now()
      };

      await userWorkService.updateWork(workId, updateData);

      // 获取更新后的作品数据（使用 taskId 而不是 workId，避免 HTTP 500 错误）
      let updatedWork: UserWorkModel | undefined;
      try {
        const updatedWorkResult = await userWorkService.getWorkByTaskId(taskId);
        if (updatedWorkResult.success && updatedWorkResult.data) {
          const rawData = updatedWorkResult.data as any;
          const workData = rawData.record ? rawData.record : rawData;
          
          if (workData) {
            // 确保 taskStatus 字段正确设置
            const workWithStatus = {
              ...workData,
              taskStatus: workData.taskStatus || TaskStatus.SUCCESS
            };
            updatedWork = workWithStatus as UserWorkModel;
          }
        }
      } catch (error) {
        console.error('[Redux] 获取更新后的作品数据失败:', error);
        // 即使获取失败，也继续更新 Redux 状态（使用已更新的数据）
        updatedWork = {
          ...work.record!,
          taskStatus: TaskStatus.SUCCESS,
          result_data: newResultData,
          ext_data: JSON.stringify(extDataObj),
          updatedAt: Date.now()
        } as UserWorkModel;
      }

      // 更新 Redux 状态
      dispatch(updateDoubaoTaskStatus({
        taskId,
        status: TaskStatus.SUCCESS,
        resultImage: resultUrl,
        updatedWork: updatedWork || undefined
      }));

      // 更新作品列表
      if (updatedWork) {
        dispatch(updateWorkItem(updatedWork));
      }

      console.log('[Redux] 豆包图生图任务处理完成:', taskId, resultUrl);
    }
  } catch (error) {
    console.error('[Redux] 豆包图生图后台处理异常:', error);
    
    // 更新任务状态为失败
    const workResult = await userWorkService.getWorkByTaskId(taskId);
    if (workResult.success && workResult.data) {
      const work = workResult.data;
      const updateData: Partial<UserWorkModel> = {
        taskStatus: TaskStatus.FAILED,
      };
      await userWorkService.updateWork(work.record?._id!, updateData);
    }
    
    dispatch(updateDoubaoTaskStatus({
      taskId,
      status: TaskStatus.FAILED,
      error: error instanceof Error ? error.message : '处理失败'
    }));
  }
}

// 发起异步任务
export const startAsyncTask = createAsyncThunk(
  'asyncTask/start',
  async (
    payload: StartAsyncTaskPayload,
    { rejectWithValue, dispatch }
  ) => {
    try {
      // 1. 调用云函数发起任务
      const bailianParams: BailianParams = {
        task_type: payload.taskType,
        prompt: payload.prompt,
        enable_custom_prompt: payload.enableCustomPrompt,
        custom_prompt: payload.customPrompt,
        images: payload.images,
        video_url: payload.videoUrl,
        audio_url: payload.audioUrl,
        params: {
          n: 1,
          size: "720*1280", // 9:16 比例（图生图使用）
          duration: payload.videoParams?.duration, // 保留兼容性，但图生视频使用resolution
          fps: payload.videoParams?.fps, // 保留兼容性，但图生视频使用resolution
          resolution: payload.videoParams?.resolution || '720P', // 图生视频和视频特效分辨率，默认720P
          template: payload.videoParams?.template || payload.videoParams?.style_type, // 视频特效模板（如 "frenchkiss"），在API中使用input.template
          style_type: payload.videoParams?.style_type, // 视频特效风格类型（向后兼容，会映射为template）
          // 人像风格重绘参数
          style_index: payload.styleRedrawParams?.style_index,
          style_ref_url: payload.styleRedrawParams?.style_ref_url,
        },
        // 统一由 HttpClient 拦截器注入 uid，避免业务层手动拼装
        user_id: '__AUTO__',
        price: payload.price || 0,
      };

      // 豆包图生图：先创建 PENDING 状态的任务，然后在后台处理
      if (payload.taskType === TaskType.DOUBAO_IMAGE_TO_IMAGE) {
        // 注意：余额检查在后台处理时进行，如果余额不足会更新任务状态为失败
        // 1. 先创建 PENDING 状态的任务记录（不调用 API）
        const taskId = `doubao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const coverImage = payload.activityImage || 
                          (payload.images && payload.images.length > 0 ? payload.images[0] : '') || 
                          '';

        const resultData: ResultData[] = [
          {
            template_id: payload.templateId,
            template_image: coverImage,
            result_image: '' // 尚未生成
          }
        ];

        // 正确获取用户自拍图URL
        // 对于豆包图生图：如果 exclude_result_image 为 false，result_image 在 images[0]，用户自拍在 images[1]；如果为 true，用户自拍在 images[0]
        // 对于其他任务：用户自拍在 images[0]
        let selfieUrl = payload.images?.[0];
        if (payload.taskType === 'doubao_image_to_image' && payload.excludeResultImage === false && payload.images && payload.images.length > 1) {
          // 豆包图生图且未排除 result_image：用户自拍在 images[1]
          selfieUrl = payload.images[1];
        } else if (payload.taskType === 'doubao_image_to_image' && payload.excludeResultImage === true) {
          // 豆包图生图且排除 result_image：用户自拍在 images[0]
          selfieUrl = payload.images?.[0];
        } else {
          // 其他任务：用户自拍在 images[0]
          selfieUrl = payload.images?.[0];
        }

        const extData = {
          task_id: taskId,
          task_status: TaskStatus.PENDING,
          task_type: payload.taskType,
          selfie_url: selfieUrl, // 保存用户选择的自拍图（正确获取）
          scene_url: payload.images?.[1], // 保存图2（result_image，场景图，如果存在）
          exclude_result_image: payload.excludeResultImage || false, // 保存是否排除 result_image 的标记位（true=仅使用用户自拍图+prompt，false=使用用户自拍图+result_image+prompt）
          prompt_data: payload.promptData,
          price: payload.price || 0,
          template_id: payload.templateId,
          activity_id: payload.activityId,
          activity_title: payload.activityTitle,
          activity_image: coverImage,
          video_params: payload.videoParams,
          style_redraw_params: payload.styleRedrawParams,
          audio_url: payload.audioUrl,
        };

        const workData: Omit<UserWorkModel, '_id' | 'uid'> = {
          activity_id: payload.activityId,
          activity_type: 'asyncTask',
          activity_title: payload.activityTitle,
          activity_description: payload.activityDescription || '',
          activity_image: coverImage,
          album_id: payload.albumId || '',
          likes: '0',
          is_public: '0',
          download_count: '0',
          result_data: resultData,
          ext_data: JSON.stringify(extData),
          taskId: taskId,
          taskStatus: TaskStatus.PENDING,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        const createResult = await userWorkService.createWork(workData);

        if (!createResult.success || !createResult.data?.id) {
          throw new Error(createResult.error?.message || '创建作品记录失败');
        }

        const workId = createResult.data.id;

        // 2. 立即返回 PENDING 状态的任务信息
        const pendingTask: AsyncTask = {
          taskId,
          workId,
          status: TaskStatus.PENDING,
          startTime: Date.now(),
          activityTitle: payload.activityTitle,
          coverImage: payload.activityImage || (payload.images && payload.images.length > 0 ? payload.images[0] : ''),
          updatedWork: {
            ...workData,
            _id: workId,
            ext_data: JSON.stringify(extData), // 保存 ext_data，包含 task_type
          } as UserWorkModel,
        };

        // 3. 在后台异步调用 API（不阻塞返回）
        // 余额检查在后台处理时进行，如果余额不足会更新任务状态为失败
        processDoubaoTaskInBackground({
          taskId,
          bailianParams,
          dispatch
        }).catch((error) => {
          console.error('[Redux] 豆包图生图后台处理失败:', error);
        });

        return pendingTask;
      }

      // 其他异步任务：正常调用 API（包含余额检查）
      const apiResponse = await asyncTaskService.callBailian(bailianParams);

      if (!apiResponse.success) {
        // 处理余额不足错误
        if (apiResponse.errCode === 'INSUFFICIENT_BALANCE') {
          const error: AsyncTaskError = {
            errCode: 'INSUFFICIENT_BALANCE',
            message: apiResponse.errorMsg || '余额不足',
            data: {
              currentBalance: apiResponse.data?.currentBalance ?? 0,
              requiredAmount: apiResponse.data?.requiredAmount ?? 0,
            }
          };
          return rejectWithValue(error);
        }
        const error: AsyncTaskError = {
          errCode: apiResponse.errCode || 'UNKNOWN_ERROR',
          message: apiResponse.errorMsg || '启动任务失败',
          data: apiResponse.data || undefined
        };
        return rejectWithValue(error);
      }

      // 其他异步任务需要 taskId
      const taskId = apiResponse.data?.taskId;
      if (!taskId) {
        throw new Error('任务ID缺失');
      }

      // 2. 创建数据库记录（状态为进行中）
      const coverImage = payload.activityImage || 
                        (payload.images && payload.images.length > 0 ? payload.images[0] : '') || 
                        payload.videoUrl || 
                        '';

      const resultData: ResultData[] = [
        {
          template_id: payload.templateId,
          template_image: coverImage, // 以此作为模板图或视频封面
          result_image: '' // 尚未生成（可能是图片或视频URL）
        }
      ];

      // 正确获取用户自拍图URL（同步任务）
      // 对于同步任务，用户自拍在 images[0]
      const selfieUrl = payload.images?.[0];

      const extData = {
        task_id: taskId,
        task_status: TaskStatus.PENDING,
        task_type: payload.taskType,
        selfie_url: selfieUrl, // 保存用户选择的自拍图
        scene_url: payload.images?.[1], // 兜底
        video_url: payload.videoUrl, // 保存视频URL（视频特效）
        prompt_data: payload.promptData,
        price: payload.price || 0,
        template_id: payload.templateId,
        activity_id: payload.activityId,
        activity_title: payload.activityTitle,
        activity_image: coverImage,
        video_params: payload.videoParams,
        style_redraw_params: payload.styleRedrawParams,
        audio_url: payload.audioUrl,
      };

        const workData: Omit<UserWorkModel, '_id' | 'uid'> = {
        activity_id: payload.activityId,
        activity_type: 'asyncTask', // 异步任务统一使用 asyncTask，与同步任务（face fusion）区分
        activity_title: payload.activityTitle,
        activity_description: payload.activityDescription || '',
        activity_image: coverImage,
        album_id: '', // 异步任务可能没有特定相册ID，或者复用ActivityID
        likes: '0',
        is_public: '0',
        download_count: '0',
        result_data: resultData,
        ext_data: JSON.stringify(extData),
        // 扩展字段（用于数据库存储）
        taskId: taskId,
        taskStatus: TaskStatus.PENDING,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const createResult = await userWorkService.createWork(workData);

      if (!createResult.success || !createResult.data?.id) {
        throw new Error(createResult.error?.message || '创建作品记录失败');
      }

      const workId = createResult.data.id;

      // 3. 返回任务信息（包含 updatedWork，以便后续获取 task_type）
      const workDataForTask: Omit<UserWorkModel, '_id' | 'uid'> = {
        activity_id: payload.activityId,
        activity_type: 'asyncTask',
        activity_title: payload.activityTitle,
        activity_description: payload.activityDescription || '',
        activity_image: coverImage,
        album_id: '',
        likes: '0',
        is_public: '0',
        download_count: '0',
        result_data: resultData,
        ext_data: JSON.stringify(extData), // 保存 ext_data，包含 task_type
        taskId: taskId,
        taskStatus: TaskStatus.PENDING,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      return {
        taskId,
        workId,
        taskType: payload.taskType,
        status: TaskStatus.PENDING,
        startTime: Date.now(),
        activityTitle: payload.activityTitle,
        coverImage: payload.activityImage || (payload.images && payload.images.length > 0 ? payload.images[0] : ''),
        updatedWork: {
          ...workDataForTask,
          _id: workId,
        } as UserWorkModel,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发起任务失败';
      const asyncTaskError: AsyncTaskError = {
        errCode: 'UNKNOWN_ERROR',
        message: errorMessage,
      };
      return rejectWithValue(asyncTaskError);
    }
  }
);

// 轮询单个任务
export const pollAsyncTask = createAsyncThunk(
  'asyncTask/poll',
  async (task: AsyncTask, { dispatch, rejectWithValue }) => {
    try {
      console.log('[Redux] 正在轮询任务:', task.taskId); // LOG: Query Task Start
      const response = await asyncTaskService.queryTask(task.taskId, task.taskType);
      console.log('[Redux] 轮询响应:', response); // LOG: Query Task Response

      if (!response.success) {
        // 查询失败暂不视为任务失败，可能是网络波动，不污染UI
        console.warn('[Redux] 轮询任务失败:', task.taskId, response.errorMsg);
        return { ...task, error: undefined };
      }

      const taskStatus = response.data?.taskStatus || 'UNKNOWN';
      
      // 遇到 UNKNOWN 状态，终止轮询（将任务标记为失败）
      if (taskStatus === 'UNKNOWN') {
        console.warn('[Redux] 任务状态为 UNKNOWN，终止轮询:', task.taskId);
        return {
          ...task,
          status: TaskStatus.FAILED,
          error: '任务状态未知，无法继续轮询',
          resultImage: '',
          updatedWork: undefined
        };
      }
      
      if (taskStatus === 'SUCCEEDED') {
         console.log('[Redux] 任务成功:', task.taskId); // LOG: Task Succeeded
      } else if (taskStatus === 'FAILED') {
         console.log('[Redux] 任务失败:', task.taskId);
      }

      let newStatus = task.status;
      let resultImage = '';

      if (taskStatus === 'SUCCEEDED') {
        newStatus = TaskStatus.SUCCESS;
        // 从 data.output 中获取结果URL
        if (response.data?.output) {
          // 优先使用 output.video_url（图生视频、图片特效）
          if (response.data.output.video_url) {
            resultImage = response.data.output.video_url;
            console.log('[Redux] 从 data.output.video_url 获取视频URL:', resultImage);
          }
          // 其次使用 output.results（图生图）
          else if (response.data.output.results && response.data.output.results.length > 0) {
            resultImage = response.data.output.results[0].url || '';
            console.log('[Redux] 从 data.output.results 获取图片URL:', resultImage);
          }
        }
        // 向后兼容：从 results 中获取（图生图）
        else if (response.data?.results && response.data.results.length > 0) {
          resultImage = response.data.results[0].url;
          console.log('[Redux] 从 data.results 获取URL:', resultImage);
        }
        
        console.log('[Redux] 轮询响应 - taskStatus:', taskStatus, 'resultImage:', resultImage);
      } else if (taskStatus === 'FAILED' || taskStatus === 'CANCELED') {
        newStatus = TaskStatus.FAILED;
      }

      let updatedWork: UserWorkModel | undefined;

      // 状态发生改变，更新数据库
      if (newStatus !== task.status) {
        console.log('[Redux] 更新作品状态为:', newStatus); // LOG: Update Work Status
        try {
          // 1. 优先使用 taskId 查找作品 (避免使用 workId 导致潜在的 500 错误)
          const workResult = await userWorkService.getWorkByTaskId(task.taskId);
          
          if (workResult.success && workResult.data) {
            const work = workResult.data;
            const workId = work.record?._id!; // 必须有 _id

            const updateData: Partial<UserWorkModel> = {
              taskStatus: newStatus
            };

            // 解析 ext_data
            let extDataObj: any = {};
            try {
                extDataObj = JSON.parse(work.record?.ext_data || '{}');
            } catch (e) {}

            // 如果成功，直接保存结果URL到数据库（不上传到COS）
            if (newStatus === TaskStatus.SUCCESS && resultImage) {
                console.log('[Redux] 任务成功，保存结果URL到数据库:', resultImage);
                
                const taskType = extDataObj.task_type || TaskType.IMAGE_TO_IMAGE;
                const isVideoResult = taskType === TaskType.IMAGE_TO_VIDEO || taskType === TaskType.VIDEO_EFFECT;
                
                // 更新 result_data
                    const resultData = work.record?.result_data || [];
                    if (resultData.length > 0) {
                        const newResultData = [...resultData];
                        newResultData[0] = { ...newResultData[0], result_image: resultImage };
                        updateData.result_data = newResultData;
                    }
                    
                // 更新 ext_data，保存结果URL（视频或图片）
                    updateData.ext_data = JSON.stringify({
                        ...extDataObj,
                        task_status: newStatus,
                        task_id: task.taskId,
                    // 保存结果URL到 ext_data（用于展示个人作品）
                    ...(isVideoResult ? { video_url: resultImage } : { image_url: resultImage }),
                });
                
                console.log('[Redux] ext_data 已更新，保存的URL:', resultImage);
            } else if (newStatus === TaskStatus.SUCCESS && !resultImage) {
                // 成功但无结果URL（理论上不应该发生，但保留处理）
                    updateData.ext_data = JSON.stringify({
                        ...extDataObj,
                        task_status: newStatus,
                        task_id: task.taskId,
                    });
            } else {
                // 非成功状态，只更新状态信息
                updateData.ext_data = JSON.stringify({
                    ...extDataObj,
                    task_status: newStatus,
                    task_id: task.taskId
                });
            }

            // 2. 使用 _id 更新作品
            console.log('[Redux] 正在更新DB workId:', workId, '更新数据:', updateData); // LOG: Update UserWork
            const updateResult = await userWorkService.updateWork(workId, updateData);
            console.log('[Redux] DB更新结果:', updateResult); // LOG: Update UserWork Result
            
            if (!updateResult.success) {
              console.warn('[Redux] DB更新失败:', updateResult.error);
            } else {
                // 3. DB更新成功后
                console.log('[Redux] DB更新成功，即将更新Redux状态...');
                
                // 拉取最新单条数据并更新Redux状态（而不是重新获取整个列表）
                // 这样可以避免因为分页限制（只返回前20个）而丢失新创建的作品
                try {
                  const latestWorkResult = await userWorkService.getWorkByTaskId(task.taskId);
                  if (latestWorkResult.success && latestWorkResult.data) {
                      const rawData = latestWorkResult.data as any;
                      const workData = rawData.record ? rawData.record : rawData;
                      
                      if (workData && workData._id) {
                        // 确保 taskStatus 字段正确设置（优先使用顶层字段，否则从 ext_data 中提取）
                        if (!workData.taskStatus && workData.ext_data) {
                          try {
                            const extData = JSON.parse(workData.ext_data);
                            if (extData.task_status) {
                              workData.taskStatus = extData.task_status;
                            }
                          } catch (e) {
                            console.warn('[Redux] 解析 ext_data 失败:', e);
                          }
                        }
                        
                        // 如果仍然没有 taskStatus，使用当前任务状态
                        if (!workData.taskStatus) {
                          workData.taskStatus = newStatus;
                        }
                        
                        // 使用 updateWorkItem 更新单个作品，而不是重新获取整个列表
                        // 这样可以避免因为分页限制而丢失其他作品
                        updatedWork = workData;
                        console.log('[Redux] 最新单条作品数据拉取成功，更新Redux状态，taskStatus:', workData.taskStatus);
                        dispatch(updateWorkItem(workData));
                        console.log('[Redux] 已通过 updateWorkItem 更新作品:', workData._id);
                      }
                  }
                } catch(fetchError) {
                    console.error('[Redux] 拉取最新作品数据失败:', fetchError);
                    // 如果拉取失败，仍然尝试刷新整个列表（作为兜底方案，uid 在底层自动获取）
                    console.log('[Redux] 拉取失败，使用兜底方案刷新整个列表');
                    dispatch(fetchUserWorks());
                }
            }
          } else {
            console.warn('[Redux] 未找到任务对应的作品:', task.taskId);
          }
        } catch (dbError) {
          console.error('[Redux] DB更新异常:', dbError);
          // 忽略数据库错误，确保前端状态能更新
        }
      }

      return {
        ...task,
        status: newStatus,
        resultImage, // 传递给 reducer
        updatedWork // 返回最新数据
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '轮询失败';
      return rejectWithValue(errorMessage);
    }
  }
);

const asyncTaskSlice = createSlice({
  name: 'asyncTask',
  initialState,
  reducers: {
    togglePanel: (state, action: PayloadAction<boolean | undefined>) => {
      state.isPanelOpen = action.payload !== undefined ? action.payload : !state.isPanelOpen;
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.taskId !== action.payload);
    },
    addTask: (state, action: PayloadAction<AsyncTask>) => {
      state.tasks.push(action.payload);
    },
    updateDoubaoTaskStatus: (state, action: PayloadAction<{
      taskId: string;
      status: TaskStatus;
      resultImage?: string;
      error?: string;
      updatedWork?: UserWorkModel;
    }>) => {
      const { taskId, status, resultImage, error, updatedWork } = action.payload;
      const index = state.tasks.findIndex(t => t.taskId === taskId);
      if (index !== -1) {
        state.tasks[index] = {
          ...state.tasks[index],
          status,
          resultImage,
          error,
          updatedWork
        };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Start Task
      .addCase(startAsyncTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
        state.isPanelOpen = true; // 自动打开面板
      })
      // Poll Task
      .addCase(pollAsyncTask.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        const index = state.tasks.findIndex(t => t.taskId === updatedTask.taskId);
        if (index !== -1) {
          state.tasks[index] = {
            ...state.tasks[index],
            status: updatedTask.status,
            error: updatedTask.error,
            resultImage: updatedTask.resultImage,
            updatedWork: updatedTask.updatedWork // 更新 Store
          };
        }
      });
  },
});

export const { togglePanel, removeTask, addTask, updateDoubaoTaskStatus } = asyncTaskSlice.actions;
export default asyncTaskSlice.reducer;
