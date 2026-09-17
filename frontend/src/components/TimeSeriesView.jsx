import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Calendar,
  Filter,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import axios from 'axios';

export default function TimeSeriesView({ datasetSummary }) {
  const [productFilter, setProductFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/analysis/time-series', {
        params: {
          product_name: productFilter,
          category: categoryFilter
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
    fetchAnalysis();
  }, [productFilter, categoryFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
        <p className="text-sm">Decomposing time series & trend signals...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const autocorr = data?.autocorrelation || {};
  const series = data?.time_series || [];

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Time-Series Analytics & Decomposition</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {datasetSummary?.categories?.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Total Sales Units</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.total_sales?.toLocaleString() || 0}</p>
          <p className="text-xs text-indigo-400 mt-1 font-mono">{summary.total_days} total days analyzed</p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Daily Demand Average</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.avg_daily_sales || 0} <span className="text-xs text-slate-400 font-normal">units/day</span></p>
          <p className="text-xs text-slate-400 mt-1">Std Dev: ±{summary.std_sales}</p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Peak Single Day Demand</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{summary.max_daily_sales || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Historical Max Spike</p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Weekly Seasonality (Lag-7)</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{(autocorr.lag_7 * 100).toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">Autocorrelation Score</p>
        </div>
      </div>

      {/* Main Historical Demand Chart */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Daily Demand & Moving Averages</h3>
            <p className="text-xs text-slate-400">Actual sales volume overlaid with 7-Day & 30-Day moving average trendlines</p>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="sales" name="Actual Daily Sales" fill="#3b82f6" opacity={0.4} />
              <Line type="monotone" dataKey="ma_7" name="7-Day Moving Avg" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="ma_30" name="30-Day Moving Avg" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seasonal Decomposition View (Trend, Seasonal Pattern, Residual Noise) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Component */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Long-Term Trend Signal Component
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
                <Area type="monotone" dataKey="trend" name="Extracted Trend" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Seasonality Pattern */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Weekly Seasonal Cycle (7-Day Periodicity)
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
                <Line type="monotone" dataKey="seasonal" name="Seasonal Impact" stroke="#6366f1" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Autocorrelation Matrix */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-white mb-3">Autocorrelation Lag Coefficients</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
            <p className="text-xs text-slate-400">Lag 1 (Yesterday)</p>
            <p className="text-lg font-bold text-slate-100">{autocorr.lag_1}</p>
          </div>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
            <p className="text-xs text-slate-400">Lag 7 (Same Day Prev Week)</p>
            <p className="text-lg font-bold text-indigo-400">{autocorr.lag_7}</p>
          </div>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
            <p className="text-xs text-slate-400">Lag 14 (2 Weeks Prior)</p>
            <p className="text-lg font-bold text-slate-100">{autocorr.lag_14}</p>
          </div>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
            <p className="text-xs text-slate-400">Lag 30 (1 Month Prior)</p>
            <p className="text-lg font-bold text-slate-100">{autocorr.lag_30}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
