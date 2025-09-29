import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust path

// Fetch all products
export const fetchProducts = createAsyncThunk(
  "product/fetchAll",
  async () => {
    const res = await api.get("admin/product/get-data");
    return res.data.data;
  }
);

// Add product
export const addProduct = createAsyncThunk(
  "product/add",
  async (newData, { rejectWithValue }) => {
    // console.log("sendData:", JSON.stringify(newData, null, 2));

    try {
      const res = await api.post("admin/product/store", newData, );
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Add failed");
    }
  }
);


// Update product
export const updateProduct = createAsyncThunk(
  "product/update",
  async ({ updated }, { rejectWithValue }) => {
    try {
      
      const res = await api.post(`admin/product/update/${updated.id}`, updated,);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Update failed");
    }
  }
);

// ✅ Status update
export const statusUpdate = createAsyncThunk(
  "product/update",
  async (updated) => {
    const res = await api.post("admin/product/status-update", {
      id: updated.id,
      status: updated.status,
    });
    return updated;
  }
);

// Delete product
export const deleteProduct = createAsyncThunk("product/delete", async (id) => {
  await api.post(`admin/product/delete/${id}`);
  return id;
});

const productSlice = createSlice({
  name: "product",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add
      .addCase(addProduct.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })
      // Update
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })
      // Delete
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default productSlice.reducer;
