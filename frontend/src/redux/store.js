import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/productsSlice.js';

const store = configureStore({
    reducer: {
        products: productsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
