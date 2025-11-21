import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

export const storeMaterialRequest = createAsyncThunk(
  "materialRequest/storeMaterialRequest",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/store-material-request`, values);
      successMessage(res.data.message);

      return res.data.data || [];
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchMaterialRequest = createAsyncThunk(
  "materialRequest/fetchMaterialRequest",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/get-material-request`);
      successMessage(res.data.message);

      return res.data.data || [];
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


const materialRequestSlice = createSlice({
  name: "materialRequest",
  initialState: {
    data: [],
    loading: false,
    error: null,
    activeBatch: null,
    totalRecords: 0,
  },
  reducers: {
    
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMaterialRequest.pending, (state) => {
        state.productionLoading = true;
        state.error = null;
      })
      .addCase(fetchMaterialRequest.fulfilled, (state, action) => {
        state.productionLoading = false;
        state.data = action.payload.data;
      })
      .addCase(fetchMaterialRequest.rejected, (state, action) => {
        state.productionLoading = false;
        state.error = action.payload;
      });
  },
});

export default materialRequestSlice.reducer;
