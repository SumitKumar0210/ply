import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

let token = localStorage.getItem('token');
if(!token){
  const token ='eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3BseWFwaS50ZWNoaWVzcXVhZC5pbi9wdWJsaWMvYXBpL2xvZ2luIiwiaWF0IjoxNzU3NTY3OTAwLCJleHAiOjE3ODkxMDM5MDAsIm5iZiI6MTc1NzU2NzkwMCwianRpIjoiRWNxSmZoNURyTzdYaW9WRSIsInN1YiI6IjEiLCJwcnYiOiIyM2JkNWM4OTQ5ZjYwMGFkYjM5ZTcwMWM0MDA4NzJkYjdhNTk3NmY3In0.WCqoW-pFmxGjMMXQ9DsswSLegHWAfigb0fByyA6zAHg'
  localStorage.setItem('token',token)
}

// ✅ Thunks
export const fetchUserTypes = createAsyncThunk('userType/fetchAll', async () => {
  const res = await axios.get(
    'https://plyapi.techiesquad.in/public/api/admin/userType/get-data',
    { headers: { Authorization: `Bearer ${token}` } }
  );
 
  return res.data.data;
  // return false;
});

export const addUserType = createAsyncThunk(
  'userType/add',
  async (newData, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        'https://plyapi.techiesquad.in/public/api/admin/userType/store',
        newData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return newData;
    } catch (error) {
      if (error.response && error.response.data) {
        // return only the message (serializable)
        return rejectWithValue(
          error.response.data[0] ?? error.response.data.error ?? "Request failed"
        );
      }
      return rejectWithValue("Something went wrong");
    }
  }
);


export const updateUserType = createAsyncThunk('userType/update', async (updated) => {
  const res = await axios.post(
    `https://plyapi.techiesquad.in/public/api/admin/userType/update/${updated.id}`,
    updated,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res;
});

export const statusUpdate = createAsyncThunk('userType/update', async (updated) => {
  const res = await axios.post(
    `https://plyapi.techiesquad.in/public/api/admin/userType/status-update`,
    { id: updated.id, status: updated.status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return updated;
});

export const deleteUserType = createAsyncThunk('userType/delete', async (id) => {
  await axios.post(
    `https://plyapi.techiesquad.in/public/api/admin/userType/delete/${id}`,
    id,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return id;
});

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
        state.data = state.data.filter((u) => u.id !== action.payload);
      });
  },
});

export default userTypeSlice.reducer;
