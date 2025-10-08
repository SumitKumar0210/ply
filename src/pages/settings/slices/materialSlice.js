import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust path
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
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
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


// Update material
export const updateMaterial = createAsyncThunk(
  "material/update",
  async ({ updated }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/material/update/${updated.id}`, updated,);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ✅ Status update
export const statusUpdate = createAsyncThunk(
  "material/update",
  async (updated) => {
    try{
      const res = await api.post("admin/material/status-update", {
        id: updated.id,
        status: updated.status,
      });
      successMessage(res.data.message);
      return updated;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Delete material
export const deleteMaterial = createAsyncThunk("material/delete", async (id) => {
  try{
    const res = await api.post(`admin/material/delete/${id}`);
    successMessage(res.data.message);
    return id;
  } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
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
