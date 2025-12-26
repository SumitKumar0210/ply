import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { errorMessage, getErrorMessage } from "../../../toast";

export const fetchStock = createAsyncThunk(
  "stock/fetchStock",
  async ({ searchQuery = "", page = 1, perPage = 10 } = {}, { rejectWithValue }) => {
    try {
      const params = {
        page,
        per_page: perPage,
      };
      
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const res = await api.get("/admin/stock/get-data", { params });
      
      // Handle both paginated and non-paginated responses
      if (res.data.data) {
        // Paginated response
        return {
          data: res.data.data,
          total: res.data.total || 0,
          currentPage: res.data.current_page || 1,
          lastPage: res.data.last_page || 1,
          perPage: res.data.per_page || perPage,
        };
      }
      
      // Non-paginated response fallback
      return {
        data: res.data || [],
        total: res.data?.length || 0,
        currentPage: 1,
        lastPage: 1,
        perPage: res.data?.length || 10,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const stockSlice = createSlice({
  name: "stock",
  initialState: {
    data: [],
    loading: false,
    error: null,
    pagination: {
      currentPage: 1,
      perPage: 10,
      total: 0,
      lastPage: 1,
    },
  },
  reducers: {
    // Reset pagination to first page
    resetPagination: (state) => {
      state.pagination.currentPage = 1;
    },
    // Clear all data
    clearStockData: (state) => {
      state.data = [];
      state.pagination = {
        currentPage: 1,
        perPage: 10,
        total: 0,
        lastPage: 1,
      };
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStock.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = {
          currentPage: action.payload.currentPage,
          perPage: action.payload.perPage,
          total: action.payload.total,
          lastPage: action.payload.lastPage,
        };
        state.error = null;
      })
      .addCase(fetchStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Keep existing data on error
      });
  },
});

export const { 
  resetPagination,
  clearStockData,
} = stockSlice.actions;

export default stockSlice.reducer;