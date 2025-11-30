import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { asyncTaskService, BailianParams } from '../../services/cloud/asyncTaskService';
import { userWorkService } from '../../services/database/userWorkService';
import { TaskStatus } from '../../types/model/user_works';

// 任务信息接口
export interface AsyncTask {
  taskId: string;
  workId: string; // 关联的作品ID
  status: TaskStatus;
  startTime: number;
  activityTitle: string;
  coverImage: string; // 用于悬浮条展示
  error?: string;
}

interface AsyncTaskState {
  tasks: AsyncTask[];
  isPanelOpen: boolean; // 面板开启状态
}

const initialState: AsyncTaskState = {
  tasks: [],
  isPanelOpen: false,
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
          size: "1024*1024" // 默认尺寸
        }
      };

      const apiResponse = await asyncTaskService.callBailian(bailianParams);

      if (!apiResponse.success || !apiResponse.taskId) {
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
      const response = await asyncTaskService.queryTask(task.taskId);

      if (!response.success) {
        // 查询失败暂不视为任务失败，可能是网络波动
        return { ...task, error: response.error };
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

      // 状态发生改变，更新数据库
      if (newStatus !== task.status) {
        const updateData: any = {
           ext_data: JSON.stringify({
             task_id: task.taskId,
             task_status: newStatus,
             // 如果需要保留其他ext_data，这里可能需要先读取。
             // 但为了简化，假设这里只更新状态。
             // 实际上 ext_data 是全量覆盖还是 merge 取决于后端实现。
             // CloudBase update 通常是 merge 顶层字段，但 json string 内部需要自己处理。
             // 由于我们没有先读取，这里可能会覆盖 selfie_url。
             // TODO: 应该先读取 work，或者在 ext_data 中只存储必要信息。
             // 鉴于当前架构，我们只能尽量保留已知信息。
             // 更好的做法是在 UserWorkService 中实现 partial update of ext_data json (如果支持) 或者在 reducer 中处理。
             // 这里为了安全，我们应该 update result_data。
           })
        };

        // 如果成功，更新 result_data
        if (newStatus === TaskStatus.SUCCESS && resultImage) {
          // 我们需要更新 result_data 中的 result_image
          // 由于 result_data 是数组，直接更新整个数组比较安全
          // 但我们没有原始数据。
          // 临时方案：只更新 ext_data 中的 status，图片链接等稍后处理。
          // 实际上，result_image 字段是在 result_data 数组里的。
          // 我们需要更新 result_data[0].result_image
          
          // 尝试更新 result_data
          // 注意：这里假设只有一个 result_data
          // CloudBase update operator needed for array update? 
          // 简单起见，覆盖 result_data
          // 但我们丢失了 template_id 等信息。
          
          // 修正策略：我们只更新 ext_data 里的状态，
          // 并在 ext_data 里也存一份 result_image 以便前端读取，或者
          // 数据库层面的 update 比较复杂。
          
          // 既然是 userWorkService.updateWork，它是全量更新字段。
          // 我们无法做到精确更新 result_data 数组中的某一项而不读取。
          // 所以正确流程是：读取 -> 修改 -> 保存。
          
          // 1. 读取作品
          const workResult = await userWorkService.getWorkById(task.workId);
          if (workResult.success && workResult.data) {
            const work = workResult.data;
            const resultData = work.result_data || [];
            if (resultData.length > 0) {
                resultData[0].result_image = resultImage;
            }
            
            // 解析旧的 ext_data 以保留 selfie_url
            let extDataObj = {};
            try {
                extDataObj = JSON.parse(work.ext_data || '{}');
            } catch (e) {}
            
            const newExtData = JSON.stringify({
                ...extDataObj,
                task_status: newStatus,
                task_id: task.taskId
            });
            
            await userWorkService.updateWork(task.workId, {
                result_data: resultData,
                ext_data: newExtData
            });
          }
        } else if (newStatus === TaskStatus.FAILED) {
            // 仅更新状态
             const workResult = await userWorkService.getWorkById(task.workId);
             if (workResult.success && workResult.data) {
                let extDataObj = {};
                try {
                    extDataObj = JSON.parse(workResult.data.ext_data || '{}');
                } catch (e) {}
                
                await userWorkService.updateWork(task.workId, {
                    ext_data: JSON.stringify({
                        ...extDataObj,
                        task_status: newStatus,
                        task_id: task.taskId
                    })
                });
             }
        }
      }

      return {
        ...task,
        status: newStatus,
        resultImage // 传递给 reducer
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
            error: updatedTask.error
          };
        }
      });
  },
});

export const { togglePanel, removeTask, addTask } = asyncTaskSlice.actions;
export default asyncTaskSlice.reducer;

