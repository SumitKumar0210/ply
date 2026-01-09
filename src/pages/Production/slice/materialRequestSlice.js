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
      const queryParams = new URLSearchParams();

      // Add pageIndex as 'pageIndex' for backend
      if (params.pageIndex !== undefined) {
        queryParams.append("pageIndex", params.pageIndex);
      }
      
      // Add pageLimit as 'pageLimit' for backend
      if (params.pageLimit) {
        queryParams.append("pageLimit", params.pageLimit);
      }
      
      // Add search parameter
      if (params.search) {
        queryParams.append("search", params.search);
      }

      const url = `admin/production-order/get-all-material-request?${queryParams.toString()}`;

      console.log("API URL:", url);
      
      const res = await api.post(url);
      
      console.log("API Response:", res.data);
      
      return {
        data: res.data.data.data ?? [],
        total: res.data.data.total ?? 0,
        currentPage: res.data.data.current_page ?? 1,
        lastPage: res.data.data.last_page ?? 1,
        perPage: res.data.data.per_page ?? params.pageLimit ?? 10,
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
    requestItems: {
      data: [],
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
    },
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
       // Fetch all request items
      .addCase(fetchAllRequestItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRequestItems.fulfilled, (state, action) => {
        state.loading = false;
        state.requestItems = {
          data: action.payload.data,
          current_page: action.payload.currentPage,
          last_page: action.payload.lastPage,
          per_page: action.payload.perPage,
          total: action.payload.total,
        };
        state.totalRecords = action.payload.total;
        state.error = null;
      })
      .addCase(fetchAllRequestItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch material requests";
        state.data = {
          data: [],
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
        };
        state.totalRecords = 0;
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
