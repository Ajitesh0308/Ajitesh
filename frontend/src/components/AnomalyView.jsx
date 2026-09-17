import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Sliders, RefreshCw, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import axios from 'axios';

export default function AnomalyView({ datasetSummary }) {
  const [method, setMethod] = useState('zscore');
  const [sensitivity, setSensitivity] = useState(2.5);
  const [productFilter, setProductFilter] = useState('ALL');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/analysis/anomalies', {
        params: {
          method,
          sensitivity,
          product_name: productFilter
        }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [method, sensitivity, productFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-sm">Detecting sales anomalies and outlier spikes...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const anomalies = data?.anomalies || [];
  const series = data?.time_series || [];

  return (
    <div className="space-y-6">
      {/* Settings Bar */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-white">Anomaly & Outlier Detection Engine</h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Algorithm Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Method:</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="zscore">Z-Score (Standard Deviations)</option>
              <option value="iqr">IQR (Interquartile Range)</option>
              <option value="isolation_forest">Isolation Forest (ML)</option>
            </select>
          </div>

          {/* Sensitivity Slider */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-xs text-slate-400">Sensitivity Threshold ({sensitivity}):</span>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.5"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Product Filter */}
          <div>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Products</option>
              {datasetSummary?.products?.map((prod) => (
                <option key={prod} value={prod}>{prod}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Anomaly KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Anomalies Detected</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{summary.total_anomalies || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Outlier data points</p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Demand Spikes</p>
          <p className="text-2xl font-bold text-rose-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-5 h-5" />
            {summary.spikes_count || 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Unusual surge in demand</p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Demand Dips / Drop-offs</p>
          <p className="text-2xl font-bold text-sky-400 mt-1 flex items-center gap-1">
            <TrendingDown className="w-5 h-5" />
            {summary.dips_count || 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Unexpected sales plunge</p>
        </div>
      </div>

      {/* Interactive Anomaly Chart */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">Anomaly Detection Overlay</h3>
          <p className="text-xs text-slate-400">Sales curve with expected lower/upper statistical tolerance bands</p>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="sales" name="Actual Sales" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="upper_bound" name="Upper Threshold" stroke="#f59e0b" strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="lower_bound" name="Lower Threshold" stroke="#10b981" strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Anomaly Table */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-base font-semibold text-white mb-4">Detected Outlier Event Log</h3>

        {anomalies.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No anomalies detected for the current threshold settings.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-slate-400 bg-slate-900 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3 text-right">Observed Sales</th>
                  <th className="p-3 text-right">Expected Threshold</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {anomalies.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition">
                    <td className="p-3 font-mono text-indigo-300">{item.date}</td>
                    <td className="p-3 font-medium">
                      <span className={`px-2 py-0.5 rounded ${
                        item.anomaly_type === 'Spike' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {item.anomaly_type}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        item.severity === 'HIGH' ? 'bg-red-600 text-white' : item.severity === 'MEDIUM' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-200'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-white">{item.sales_qty}</td>
                    <td className="p-3 text-right text-slate-400">{item.expected_upper}</td>
                    <td className="p-3 text-slate-300">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
