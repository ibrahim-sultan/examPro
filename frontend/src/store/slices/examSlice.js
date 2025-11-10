import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for listing all exams (for admins)
export const listExams = createAsyncThunk(
  'exams/listExams',
  async (_, { getState, rejectWithValue }) => {
    try {
      const {
        user: { userInfo },
      } = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get('/api/exams', config);
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk for listing available exams (for students)
export const listAvailableExams = createAsyncThunk(
  'exams/listAvailableExams',
  async (_, { getState, rejectWithValue }) => {
    try {
      const {
        user: { userInfo },
      } = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get('/api/exams/available', config);
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get single exam details
export const getExamDetails = createAsyncThunk(
  'exams/getDetails',
  async (id, { getState, rejectWithValue }) => {
    try {
      const {
        user: { userInfo },
      } = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get(`/api/exams/${id}`, config);
      return data;
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      return rejectWithValue(message);
    }
  }
);

const examSlice = createSlice({
  name: 'exam',
  initialState: {
    exams: [],
    loading: false,
    error: null,
    exam: null,
  },
  reducers: {
    resetExamState: (state) => {
      state.loading = false;
      state.error = null;
      state.exam = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listExams.pending, (state) => {
        state.loading = true;
      })
      .addCase(listExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(listExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(listAvailableExams.pending, (state) => {
        state.loading = true;
      })
      .addCase(listAvailableExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(listAvailableExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getExamDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getExamDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.exam = action.payload;
      })
      .addCase(getExamDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetExamState } = examSlice.actions;
export default examSlice.reducer;