import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api"; // adjust the path to your api file
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";
//  Fetch all users
export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("admin/user/get-data");
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch users");
    }
  }
);

//  Add user
export const addUser = createAsyncThunk(
  "users/add",
  async (newUser, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/user/store", newUser);
      successMessage(res.data.message);
       return res.data.data;
    }  catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Update user
export const updateUser = createAsyncThunk(
  "users/update",
  async ({ id, ...updated }, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/user/update/${id}`, updated);
      successMessage(res.data.message);
      return res.data.data;
    }  catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Status update
export const statusUpdate = createAsyncThunk(
  "users/statusUpdate",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.post("admin/user/status-update", { id, status });
      successMessage(res.data.message);
      return { id, status };
    }  catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

//  Delete user
export const deleteUser = createAsyncThunk(
  "users/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/user/delete/${id}`);
      successMessage(res.data.message);
      return id;
    }  catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ---------------- Slice ----------------
const userSlice = createSlice({
  name: "users",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add
      .addCase(addUser.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      // Update
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.data.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
      })

      // Status Update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const user = state.data.find((u) => u.id === action.payload.id);
        if (user) user.status = action.payload.status;
      })

      // Delete
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.data = state.data.filter((u) => u.id !== action.payload);
      });
  },
});

export default userSlice.reducer;
