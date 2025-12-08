import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Fetch shipping by ID
export const fetchShippingAddressById = createAsyncThunk(
  "shippingAddress/fetchById",
  async (id, { rejectWithValue }) => {
    console.log(id);
    try {
      const res = await api.get(`/admin/shipping/get-data/${id}`);
      return res.data.data ?? null;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add new shipping address
export const addShippingAddress = createAsyncThunk(
  "shippingAddress/add",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/shipping/store", formData);
      successMessage("Shipping address saved successfully!");
      return response.data.data;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete shipping address
export const deleteShippingAddress = createAsyncThunk(
  "shippingAddress/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.post(`/admin/shipping/delete/${id}`);
      successMessage("Shipping address deleted!");
      return id;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update shipping address
export const updateShippingAddress = createAsyncThunk(
  "shippingAddress/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/shipping/update/${id}`, data);
      successMessage("Shipping updated successfully!");
      return response.data.data;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const shippingAddressSlice = createSlice({
  name: "shippingAddress",
  initialState: {
    data: [],          
    selected: null,    
    loading: false,
    error: null,
  },

  reducers: {
    clearSelectedShipping: (state) => {
      state.selected = null;
    },
    clearShippingError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* Fetch Shipping Address by ID */
      .addCase(fetchShippingAddressById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShippingAddressById.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchShippingAddressById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* Add Shipping */
      .addCase(addShippingAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addShippingAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(addShippingAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* Update Shipping */
      .addCase(updateShippingAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateShippingAddress.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.data.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;

        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
      })
      .addCase(updateShippingAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* Delete Shipping */
      .addCase(deleteShippingAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteShippingAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteShippingAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedShipping, clearShippingError } =
  shippingAddressSlice.actions;

export default shippingAddressSlice.reducer;
