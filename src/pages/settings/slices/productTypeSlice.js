import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust path
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
// Fetch all products
export const fetchProductTypes = createAsyncThunk(
  "productType/fetchAll",
  async () => {
    const res = await api.get("admin/product-type/get-data");
    return res.data.data;
  }
);


export const fetchActiveProductTypes = createAsyncThunk(
  "productType/fetchAll",
  async () => {
    const res = await api.get("admin/product-type/get-data?status=1");
    return res.data.data;
  }
);

// Add product
export const addProductType = createAsyncThunk(
  "productType/add",
  async (newData, { rejectWithValue }) => {
    // console.log("sendData:", JSON.stringify(newData, null, 2));

    try {
      const res = await api.post("admin/product-type/store", newData, );
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
export const updateProductType = createAsyncThunk(
  "productType/update",
  async ({ id, name }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/product-type/update/${id}`, {name},);
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
  "productType/update",
  async (updated) => {
    try{
      const res = await api.post("admin/product-type/status-update", {
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
export const deleteProductType = createAsyncThunk("productType/delete", async (id) => {
  try{
    const res = await api.post(`admin/product-type/delete/${id}`);
    successMessage(res.data.message);
    return id;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    errorMessage(errMsg);
    return rejectWithValue(errMsg);
  }
});

const productTypeSlice = createSlice({
  name: "productType",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchActiveProductTypes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveProductTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchActiveProductTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add
      .addCase(addProductType.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })
      // Update
      .addCase(updateProductType.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })
      // Delete
      .addCase(deleteProductType.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default productTypeSlice.reducer;
