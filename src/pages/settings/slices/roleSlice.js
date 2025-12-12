import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';

// ---------------------- Thunks ----------------------

// Fetch all roles
export const fetchRoles = createAsyncThunk('role/fetchAll', async () => {
  const res = await api.get('admin/roles/get-data');
  return res.data.data;
});

// Fetch only active roles
export const fetchActiveRoles = createAsyncThunk('role/fetchActive', async () => {
  const res = await api.get('admin/roles/get-data?status=1');
  return res.data.data;
});

// Add a role
export const addRole = createAsyncThunk(
  'role/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await api.post('admin/roles/store', newData);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Update a role
export const updateRole = createAsyncThunk(
  'role/update',
  async (updated, { rejectWithValue }) => {
    try {
      // Using PUT for RESTful update
      const res = await api.post(`admin/roles/update/${updated.id}`, updated);
      successMessage(res.data.message);
      // return the updated role object from server if available, otherwise fallback
      return res.data.data ?? updated;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Update role status (e.g. enable/disable)
export const statusUpdate = createAsyncThunk(
  'role/statusUpdate',
  async (payload, { rejectWithValue }) => {
    try {
      
      const res = await api.post(`admin/roles/status-update`,{id:payload.id});
      successMessage(res.data.message);
      return { id: payload.id, status: payload.status, data: res.data.data ?? null };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


export const assignPermission = createAsyncThunk(
  'role/statusUpdate',
  async (values, { rejectWithValue }) => {
    try {

      const res = await api.post(`admin/roles/assign-permissions`, values);
      successMessage(res.data.message);
      return { id: values.id, status: values.status, data: res.data.data ?? null };
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Delete role
export const deleteRole = createAsyncThunk(
  'role/delete',
  async (id, { rejectWithValue }) => {
    try {
      // Using DELETE for RESTful delete
      const res = await api.post(`admin/roles/delete/${id}`);
      successMessage(res.data.message || 'Role deleted successfully!');
      // return the deleted id so reducer can remove it
      return id;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// ---------------------- Slice ----------------------
const roleSlice = createSlice({
  name: 'role',
  initialState: {
    data: [], // array of roles
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? 'Failed to fetch roles';
      })

      // Fetch active roles
      .addCase(fetchActiveRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchActiveRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? 'Failed to fetch active roles';
      })

      // Add role
      .addCase(addRole.fulfilled, (state, action) => {
        // insert new role at start
        state.data.unshift(action.payload);
      })
      .addCase(addRole.rejected, (state, action) => {
        state.error = action.payload ?? action.error?.message;
      })

      // Update role
      .addCase(updateRole.fulfilled, (state, action) => {
        const updatedRole = action.payload;
        const index = state.data.findIndex((r) => r.id === updatedRole.id);
        if (index !== -1) {
          state.data[index] = updatedRole;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.error = action.payload ?? action.error?.message;
      })

      // Status update
      .addCase(statusUpdate.fulfilled, (state, action) => {
        const { id, status, data } = action.payload;
        const index = state.data.findIndex((r) => r.id === id);
        if (index !== -1) {
          // prefer updated object from server if provided
          if (data) state.data[index] = data;
          else state.data[index].status = status;
        }
      })
      .addCase(statusUpdate.rejected, (state, action) => {
        state.error = action.payload ?? action.error?.message;
      })

      // Delete role
      .addCase(deleteRole.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.data = state.data.filter((item) => item.id !== deletedId);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.error = action.payload ?? action.error?.message;
      });
  },
});

export default roleSlice.reducer;