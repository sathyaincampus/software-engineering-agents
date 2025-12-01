import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Type-aware hook for useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Type-aware hook for useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
