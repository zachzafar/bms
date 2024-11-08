// mockApiService.ts


import { mockPropertiesService } from './settings';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApiService = {
    ...mockPropertiesService
};