import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Async Thunks
export const fetchUserPermissions = createAsyncThunk(
  "userPermissions/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/user-permissions/get-data");
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getDataByModule = createAsyncThunk(
  "userPermissions/getDataByModule",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/user-permissions/get-data-by-module");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getModulePermission = createAsyncThunk(
  "userPermissions/getModulePermission",
  async (values, { rejectWithValue }) => {
    console.log(values);
    try {
      const response = await api.post("/admin/user-permissions/get-module-permission", {id:values});
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchUserPermissionById = createAsyncThunk(
  "userPermissions/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/user-permissions/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createUserPermission = createAsyncThunk(
  "userPermissions/create",
  async (permissionData, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/user-permissions/store", permissionData);
      successMessage("Permission created successfully");
      return response.data;
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      errorMessage(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

export const updateUserPermission = createAsyncThunk(
  "userPermissions/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/user-permissions/update/${id}`, data);
      successMessage("Permission updated successfully");
      return response.data;
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      errorMessage(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

export const deleteUserPermission = createAsyncThunk(
  "userPermissions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.post(`/admin/user-permissions/delete/${id}`);
      successMessage("Permission deleted successfully");
      return id;
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      errorMessage(errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// Initial State
const initialState = {
  permissions: [],
  rolePermissions: [],
  selectedPermission: null,
  loading: false,
  error: null,
  actionLoading: false, // For create/update/delete operations
};

const userPermissionSlice = createSlice({
  name: "userPermissions",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedPermission: (state) => {
      state.selectedPermission = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Permissions
      .addCase(fetchUserPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload;
      })
      .addCase(fetchUserPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
    
      // Fetch getDataByModule
      .addCase(getDataByModule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDataByModule.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload;
      })
      .addCase(getDataByModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch getDataByModule
      .addCase(getModulePermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getModulePermission.fulfilled, (state, action) => {
        state.loading = false;
        state.rolePermissions = action.payload;
      })
      .addCase(getModulePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Permission By ID
      .addCase(fetchUserPermissionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPermissionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPermission = action.payload;
      })
      .addCase(fetchUserPermissionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Permission
      .addCase(createUserPermission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createUserPermission.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.permissions.push(action.payload);
      })
      .addCase(createUserPermission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update Permission
      .addCase(updateUserPermission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateUserPermission.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.permissions.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index !== -1) {
          state.permissions[index] = action.payload;
        }
        if (state.selectedPermission?.id === action.payload.id) {
          state.selectedPermission = action.payload;
        }
      })
      .addCase(updateUserPermission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Delete Permission
      .addCase(deleteUserPermission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteUserPermission.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.permissions = state.permissions.filter(
          (p) => p.id !== action.payload
        );
        if (state.selectedPermission?.id === action.payload) {
          state.selectedPermission = null;
        }
      })
      .addCase(deleteUserPermission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSelectedPermission, resetState } =
  userPermissionSlice.actions;

export default userPermissionSlice.reducer;