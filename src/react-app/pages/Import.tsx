import { useAuth } from "@getmocha/users-service/react";
import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Users } from "lucide-react";
import Papa from "papaparse";
import Navbar from "@/react-app/components/Navbar";
import EmptyState from "@/react-app/components/EmptyState";
import type { CsvMember } from "@/shared/types";

export default function Import() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  
  const [previewData, setPreviewData] = useState<CsvMember[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; imported?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewData([]);
    setImportResult(null);
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data as any[];
        const processed = parsed.slice(0, 5).map((row: any) => ({
          name: row.name || row.Name || null,
          email: row.email || row.Email || null,
          discord_id: row.discord_id || row.Discord_ID || row.discord || null,
          last_active_at: row.last_active_at || row.Last_Active || row.last_active || null,
        }));
        setPreviewData(processed);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      handleFileSelect(droppedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsed = results.data as any[];
          const members = parsed.map((row: any) => ({
            name: row.name || row.Name || null,
            email: row.email || row.Email || null,
            discord_id: row.discord_id || row.Discord_ID || row.discord || null,
            last_active_at: row.last_active_at || row.Last_Active || row.last_active || null,
          }));

          const response = await fetch('/api/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ members }),
          });

          const result = await response.json();
          setImportResult(result);
          
          if (result.success) {
            setFile(null);
            setPreviewData([]);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        } catch (error) {
          setImportResult({
            success: false,
            message: 'Failed to import members. Please try again.'
          });
        } finally {
          setImporting(false);
        }
      },
    });
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to import members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Import Members</h1>
          <p className="text-gray-600 mt-1">Upload your subscriber list to start creating retention campaigns</p>
        </div>

        {!file && !previewData.length ? (
          <div className="mb-8">
            <EmptyState
              icon={Upload}
              title="Upload your first subscriber list to get started."
              subtitle="Import via CSV to begin creating retention campaigns for your inactive members."
              buttonText="Upload CSV"
              onButtonClick={openFilePicker}
              gradient="from-blue-100 to-purple-100"
            />
          </div>
        ) : null}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-blue-900 mb-3">CSV Format Requirements</h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>name</strong>: Member's display name (optional)</p>
            <p>• <strong>email</strong>: Email address for email campaigns (optional)</p>
            <p>• <strong>discord_id</strong>: Discord user ID for Discord campaigns (optional)</p>
            <p>• <strong>last_active_at</strong>: Last activity date in YYYY-MM-DD format (optional)</p>
          </div>
          <p className="text-sm text-blue-700 mt-3">
            At least one contact method (email or discord_id) should be provided for each member.
          </p>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-8">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors"
          >
            <div className="flex flex-col items-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Upload className="w-8 h-8 text-gray-500" />
              </div>
              
              {!file ? (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Upload CSV File</h3>
                  <p className="text-gray-600 mb-4">Drag and drop your CSV file here, or click to browse</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                  <button
                    onClick={openFilePicker}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
                  >
                    Choose File
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-green-500 mr-2" />
                    <span className="font-bold text-gray-900">{file.name}</span>
                  </div>
                  <p className="text-gray-600 mb-4">File selected and parsed successfully</p>
                  <button
                    onClick={openFilePicker}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mr-3"
                  >
                    Choose Different File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        {previewData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Preview (First 5 rows)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discord ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.name || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.email || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.discord_id || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.last_active_at || <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Import Members</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className={`border rounded-2xl p-4 ${
            importResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`font-bold ${
                importResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {importResult.message}
              </p>
            </div>
            {importResult.success && importResult.imported && (
              <p className="text-green-700 mt-2">
                Successfully imported {importResult.imported} members. You can now create campaigns to reach out to them.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
