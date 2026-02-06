import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TaskWithProgress, TaskType } from '../../types/model/task';
import { taskService } from '../../services/taskService';
import { showSuccessToast } from '../../utils/toast';

// 任务状态接口
interface TaskState {
  tasks: TaskWithProgress[];
  loading: boolean;
  error: string | null;
  hasUnclaimedRewards: boolean;
  hasIncompleteTasks: boolean;
  totalClaimableReward: number;
}

// 初始状态
const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  hasUnclaimedRewards: false,
  hasIncompleteTasks: true,
  totalClaimableReward: 0,
};

// 异步 Thunk: 加载所有任务
export const fetchTasks = createAsyncThunk(
  'task/fetchTasks',
  async () => {
    const tasks = await taskService.getAllTasksWithProgress();
    const hasUnclaimedRewards = await taskService.hasUnclaimedRewards();
    const hasIncompleteTasks = await taskService.hasIncompleteTasks();
    const totalClaimableReward = await taskService.getTotalClaimableReward();
    return { tasks, hasUnclaimedRewards, hasIncompleteTasks, totalClaimableReward };
  }
);

// 异步 Thunk: 更新任务进度
export const updateTaskProgress = createAsyncThunk(
  'task/updateProgress',
  async ({ taskType, count = 1 }: { taskType: TaskType; count?: number }) => {
    const safeCount = Math.max(1, Number(count) || 1);
    const result = await taskService.updateTaskProgressByType(taskType, safeCount);
    if (result?.justCompleted && result.taskTitle) {
      showSuccessToast(`太棒了！「${result.taskTitle}」任务已完成，快去领取奖励吧～`);
    }
    const tasks = await taskService.getAllTasksWithProgress();
    const hasUnclaimedRewards = await taskService.hasUnclaimedRewards();
    const hasIncompleteTasks = await taskService.hasIncompleteTasks();
    const totalClaimableReward = await taskService.getTotalClaimableReward();
    return { tasks, hasUnclaimedRewards, hasIncompleteTasks, totalClaimableReward };
  }
);

// 异步 Thunk: 领取奖励
export const claimTaskReward = createAsyncThunk(
  'task/claimReward',
  async (taskId: string, { rejectWithValue }) => {
    const result = await taskService.claimReward(taskId);
    if (!result.success) {
      return rejectWithValue(result.error || '领取奖励失败');
    }
    // 重新加载所有任务数据
    const tasks = await taskService.getAllTasksWithProgress();
    const hasUnclaimedRewards = await taskService.hasUnclaimedRewards();
    const hasIncompleteTasks = await taskService.hasIncompleteTasks();
    const totalClaimableReward = await taskService.getTotalClaimableReward();
    return {
      tasks,
      hasUnclaimedRewards,
      hasIncompleteTasks,
      totalClaimableReward,
      rewardAmount: result.rewardAmount,
      newBalance: result.newBalance,
    };
  }
);

// 异步 Thunk: 重置所有任务（仅测试用）
export const resetAllTasks = createAsyncThunk(
  'task/resetAll',
  async () => {
    await taskService.resetAllTasks();
    const tasks = await taskService.getAllTasksWithProgress();
    return { tasks, hasUnclaimedRewards: false, hasIncompleteTasks: true, totalClaimableReward: 0 };
  }
);

// 创建 Slice
const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null;
    },
    // 清除缓存
    clearTaskCache: (state) => {
      taskService.clearCache();
      state.tasks = [];
      state.hasUnclaimedRewards = false;
      state.hasIncompleteTasks = true;
      state.totalClaimableReward = 0;
    },
  },
  extraReducers: (builder) => {
    // fetchTasks
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.tasks;
        state.hasUnclaimedRewards = action.payload.hasUnclaimedRewards;
        state.hasIncompleteTasks = action.payload.hasIncompleteTasks;
        state.totalClaimableReward = action.payload.totalClaimableReward;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '加载任务失败';
      });

    // updateTaskProgress
    builder
      .addCase(updateTaskProgress.fulfilled, (state, action) => {
        state.tasks = action.payload.tasks;
        state.hasUnclaimedRewards = action.payload.hasUnclaimedRewards;
        state.hasIncompleteTasks = action.payload.hasIncompleteTasks;
        state.totalClaimableReward = action.payload.totalClaimableReward;
      });

    // claimTaskReward
    builder
      .addCase(claimTaskReward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(claimTaskReward.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.tasks;
        state.hasUnclaimedRewards = action.payload.hasUnclaimedRewards;
        state.hasIncompleteTasks = action.payload.hasIncompleteTasks;
        state.totalClaimableReward = action.payload.totalClaimableReward;
      })
      .addCase(claimTaskReward.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || '领取奖励失败';
      });

    // resetAllTasks
    builder
      .addCase(resetAllTasks.fulfilled, (state, action) => {
        state.tasks = action.payload.tasks;
        state.hasUnclaimedRewards = action.payload.hasUnclaimedRewards;
        state.hasIncompleteTasks = action.payload.hasIncompleteTasks;
        state.totalClaimableReward = action.payload.totalClaimableReward;
      });
  },
});

export const { clearError, clearTaskCache } = taskSlice.actions;
export default taskSlice.reducer;
