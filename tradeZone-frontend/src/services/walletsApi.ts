import api from './api';

export interface WalletDto {
  id: string;
  name: string;
  platform?: string;
  balance?: number;
  currency?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletHistoryItem {
  id: string;
  userId: string;
  walletId: string;
  action: 'create' | 'update';
  data: any;
  createdAt: string;
}

export const walletsApi = {
  list: async (): Promise<WalletDto[]> => {
    const res = await api.get('/wallets');
    return res.data;
  },
  create: async (data: Partial<WalletDto> & { name: string }): Promise<WalletDto> => {
    const res = await api.post('/wallets', data);
    return res.data;
  },
  async update(id: string, payload: Partial<WalletDto>) {
    const res = await api.patch<{ success: boolean }>(`/wallets/${id}`, payload);
    return res.data;
  },
  async remove(id: string) {
    const res = await api.delete<{ success: boolean }>(`/wallets/${id}`);
    return res.data;
  },
  async history(limit?: number) {
    const qs = typeof limit === 'number' ? `?limit=${limit}` : '';
    const res = await api.get<WalletHistoryItem[]>(`/wallets/history/all${qs}`);
    return res.data;
  }
};
