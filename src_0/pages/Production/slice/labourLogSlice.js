import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";


export const fetchLabourLogs = createAsyncThunk(
  "labour/fetchLabourLogs",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/get-all-worksheet`, {pp_id: id});
      successMessage(res.data.message);

      return res.data.data ?? [];
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const storeLabourLog = createAsyncThunk(
  "labour/storeLabourLog",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/store-worksheet`, values);
      successMessage(res.data.message);

      return res.data.data ?? [];
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


const labourSlice = createSlice({
  name: "labourLog",
  initialState: {
    data: [],
    loading: false,
    error: null,
    totalRecords: 0,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      // FETCH LOGS
      .addCase(fetchLabourLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLabourLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // payload already contains array
      })
      .addCase(fetchLabourLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // STORE LOG
      .addCase(storeLabourLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(storeLabourLog.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // update data after storing
      })
      .addCase(storeLabourLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default labourSlice.reducer;
