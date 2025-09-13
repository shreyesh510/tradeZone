import React, { useEffect, useState } from 'react';

interface AddWalletModalProps {
  open: boolean;
  onSave: (payload: { 
    name: string; 
    type: 'demat' | 'bank'; 
    platform?: string;
    currency?: string;
    address?: string;
    amount?: number; 
    description?: string;
  }) => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

const AddWalletModal: React.FC<AddWalletModalProps> = ({ open, onSave, onCancel, isDarkMode = false }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'demat' | 'bank'>('demat');
  const [platform, setPlatform] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [customCurrency, setCustomCurrency] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Common platforms for demat and bank accounts
  const platforms = type === 'demat' 
    ? ['Grow', 'Delta Exchange', 'Exness', 'Other']
    : ['Bank', 'Other'];

  // Common currencies
  const currencies = ['INR', 'USD', 'Other'];

  useEffect(() => {
    if (open) {
      setName('');
      setType('demat');
      setPlatform('');
      setCustomPlatform('');
      setCurrency('INR');
      setCustomCurrency('');
      setAddress('');
      setAmount('');
      setDescription('');
    }
  }, [open]);

  // Reset platform when type changes
  useEffect(() => {
    setPlatform('');
    setCustomPlatform('');
  }, [type]);

  if (!open) return null;

  const bg = isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const border = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  const handleSave = () => {
    if (!name.trim()) return;
    const amt = parseFloat(amount);
    const finalPlatform = platform === 'Other' ? customPlatform.trim() : platform;
    const finalCurrency = currency === 'Other' ? customCurrency.trim() : currency;
    
    onSave({ 
      name: name.trim(), 
      type,
      platform: finalPlatform || undefined,
      currency: finalCurrency || undefined,
      address: address.trim() || undefined,
      amount: isNaN(amt) ? undefined : amt, 
      description: description.trim() || undefined 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div onClick={(e) => e.stopPropagation()} className={`${bg} relative z-10 w-full max-w-md rounded-xl shadow-xl border ${border}`}>
        <div className="p-5 border-b border-gray-700/40">
          <h3 className="text-lg font-semibold">Add Wallet</h3>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm mb-1">Account Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'demat' | 'bank')}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="demat">Demat Account</option>
              <option value="bank">Bank Account</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Account Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Delta Exchange Main"
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                if (e.target.value !== 'Other') setCustomPlatform('');
              }}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">Select Platform</option>
              {platforms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {platform === 'Other' && (
              <input
                type="text"
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                placeholder="Enter platform name"
                className={`w-full px-3 py-2 rounded-lg border mt-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Initial Balance (optional)</label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                if (e.target.value !== 'Other') setCustomCurrency('');
              }}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              {currencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {currency === 'Other' && (
              <input
                type="text"
                value={customCurrency}
                onChange={(e) => setCustomCurrency(e.target.value)}
                placeholder="Enter currency code"
                className={`w-full px-3 py-2 rounded-lg border mt-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Account ID (optional)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter account ID"
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Note for this wallet"
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
        </div>
        <div className="p-5 flex justify-end gap-3 border-t border-gray-700/40">
          <button onClick={onCancel} className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!name.trim()} className={`px-4 py-2 rounded-lg font-medium ${!name.trim() ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWalletModal;