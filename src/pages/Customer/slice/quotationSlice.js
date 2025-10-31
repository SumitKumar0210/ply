import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Fetch quotations
export const fetchQuotation = createAsyncThunk(
  "quotation/fetchQuotation",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(`admin/quotation-order/get-data`);
      // successMessage(res.data.message); // optional
      return res.data.data;
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

const quotationSlice = createSlice({
  name: "quotation",
  initialState: {
    data: [],
    selected: {},
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
        state.data = action.payload || [];
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
        state.data.unshift(action.payload); // add new record to the list
      })
      .addCase(addQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default quotationSlice.reducer;