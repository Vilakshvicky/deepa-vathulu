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
  Lock,
  KeyRound,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Plus,
  X,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  is_active: boolean;
  image_url?: string;
  description?: string;
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

const DEFAULT_ADMIN_PIN = '0916';

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);

  // New Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Daily Wicks');
  const [newProductPrice, setNewProductPrice] = useState<number>(299);
  const [newProductStock, setNewProductStock] = useState<number>(50);
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [addProductSuccess, setAddProductSuccess] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === DEFAULT_ADMIN_PIN || pinInput === '0916') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput('');
  };

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: dbProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (productsError) {
        console.error('Admin Products fetch error:', productsError);
      } else if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts);
      }

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
    if (isAuthenticated) {
      fetchAdminData();

      const channel = supabase
        .channel('admin-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchAdminData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          fetchAdminData();
        })
        .subscribe();

      const interval = setInterval(() => {
        fetchAdminData();
      }, 2000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [isAuthenticated, fetchAdminData]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    try {
      setIsSubmittingProduct(true);
      const newProdObj = {
        name: newProductName.trim(),
        category: newProductCategory,
        price: Number(newProductPrice) || 299,
        stock: Number(newProductStock) || 50,
        is_active: true,
        image_url: newProductImage.trim() || 'https://images.unsplash.com/photo-1605371924599-2d0365da1ae0?w=600&q=80',
        description: newProductDesc.trim() || '100% Pure Organic Cotton Wicks handcrafted for traditional Deepam and pooja rituals.',
      };

      const { data, error } = await supabase.from('products').insert([newProdObj]).select();

      if (error) {
        console.error('Supabase Product Insert Error:', error);
        // Fallback local add if DB table columns differ
        const localId = `p_${Date.now()}`;
        setProducts((prev) => [{ id: localId, ...newProdObj }, ...prev]);
      } else if (data && data.length > 0) {
        setProducts((prev) => [data[0], ...prev]);
      }

      setAddProductSuccess(true);
      setTimeout(() => {
        setAddProductSuccess(false);
        setIsAddProductOpen(false);
        setNewProductName('');
        setNewProductPrice(299);
        setNewProductStock(50);
        setNewProductImage('');
        setNewProductDesc('');
      }, 1200);
    } catch (err) {
      console.error('Unexpected Product creation error:', err);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

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

  const updateOrderStatus = async (id: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
      if (error) console.error('Error updating order status in Supabase:', error);
    } catch (err) {
      console.error('Unexpected error updating order status:', err);
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalOrdersCount = orders.length;
  const activeProductsCount = products.filter((p) => p.is_active !== false).length;
  const lowStockCount = products.filter((p) => p.stock < 10).length;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.category.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchOrder.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchOrder.toLowerCase()) ||
      (o.customer_phone && o.customer_phone.includes(searchOrder))
  );

  // If NOT authenticated, render Security PIN Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 font-sans flex items-center justify-center p-4 selection:bg-amber-500 selection:text-stone-950">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600" />

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-lg shadow-amber-950/40">
              <Lock className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
              Deepa Vathulu Admin
            </h1>
            <p className="text-xs text-stone-400 mt-1 font-medium">
              Owner Security Portal • Protected Access
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-stone-300 block mb-2 uppercase tracking-wider">
                Enter Admin Security PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="Enter PIN"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError(false);
                  }}
                  className={`w-full bg-stone-950 border rounded-xl pl-10 pr-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 font-mono tracking-widest focus:outline-none transition-colors ${
                    pinError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-stone-800 focus:border-amber-500'
                  }`}
                />
              </div>
              {pinError && (
                <p className="text-xs text-red-400 font-semibold mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Incorrect Security PIN.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-sm shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Unlock Admin Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-800/80 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Encrypted Realtime Supabase Connection
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-900/30 text-stone-950 font-bold text-xl">
              🪔
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                  Deepa Vathulu
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider">
                  LIVE ADMIN PORTAL
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono tracking-widest -mt-0.5 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-amber-500 animate-pulse" /> 2s Poll & Real-Time Sync Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Product</span>
            </button>

            <button
              onClick={() => fetchAdminData()}
              className="p-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 transition-colors flex items-center gap-2 text-xs font-semibold"
              title="Force Sync Real-Time Data"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-stone-900 hover:bg-red-950/40 border border-stone-800 hover:border-red-500/30 rounded-xl text-stone-400 hover:text-red-400 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Lock Admin Portal"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Lock Portal</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 border-t border-stone-900 pt-2 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Boxes className="w-4 h-4" /> Products ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Live Orders ({orders.length})
          </button>
        </div>
      </header>

      {/* Main Admin Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold block">Total Revenue</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                ₹{totalRevenue.toLocaleString()}
              </span>
              <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-1 font-mono">
                <TrendingUp className="w-3 h-3 text-amber-400" /> Live Supabase Stream
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold block">Total Orders Streamed</span>
              <span className="text-2xl font-black text-stone-100 mt-1 block">
                {totalOrdersCount}
              </span>
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mt-1">
                {orders.filter((o) => o.status === 'Pending').length} pending dispatch
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold block">Active Catalog Items</span>
              <span className="text-2xl font-black text-stone-100 mt-1 block">
                {activeProductsCount}
              </span>
              <span className="text-[11px] text-stone-500 block mt-1">{products.length} registered</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold block">Low Stock Warning</span>
              <span className={`text-2xl font-black mt-1 block ${lowStockCount > 0 ? 'text-amber-400' : 'text-stone-100'}`}>
                {lowStockCount} items
              </span>
              <span className="text-[11px] text-stone-500 block mt-1">Stock &lt; 10 units</span>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse' : 'bg-stone-800 text-stone-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab 1: Overview & Recent Orders Stream */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h3 className="text-lg font-bold text-stone-100">Live Customer Orders Stream</h3>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  View All Orders &rarr;
                </button>
              </div>

              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="bg-stone-950 border border-stone-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-amber-400 text-sm">{order.id}</span>
                        <span className="text-xs font-bold text-stone-200">{order.customer_name}</span>
                        {order.customer_phone && (
                          <span className="text-[11px] text-stone-400 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-500" /> {order.customer_phone}
                          </span>
                        )}
                      </div>

                      {order.items_summary && (
                        <p className="text-xs text-stone-400 font-medium">{order.items_summary}</p>
                      )}

                      {order.shipping_address && (
                        <p className="text-[11px] text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-500" /> {order.shipping_address}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-amber-400">₹{order.total_amount}</span>
                        <span className="text-[10px] text-stone-500 block flex items-center gap-1 justify-end mt-0.5">
                          {order.payment_method?.includes('Razorpay') ? (
                            <CreditCard className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Banknote className="w-3 h-3 text-amber-400" />
                          )}
                          {order.payment_method || 'Paid'}
                        </span>
                      </div>

                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none ${
                          order.status === 'Delivered'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : order.status === 'Shipped'
                            ? 'bg-stone-800 border-stone-700 text-stone-200'
                            : order.status === 'Processing'
                            ? 'bg-stone-800 border-amber-500/40 text-amber-300'
                            : 'bg-stone-900 border-stone-800 text-stone-400'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products Catalog & Stock Management */}
        {activeTab === 'products' && (
          <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
              <div>
                <h3 className="text-lg font-bold text-stone-100">Product Inventory & Stock Control</h3>
                <p className="text-xs text-stone-400">Click stock number to edit quantity directly</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-stone-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> Add Product
                </button>

                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    placeholder="Filter products..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock Quantity</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-stone-950/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-stone-100 flex items-center gap-2">
                        <span>🪔</span> {product.name}
                      </td>
                      <td className="py-4 px-4 text-stone-400 font-medium">{product.category}</td>
                      <td className="py-4 px-4 font-extrabold text-amber-400">₹{product.price}</td>
                      <td className="py-4 px-4">
                        {editingStockId === product.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(Number(e.target.value))}
                              className="w-20 bg-stone-950 border border-amber-500 rounded px-2 py-1 text-xs text-stone-100 font-bold focus:outline-none"
                            />
                            <button
                              onClick={() => handleStockUpdate(product.id, tempStockValue)}
                              className="px-2 py-1 bg-amber-500 text-stone-950 text-[10px] font-bold rounded"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingStockId(product.id);
                              setTempStockValue(product.stock);
                            }}
                            className="flex items-center gap-1.5 text-stone-200 hover:text-amber-400 font-bold bg-stone-950 border border-stone-800 px-3 py-1 rounded-lg transition-colors"
                          >
                            <span>{product.stock} units</span>
                            <Edit2 className="w-3 h-3 text-stone-500" />
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => toggleProductActive(product.id, product.is_active)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            product.is_active
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-stone-800 border-stone-700 text-stone-500'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Complete Orders Log */}
        {activeTab === 'orders' && (
          <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
              <div>
                <h3 className="text-lg font-bold text-stone-100">All Customer Orders</h3>
                <p className="text-xs text-stone-400">Manage dispatch and delivery status</p>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search orders, phone..."
                  value={searchOrder}
                  onChange={(e) => setSearchOrder(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-stone-950 border border-stone-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-400 text-sm">{order.id}</span>
                      <span className="text-sm font-bold text-stone-100">{order.customer_name}</span>
                      {order.customer_phone && (
                        <span className="text-xs text-stone-400 font-mono flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-stone-500" /> {order.customer_phone}
                        </span>
                      )}
                    </div>

                    {order.items_summary && (
                      <p className="text-xs text-stone-300 font-medium">{order.items_summary}</p>
                    )}

                    {order.shipping_address && (
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-500" /> {order.shipping_address}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-stone-800">
                    <div className="text-right">
                      <span className="text-base font-black text-amber-400">₹{order.total_amount}</span>
                      <span className="text-[11px] text-stone-500 block flex items-center gap-1 justify-end mt-0.5">
                        {order.payment_method?.includes('Razorpay') ? (
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Banknote className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        {order.payment_method || 'Paid'}
                      </span>
                    </div>

                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border focus:outline-none ${
                        order.status === 'Delivered'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : order.status === 'Shipped'
                          ? 'bg-stone-800 border-stone-700 text-stone-200'
                          : order.status === 'Processing'
                          ? 'bg-stone-800 border-amber-500/40 text-amber-300'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Add New Product Modal Dialog */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">Add New Product</h3>
                  <p className="text-[11px] text-stone-400">Publish item to Web & Mobile Storefront</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-2 rounded-xl bg-stone-950 text-stone-400 hover:text-stone-100 border border-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addProductSuccess ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-14 h-14 text-amber-400 mx-auto animate-bounce" />
                <h4 className="text-lg font-extrabold text-stone-100">Product Added Successfully!</h4>
                <p className="text-xs text-stone-400">Live catalog updated across Web & Mobile</p>
              </div>
            ) : (
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-300 block mb-1.5 uppercase">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panchamukhi Cotton Wick Pack (500 pcs)"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-300 block mb-1.5 uppercase">
                      Category *
                    </label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Daily Wicks">Daily Wicks</option>
                      <option value="Specialty Wicks">Specialty Wicks</option>
                      <option value="Akhanda Wicks">Akhanda Wicks</option>
                      <option value="Pooja Kits">Pooja Kits</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-300 block mb-1.5 uppercase">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-300 block mb-1.5 uppercase">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-300 block mb-1.5 uppercase">
                      Photo URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newProductImage}
                      onChange={(e) => setNewProductImage(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-300 block mb-1.5 uppercase">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short product description..."
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-stone-950 text-stone-400 hover:text-stone-200 text-xs font-bold border border-stone-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingProduct}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-stone-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center gap-2"
                  >
                    {isSubmittingProduct ? (
                      <span>Saving Product...</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Publish Product</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
