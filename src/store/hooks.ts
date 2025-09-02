import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// 类型化的hooks - 提供完整的类型安全
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// 也可以直接导出类型化的useSelector，避免重复导入RootState
export const useTypedSelector = useSelector as TypedUseSelectorHook<RootState>;
