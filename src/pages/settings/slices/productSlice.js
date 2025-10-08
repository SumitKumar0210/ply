import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust path
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
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
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


// Update product
export const updateProduct = createAsyncThunk(
  "product/update",
  async ({ updated }, { rejectWithValue }) => {
    try {
      console.log('kya')
      console.log(JSON.stringify(updated))
      const res = await api.post(`admin/product/update/${updated.id}`, updated,);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ✅ Status update
export const statusUpdate = createAsyncThunk(
  "product/update",
  async (updated) => {
    try{
      const res = await api.post("admin/product/status-update", {
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

// Delete product
export const deleteProduct = createAsyncThunk("product/delete", async (id) => {
  try{
    const res = await api.post(`admin/product/delete/${id}`);
    successMessage(res.data.message);
    return id;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    errorMessage(errMsg);
    return rejectWithValue(errMsg);
  }
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
