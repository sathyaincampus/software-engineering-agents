/*
  This file re-exports the async thunks defined in authSlice.ts.
  This is a common pattern to keep the slice cleaner and group related actions.
  If you add more specific thunks later (e.g., for profile updates),
  you can define them here and re-export them.
*/

export {
  bootstrapAuth,
  registerUser,
  loginUser,
  logoutUser,
  sendPasswordResetEmail,
} from './authSlice';
