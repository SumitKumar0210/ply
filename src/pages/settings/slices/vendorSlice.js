import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust your API path
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
//  Thunks

// Fetch all vendors
export const fetchVendors = createAsyncThunk(
  "vendor/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();

      // Add pagination
      if (params.page) queryParams.append("page", params.page);
      if (params.per_page) queryParams.append("per_page", params.per_page);

      // Add search
      if (params.search) queryParams.append("search", params.search);

      // Add extra filters (optional)
      if (params.status) queryParams.append("status", params.status);
      if (params.category_id) queryParams.append("category_id", params.category_id);

      const queryString = queryParams.toString();
      const url = queryString
        ? `admin/vendor/get-data?${queryString}`
        : `admin/vendor/get-data`;

      const res = await api.get(url);

      return {
        data: res.data.data || [],
        total: res.data.total || 0,
        page: params.page || 1,
        per_page: params.per_page || 10,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);



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
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/vendor/delete/${id}`, id);
      successMessage(res.data.message);
      return id;
    } catch (error) {
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
    try {
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
    total: 0,
    page: 1,
    per_page: 10,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      // Fetch Vendors
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.per_page = action.payload.per_page;
        state.error = null;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.data = [];
        state.total = 0;
      })

      .addCase(addVendor.pending, (state) => {
        state.loading = true;
      })
      .addCase(addVendor.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;


        state.total += 1;
      })
      .addCase(addVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateVendor.fulfilled, (state, action) => {
        const index = state.data.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index > -1) {
          state.data[index] = action.payload;
        }
      })

      .addCase(deleteVendor.fulfilled, (state, action) => {
        const vendorId = action.payload;
        // Add safety check to ensure data is an array
        if (Array.isArray(state.data)) {
          state.data = state.data.filter((item) => item.id !== vendorId);
        }
      })
      .addCase(deleteVendor.rejected, (state, action) => {
        console.error("Delete vendor failed:", action.payload);
      })

      // Status update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex(d => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      });
  },
});
// Export actions
export const { clearVendorError, resetVendorState } = vendorSlice.actions;

// Export reducer
export default vendorSlice.reducer;
