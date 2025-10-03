import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust the path to your API helper

// ✅ Fetch all states
export const fetchStates = createAsyncThunk(
  "states/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/state/get-data"); 
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch states");
    }
  }
);


const stateSlice = createSlice({
  name: "states",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch states
      .addCase(fetchStates.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStates.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchStates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export default stateSlice.reducer;
