import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust your API path
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
//  Thunks

// Fetch all vendors
export const fetchVendors = createAsyncThunk("vendor/fetchAll", async () => {
  const res = await api.get("admin/vendor/get-data");
  return res.data.data;
});


export const fetchActiveVendors = createAsyncThunk("vendor/fetchAll", async () => {
  const res = await api.get("admin/vendor/get-data?status=1");
  return res.data.data;
});

// Add vendor
export const addVendor = createAsyncThunk(
  "vendor/add",
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/vendor/store", newData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
  }
  }
);

// Update vendor
export const updateVendor = createAsyncThunk(
  "vendor/update",
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/vendor/update/${updated.id}`, updated);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Delete vendor
export const deleteVendor = createAsyncThunk(
  "vendor/delete",
  async (id) => {
    try{
      const res = await api.post(`admin/vendor/delete/${id}`, id);
      successMessage(res.data.message);
      return id;
    }catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Status update
export const statusUpdate = createAsyncThunk(
  "vendor/statusUpdate",
  async (updated) => {
    try{
      const res = await api.post("admin/vendor/status-update", {
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

// Slice
const vendorSlice = createSlice({
  name: "vendor",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Add
      .addCase(addVendor.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(updateVendor.fulfilled, (state, action) => {
        const index = state.data.findIndex(d => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })

      // Delete
      .addCase(deleteVendor.fulfilled, (state, action) => {
        const deletedId = action.payload; // use payload, not meta.arg
        state.data = state.data.filter(item => item.id !== deletedId);
      })

      // Status update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex(d => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      });
  },
});

export default vendorSlice.reducer;
