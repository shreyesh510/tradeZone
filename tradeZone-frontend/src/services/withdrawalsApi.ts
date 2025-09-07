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
  async update(id: string, payload: Partial<{ amount: number; description?: string; method?: string }>) {
    const res = await api.patch<{ success: boolean }>(`/withdrawals/${id}`, payload);
    return res.data;
  },
  async remove(id: string) {
    const res = await api.delete<{ success: boolean }>(`/withdrawals/${id}`);
    return res.data;
  }
};
