import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import groupReducer from './slices/groupSlice';
import examReducer from './slices/examSlice';
import questionReducer from './slices/questionSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    group: groupReducer,
    exam: examReducer,
    question: questionReducer,
  },
});

export default store;