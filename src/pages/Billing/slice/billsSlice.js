import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Async Thunks

// Fetch all bills
export const fetchBills = createAsyncThunk(
  "bill/fetchBills",
  async ({ pageIndex = 0, pageLimit = 10, search = "" }, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/billing/get-data", {
        params: {
          page: pageIndex + 1,
          limit: pageLimit,
          search: search,
        }
      });
      console.log(res.data.data);
      console.log(res.data);

      return {
        data: res.data.data ?? [],
        totalRecords: res.data.total ?? 0,
      };
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


export const fetchActiveBills = createAsyncThunk(
  "bill/fetchActiveBills",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/billings/active");
      return response.data;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch single bill by ID
export const fetchBillById = createAsyncThunk(
  "bill/fetchBillById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/billing/edit/${id}`);
      return response.data.data;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add new bill
export const addBill = createAsyncThunk(
  "bill/addBill",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/billing/store", formData);
      successMessage("Bill created successfully!");
      return response.data;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update bill
export const updateBill = createAsyncThunk(
  "bill/updateBill",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      console.log(id, formData);
      const response = await api.post(`/admin/billing/update/${id}`, formData);

      successMessage("Bill updated successfully!");
      return response.data;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete bill
export const deleteBill = createAsyncThunk(
  "bill/deleteBill",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/billing/${id}`);
      successMessage("Bill deleted successfully!");
      return id;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update bill status (pending/paid)
export const updateBillStatus = createAsyncThunk(
  "bill/updateBillStatus",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/billing/status-update`, { id: id });
      successMessage(`Bill status updated to ${status}!`);
      return response.data;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch bills by customer
export const fetchBillsByCustomer = createAsyncThunk(
  "bill/fetchBillsByCustomer",
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/billings/customer/${customerId}`);
      return response.data;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const billsSlice = createSlice({
  name: "bill",
  initialState: {
    data: [],
    activeData: [],
    selected: {},
    totalRecords: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentBill: (state) => {
      state.currentBill = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all bills
      .addCase(fetchBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;         
        state.totalRecords = action.payload.totalRecords;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch active bills
      .addCase(fetchActiveBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveBills.fulfilled, (state, action) => {
        state.loading = false;
        state.activeData = action.payload;
      })
      .addCase(fetchActiveBills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch bill by ID
      .addCase(fetchBillById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBillById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchBillById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add bill
      .addCase(addBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBill.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(addBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update bill
      .addCase(updateBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBill.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (bill) => bill.id === action.payload.id
        );
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        if (state.currentBill?.id === action.payload.id) {
          state.currentBill = action.payload;
        }
      })
      .addCase(updateBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete bill
      .addCase(deleteBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBill.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter((bill) => bill.id !== action.payload);
        state.activeData = state.activeData.filter(
          (bill) => bill.id !== action.payload
        );
      })
      .addCase(deleteBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update bill status
      .addCase(updateBillStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBillStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (bill) => bill.id === action.payload.id
        );
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        if (state.currentBill?.id === action.payload.id) {
          state.currentBill = action.payload;
        }
      })
      .addCase(updateBillStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch bills by customer
      .addCase(fetchBillsByCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBillsByCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchBillsByCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentBill, clearError } = billsSlice.actions;

export default billsSlice.reducer;