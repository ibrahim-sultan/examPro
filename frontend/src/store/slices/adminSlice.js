
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  userList: [],
  loading: false,
  error: null,
  loadingCreate: false,
  errorCreate: null,
  successCreate: false,
  // Add state for user details and update
  loadingDetails: false,
  errorDetails: null,
  userDetails: null,
  loadingUpdate: false,
  errorUpdate: null,
  successUpdate: false,
  // Add state for delete
  loadingDelete: false,
  errorDelete: null,
  successDelete: false,
};

// Async thunk to get all users
export const listUsers = createAsyncThunk(
  'admin/listUsers',
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

      const { data } = await axios.get(`${API_BASE_URL}/api/users`, config);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async thunk to create a user
export const createUser = createAsyncThunk(
  'admin/createUser',
  async (userData, { getState, rejectWithValue }) => {
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

      await axios.post(`${API_BASE_URL}/api/users`, userData, config);
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async thunk to get user details
export const getUserDetails = createAsyncThunk(
  'admin/getUserDetails',
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

      const { data } = await axios.get(`${API_BASE_URL}/api/users/${id}`, config);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async thunk to update a user
export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async (userData, { getState, rejectWithValue }) => {
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

      const { data } = await axios.put(
        `${API_BASE_URL}/api/users/${userData._id}`,
        userData,
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async thunk to delete a user
export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
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

      await axios.delete(`${API_BASE_URL}/api/users/${id}`, config);
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    resetCreateUser: (state) => {
      state.loadingCreate = false;
      state.errorCreate = null;
      state.successCreate = false;
    },
    // Add reducer to reset update state
    resetUpdateUser: (state) => {
      state.loadingUpdate = false;
      state.errorUpdate = null;
      state.successUpdate = false;
      state.userDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(listUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.userList = action.payload;
      })
      .addCase(listUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createUser.pending, (state) => {
        state.loadingCreate = true;
        state.successCreate = false;
        state.errorCreate = null;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.loadingCreate = false;
        state.successCreate = true;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loadingCreate = false;
        state.errorCreate = action.payload;
      })
      // Cases for getUserDetails
      .addCase(getUserDetails.pending, (state) => {
        state.loadingDetails = true;
      })
      .addCase(getUserDetails.fulfilled, (state, action) => {
        state.loadingDetails = false;
        state.userDetails = action.payload;
      })
      .addCase(getUserDetails.rejected, (state, action) => {
        state.loadingDetails = false;
        state.errorDetails = action.payload;
      })
      // Cases for updateUser
      .addCase(updateUser.pending, (state) => {
        state.loadingUpdate = true;
        state.successUpdate = false;
        state.errorUpdate = null;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.loadingUpdate = false;
        state.successUpdate = true;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loadingUpdate = false;
        state.errorUpdate = action.payload;
      })
      // Cases for deleteUser
      .addCase(deleteUser.pending, (state) => {
        state.loadingDelete = true;
        state.successDelete = false;
        state.errorDelete = null;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.loadingDelete = false;
        state.successDelete = true;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loadingDelete = false;
        state.errorDelete = action.payload;
      });
  },
});

export const { resetCreateUser, resetUpdateUser } = adminSlice.actions;
export default adminSlice.reducer;
