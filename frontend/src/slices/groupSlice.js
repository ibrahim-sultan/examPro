
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  groups: [],
  groupDetails: null,
  loading: false,
  error: null,
};

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    // We will add reducers here later to handle group-related state changes.
  },
  extraReducers: (builder) => {
    // For handling async thunks for fetching, creating, and updating groups.
  },
});

export default groupSlice.reducer;
