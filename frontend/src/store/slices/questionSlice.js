
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import questionService from '../../services/questionService';

// Async thunk for listing questions
export const listQuestions = createAsyncThunk(
  'question/list',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().user.userInfo.token;
      return await questionService.listQuestions(token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Async thunk for creating a question
export const createQuestion = createAsyncThunk(
  'question/create',
  async (questionData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().user.userInfo.token;
      return await questionService.createQuestion(questionData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Async thunk for deleting a question
export const deleteQuestion = createAsyncThunk(
  'question/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().user.userInfo.token;
      return await questionService.deleteQuestion(id, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteQuestionsBulk = createAsyncThunk(
  'question/deleteBulk',
  async (ids, thunkAPI) => {
    try {
      const token = thunkAPI.getState().user.userInfo.token;
      return await questionService.deleteQuestionsBulk(ids, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Async thunk for getting question details
export const getQuestionDetails = createAsyncThunk(
  'question/getDetails',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().user.userInfo.token;
      return await questionService.getQuestionDetails(id, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Async thunk for updating a question
export const updateQuestion = createAsyncThunk(
  'question/update',
  async (questionData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().user.userInfo.token;
      return await questionService.updateQuestion(questionData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  questions: [],
  question: null, // For question details
  loading: false,
  error: null,
  success: false, // For creation success
  successUpdate: false, // For update success
};

export const questionSlice = createSlice({
  name: 'question',
  initialState,
  reducers: {
    resetQuestionState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.successUpdate = false;
      state.question = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // List Questions
      .addCase(listQuestions.pending, (state) => {
        state.loading = true;
      })
      .addCase(listQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload;
      })
      .addCase(listQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Question
      .addCase(createQuestion.pending, (state) => {
        state.loading = true;
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.questions.push(action.payload);
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Question
      .addCase(deleteQuestion.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = state.questions.filter(
          (q) => q._id !== action.payload
        );
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteQuestionsBulk.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteQuestionsBulk.fulfilled, (state, action) => {
        state.loading = false;
        const deletedCount = action.payload?.deletedCount ?? 0;
        if (deletedCount > 0) {
          const ids = new Set((action.meta.arg || []).map(String));
          state.questions = state.questions.filter((q) => !ids.has(String(q._id)));
        }
      })
      .addCase(deleteQuestionsBulk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Question Details
      .addCase(getQuestionDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getQuestionDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.question = action.payload;
      })
      .addCase(getQuestionDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Question
      .addCase(updateQuestion.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.successUpdate = true;
        state.question = action.payload;
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetQuestionState } = questionSlice.actions;
export default questionSlice.reducer;
