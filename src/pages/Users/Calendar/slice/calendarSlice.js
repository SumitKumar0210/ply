import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../../toast";

// Fetch monthly attendance with month and year parameters
export const fetchMonthlyAttendance = createAsyncThunk(
  "calendar/fetchMonthlyAttendance",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/labour/getAttendance", {
        params: { month, year },
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Mark / Update attendance
export const markAttendance = createAsyncThunk(
  "calendar/markAttendance",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/admin/labour/markAttendance", payload);
      successMessage("Attendance marked successfully");
      return res.data.data;
    } catch (error) {
      errorMessage(getErrorMessage(error));
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const calendarSlice = createSlice({
  name: "calendar",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetCalendar: (state) => {
      state.data = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch monthly attendance
      .addCase(fetchMonthlyAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyAttendance.fulfilled, (state, action) => {
        state.loading = false;
        // Flatten the grouped data structure into an array
        const flattenedData = [];
        Object.entries(action.payload).forEach(([date, records]) => {
          records.forEach(record => {
            flattenedData.push({
              ...record,
              attendance_date: record.date,
              sign_in_time: record.sign_in,
              sign_out_time: record.sign_out,
              status: record.sign_in && record.sign_out ? 'present' : 'absent'
            });
          });
        });
        state.data = flattenedData;
      })
      .addCase(fetchMonthlyAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark attendance
      .addCase(markAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.loading = false;

        // Normalize the response to match our data structure
        const normalizedRecord = {
          ...action.payload,
          attendance_date: action.payload.date,
          sign_in_time: action.payload.sign_in,
          sign_out_time: action.payload.sign_out,
        };

        // Update or add the attendance record in state
        const index = state.data.findIndex(
          (item) =>
            item.labour_id === normalizedRecord.labour_id &&
            (item.date === normalizedRecord.date || item.attendance_date === normalizedRecord.attendance_date)
        );

        if (index !== -1) {
          // Update existing record
          state.data[index] = normalizedRecord;
        } else {
          // Add new record
          state.data.push(normalizedRecord);
        }
      })
      .addCase(markAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetCalendar } = calendarSlice.actions;
export default calendarSlice.reducer;