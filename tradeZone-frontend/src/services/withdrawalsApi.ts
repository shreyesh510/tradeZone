import api from './api';

export interface WithdrawalDto {
  id: string;
  amount: number;
  method?: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
}

export const withdrawalsApi = {
  list: async (): Promise<WithdrawalDto[]> => {
    const res = await api.get('/withdrawals');
    return res.data;
  },
  create: async (data: { amount: number; method?: string; description?: string }): Promise<WithdrawalDto> => {
    const res = await api.post('/withdrawals', data);
    return res.data;
  },
};
