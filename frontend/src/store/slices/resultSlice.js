
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

// Thunk to start an exam
export const startExam = createAsyncThunk(
  'results/startExam',
  async (examId, { getState, rejectWithValue }) => {
    try {
      const {
        user: { userInfo },
      } = getState();

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(`${API_BASE_URL}/api/results/start/${examId}`, {}, config);
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

// Thunk to submit an exam
export const submitExam = createAsyncThunk(
  'results/submitExam',
  async ({ resultId, answers }, { getState, rejectWithValue }) => {
    try {
      const {
        user: { userInfo },
      } = getState();

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(`${API_BASE_URL}/api/results/submit/${resultId}`, { answers }, config);
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

// Thunk to get result details
export const getResultDetails = createAsyncThunk(
  'results/getResultDetails',
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

      const { data } = await axios.get(`${API_BASE_URL}/api/results/${id}`, config);
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

const resultSlice = createSlice({
  name: 'result',
  initialState: {
    activeResult: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(startExam.pending, (state) => {
        state.loading = true;
        state.activeResult = null;
        state.error = null;
      })
      .addCase(startExam.fulfilled, (state, action) => {
        state.loading = false;
        state.activeResult = action.payload;
      })
      .addCase(startExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add cases for submitExam
      .addCase(submitExam.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitExam.fulfilled, (state, action) => {
        state.loading = false;
        state.activeResult = action.payload; // Store the final result
        state.error = null;
      })
      .addCase(submitExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add cases for getResultDetails
      .addCase(getResultDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getResultDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.activeResult = action.payload;
      })
      .addCase(getResultDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default resultSlice.reducer;
