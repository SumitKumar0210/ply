import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import api from '../../../api';
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';

// ✅ Thunks
export const fetchUserTypes = createAsyncThunk('userType/fetchAll', async () => {

  const res = await api.get("admin/userType/get-data");
 
  return res.data.data;
  // return false;
});


export const fetchActiveUserTypes = createAsyncThunk('userType/fetchAll', async () => {

  const res = await api.get("admin/userType/get-data?status=1");
 
  return res.data.data;
  // return false;
});

export const addUserType = createAsyncThunk(
  'userType/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post(
      "admin/userType/store",
        newData,
      );
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


export const updateUserType = createAsyncThunk('userType/update', async (updated, {rejectWithValue}) => {
  try{
    const res = await api.post(
      `admin/userType/update/${updated.id}`,
      updated,
     
    );
    successMessage(res.data.message);
    return updated;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    errorMessage(errMsg);
    return rejectWithValue(errMsg);
  }
});

export const statusUpdate = createAsyncThunk('userType/update', async (updated) => {
  try{
    const res = await api.post(
      "admin/userType/status-update",
      { id: updated.id, status: updated.status },
    );
    successMessage(res.data.message);
    return updated;
  } catch (error) {
    const errMsg = getErrorMessage(error);
    errorMessage(errMsg);
    return rejectWithValue(errMsg);
  }

});

export const deleteUserType = createAsyncThunk(
  "userType/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/userType/delete/${id}`);

      // Log and show success message
      console.log(res.data.message || "User type deleted successfully!");
      successMessage(res.data.message || "User type deleted successfully!");

      return res;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


// ✅ Slice
const userTypeSlice = createSlice({
  name: "userType",
  initialState: {
    data: [], // ✅ keep only array here
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchUserTypes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // ✅ array only
      })
      .addCase(fetchUserTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add
      .addCase(addUserType.fulfilled, (state, action) => {
        state.data.unshift(action.payload); // ✅ add new row
      })

      // Update
      .addCase(updateUserType.fulfilled, (state, action) => {
        const index = state.data.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteUserType.fulfilled, (state, action) => {
        const deletedId = action.meta.arg; 
        state.data = state.data.filter((item) => item.id !== deletedId);
      });
  },
});

export default userTypeSlice.reducer;
