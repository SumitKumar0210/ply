// src/store/slices/labourSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust the path to your API file
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
//  Fetch all labours
export const fetchLabours = createAsyncThunk(
  "labour/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/labour/get-data"); // update API endpoint
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Fetch failed");
    }
  }
);

//  Add labour
export const addLabour = createAsyncThunk(
  "labour/add",
  async (newlabour, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/labour/store", newlabour);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Update labour
export const updateLabour = createAsyncThunk(
  "labour/update",
  async ({ updated }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/labour/update/${updated.id}`, updated);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Status update
export const statusUpdate = createAsyncThunk(
  "labour/statusUpdate",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/labour/status-update", { id, status });
      successMessage(res.data.message);
      return { id, status };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Delete labour
export const deleteLabour = createAsyncThunk(
  "labour/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/labour/delete/${id}`);
      successMessage(res.data.message);
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  labour slice
const labourSlice = createSlice({
  name: "labour",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchLabours.pending, (state) => { state.loading = true; })
      .addCase(fetchLabours.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchLabours.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error.message; })

      // Add
      .addCase(addLabour.fulfilled, (state, action) => { state.data.unshift(action.payload); })

      // Update
      .addCase(updateLabour.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })

      // Status update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index].status = action.payload.status;
      })

      // Delete
      .addCase(deleteLabour.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default labourSlice.reducer;
