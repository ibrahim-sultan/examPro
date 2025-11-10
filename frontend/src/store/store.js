
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import groupReducer from './slices/groupSlice';
import examReducer from './slices/examSlice';
import questionReducer from './slices/questionSlice';
import resultReducer from './slices/resultSlice'; // Import result reducer

const store = configureStore({
  reducer: {
    user: userReducer,
    group: groupReducer,
    exam: examReducer,
    question: questionReducer,
    result: resultReducer, // Add result reducer
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
