import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../api';
import { successMessage, errorMessage, getErrorMessage } from '../../../toast';

//  Thunks
export const fetchSettings = createAsyncThunk('setting/fetchAll', async () => {
  const res = await api.get("admin/setting/get-data");
  return res.data.data;
});

export const updateSetting = createAsyncThunk(
  'setting/update',
  async (updated, { rejectWithValue }) => {
    try {
      const res = await api.post(`admin/setting/update/${updated.get("id")}`, updated);
      successMessage(res.data.message);
      return res.data.data;
    } catch (error) {
      const errMsg = getErrorMessage(error);
      errorMessage(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);


//  Slice
const generalSettingSlice = createSlice({
  name: "setting",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update
      .addCase(updateSetting.fulfilled, (state, action) => {
        const index = state.data.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })

  },
});

export default generalSettingSlice.reducer;
