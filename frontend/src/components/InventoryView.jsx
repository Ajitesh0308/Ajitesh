import React, { useState, useEffect } from 'react';
import { Package, ShieldAlert, AlertCircle, CheckCircle, Download, RefreshCw, ShoppingCart, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function InventoryView({ datasetSummary }) {
  const [serviceLevel, setServiceLevel] = useState(0.95);
  const [orderCost, setOrderCost] = useState(50.0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/forecasting/inventory', {
        params: {
          service_level: serviceLevel,
          order_cost: orderCost
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
    fetchInventory();
  }, [serviceLevel, orderCost]);

  const handleExportCSV = () => {
    if (!data?.inventory) return;
    const items = data.inventory;
    const headers = ["Product_ID", "Product_Name", "Category", "Current_Stock", "Safety_Stock", "Reorder_Point", "EOQ", "Status", "Suggested_Order_Qty"];
    const rows = items.map(i => [
      i.product_id,
      `"${i.product_name}"`,
      i.category,
      i.current_stock,
      i.safety_stock,
      i.reorder_point,
      i.eoq,
      i.status,
      i.suggested_order_qty
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventory_Optimization_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
        <p className="text-sm">Calculating Safety Stock, Reorder Points, and Economic Order Quantities...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const inventory = data?.inventory || [];

  return (
    <div className="space-y-6">
      {/* Settings Bar */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Inventory Optimization & Reorder Recommendations</h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Service Level Target */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-xs text-slate-400">Target Service Level:</span>
            <select
              value={serviceLevel}
              onChange={(e) => setServiceLevel(parseFloat(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded p-1 focus:ring-1 focus:ring-emerald-500 font-bold"
            >
              <option value="0.90">90% (Z=1.28)</option>
              <option value="0.95">95% (Z=1.65 - Recommended)</option>
              <option value="0.99">99% (Z=2.33 - Critical High)</option>
            </select>
          </div>

          {/* Export Report Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition shadow-md shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Reorder Plan CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Monitored SKUs / Products</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.total_products || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Target Service Level: {summary.service_level_pct}%</p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Total Inventory Holding Value</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">${summary.total_inventory_value?.toLocaleString() || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Current asset valuation</p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Critical Stockout Alerts</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{summary.critical_stockouts || 0}</p>
          <p className="text-xs text-rose-300 mt-1">Requires immediate purchase order</p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-xs font-medium text-slate-400">Reorders Required</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{summary.reorder_required_count || 0}</p>
          <p className="text-xs text-slate-400 mt-1">At or below Reorder Point</p>
        </div>
      </div>

      {/* Main Inventory Optimization Table */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">SKU Inventory & Purchase Order Plan</h3>
          <span className="text-xs text-slate-400">Dynamic safety stock & EOQ calculation engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-slate-400 bg-slate-900 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">SKU / Product</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Current Stock</th>
                <th className="p-3 text-right">Safety Stock</th>
                <th className="p-3 text-right">Reorder Point (ROP)</th>
                <th className="p-3 text-right">EOQ Order Qty</th>
                <th className="p-3 text-right">Days of Supply</th>
                <th className="p-3">Status</th>
                <th className="p-3">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {inventory.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition">
                  <td className="p-3 font-medium text-white">
                    <div>{item.product_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.product_id}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-slate-100">{item.current_stock}</td>
                  <td className="p-3 text-right text-indigo-400 font-mono">{item.safety_stock}</td>
                  <td className="p-3 text-right text-amber-400 font-mono font-bold">{item.reorder_point}</td>
                  <td className="p-3 text-right text-emerald-400 font-mono font-bold">{item.eoq}</td>
                  <td className="p-3 text-right text-slate-300 font-mono">{item.days_of_supply} days</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      item.status === 'CRITICAL' ? 'bg-rose-600 text-white' : item.status === 'WARNING' ? 'bg-amber-600 text-white' : 'bg-emerald-800/60 text-emerald-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs text-slate-300">{item.recommended_action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
