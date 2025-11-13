import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Fetch quotations with pagination
export const fetchQuotation = createAsyncThunk(
  "quotation/fetchQuotation",
  async ({ pageIndex, pageLimit }, { rejectWithValue }) => {
    try {
      const res = await api.get(`admin/quotation-order/get-data`, {
        params: {
          page: pageIndex + 1, 
          limit: pageLimit
        }
      });
      return {
        data: res.data.data,
        totalRecords: res.data.total || res.data.data.length
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Add quotation
export const addQuotation = createAsyncThunk(
  "quotation/addQuotation",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/quotation-order/store`, values);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Edit quotation
export const editQuotation = createAsyncThunk(
  "quotation/editQuotation",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/quotation-order/edit/${id}`);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Update quotation
// Update this thunk in your quotationSlice.js

export const updateQuotation = createAsyncThunk(
  "quotation/updateQuotation",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      // ✅ Debug: Log FormData contents properly
      console.group('📤 Sending FormData to API:');
      console.log('Endpoint:', `admin/quotation-order/update/${id}`);
      console.log('FormData type:', formData.constructor.name);
      console.log('FormData entries:');
      
      let entriesCount = 0;
      for (const [key, value] of formData.entries()) {
        entriesCount++;
        if (value instanceof File) {
          console.log(`  ${key}:`, `[File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  ${key}:`, value);
        }
      }
      
      console.log('Total entries:', entriesCount);
      console.groupEnd();
      
      console.log('🚀 Making API call...');

      // ✅ Send FormData (not values) - let axios handle headers automatically
      const res = await api.post(`admin/quotation-order/update/${id}`, formData);
      
      console.log('✅ API Response received:', res.data);
      
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      
      // ✅ Enhanced error logging
      console.error('❌ Update Quotation Error:', {
        message: errMsg,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Delete quotation
export const deleteQuotation = createAsyncThunk(
  "quotation/deleteQuotation",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/quotation-order/delete/${id}`);
      successMessage(res.data.message);
      return { id };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Approve quotation
export const approveQuotation = createAsyncThunk(
  "quotation/deleteQuotation",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/quotation-order/status-update`, {id:id});
      successMessage(res.data.message);
      return { id };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const quotationSlice = createSlice({
  name: "quotation",
  initialState: {
    data: [],
    selected: {},
    totalRecords: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch quotations
      .addCase(fetchQuotation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data || [];
        state.totalRecords = action.payload.totalRecords || 0;
      })
      .addCase(fetchQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add quotation
      .addCase(addQuotation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.data.unshift(action.payload);
        state.totalRecords += 1;
      })
      .addCase(addQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Edit quotation
      .addCase(editQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      
      // Delete quotation
      .addCase(deleteQuotation.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(item => item.id !== action.payload.id);
        state.totalRecords = Math.max(0, state.totalRecords - 1);
      })
      .addCase(deleteQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default quotationSlice.reducer;