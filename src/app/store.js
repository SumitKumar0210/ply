import { configureStore } from '@reduxjs/toolkit';
import userTypeReducer from '../features/userTypeSlice';

export const store = configureStore({
    reducer : {
         userType: userTypeReducer,
    }
})