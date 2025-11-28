import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Fetch Ready Products
export const fetchReadyProduct = createAsyncThunk(
  "readyProduct/fetchReadyProduct",
  async (params = {}, { rejectWithValue }) => {
    try {
      const page = params.pageIndex ?? 1;
      const limit = params.pageLimit ?? 10;
      const search = params.search ?? "";

      const res = await api.get("admin/store-order/get-ready-product", {
        params: { page, limit, search },
      });

      const response = res.data;
      successMessage(res.data.message);

      return {
        data: response.data || [],
        totalRecords: response.total || 0,
        currentPage: response.current_page || page,
        perPage: response.per_page || limit,
        lastPage: response.last_page || 1,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Get Challan
export const getChallan = createAsyncThunk(
  "readyProduct/getChallan",
  async (id, { rejectWithValue }) => {
    try {

      const res = await api.post("/admin/store-order/get-challan-byId", {id:id});
      
      return res.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


const readyProductSlice = createSlice({
  name: "readyProduct",
  initialState: {
    data: [],
    loading: false,
    error: null,
    totalRecords: 0,
    currentPage: 1,
    perPage: 10,
    lastPage: 1,
  },
  reducers: {
    
  },
  extraReducers: (builder) => {
    builder
      // Fetch Ready Products
      .addCase(fetchReadyProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReadyProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.totalRecords = action.payload.totalRecords;
        state.currentPage = action.payload.currentPage;
        state.perPage = action.payload.perPage;
        state.lastPage = action.payload.lastPage;
      })
      .addCase(fetchReadyProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Challan
      .addCase(getChallan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChallan.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(getChallan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default readyProductSlice.reducer;