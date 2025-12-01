import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

export const submitFailedQc = createAsyncThunk(
  "failedQc/submitFailedQc",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/production-order/failed-qc", formData);
      console.log(res.data);
      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  loading: false,
  error: null,
};

const failedQcSlice = createSlice({
  name: "failedQc",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(submitFailedQc.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(submitFailedQc.fulfilled, (state, action) => {
        state.loading = false;
        successMessage("Failed QC submitted successfully!");
      })

      .addCase(submitFailedQc.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        errorMessage(action.payload || "Something went wrong");
      });
  },
});

export default failedQcSlice.reducer;
