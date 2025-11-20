import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

export const fetchProductionChainOrder = createAsyncThunk(
  "productionChain/fetchProductionChainOrder",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/get-production-batch`);
      successMessage(res.data.message);

      return {
        data: res.data.data || [],
        totalRecords: res.data.totalRecords || 0,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const productionChainSlice = createSlice({
  name: "productionChain",
  initialState: {
    data: [],
    loading: false,
    error: null,
    activeBatch: null,
    totalRecords: 0,
  },
  reducers: {
    setActiveBatch: (state, action) => {
      state.activeBatch = action.payload;
    },

    clearActiveBatch: (state) => {
      state.activeBatch = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchProductionChainOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductionChainOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.totalRecords = action.payload.totalRecords;
      })
      .addCase(fetchProductionChainOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setActiveBatch, clearActiveBatch } = productionChainSlice.actions;
export default productionChainSlice.reducer;
