import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Upload,
  TrendingUp,
  AlertTriangle,
  Package,
  Sparkles,
  RefreshCw,
  Layers,
  Database
} from 'lucide-react';
import axios from 'axios';

import DataUploadView from './components/DataUploadView';
import TimeSeriesView from './components/TimeSeriesView';
import AnomalyView from './components/AnomalyView';
import ForecastView from './components/ForecastView';
import InventoryView from './components/InventoryView';

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [datasetSummary, setDatasetSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const fetchDatasetSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await axios.get('/api/data/current');
      setDatasetSummary(res.data);
    } catch (err) {
      console.error("Failed to load dataset summary", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchDatasetSummary();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Demand Forecasting Engine
              <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-normal">
                ML Powered
              </span>
            </h1>
            <p className="text-xs text-slate-400">Enterprise Time-Series Analytics & Inventory Intelligence</p>
          </div>
        </div>

        {datasetSummary && (
          <div className="hidden md:flex items-center gap-4 text-xs bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
            <div>
              <span className="text-slate-400">Total Records: </span>
              <span className="font-bold text-slate-200">{datasetSummary.total_records}</span>
            </div>
            <div className="border-l border-slate-800 h-4"></div>
            <div>
              <span className="text-slate-400">Total Revenue: </span>
              <span className="font-bold text-emerald-400">${datasetSummary.total_revenue?.toLocaleString()}</span>
            </div>
          </div>
        )}
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-950 p-4 flex flex-col justify-between shrink-0">
          <nav className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Data & Pipeline
            </div>

            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Data Upload & Clean</span>
            </button>

            <button
              onClick={() => setActiveTab('time-series')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'time-series'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Time-Series Analytics</span>
            </button>

            <div className="pt-4 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Forecasting & Ops
            </div>

            <button
              onClick={() => setActiveTab('anomalies')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'anomalies'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Anomaly Detection</span>
            </button>

            <button
              onClick={() => setActiveTab('forecast')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'forecast'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Demand Forecast</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inventory'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory Optimization</span>
            </button>
          </nav>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/60 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>FastAPI Backend Active</span>
            </div>
            <p className="text-[11px] text-slate-500">Holt-Winters, ARIMA, Z-Score & EOQ models ready.</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-900">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'upload' && (
              <DataUploadView
                onDataLoaded={fetchDatasetSummary}
                datasetSummary={datasetSummary}
                onRefresh={fetchDatasetSummary}
              />
            )}

            {activeTab === 'time-series' && (
              <TimeSeriesView datasetSummary={datasetSummary} />
            )}

            {activeTab === 'anomalies' && (
              <AnomalyView datasetSummary={datasetSummary} />
            )}

            {activeTab === 'forecast' && (
              <ForecastView datasetSummary={datasetSummary} />
            )}

            {activeTab === 'inventory' && (
              <InventoryView datasetSummary={datasetSummary} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
