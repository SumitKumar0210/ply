import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

// Fetch all work shifts
export const fetchWorkShifts = createAsyncThunk(
    "workShift/fetchWorkShifts",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/admin/shift/get-data");
            return res.data.data;
        } catch (error) {
            const errMsg = getErrorMessage(error);
            errorMessage(errMsg);
            return rejectWithValue(errMsg);
        };
    }
);

export const fetchActiveWorkShifts = createAsyncThunk(
    "workShift/fetchActiveWorkShifts",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/admin/shift/get-data?status=1");
            return res.data.data;
        } catch (error) {
            const errMsg = getErrorMessage(error);
            errorMessage(errMsg);
            return rejectWithValue(errMsg);
        };
    }
);

// Add new work shift
export const addWorkShift = createAsyncThunk(
    "workShift/addWorkShift",
    async (shiftData, { rejectWithValue }) => {
        try {
            const res = await api.post("/admin/shift/store", shiftData);
            return res.data.data;
        } catch (error) {
            const errMsg = getErrorMessage(error);
            errorMessage(errMsg);
            return rejectWithValue(errMsg);
        }
    }
);

// Update work shift
export const updateWorkShift = createAsyncThunk(
    "workShift/updateWorkShift",
    async ({ id, ...shiftData }, { rejectWithValue }) => {
        try {
            const res = await api.post(`/admin/shift/update/${id}`, shiftData);
            return res.data.data;
        } catch (error) {
            const errMsg = getErrorMessage(error);
            errorMessage(errMsg);
            return rejectWithValue(errMsg);
        }
    }
);

// Delete work shift
export const deleteWorkShift = createAsyncThunk(
    "workShift/deleteWorkShift",
    async (id, { rejectWithValue }) => {
        try {
            await api.post(`/admin/shift/delete/${id}`);
            return id;
        } catch (error) {
            const errMsg = getErrorMessage(error);
            errorMessage(errMsg);
            return rejectWithValue(errMsg);
        }
    }
);

// Update status
export const statusUpdate = createAsyncThunk(
    "workShift/statusUpdate",
    async (shiftData, { rejectWithValue }) => {
        try {
            const res = await api.post(
                `/admin/shift/status-update`,
                {id:shiftData.id, status: shiftData.status }
            );
            return res.data.data;
        } catch (error) {
            const errMsg = getErrorMessage(error);
            errorMessage(errMsg);
            return rejectWithValue(errMsg);
        }
    }
);

const workShiftSlice = createSlice({
    name: "workShift", 
    initialState: {
        data: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder

            .addCase(fetchWorkShifts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkShifts.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchWorkShifts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(fetchActiveWorkShifts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchActiveWorkShifts.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchActiveWorkShifts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(addWorkShift.fulfilled, (state, action) => {
                state.data.push(action.payload);
            })

            .addCase(updateWorkShift.fulfilled, (state, action) => {
                const index = state.data.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) {
                    state.data[index] = action.payload;
                }
            })

            .addCase(deleteWorkShift.fulfilled, (state, action) => {
                state.data = state.data.filter((item) => item.id !== action.payload);
            })

            .addCase(statusUpdate.fulfilled, (state, action) => {
                const index = state.data.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) {
                    state.data[index] = action.payload;
                }
            });
    },
});

export default workShiftSlice.reducer;