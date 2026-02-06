import { jest } from '@jest/globals';

export const createProductTransaction = jest.fn().mockResolvedValue(undefined);
export const getProduct = jest.fn();
export const getStock = jest.fn();
export const joinProductWithStock = jest.fn();
export const getAllProducts = jest.fn();
export const getAllStocks = jest.fn();
export const joinProductsWithStocks = jest.fn();
