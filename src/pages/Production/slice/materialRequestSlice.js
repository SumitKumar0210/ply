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
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();

      if (params.pageIndex !== undefined) {
        query.append("page", params.pageIndex + 1);
      }
      if (params.pageLimit) {
        query.append("per_page", params.pageLimit);
      }
      if (params.search) {
        query.append("search", params.search);
      }

      const url = query.toString()
        ? `admin/production-order/get-all-material-request?${query}`
        : `admin/production-order/get-all-material-request`;

      console.log("API URL:", url);
      
      const res = await api.post(url);
      
      console.log("result:", res.data.data);
      return {
        data: res.data.data.data ?? [],
        total: res.data.data.total ?? 0,
        page: res.data.data.current_page ?? 1,
        per_page: res.data.data.per_page ?? params.pageLimit ?? 10,
      };
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
      const res = await api.post(`admin/production-order/approve-material-request`, {
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
         state.totalRecords = action.payload.total ?? 0;
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
        // if (!updated) return;

        // // Update specific request item in Redux state
        // state.data = state.data.map((item) =>
        //   item.id === updated.id ? updated : item
        // );
      });
  },
});

export default materialRequestSlice.reducer;
