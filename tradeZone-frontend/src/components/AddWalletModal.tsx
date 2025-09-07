import React, { useEffect, useState } from 'react';

interface AddWalletModalProps {
  open: boolean;
  onSave: (payload: { name: string; amount?: number; description?: string }) => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

const AddWalletModal: React.FC<AddWalletModalProps> = ({ open, onSave, onCancel, isDarkMode = false }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setAmount('');
      setDescription('');
    }
  }, [open]);

  if (!open) return null;

  const bg = isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const border = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  const handleSave = () => {
    if (!name.trim()) return;
    const amt = parseFloat(amount);
    onSave({ name: name.trim(), amount: isNaN(amt) ? undefined : amt, description: description.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div onClick={(e) => e.stopPropagation()} className={`${bg} relative z-10 w-full max-w-md rounded-xl shadow-xl border ${border}`}>
        <div className="p-5 border-b border-gray-700/40">
          <h3 className="text-lg font-semibold">Add Wallet</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm mb-1">Account name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Delta Exchange Main"
              className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Amount (optional)</label>
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
            <label className="block text-sm mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Note for this wallet"
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
