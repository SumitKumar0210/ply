import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

export const fetchLabours = createAsyncThunk(
  "labour/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/labour/get-data");
      return res.data.data || [];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);


export const fetchActiveLabours = createAsyncThunk(
  "labour/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/labour/get-data?status=1");
      return res.data.data || [];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);


export const fetchAllLaboursWithSearch = createAsyncThunk(
  "labour/fetchAllWithSearch",
  async (
    { pageIndex = 1, pageLimit = 10, search = "", active = "" },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("admin/labour/search", {
        page: pageIndex,
        limit: pageLimit,
        search,
        active,
      });

      const response = res.data.data || {};

      return {
        data: Array.isArray(response.data) ? response.data : [],
        total: response.total ?? 0,
        currentPage: response.current_page ?? pageIndex,
        perPage: response.per_page ?? pageLimit,
      };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


export const addLabour = createAsyncThunk(
  "labour/add",
  async (newlabour, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/labour/store", newlabour);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


export const updateLabour = createAsyncThunk(
  "labour/update",
  async ({ updated }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/labour/update/${updated.id}`, updated);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const statusUpdate = createAsyncThunk(
  "labour/statusUpdate",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/labour/status-update", { id, status });
      successMessage(res.data.message);
      return { id, status };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const deleteLabour = createAsyncThunk(
  "labour/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/labour/delete/${id}`);
      successMessage(res.data.message);
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const labourSlice = createSlice({
  name: "labour",
  initialState: {
    data: [],
    activeLabours: [],
    searchResults: {
      data: [],
      total: 0,
      currentPage: 1,
      perPage: 10,
    },
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      
      .addCase(fetchLabours.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLabours.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchLabours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchActiveLabours.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveLabours.fulfilled, (state, action) => {
        state.loading = false;
        state.activeLabours = action.payload;
      })
      .addCase(fetchActiveLabours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchAllLaboursWithSearch.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllLaboursWithSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults.data = action.payload;
      })
      .addCase(fetchAllLaboursWithSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addLabour.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      .addCase(updateLabour.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })

      .addCase(statusUpdate.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index].status = action.payload.status;
      })

      .addCase(deleteLabour.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default labourSlice.reducer;
