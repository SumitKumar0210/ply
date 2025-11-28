import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// STORE MATERIAL REQUEST
export const storeMaterialRequest = createAsyncThunk(
  "materialRequest/storeMaterialRequest",
  async (values, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/store-material-request`, values);
      successMessage(res.data.message);

      return res.data.data || null; // return single created item
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// FETCH ALL REQUEST ITEMS
export const fetchAllRequestItems = createAsyncThunk(
  "materialRequest/fetchAllRequestItems",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/get-all-material-request`);
      return res.data.data; // DO NOT toast on fetch
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// FETCH REQUEST ITEMS
export const fetchRequestItems = createAsyncThunk(
  "materialRequest/fetchRequestItems",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/get-material-request`,{id:id});
      return res.data.data; // DO NOT toast on fetch
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// APPROVE MATERIAL REQUEST
export const approveRequest = createAsyncThunk(
  "materialRequest/approveRequest",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/production-order/approve-all-material-request`, {
        id: id,
        status: "1",
      });
      successMessage(res.data.message);

      return res.data.data; // returns updated record
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
  reducers: {},

  extraReducers: (builder) => {
    builder
      // -------------------------
      // FETCH ITEMS
      // -------------------------
      .addCase(fetchAllRequestItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRequestItems.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload ?? [];
      })
      .addCase(fetchAllRequestItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRequestItems.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload ?? [];
      })

      // -------------------------
      // STORE MATERIAL REQUEST
      // -------------------------
      .addCase(storeMaterialRequest.fulfilled, (state, action) => {
        if (action.payload) {
          state.data.push(action.payload); // push only one object
        }
      })

      // -------------------------
      // APPROVE MATERIAL REQUEST
      // -------------------------
      .addCase(approveRequest.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated) return;

        // Update specific request item in Redux state
        state.data = state.data.map((item) =>
          item.id === updated.id ? updated : item
        );
      });
  },
});

export default materialRequestSlice.reducer;
