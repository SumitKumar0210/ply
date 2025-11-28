import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

//  Fetch all branches
export const fetchBranches = createAsyncThunk("branch/fetchAll", async () => {
  const res = await api.get("admin/branch/get-data");
  return res.data.data;
});

//  Add branch
export const addBranch = createAsyncThunk(
  "branch/add",
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/branch/store", newData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Update branch
export const updateBranch = createAsyncThunk(
  "branch/update",
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/branch/update/${updated.id}`, updated);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Delete branch
export const deleteBranch = createAsyncThunk("branch/delete", async (id) => {
  try{
    const res = await api.post(`admin/branch/delete/${id}`);
    successMessage(res.data.message);
    return id;
  }catch (error) {
    const errMsg = getErrorMessage(error);
    errorMessage(errMsg);
    return rejectWithValue(errMsg);
  }
});

//  Status update
export const statusUpdate = createAsyncThunk(
  "branch/statusUpdate",
  async (updated) => {
    try{
      const res = await api.post("admin/branch/status-update", {
        id: updated.id,
        status: updated.status,
      });
      successMessage(res.data.message);
      return updated;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const branchSlice = createSlice({
  name: "branch",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add
      .addCase(addBranch.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(updateBranch.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })

      // Delete
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      })

      // Status
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      });
  },
});

export default branchSlice.reducer;
