import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { asyncTaskService, BailianParams } from '../../services/cloud/asyncTaskService';
import { userWorkService } from '../../services/database/userWorkService';
import { TaskStatus, UserWorkModel } from '../../types/model/user_works';
import { fetchUserWorks } from './userWorksSlice';
import { imageUploadService } from '../../services/imageUploadService';

// 任务信息接口
export interface AsyncTask {
  taskId: string;
  workId: string; // 关联的作品ID
  status: TaskStatus;
  startTime: number;
  activityTitle: string;
  coverImage: string; // 用于悬浮条展示
  error?: string;
  resultImage?: string;
  updatedWork?: UserWorkModel; // 任务完成后的最新作品数据
}

interface AsyncTaskState {
  tasks: AsyncTask[];
  isPanelOpen: boolean; // 面板开启状态
}

const initialState: AsyncTaskState = {
  tasks: [],
  isPanelOpen: false, // 面板默认关闭，通过悬浮条打开
};

// 发起异步任务
export const startAsyncTask = createAsyncThunk(
  'asyncTask/start',
  async (
    payload: {
      prompt: string;
      images: string[];
      activityId: string;
      activityTitle: string;
      activityDescription?: string;
      activityImage?: string;
      uid: string;
      templateId: string; // 即使是自由生成，可能也有一个虚拟模板ID
      promptData?: any;
      price?: number; // 模板价格（美美币），0表示免费
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      // 1. 调用云函数发起任务
      const bailianParams: BailianParams = {
        prompt: payload.prompt,
        images: payload.images,
        params: {
          n: 1,
          size: "720*1280" // 9:16 比例
        },
        user_id: payload.uid,
        price: payload.price || 0,
      };

      const apiResponse = await asyncTaskService.callBailian(bailianParams);

      if (!apiResponse.success || !apiResponse.taskId) {
        // 处理余额不足错误
        if (apiResponse.errorCode === 'INSUFFICIENT_BALANCE') {
          throw new Error(`余额不足：需要${apiResponse.requiredAmount}美美币，当前余额${apiResponse.currentBalance}美美币`);
        }
        throw new Error(apiResponse.error || '启动任务失败');
      }

      const taskId = apiResponse.taskId;

      // 2. 创建数据库记录（状态为进行中）
      // 注意：这里需要UserWorkModel匹配数据库结构
      const workData: any = {
        uid: payload.uid,
        activity_id: payload.activityId,
        activity_type: 'asyncTask',
        activity_title: payload.activityTitle,
        activity_description: payload.activityDescription || '',
        activity_image: payload.activityImage || payload.images[0],
        album_id: '', // 异步任务可能没有特定相册ID，或者复用ActivityID
        likes: '0',
        is_public: '0',
        download_count: '0',
        // 新增顶层字段
        taskId: taskId,
        taskStatus: TaskStatus.PENDING,
        result_data: [
          {
            template_id: payload.templateId,
            template_image: payload.images[0], //以此作为模板图
            result_image: '' // 尚未生成
          }
        ],
        ext_data: JSON.stringify({
          task_id: taskId,
          task_status: TaskStatus.PENDING,
          selfie_url: payload.images[0], // 保存自拍图
          prompt_data: payload.promptData
        }),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const createResult = await userWorkService.createWork(workData);

      if (!createResult.success || !createResult.data?.id) {
        throw new Error(createResult.error?.message || '创建作品记录失败');
      }

      const workId = createResult.data.id;

      // 3. 返回任务信息
      return {
        taskId,
        workId,
        status: TaskStatus.PENDING,
        startTime: Date.now(),
        activityTitle: payload.activityTitle,
        coverImage: payload.activityImage || payload.images[0]
      };

    } catch (error: any) {
      return rejectWithValue(error.message || '发起任务失败');
    }
  }
);

// 轮询单个任务
export const pollAsyncTask = createAsyncThunk(
  'asyncTask/poll',
  async (task: AsyncTask, { dispatch, rejectWithValue }) => {
    try {
      console.log('[Redux] 正在轮询任务:', task.taskId); // LOG: Query Task Start
      const response = await asyncTaskService.queryTask(task.taskId);
      console.log('[Redux] 轮询响应:', response); // LOG: Query Task Response

      if (!response.success) {
        // 查询失败暂不视为任务失败，可能是网络波动
        console.warn('[Redux] 轮询任务失败:', task.taskId, response.error);
        return { ...task, error: response.error };
      }

      if (response.taskStatus === 'SUCCEEDED') {
         console.log('[Redux] 任务成功:', task.taskId); // LOG: Task Succeeded
      } else if (response.taskStatus === 'FAILED') {
         console.log('[Redux] 任务失败:', task.taskId);
      }

      let newStatus = task.status;
      let resultImage = '';

      if (response.taskStatus === 'SUCCEEDED') {
        newStatus = TaskStatus.SUCCESS;
        if (response.results && response.results.length > 0) {
          resultImage = response.results[0].url;
        }
      } else if (response.taskStatus === 'FAILED' || response.taskStatus === 'CANCELED') {
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
            let extDataObj = {};
            try {
                extDataObj = JSON.parse(work.record?.ext_data || '{}');
            } catch (e) {}

            // 如果成功，先上传图片到COS，再更新 result_data
            if (newStatus === TaskStatus.SUCCESS && resultImage) {
                console.log('[Redux] 任务成功，开始上传图片到COS:', resultImage);
                
                // 上传图片到COS（传入 album_id 用于文件命名）
                const albumId = work.record?.album_id || work.record?.activity_id || undefined;
                const uploadResult = await imageUploadService.uploadImageToCOS(resultImage, 'user_works', albumId);
                
                if (!uploadResult.success || !uploadResult.cosUrl) {
                    console.error('[Redux] 图片上传到COS失败:', uploadResult.error);
                    // 即使上传失败，也保存临时URL，避免数据丢失
                    // 但记录错误信息到 ext_data
                    const resultData = work.record?.result_data || [];
                    if (resultData.length > 0) {
                        const newResultData = [...resultData];
                        newResultData[0] = { ...newResultData[0], result_image: resultImage };
                        updateData.result_data = newResultData;
                    }
                    
                    // 记录上传失败信息
                    updateData.ext_data = JSON.stringify({
                        ...extDataObj,
                        task_status: newStatus,
                        task_id: task.taskId,
                        cos_upload_failed: true,
                        cos_upload_error: uploadResult.error,
                        result_image_temp_url: resultImage, // 保留临时URL作为备份
                    });
                } else {
                    console.log('[Redux] 图片上传到COS成功:', uploadResult.cosUrl);
                    
                    // 使用COS URL更新 result_data
                    const resultData = work.record?.result_data || [];
                    if (resultData.length > 0) {
                        const newResultData = [...resultData];
                        newResultData[0] = { ...newResultData[0], result_image: uploadResult.cosUrl };
                        updateData.result_data = newResultData;
                    }
                    
                    // 更新 ext_data，记录COS URL
                    updateData.ext_data = JSON.stringify({
                        ...extDataObj,
                        task_status: newStatus,
                        task_id: task.taskId,
                        result_image_cos_url: uploadResult.cosUrl,
                    });
                }
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
                console.log('[Redux] DB更新成功，即将刷新数据...');
                
                // 触发全局列表刷新 (如果作品属于当前用户)
                if (work.record?.uid) {
                    console.log('[Redux] 触发用户作品列表刷新 uid:', work.record?.uid);
                    dispatch(fetchUserWorks({ uid: work.record?.uid }));
                }
                
                // 同时也拉取最新单条数据 (供 Preview 页使用，因为它依赖 updatedWork)
                try {
                  const latestWorkResult = await userWorkService.getWorkByTaskId(task.taskId);
                  if (latestWorkResult.success && latestWorkResult.data) {
                      const rawData = latestWorkResult.data as any;
                      updatedWork = rawData.record ? rawData.record : rawData;
                      console.log('[Redux] 最新单条作品数据拉取成功');
                  }
                } catch(fetchError) {
                    console.error('[Redux] 拉取最新作品数据失败:', fetchError);
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

    } catch (error: any) {
      return rejectWithValue(error.message || '轮询失败');
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

export const { togglePanel, removeTask, addTask } = asyncTaskSlice.actions;
export default asyncTaskSlice.reducer;
