import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../../toast";

// Fetch monthly attendance data
export const getMonthlyAttendance = createAsyncThunk(
    "attendance/getMonthlyAttendance",
    async ({ month, year }, { rejectWithValue }) => {
        try {
            const response = await api.get("/admin/labour/getAttendance", {
                params: { month, year }
            });
            return response.data;
        } catch (error) {
            const errMsg = getErrorMessage(error);
            errorMessage(errMsg);
            return rejectWithValue(errMsg);
        }
    }
);

const attendanceSlice = createSlice({
    name: "attendance",
    initialState: {
        data: {},
        selectedMonth: new Date().getMonth() + 1,
        selectedYear: new Date().getFullYear(),
        loading: false,
        error: null,
    },
    reducers: {
        setMonthYear: (state, action) => {
            state.selectedMonth = action.payload.month;
            state.selectedYear = action.payload.year;
        },
        clearAttendanceData: (state) => {
            state.data = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getMonthlyAttendance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getMonthlyAttendance.fulfilled, (state, action) => {
                state.loading = false;
                // Store data directly as received from API
                state.data = action.payload.data || {};
            })
            .addCase(getMonthlyAttendance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.data = {};
            });
    },
});

export const {
    setMonthYear,
    clearAttendanceData,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;