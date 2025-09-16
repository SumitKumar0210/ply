import { configureStore } from '@reduxjs/toolkit';
import userTypeReducer from '../slices/userTypeSlice';

export const store = configureStore({
    reducer : {
         userType: userTypeReducer,
    }
})