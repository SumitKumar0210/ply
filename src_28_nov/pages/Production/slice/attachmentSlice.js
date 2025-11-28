import { createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";



export const storeAttachment = createAsyncThunk(
  "attachment/storeAttachment",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/upload-document`, values);
      successMessage(res.data.message);

      return res.data.data || [];
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);




const attachmentSlice = createSlice({
  name: "attachment",
  initialState: {
    data: [],
    loading: false,
    error: null,
    totalRecords: 0,
  },
  reducers: {
    
  },

  extraReducers: (builder) => {
    builder
      .addCase(storeAttachment.pending, (state) => {
        state.productionLoading = true;
        state.error = null;
      })
      .addCase(storeAttachment.fulfilled, (state, action) => {
        state.productionLoading = false;
        state.data = action.payload.data;
      })
      .addCase(storeAttachment.rejected, (state, action) => {
        state.productionLoading = false;
        state.error = action.payload;
      });
  },
});

export default attachmentSlice.reducer;
