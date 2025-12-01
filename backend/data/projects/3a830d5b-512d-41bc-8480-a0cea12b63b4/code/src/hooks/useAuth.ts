import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import {
  bootstrapAuth, 
  selectCurrentUser, 
  selectIsAuthLoading, 
  selectIsAuthenticated 
} from '../store/auth';

/**
 * Custom hook to manage authentication state and actions.
 * Automatically bootstraps the auth state on component mount.
 * Provides the current user, loading status, and authentication status.
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  
  // Select relevant state from the Redux store using the defined selectors
  const currentUser = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectIsAuthLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    // Dispatch the bootstrapAuth action when the component mounts.
    // This action checks the current Firebase Auth state (e.g., if a user is already logged in)
    // and updates the Redux store accordingly.
    dispatch(bootstrapAuth());
  }, [dispatch]); // Dependency array ensures this runs only once on mount

  // Return the relevant authentication state values
  return {
    currentUser,
    isLoading,
    isAuthenticated,
  };
};
