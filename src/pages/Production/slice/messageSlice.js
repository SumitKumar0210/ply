import { createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";



export const storeMessage = createAsyncThunk(
  "message/storeMessage",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/upload-message`, values);
      successMessage(res.data.message);

      return res.data.data || [];
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);




const messageSlice = createSlice({
  name: "message",
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
      .addCase(storeMessage.pending, (state) => {
        state.productionLoading = true;
        state.error = null;
      })
      .addCase(storeMessage.fulfilled, (state, action) => {
        state.productionLoading = false;
        state.data = action.payload.data;
      })
      .addCase(storeMessage.rejected, (state, action) => {
        state.productionLoading = false;
        state.error = action.payload;
      });
  },
});

export default messageSlice.reducer;
