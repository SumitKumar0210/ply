import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// ✅ Corrected: Action name and payload structure
export const fetchLedgerData = createAsyncThunk(
  "ledger/fetchLedgerData",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/vendor/get-vendor-ledger`, { id });
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const ledgerSlice = createSlice({
  name: "ledger",
  initialState: {
    data: [],
    selected: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLedgerData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLedgerData.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload || [];
      })
      .addCase(fetchLedgerData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default ledgerSlice.reducer;
