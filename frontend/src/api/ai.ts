import api from './axios';

export interface HintRequest {
  problemDescription: string;
  userCode: string;
  language: string;
  problemSlug?: string;
}

export interface HintResponse {
  hint: string;
}

export const aiApi = {
  getHint: async (data: HintRequest): Promise<HintResponse> => {
    const response = await api.post('/ai/hint', data);
    return response.data;
  },
};