import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

export const fetchOwnProductionOrder = createAsyncThunk(
  "productionOrder/fetchOwnProductionOrder",
  async ({ pageIndex, pageLimit, search="" }, { rejectWithValue }) => {
    try {
      const res = await api.get(`admin/production-order/get-data?ownData=true`,{
        params: {
          page: pageIndex + 1,
          limit: pageLimit ?? 10, 
          search:search
        }
      });
      return {
        data: res.data.data || [],
        totalRecords: res.data.total || res.data.data?.length || 0,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const storeProductionOrder = createAsyncThunk(
  "productionOrder/storeProductionOrder",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/store-own-production-product`, values);
      successMessage(res.data.message || "Production Order created successfully");
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const productionOrderSlice = createSlice({
  name: "productionOrder",
  initialState: {
    data: [],
    totalRecords: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearProductionOrders: (state) => {
      state.data = [];
      state.totalRecords = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchOwnProductionOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnProductionOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.totalRecords = action.payload.totalRecords;
      })
      .addCase(fetchOwnProductionOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Store
      .addCase(storeProductionOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(storeProductionOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.data.unshift(action.payload); 
      })
      .addCase(storeProductionOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProductionOrders } = productionOrderSlice.actions;
export default productionOrderSlice.reducer;
