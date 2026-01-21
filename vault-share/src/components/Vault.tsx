import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { encryptFile, decryptFile } from '../utils/crypto';
import { 
  Upload, Lock, FileText, Trash2, 
  LogOut, Shield, Loader2, KeyRound, 
  CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';

interface VaultItem {
  id: string;
  filename: string;
  created_at: string;
  size_bytes: number;
  file_path: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function Vault({ session }: { session: any }) {
  // Data State
  const [files, setFiles] = useState<VaultItem[]>([]);
  
  // Interaction State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPassword, setUploadPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  
  // Decryption State
  const [decryptPassword, setDecryptPassword] = useState('');
  const [selectedFileForDecrypt, setSelectedFileForDecrypt] = useState<VaultItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Show Notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    // Auto-dismiss after 3 seconds
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchVaultItems();
  }, []);

  const fetchVaultItems = async () => {
    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching vault:', error);
    else setFiles(data || []);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadPassword) return;
    setIsProcessing(true);

    try {
      // 1. Encrypt
      const { encryptedBlob, fileName } = await encryptFile(uploadFile, uploadPassword);

      // 2. Upload
      const filePath = `${session.user.id}/${Date.now()}_${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('vault-files')
        .upload(filePath, encryptedBlob);

      if (uploadError) throw uploadError;

      // 3. Database Record
      const { error: dbError } = await supabase.from('vault_items').insert({
        owner_id: session.user.id,
        filename: uploadFile.name,
        file_path: filePath,
        size_bytes: uploadFile.size,
      });

      if (dbError) throw dbError;

      setUploadFile(null);
      setUploadPassword('');
      fetchVaultItems();
      showToast('File Encrypted & Secured Successfully.', 'success');

    } catch (error: any) {
      showToast(error.message || 'Upload failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!selectedFileForDecrypt || !decryptPassword) return;
    setIsProcessing(true);

    try {
      // 1. Download Encrypted Blob
      const { data: blob, error } = await supabase.storage
        .from('vault-files')
        .download(selectedFileForDecrypt.file_path);

      if (error) throw error;
      if (!blob) throw new Error('File download failed.');

      // 2. Decrypt Locally
      const decryptedBlob = await decryptFile(blob, decryptPassword);

      // 3. Trigger Download
      const url = window.URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFileForDecrypt.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSelectedFileForDecrypt(null);
      setDecryptPassword('');
      showToast('Decryption Verified: File Downloaded.', 'success');

    } catch (error: any) {
      showToast('Decryption Failed: Invalid Password or Corrupted Data.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, path: string) => {
    if (!confirm('Permanently delete this secure asset?')) return;
    
    await supabase.storage.from('vault-files').remove([path]);
    await supabase.from('vault_items').delete().eq('id', id);
    fetchVaultItems();
    showToast('Asset permanently destroyed.', 'success');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-vault-900 text-gray-100 p-4 md:p-8 relative">
      
      {/* TOAST NOTIFICATION SYSTEM */}
      {toast && (
        <div className={`
          fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md animate-slide-in
          ${toast.type === 'success' 
            ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100' 
            : 'bg-rose-900/80 border-rose-500/50 text-rose-100'}
        `}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-vault-700 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-vault-accent/10 rounded-lg border border-vault-accent/20">
              <Shield className="w-8 h-8 text-vault-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Secure Vault</h1>
              <p className="text-xs text-gray-500 font-mono">ID: {session.user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </header>

        {/* Upload Section */}
        <div className="bg-vault-800 rounded-2xl border border-vault-700 overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-all
                ${uploadFile ? 'border-vault-accent bg-vault-accent/5' : 'border-vault-700 hover:border-gray-500 bg-vault-900/50'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => e.target.files && setUploadFile(e.target.files[0])}
              />
              {uploadFile ? (
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-vault-accent" />
                  <div className="text-left">
                    <p className="font-medium text-white">{uploadFile.name}</p>
                    <p className="text-xs text-gray-400">{formatSize(uploadFile.size)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                  <p className="text-sm text-gray-400">Click to select a sensitive document</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3 h-3" /> Encryption Key
              </label>
              <input
                type="password"
                value={uploadPassword}
                onChange={(e) => setUploadPassword(e.target.value)}
                placeholder="Enter a strong unique password for this file..."
                className="w-full bg-vault-900 border border-vault-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-vault-accent outline-none transition-all font-mono text-sm"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!uploadFile || !uploadPassword || isProcessing}
              className={`
                w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                ${!uploadFile || !uploadPassword 
                  ? 'bg-vault-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-vault-accent hover:bg-emerald-400 text-vault-900 shadow-lg shadow-emerald-900/20'}
              `}
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <Lock className="w-4 h-4" />}
              {isProcessing ? 'Encrypting & Uploading...' : 'Secure & Upload'}
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300">Vaulted Assets</h3>
          {files.length === 0 ? (
            <div className="text-center py-12 text-gray-600 border border-dashed border-vault-700 rounded-xl">
              No secure files found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => (
                <div key={file.id} className="bg-vault-800 border border-vault-700 p-4 rounded-xl hover:border-vault-500 transition-colors group relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-vault-900 rounded-lg">
                      <Lock className="w-5 h-5 text-gray-400 group-hover:text-vault-accent transition-colors" />
                    </div>
                    <button 
                      onClick={() => handleDelete(file.id, file.file_path)}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-medium text-white truncate mb-1" title={file.filename}>{file.filename}</h4>
                  <p className="text-xs text-gray-500 mb-4">{formatSize(file.size_bytes)} • {new Date(file.created_at).toLocaleDateString()}</p>
                  <button
                    onClick={() => setSelectedFileForDecrypt(file)}
                    className="w-full py-2 bg-vault-900 border border-vault-700 hover:border-vault-accent text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <KeyRound className="w-3 h-3" />
                    Decrypt
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Decryption Modal */}
        {selectedFileForDecrypt && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-40">
            <div className="bg-vault-800 p-6 rounded-2xl w-full max-w-md border border-vault-600 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Decrypt File</h3>
                <button onClick={() => setSelectedFileForDecrypt(null)} className="text-gray-400 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Enter the password used to encrypt <span className="text-white">{selectedFileForDecrypt.filename}</span>.
              </p>
              
              <input
                type="password"
                autoFocus
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
                placeholder="Enter decryption password..."
                className="w-full bg-vault-900 border border-vault-600 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-vault-accent outline-none text-white"
              />
              
              <button 
                onClick={handleDecrypt}
                disabled={isProcessing || !decryptPassword}
                className="w-full py-3 rounded-lg bg-vault-accent text-vault-900 font-bold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Verifying Integrity...' : 'Unlock & Download'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}