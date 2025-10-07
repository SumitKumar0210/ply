import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust path

// Fetch all materials
export const fetchMaterials = createAsyncThunk(
  "material/fetchAll",
  async () => {
    const res = await api.get("admin/material/get-data");
    return res.data.data;
  }
);

// Add material
export const addMaterial = createAsyncThunk(
  "material/add",
  async (newData, { rejectWithValue }) => {
    // console.log("sendData:", JSON.stringify(newData, null, 2));

    try {
      const res = await api.post("admin/material/store", newData, );
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Add failed");
    }
  }
);


// Update material
export const updateMaterial = createAsyncThunk(
  "material/update",
  async ({ updated }, { rejectWithValue }) => {
    try {
      
      const res = await api.post(`admin/material/update/${updated.id}`, updated,);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Update failed");
    }
  }
);

// ✅ Status update
export const statusUpdate = createAsyncThunk(
  "material/update",
  async (updated) => {
    const res = await api.post("admin/material/status-update", {
      id: updated.id,
      status: updated.status,
    });
    return updated;
  }
);

// Delete material
export const deleteMaterial = createAsyncThunk("material/delete", async (id) => {
  await api.post(`admin/material/delete/${id}`);
  return id;
});

const materialSlice = createSlice({
  name: "material",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchMaterials.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add
      .addCase(addMaterial.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })
      // Update
      .addCase(updateMaterial.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })
      // Delete
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.data = state.data.filter((d) => d.id !== action.payload);
      });
  },
});

export default materialSlice.reducer;
