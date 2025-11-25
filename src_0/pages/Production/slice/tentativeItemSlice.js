import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api";
import { successMessage, errorMessage, getErrorMessage } from "../../../toast";


export const storeTentativeItems = createAsyncThunk(
    "tentativeItem/storeTentativeItems",
    async (values, { rejectWithValue }) => {
        try {
            const res = await api.post(
                `admin/production-order/store-tentive-items`,
                values
            );

            successMessage(res.data.message);
            return res.data.data ?? []; 
        } catch (error) {
            const errMsg = getErrorMessage(error);
            errorMessage(errMsg);
            return rejectWithValue(errMsg);
        }
    }
);


const tentativeItemSlice = createSlice({
    name: "tentativeItem",

    initialState: {
        data: [],
        loading: false,
        error: null,
        totalRecords: 0,
    },

    reducers: {},

    extraReducers: (builder) => {
        builder

            // STORE
            .addCase(storeTentativeItems.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(storeTentativeItems.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload; 
            })

            .addCase(storeTentativeItems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default tentativeItemSlice.reducer;
