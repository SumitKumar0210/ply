import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";

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
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to add grade"
      );
    }
  }
);

// ✅ Update grade
export const updateGrade = createAsyncThunk(
  "grade/update",
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/grade/update/${updated.id}`, updated);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update grade"
      );
    }
  }
);

export const statusUpdate = createAsyncThunk(
  'grade/update',
  async (updated) => {
    const res = await api.post("admin/grade/status-update", {
      id: updated.id,
      status: updated.status,
    });
    return updated;
  }
);

// ✅ Delete grade
export const deleteGrade = createAsyncThunk("grade/delete", async (id) => {
  await api.post(`admin/grade/delete/${id}`);
  return id;
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
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default gradeSlice.reducer;
