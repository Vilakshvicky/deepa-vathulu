'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Package,
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  Search,
  Edit2,
  TrendingUp,
  RefreshCw,
  LayoutDashboard,
  Boxes,
  ClipboardList,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  Clock,
  Radio,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  is_active: boolean;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address?: string;
  payment_method?: string;
  items_summary?: string;
  items?: string;
  total_amount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  created_at: string;
}

const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', name: 'Traditional Clay Diya Set with Cotton Wicks (Pack of 12)', category: 'Daily Wicks', price: 299, stock: 45, is_active: true },
  { id: '2', name: 'Panchamukhi Cotton Wick Pack (500 pcs)', category: 'Specialty Wicks', price: 349, stock: 8, is_active: true },
  { id: '3', name: 'Organic Cotton Ghee Wicks (100 pcs)', category: 'Daily Wicks', price: 199, stock: 120, is_active: true },
  { id: '4', name: 'Akhanda Deepam Long Cotton Wicks (50 pcs)', category: 'Akhanda Wicks', price: 499, stock: 4, is_active: true },
  { id: '5', name: 'Festive Cotton Wicks & Pooja Kit Box', category: 'Pooja Kits', price: 899, stock: 18, is_active: true },
  { id: '6', name: 'Hand-Rolled Flower Cotton Wicks (250 pcs)', category: 'Specialty Wicks', price: 279, stock: 2, is_active: false },
];

const SAMPLE_ORDERS: Order[] = [
  { id: 'ORD-892104', customer_name: 'Rajesh Sharma', customer_phone: '+91 98765 43210', shipping_address: 'Flat 402, Lotus Apartments, Jubilee Hills, Hyderabad 500033', payment_method: 'Razorpay', items_summary: '2x Panchamukhi Cotton Wick Pack, 1x Ghee Wicks', total_amount: 897, status: 'Processing', created_at: '10 mins ago' },
  { id: 'ORD-892103', customer_name: 'Priya Sundaram', customer_phone: '+91 91234 56789', shipping_address: 'No 14, 2nd Main Road, T Nagar, Chennai 600017', payment_method: 'Cash on Delivery', items_summary: '1x Akhanda Deepam Long Cotton Wicks', total_amount: 499, status: 'Pending', created_at: '25 mins ago' },
  { id: 'ORD-892102', customer_name: 'Ananya Reddy', customer_phone: '+91 99887 76655', shipping_address: 'B-104, Green Glen Layout, Bellandur, Bengaluru 560103', payment_method: 'Razorpay', items_summary: '3x Traditional Clay Diya Set', total_amount: 897, status: 'Shipped', created_at: '1 hour ago' },
  { id: 'ORD-892101', customer_name: 'Venkatesh Rao', customer_phone: '+91 94400 11223', shipping_address: 'Plot 45, MVP Colony, Visakhapatnam 530017', payment_method: 'Razorpay', items_summary: '1x Festive Cotton Wicks & Pooja Kit Box', total_amount: 899, status: 'Delivered', created_at: '3 hours ago' },
];

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch Products & log error if any
      const { data: dbProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (productsError) {
        console.error('Admin Products fetch error:', productsError);
      } else if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts);
      }

      // Exact order fetching logic requested
      const { data: dbOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Admin Orders fetch error:', ordersError);
      } else if (dbOrders && dbOrders.length > 0) {
        setOrders(dbOrders);
      }
    } catch (err) {
      console.error('Unexpected Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();

    // Real-time listener for newly placed orders & products updates
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchAdminData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchAdminData();
      })
      .subscribe();

    // 2-second interval polling fallback so new orders populate automatically
    const interval = setInterval(() => {
      fetchAdminData();
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchAdminData]);

  const handleStockUpdate = async (id: string, newStock: number) => {
    const validStock = Math.max(0, newStock);
    try {
      const { error } = await supabase.from('products').update({ stock: validStock }).eq('id', id);
      if (error) console.error('Error updating stock in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error updating stock:', err);
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: validStock } : p))
    );
    setEditingStockId(null);
  };

  const toggleProductActive = async (id: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    try {
      const { error } = await supabase.from('products').update({ is_active: nextActive }).eq('id', id);
      if (error) console.error('Error toggling product active status in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error toggling active status:', err);
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: nextActive } : p))
    );
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) console.error('Error updating order status in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error updating order status:', err);
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  // Metrics calculation
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalOrders = orders.length;
  const activeProductsCount = products.filter((p) => p.is_active !== false).length;
  const lowStockCount = products.filter((p) => (p.stock ?? 0) < 10).length;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.category.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchOrder.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchOrder.toLowerCase())) ||
      (o.customer_phone && o.customer_phone.includes(searchOrder)) ||
      (o.items_summary && o.items_summary.toLowerCase().includes(searchOrder.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Header */}
      <header className="bg-stone-900/90 backdrop-blur-md border-b border-stone-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center font-bold text-stone-950 text-lg shadow-md shadow-amber-900/40">
              🪔
            </div>
            <div>
              <span className="font-extrabold text-stone-100 tracking-tight text-lg">Deepa Vathulu</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono font-semibold border border-amber-500/20">
                LIVE ADMIN PORTAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">2s Poll & Real-Time Sync Active</span>
            </div>

            <button
              onClick={fetchAdminData}
              className="p-2 text-stone-400 hover:text-amber-400 rounded-lg hover:bg-stone-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-800 pb-4 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
            }`}
          >
            <Boxes className="w-4 h-4" /> Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Live Orders ({orders.length})
          </button>
        </div>

        {/* 1. Metrics Cards Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-400 font-medium">Total Revenue</p>
              <h3 className="text-2xl font-extrabold text-stone-100 mt-1">₹{totalSales.toLocaleString()}</h3>
              <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                <TrendingUp className="w-3 h-3" /> Live Supabase Synced
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-400 font-medium">Total Orders Streamed</p>
              <h3 className="text-2xl font-extrabold text-stone-100 mt-1">{totalOrders}</h3>
              <p className="text-[10px] text-amber-400 mt-1 font-medium">
                {orders.filter((o) => o.status === 'Pending').length} pending dispatch
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-400 font-medium">Active Catalog Items</p>
              <h3 className="text-2xl font-extrabold text-stone-100 mt-1">{activeProductsCount}</h3>
              <p className="text-[10px] text-stone-400 mt-1 font-medium">{products.length} registered</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-400 font-medium">Low Stock Warning</p>
              <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{lowStockCount} items</h3>
              <p className="text-[10px] text-orange-400 mt-1 font-medium">Stock &lt; 10 units</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 2. Live Recent Orders Stream */}
        {(activeTab === 'overview' || activeTab === 'orders') && (
          <section className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 mb-10 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-400" /> Live Customer Orders Stream
                </h2>
                <p className="text-xs text-stone-400 mt-1">Real-time orders submitted via Web & Mobile app with full delivery details.</p>
              </div>

              <div className="relative sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search orders, phone, name..."
                  value={searchOrder}
                  onChange={(e) => setSearchOrder(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-stone-950/60 rounded-xl border border-stone-800 text-stone-400">
                  <div className="text-4xl mb-3">📦</div>
                  <h4 className="text-sm font-bold text-stone-200">No Orders Placed Yet</h4>
                  <p className="text-xs text-stone-500 mt-1">Orders placed via Web or Mobile app will appear here automatically.</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-stone-950 border border-stone-800/80 rounded-xl p-5 hover:border-amber-500/40 transition-all"
                  >
                    {/* Top Order Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800/60">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-amber-400 text-sm">{order.id}</span>
                        <span className="text-stone-600 text-xs">•</span>
                        <span className="text-xs font-bold text-stone-100">{order.customer_name || 'Guest Customer'}</span>
                        {order.customer_phone && (
                          <span className="text-xs text-stone-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-amber-500/70" /> {order.customer_phone}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {order.payment_method && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-900 border border-stone-800 text-stone-300">
                            {order.payment_method.toLowerCase().includes('razorpay') ? (
                              <CreditCard className="w-3 h-3 text-amber-400" />
                            ) : (
                              <Banknote className="w-3 h-3 text-emerald-400" />
                            )}
                            {order.payment_method}
                          </span>
                        )}
                        <span className="text-xs text-stone-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-500" />
                          {typeof order.created_at === 'string' && order.created_at.includes('T')
                            ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : order.created_at || 'Just now'}
                        </span>
                      </div>
                    </div>

                    {/* Middle Order Content */}
                    <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="md:col-span-2">
                        <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold block mb-1">
                          Ordered Items
                        </span>
                        <p className="text-stone-300 font-medium">{order.items_summary || order.items || 'Standard Order Items'}</p>
                        
                        {order.shipping_address && (
                          <div className="mt-2 flex items-start gap-1.5 text-stone-400">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{order.shipping_address}</span>
                          </div>
                        )}
                      </div>

                      {/* Right Status Update & Price */}
                      <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0">
                        <div className="text-right">
                          <span className="text-[10px] text-stone-500 uppercase tracking-widest block font-medium font-mono">Total Price</span>
                          <span className="text-lg font-extrabold text-amber-400">₹{order.total_amount}</span>
                        </div>

                        {/* Status Dropdown - Updates Supabase directly */}
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                          className={`text-xs font-bold px-3 py-2 rounded-xl border focus:outline-none transition-colors cursor-pointer ${
                            order.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : order.status === 'Processing'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : order.status === 'Shipped'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          <option value="Pending" className="bg-stone-900 text-amber-400">Pending</option>
                          <option value="Processing" className="bg-stone-900 text-blue-400">Processing</option>
                          <option value="Shipped" className="bg-stone-900 text-purple-400">Shipped</option>
                          <option value="Delivered" className="bg-stone-900 text-emerald-400">Delivered</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* 3. Product Inventory Section */}
        {(activeTab === 'overview' || activeTab === 'products') && (
          <section className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-400" /> Inventory & Product Catalog Management
                </h2>
                <p className="text-xs text-stone-400 mt-1">Manage stock quantities, prices, and online store availability.</p>
              </div>

              <div className="relative sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Filter catalog..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-stone-800">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 font-semibold border-b border-stone-800">
                  <tr>
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Stock Level</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 bg-stone-900/40">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="py-4 px-4 font-semibold text-stone-100 flex items-center gap-2">
                        <span className="text-lg">🪔</span> {product.name}
                      </td>
                      <td className="py-4 px-4 text-stone-400">{product.category}</td>
                      <td className="py-4 px-4 font-extrabold text-amber-400">₹{product.price}</td>
                      <td className="py-4 px-4">
                        {editingStockId === product.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(Number(e.target.value))}
                              className="w-16 bg-stone-950 border border-amber-500 rounded px-2 py-1 text-xs text-stone-100"
                            />
                            <button
                              onClick={() => handleStockUpdate(product.id, tempStockValue)}
                              className="px-2 py-1 bg-amber-500 text-stone-950 font-bold rounded hover:bg-amber-600"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold px-2 py-0.5 rounded ${
                                (product.stock ?? 0) < 10
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'text-stone-200'
                              }`}
                            >
                              {product.stock ?? 0} units
                            </span>
                            <button
                              onClick={() => {
                                setEditingStockId(product.id);
                                setTempStockValue(product.stock ?? 0);
                              }}
                              className="text-stone-500 hover:text-amber-400"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            product.is_active !== false
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-stone-800 text-stone-500 border border-stone-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.is_active !== false ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                            }`}
                          />
                          {product.is_active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => toggleProductActive(product.id, product.is_active !== false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            product.is_active !== false
                              ? 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                              : 'bg-amber-500 text-stone-950 hover:bg-amber-600'
                          }`}
                        >
                          {product.is_active !== false ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
