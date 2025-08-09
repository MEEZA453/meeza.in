import * as api from '../../api';
import { AppDispatch } from '../store';
import { Product } from '../../types/Product';

export const getFavorites = (token: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch({ type: 'GET_FAVORITES_REQUEST' });

    const { data } = await api.getFavorites(token);

    dispatch({ type: 'GET_FAVORITES_SUCCESS', payload: data.favourites });
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    dispatch({ type: 'GET_FAVORITES_FAIL', payload: errorMsg });
  }
};
export const getFavoritesByHandle = (token : string , handle: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch({ type: 'GET_FAVORITES_REQUEST_BY_HANDLE' });

    const { data } = await api.getFavoritesByHandle(token , handle);

    dispatch({ type: 'GET_FAVORITES_SUCCESS_BY_HANDLE', payload: data.favourites });
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    dispatch({ type: 'GET_FAVORITES_FAIL_BY_HANDLE', payload: errorMsg });
  }
};
export const addToFavorites = (designId: string, token: string) => async (dispatch: AppDispatch) => {
  try {
    await api.addToFavorites(designId, token);

    dispatch({ type: 'ADD_TO_FAVORITES', payload: designId });
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    dispatch({ type: 'FAVORITES_ERROR', payload: errorMsg });
  }
};

export const removeFromFavorites = (designId: string, token: string) => async (dispatch: AppDispatch) => {
  try {
    await api.removeFromFavorites(designId, token);

    dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: designId });
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    dispatch({ type: 'FAVORITES_ERROR', payload: errorMsg });
  }
};
