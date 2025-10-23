// src/store/slices/customerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust the path to your API file
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
// ✅ Fetch all customers
export const fetchInwards = createAsyncThunk(
  "purchaseInward/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/purchase-inward/get-data");
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Fetch failed");
    }
  }
);

// ✅ Add customer
export const addInward = createAsyncThunk(
  "purchaseInward/add",
  async (newCustomer, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/purchase-inward/store", newCustomer);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ✅ Update customer
export const updateInward = createAsyncThunk(
  "purchaseInward/update",
  async (poData, { rejectWithValue }) => {
    try {
      console.log(poData)
      const res = await api.post(`admin/purchase-inward/update/${poData.id}`, poData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ✅ Update customer
export const editInward = createAsyncThunk(
  "purchaseInward/edit",
  async (id, { rejectWithValue }) => {

    try {
      const res = await api.post(`admin/purchase-inward/edit/${id}`);
      // console.log(JSON.parse(res.data.data.material_items))
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
  "purchaseInward/statusUpdate",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/purchase-inward/status-update", { id, status });
      successMessage(res.data.message);
      return { id, status };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


// ✅ Delete customer
export const deleteInward = createAsyncThunk(
  "purchaseInward/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/purchase-inward/delete/${id}`);
      successMessage(res.data.message);
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ✅ Customer slice    
const purchaseInwardSlice = createSlice({
  name: "purchaseInward",
  initialState: {
    data: [],
    selected: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchInwards.pending, (state) => { state.loading = true; })
      .addCase(fetchInwards.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchInwards.rejected, (state, action) => { state.loading = false; state.error = action.payload || action.error.message; })


      // Add
      .addCase(addInward.fulfilled, (state, action) => { state.data = action.payloadS; })

    // Edit
    .addCase(editInward.pending, (state) => {
      state.loading = true;
    })
    .addCase(editInward.fulfilled, (state, action) => {
      state.loading = false;
      state.selected = action.payload;
    })
    .addCase(editInward.rejected, (state) => {
      state.loading = false;
    })

    // Update
    .addCase(updateInward.fulfilled, (state, action) => {
      const index = state.data.findIndex((d) => d.id === action.payload.id);
      if (index !== -1) state.data[index] = action.payload;
    })

    // Status update
    .addCase(statusUpdate.fulfilled, (state, action) => {
      const index = state.data.findIndex((d) => d.id === action.payload.id);
      if (index !== -1) state.data[index].status = action.payload.status;
    })

    // Delete
    .addCase(deleteInward.fulfilled, (state, action) => {
      state.data = state.data.filter((d) => d.id !== action.payload);
    });
}
});

export default purchaseInwardSlice.reducer;
