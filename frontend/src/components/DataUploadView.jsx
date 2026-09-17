import React, { useState } from 'react';
import { Upload, Database, CheckCircle2, FileText, AlertCircle, RefreshCw, Filter, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function DataUploadView({ onDataLoaded, datasetSummary, onRefresh }) {
  const [file, setFile] = useState(null);
  const [imputeMethod, setImputeMethod] = useState('ffill');
  const [dropDuplicates, setDropDuplicates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [preview, setPreview] = useState(datasetSummary?.preview || []);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('impute_method', imputeMethod);
    formData.append('drop_duplicates', dropDuplicates);

    try {
      const res = await axios.post('/api/data/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        setStats(res.data.stats);
        setPreview(res.data.preview);
        if (onDataLoaded) onDataLoaded();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/data/sample?days=180');
      if (res.data.status === 'success') {
        setStats(res.data.stats);
        setPreview(res.data.sample_records);
        if (onDataLoaded) onDataLoaded();
      }
    } catch (err) {
      setError('Failed to generate sample dataset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              Upload Sales CSV Data
            </h2>
            <button
              onClick={handleLoadSample}
              disabled={loading}
              className="flex items-center gap-2 text-xs bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Demo Dataset (180 Days)
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center transition cursor-pointer bg-slate-900/50">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer block">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-200 font-medium">
                  {file ? file.name : "Click or drag CSV file to upload"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Expected headers: Date, Product, Category, Sales_Qty, Price, Stock
                </p>
              </label>
            </div>

            {/* Data Cleaning Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-lg border border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Missing Value Imputation
                </label>
                <select
                  value={imputeMethod}
                  onChange={(e) => setImputeMethod(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ffill">Forward Fill (ffill)</option>
                  <option value="bfill">Backward Fill (bfill)</option>
                  <option value="mean">Average Mean</option>
                  <option value="zero">Fill with Zero (0)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4">
                <label className="text-xs font-medium text-slate-300">
                  Deduplicate Duplicate Rows
                </label>
                <input
                  type="checkbox"
                  checked={dropDuplicates}
                  onChange={(e) => setDropDuplicates(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{loading ? "Processing Data..." : "Clean & Upload Dataset"}</span>
            </button>
          </form>
        </div>

        {/* Cleaning Summary Stats Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-emerald-400" />
              Data Pipeline Status
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-800">
                <span className="text-slate-400">Total Rows Processed</span>
                <span className="font-bold text-slate-100">
                  {stats ? stats.final_rows : datasetSummary?.total_records || 0}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-800">
                <span className="text-slate-400">Missing Values Fixed</span>
                <span className="font-semibold text-emerald-400">
                  {stats ? stats.missing_values_fixed : 0}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-800">
                <span className="text-slate-400">Duplicates Removed</span>
                <span className="font-semibold text-amber-400">
                  {stats ? stats.duplicates_removed : 0}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-800">
                <span className="text-slate-400">Date Range</span>
                <span className="text-xs font-mono text-slate-300">
                  {datasetSummary?.start_date || 'N/A'} to {datasetSummary?.end_date || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Dataset ready for time-series decomposition and forecasting.</span>
          </div>
        </div>
      </div>

      {/* Dataset Preview Table */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Cleaned Data Preview (Top 15 Rows)</h3>
          <span className="text-xs text-slate-400">Showing normalized schema</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-slate-400 bg-slate-900 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Sales Qty</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Revenue ($)</th>
                <th className="p-3 text-right">Stock Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {preview.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition">
                  <td className="p-3 font-mono text-indigo-300">{row.date}</td>
                  <td className="p-3 font-medium text-slate-100">{row.product_name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                      {row.category}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-white">{row.sales_qty}</td>
                  <td className="p-3 text-right">${floatVal(row.price)}</td>
                  <td className="p-3 text-right text-emerald-400 font-medium">${floatVal(row.revenue)}</td>
                  <td className="p-3 text-right text-slate-300">{row.stock_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function floatVal(val) {
  const n = parseFloat(val);
  return isNaN(n) ? "0.00" : n.toFixed(2);
}
