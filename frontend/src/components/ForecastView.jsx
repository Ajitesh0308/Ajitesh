import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Calendar, Cpu, Award, RefreshCw, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import axios from 'axios';

export default function ForecastView({ datasetSummary }) {
  const [horizon, setHorizon] = useState(30);
  const [model, setModel] = useState('holt_winters');
  const [productFilter, setProductFilter] = useState('ALL');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/forecasting/forecast', {
        params: {
          horizon,
          model,
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
    fetchForecast();
  }, [horizon, model, productFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
        <p className="text-sm">Fitting time-series model & forecasting future demand...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const metrics = data?.metrics || {};
  const series = data?.forecast_series || [];

  return (
    <div className="space-y-6">
      {/* Settings Bar */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Time-Series Demand Forecasting</h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Horizon Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Forecast Horizon:</span>
            <div className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
              {[7, 14, 30, 60, 90].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                    horizon === h ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Model:</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="holt_winters">Holt-Winters Exponential Smoothing</option>
              <option value="arima">ARIMA (2,1,1) Time-Series</option>
              <option value="ridge_poly">Ridge Polynomial ML Regression</option>
            </select>
          </div>

          {/* Product Selector */}
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

      {/* Accuracy & Forecast Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Total Projected Demand ({horizon} Days)</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{summary.total_forecasted_qty?.toLocaleString() || 0} <span className="text-xs text-slate-400 font-normal">units</span></p>
          <p className="text-xs text-slate-400 mt-1">Avg ~{summary.avg_forecast_daily} units/day</p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Mean Absolute Error (MAE)</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{metrics.mae || 0}</p>
          <p className="text-xs text-slate-400 mt-1">RMSE: {metrics.rmse}</p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Error Percentage (MAPE)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.mape}%</p>
          <p className="text-xs text-slate-400 mt-1">Holdout test evaluation</p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Model Accuracy Rating</p>
          <p className="text-2xl font-bold text-white mt-1 flex items-center gap-1.5">
            <Award className="w-5 h-5 text-amber-400" />
            {metrics.accuracy_rating}
          </p>
          <p className="text-xs text-indigo-400 mt-1 font-mono uppercase">{summary.model_used}</p>
        </div>
      </div>

      {/* Main Forecast Chart with Confidence Intervals */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Demand Forecast Projection ({horizon} Days Ahead)</h3>
            <p className="text-xs text-slate-400">Historical actuals vs predicted future trend with 95% Confidence Band</p>
          </div>
        </div>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="upper_ci" name="95% Upper Bound" stroke="none" fill="#6366f1" fillOpacity={0.15} />
              <Line type="monotone" dataKey="actual" name="Historical Sales" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="forecast" name="Forecast Demand" stroke="#10b981" strokeWidth={3} strokeDasharray="3 3" dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
