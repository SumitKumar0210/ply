import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";

export const fetchStock = createAsyncThunk(
    "stock/fetchStock",
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get("/admin/stock/get-data");
            return res.data.data; 
        } catch (error) {
            errorMessage(getErrorMessage(error));
            return rejectWithValue(getErrorMessage(error));
        }
    }
);

const initialState = {
    data: [],
    loading: false,
    totalCount: 0,
    error: null,
};

const stockSlice = createSlice({
    name: "stock",
    initialState,
    reducers: {},

    extraReducers: (builder) => {
        builder
            .addCase(fetchStock.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStock.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload || [];
                state.totalCount = action.payload.totalCount || 0;
            })
            .addCase(fetchStock.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Something went wrong";
            });
    },
});

export default stockSlice.reducer;
