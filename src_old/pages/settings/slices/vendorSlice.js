import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust your API path

// ✅ Thunks

// Fetch all vendors
export const fetchVendors = createAsyncThunk("vendor/fetchAll", async () => {
  const res = await api.get("admin/vendor/get-data");
  return res.data.data;
});

// Add vendor
export const addVendor = createAsyncThunk(
  "vendor/add",
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/vendor/store", newData);
      return res.data.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(
          error.response.data[0] ?? error.response.data.error ?? "Request failed"
        );
      }
      return rejectWithValue("Something went wrong");
    }
  }
);

// Update vendor
export const updateVendor = createAsyncThunk(
  "vendor/update",
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/vendor/update/${updated.id}`, updated);
      return res.data.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(
          error.response.data[0] ?? error.response.data.error ?? "Request failed"
        );
      }
      return rejectWithValue("Something went wrong");
    }
  }
);

// Delete vendor
export const deleteVendor = createAsyncThunk(
  "vendor/delete",
  async (id) => {
    await api.post(`admin/vendor/delete/${id}`, id);
    return id;
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
        state.error = action.error.message;
      })

      // Add
      .addCase(addVendor.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(updateVendor.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default vendorSlice.reducer;
