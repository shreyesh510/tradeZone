import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

interface Props {
  open: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onImported: () => void;
}

const ImportPositionsModal: React.FC<Props> = ({ open, isDarkMode, onClose, onImported }) => {
  const [account, setAccount] = useState<'main' | 'longterm'>('main');
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : '');
  };

  const parseFile = async (): Promise<any[]> => {
    const f = fileRef.current?.files?.[0];
    if (!f) return [];
    const data = await f.arrayBuffer();
    const wb = XLSX.read(data);
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
    // Expect columns like: Date, Symbol, Side, Lots, Entry (or Entry Price), Amount/Margin (optional), Platform (optional)
    return rows.map((r) => ({
      date: r.Date || r.date || r.Timestamp || r.timestamp,
      symbol: r.Symbol || r.symbol || '',
      side: String(r.Side || r.side || 'buy').toLowerCase() === 'sell' ? 'sell' : 'buy',
      lots: Number(r.Lots ?? r.lots ?? 0),
      entryPrice: Number(r.Entry ?? r['Entry Price'] ?? r.entryPrice ?? 0),
      investedAmount: Number(r.Amount ?? r.Margin ?? r.Invested ?? r.investedAmount ?? 0) || undefined,
      platform: r.Platform || r.platform || undefined,
      account: account,
    }));
  };

  const submit = async () => {
    try {
      setBusy(true);
      const items = await parseFile();
      if (!items.length) {
        alert('No rows found in the selected file.');
        return;
      }
      const { positionsApi } = await import('../../../../services/positionsApi');
      const res = await positionsApi.importPositions(items, account);
      alert(`Imported: ${res.created}, Skipped (duplicates/invalid): ${res.skipped}`);
      onImported();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Import failed. Please check your file format.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`w-full max-w-lg rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Import Positions from Excel</h2>
          <button onClick={onClose} className="text-sm opacity-70 hover:opacity-100">Close</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Account</label>
            <select value={account} onChange={(e) => setAccount(e.target.value as any)} className={`w-full p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
              <option value="main">Main</option>
              <option value="longterm">Longterm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Excel file (.xlsx or .xls)</label>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={onFileChange} className="w-full" />
            {fileName && <div className="text-xs mt-1 opacity-70">Selected: {fileName}</div>}
          </div>
          <div className="flex gap-3 pt-2">
            <button disabled={busy} onClick={submit} className={`px-4 py-2 rounded ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white`}>
              {busy ? 'Importing…' : 'Upload & Import'}
            </button>
            <button disabled={busy} onClick={onClose} className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
              Cancel
            </button>
          </div>
          <div className="text-xs opacity-70">
            Expected columns: Date, Symbol, Side, Lots, Entry (or Entry Price), Amount/Margin (optional), Platform (optional). Duplicates are skipped using date+symbol+account+platform+entry+lots.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPositionsModal;
