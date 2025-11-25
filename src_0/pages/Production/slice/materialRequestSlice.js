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

export const fetchAllRequestItems = createAsyncThunk(
  "materialRequest/fetchAllRequestItems",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/get-material-request`,{pp_id:id});
      successMessage(res.data.message);
       return res.data.data;
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
       .addCase(fetchAllRequestItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRequestItems.fulfilled, (state, action) => {
        state.loading = false; 
        state.data = action.payload;
      })
      .addCase(fetchAllRequestItems.rejected, (state, action) => {
        state.loading = false;             
        state.error = action.payload;
      })

      // STORE REQUEST ITEM
      .addCase(storeMaterialRequest.fulfilled, (state, action) => {
        state.data.push(action.payload);
      });
  },
});

export default materialRequestSlice.reducer;
