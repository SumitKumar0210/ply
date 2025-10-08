import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';
// ✅ Fetch all grades
export const fetchGrades = createAsyncThunk("grade/fetchAll", async () => {
  const res = await api.get("admin/grade/get-data");
  return res.data.data;
});

// ✅ Add new grade
export const addGrade = createAsyncThunk(
  "grade/add",
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/grade/store", newData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ✅ Update grade
export const updateGrade = createAsyncThunk(
  "grade/update",
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/grade/update/${updated.id}`, updated);
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
  'grade/update',
  async (updated) => {
    try{
      const res = await api.post("admin/grade/status-update", {
        id: updated.id,
        status: updated.status,
      });
      successMessage(res.data.message);
      return updated;
    }catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ✅ Delete grade
export const deleteGrade = createAsyncThunk("grade/delete", async (id) => {
  try{
    const res = await api.post(`admin/grade/delete/${id}`);
    successMessage(res.data.message);
    return id;
  }catch (error) {
    const errMsg = getErrorMessage(error);
    errorMessage(errMsg);
    return rejectWithValue(errMsg);
  }
});

// ✅ Slice
const gradeSlice = createSlice({
  name: "grade",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchGrades.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchGrades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add
      .addCase(addGrade.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(updateGrade.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })

      // Delete
      .addCase(deleteGrade.fulfilled, (state, action) => {
        const deletedId = action.meta.arg; 
        state.data = state.data.filter((item) => item.id !== deletedId);
      });
  },
});

export default gradeSlice.reducer;
