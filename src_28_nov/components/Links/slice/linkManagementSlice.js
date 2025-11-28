import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage, infoMessage } from "../../../toast";



// Generate Public Link
export const generateLink = createAsyncThunk(
  "link/generate",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/generate-link", payload);
      successMessage(res.data.message || "Public link generated successfully!");
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Get Public Link by Quotation ID
export const getLink = createAsyncThunk(
  "link/get",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/get-link", id);
      if(res.data.success){
        successMessage(res.data.message || "Public link fetched successfully!");
      } else {
        infoMessage(res.data.message || "No public link found for this quotation.")
      }
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const linkManagementSlice = createSlice({
  name: "link",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearLinkData: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate Link
      .addCase(generateLink.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateLink.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(generateLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Link
      .addCase(getLink.pending, (state) => {
        state.loading = true;
      })
      .addCase(getLink.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearLinkData } = linkManagementSlice.actions;

export default linkManagementSlice.reducer;
