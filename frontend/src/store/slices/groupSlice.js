
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  groupList: [],
  loading: false,
  error: null,
  loadingCreate: false,
  errorCreate: null,
  successCreate: false,
  groupDetails: { members: [] },
  loadingDetails: false,
  errorDetails: null,
  loadingUpdate: false,
  errorUpdate: null,
  successUpdate: false,
  loadingDelete: false,
  errorDelete: null,
  successDelete: false,
};

// Async thunk to get group list
export const listGroups = createAsyncThunk(
  'group/listGroups',
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

      const { data } = await axios.get(`${API_BASE_URL}/api/groups`, config);
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

// Async thunk to create a group
export const createGroup = createAsyncThunk(
  'group/createGroup',
  async (group, { getState, rejectWithValue }) => {
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

      const { data } = await axios.post(`${API_BASE_URL}/api/groups`, group, config);
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

// Async thunk to get group details
export const getGroupDetails = createAsyncThunk(
  'group/getGroupDetails',
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

      const { data } = await axios.get(`${API_BASE_URL}/api/groups/${id}`, config);
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

// Async thunk to update a group
export const updateGroup = createAsyncThunk(
  'group/updateGroup',
  async (group, { getState, rejectWithValue }) => {
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
        `${API_BASE_URL}/api/groups/${group._id}`,
        group,
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

// Async thunk to delete a group
export const deleteGroup = createAsyncThunk(
  'group/deleteGroup',
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

      await axios.delete(`${API_BASE_URL}/api/groups/${id}`, config);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async thunk to add a member to a group
export const addMemberToGroup = createAsyncThunk(
  'group/addMemberToGroup',
  async ({ groupId, userId }, { getState, rejectWithValue }) => {
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

      const { data } = await axios.post(
        `${API_BASE_URL}/api/groups/${groupId}/members`,
        { userId },
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

// Async thunk to remove a member from a group
export const removeMemberFromGroup = createAsyncThunk(
  'group/removeMemberFromGroup',
  async ({ groupId, userId }, { getState, rejectWithValue }) => {
    try {
      const {
        user: { userInfo },
      } = getState();

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.delete(
        `${API_BASE_URL}/api/groups/${groupId}/members/${userId}`,
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

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    resetCreateGroup: (state) => {
      state.loadingCreate = false;
      state.errorCreate = null;
      state.successCreate = false;
    },
    resetUpdateGroup: (state) => {
      state.groupDetails = { members: [] };
      state.loadingUpdate = false;
      state.errorUpdate = null;
      state.successUpdate = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get group list
      .addCase(listGroups.pending, (state) => {
        state.loading = true;
      })
      .addCase(listGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groupList = action.payload;
      })
      .addCase(listGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create group
      .addCase(createGroup.pending, (state) => {
        state.loadingCreate = true;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.loadingCreate = false;
        state.successCreate = true;
        state.groupList.push(action.payload);
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loadingCreate = false;
        state.errorCreate = action.payload;
      })
      // Get group details
      .addCase(getGroupDetails.pending, (state) => {
        state.loadingDetails = true;
      })
      .addCase(getGroupDetails.fulfilled, (state, action) => {
        state.loadingDetails = false;
        state.groupDetails = action.payload;
      })
      .addCase(getGroupDetails.rejected, (state, action) => {
        state.loadingDetails = false;
        state.errorDetails = action.payload;
      })
      // Update group
      .addCase(updateGroup.pending, (state) => {
        state.loadingUpdate = true;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.loadingUpdate = false;
        state.successUpdate = true;
        state.groupDetails = action.payload;
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.loadingUpdate = false;
        state.errorUpdate = action.payload;
      })
      // Delete group
      .addCase(deleteGroup.pending, (state) => {
        state.loadingDelete = true;
      })
      .addCase(deleteGroup.fulfilled, (state) => {
        state.loadingDelete = false;
        state.successDelete = true;
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.loadingDelete = false;
        state.errorDelete = action.payload;
      })
      // Add Member to Group
      .addCase(addMemberToGroup.fulfilled, (state, action) => {
        state.groupDetails = action.payload;
      })
      // Remove Member from Group
      .addCase(removeMemberFromGroup.fulfilled, (state, action) => {
        state.groupDetails = action.payload;
      });
  },
});

export const { resetCreateGroup, resetUpdateGroup } = groupSlice.actions;
export default groupSlice.reducer;
