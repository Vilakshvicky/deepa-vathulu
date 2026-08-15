'use client';
// Trigger Vercel Web Storefront Build - Razorpay Live Checkout

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShoppingBag,
  Search,
  Star,
  X,
  CheckCircle2,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Truck,
  Flame,
  ChevronRight,
  Award,
  CreditCard,
  Banknote,
  Phone,
  User,
  MapPin,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating?: number;
  description: string;
  tag?: string;
  stock?: number;
  image_url?: string;
}

interface CartItem extends Product {
  quantity: number;
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Traditional Clay Diya Set with Cotton Wicks (Pack of 12)',
    category: 'Daily Wicks',
    price: 299,
    rating: 4.9,
    description: 'Handcrafted terracotta diyas paired with pure hand-rolled cotton wicks for daily pooja.',
    tag: 'Best Seller',
    stock: 50,
  },
  {
    id: '2',
    name: 'Panchamukhi Cotton Wick Pack (500 pcs)',
    category: 'Specialty Wicks',
    price: 349,
    rating: 4.8,
    description: 'Specially shaped multi-wick cotton wicks designed for 5-face deepam lighting.',
    tag: 'Sacred Quality',
    stock: 45,
  },
  {
    id: '3',
    name: 'Organic Cotton Ghee Wicks (100 pcs)',
    category: 'Daily Wicks',
    price: 199,
    rating: 4.7,
    description: 'Ready-to-use ghee wicks crafted from pure cow ghee and organic cotton.',
    tag: 'Eco Friendly',
    stock: 100,
  },
  {
    id: '4',
    name: 'Akhanda Deepam Long Cotton Wicks (50 pcs)',
    category: 'Akhanda Wicks',
    price: 499,
    rating: 5.0,
    description: 'Extra thick long-burning organic cotton wicks crafted for continuous Akhanda deepams.',
    tag: 'Long Burning',
    stock: 25,
  },
  {
    id: '5',
    name: 'Festive Cotton Wicks & Pooja Kit Box',
    category: 'Pooja Kits',
    price: 899,
    rating: 4.9,
    description: 'Complete hamper containing assorted flower wicks, long wicks, ghee wicks & clay diyas.',
    tag: 'Gift Special',
    stock: 30,
  },
  {
    id: '6',
    name: 'Hand-Rolled Flower Cotton Wicks (250 pcs)',
    category: 'Specialty Wicks',
    price: 279,
    rating: 4.8,
    description: 'Round lotus-shaped flower cotton wicks for temple and home oil deepams.',
    tag: 'Popular',
    stock: 60,
  },
];

const CATEGORIES = ['All', 'Daily Wicks', 'Specialty Wicks', 'Akhanda Wicks', 'Pooja Kits'];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Checkout & Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('razorpay');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    loadRazorpayScript();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.error('Error fetching products from Supabase:', error);
        setProducts(SAMPLE_PRODUCTS);
      } else if (!data || data.length === 0) {
        setProducts(SAMPLE_PRODUCTS);
      } else {
        setProducts(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching products:', err);
      setProducts(SAMPLE_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const processOrderCreation = async (paymentStatus: 'paid' | 'unpaid', paymentRef?: string) => {
    setIsCheckingOut(true);
    const newOrderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const cleanItemsArray = cart.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));
    const itemsSummary = cart.map((i) => `${i.quantity}x ${i.name}`).join(', ');

    try {
      const refId = paymentRef || `pay_rzp_${Date.now()}`;
      const orderMethodLabel = paymentMethod === 'razorpay' ? 'razorpay' : 'Cash on Delivery';

      const fullPayload: Record<string, any> = {
        id: newOrderId,
        customer_name: customerName || 'Guest Customer',
        customer_phone: customerPhone || 'Not provided',
        shipping_address: shippingAddress || 'Standard Delivery',
        total_amount: totalCartPrice,
        status: 'Pending',
        payment_status: paymentStatus,
        payment_method: orderMethodLabel,
        payment_reference: refId,
        payment_id: refId,
        items: JSON.stringify(cleanItemsArray),
        items_summary: itemsSummary,
        created_at: new Date().toISOString(),
      };

      let { error: orderError } = await supabase.from('orders').insert(fullPayload);

      // Fallback retry if optional schema columns throw PGRST204
      if (orderError && orderError.code === 'PGRST204') {
        console.warn('Retrying order insert without optional payment columns:', orderError.message);
        const safePayload = {
          id: newOrderId,
          customer_name: customerName || 'Guest Customer',
          customer_phone: customerPhone || 'Not provided',
          shipping_address: shippingAddress || 'Standard Delivery',
          total_amount: totalCartPrice,
          status: 'Pending',
          items: JSON.stringify(cleanItemsArray),
          items_summary: itemsSummary,
          payment_method: paymentMethod === 'razorpay' ? `razorpay (${refId})` : 'Cash on Delivery',
          created_at: new Date().toISOString(),
        };
        const retryRes = await supabase.from('orders').insert(safePayload);
        orderError = retryRes.error;
      }

      if (orderError) {
        console.error('Supabase Order Insert Error:', orderError);
        alert(`Order Placement Error: ${orderError.message || JSON.stringify(orderError)}`);
        setIsCheckingOut(false);
        return;
      }

      // Decrement stock levels
      for (const item of cart) {
        const currentStock = item.stock ?? 50;
        const newStock = Math.max(0, currentStock - item.quantity);
        await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
      }

      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const cartMatch = cart.find((c) => c.id === p.id);
          if (cartMatch) {
            return { ...p, stock: Math.max(0, (p.stock ?? 50) - cartMatch.quantity) };
          }
          return p;
        })
      );

      setOrderSuccess(newOrderId);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setShippingAddress('');
      setIsCartOpen(false);
    } catch (err: any) {
      console.error('Unexpected Checkout Error:', err);
      alert(`Unexpected Error: ${err?.message || 'Failed to place order'}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName || !customerPhone || !shippingAddress) {
      alert('Please fill in all delivery details before placing the order.');
      return;
    }

    if (paymentMethod === 'razorpay') {
      setIsCheckingOut(true);
      const isLoaded = await loadRazorpayScript();

      if (!isLoaded || !(window as any).Razorpay) {
        alert('Razorpay Checkout SDK failed to load. Please check internet connection.');
        setIsCheckingOut(false);
        return;
      }

      try {
        let orderData: any = null;
        try {
          const res = await fetch('/api/razorpay/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: totalCartPrice }),
          });
          if (res.ok) {
            orderData = await res.json();
          }
        } catch (err) {
          console.warn('Could not fetch order from API route, proceeding with client options:', err);
        }

        const razorpayKey =
          orderData?.key ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_live_TPkwm1YUrt2Sp8';

        const options: any = {
          key: razorpayKey,
          amount: Math.round(totalCartPrice * 100),
          currency: 'INR',
          name: 'Deepa Vathulu Store',
          description: 'Pure Sacred Cotton Wicks Order',
          prefill: {
            name: customerName,
            contact: customerPhone,
          },
          theme: {
            color: '#D97706',
          },
          handler: function (response: any) {
            console.log('Razorpay Official Standard Modal Payment Success:', response);
            const payId = response?.razorpay_payment_id || `pay_rzp_${Date.now()}`;
            processOrderCreation('paid', payId);
          },
          modal: {
            ondismiss: function () {
              setIsCheckingOut(false);
            },
          },
        };

        if (orderData?.id && !orderData?.is_fallback) {
          options.order_id = orderData.id;
        }

        const rzp = new (window as any).Razorpay(options);

        rzp.on('payment.failed', function (response: any) {
          console.warn('Razorpay Payment Failed or Cancelled:', response);
          alert(`Payment Status: ${response?.error?.description || 'Payment was not completed'}`);
          setIsCheckingOut(false);
        });

        rzp.open();
      } catch (err: any) {
        console.error('Error launching official Razorpay modal:', err);
        alert(`Razorpay Error: ${err?.message || 'Failed to open Razorpay payment modal'}`);
        setIsCheckingOut(false);
      }
    } else {
      await processOrderCreation('unpaid', 'COD');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 text-stone-900 text-xs font-semibold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <Flame className="w-4 h-4 fill-stone-900 animate-pulse" />
        <span>Diwali & Festive Special: Free Shipping Across India on Orders Above ₹499!</span>
        <Flame className="w-4 h-4 fill-stone-900 animate-pulse" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-900/30 text-stone-950 font-bold text-xl">
              🪔
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                Deepa Vathulu
              </span>
              <p className="text-[10px] text-amber-500/80 font-mono uppercase tracking-widest -mt-1">
                PURE SACRED COTTON WICKS
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search cotton wicks, ghee wicks, akhanda wicks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900/80 border border-stone-800 rounded-full pl-10 pr-4 py-2 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl transition-all flex items-center gap-2 group"
            >
              <ShoppingBag className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-xs font-semibold text-stone-200">
                Cart
              </span>
              {totalCartCount > 0 && (
                <span className="bg-amber-500 text-stone-950 font-extrabold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search cotton wicks, ghee wicks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-lg pl-10 pr-4 py-2 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 border-b border-stone-800/50 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/40 via-stone-950/0 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Handcrafted Divine Collection
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-stone-100 leading-none mb-6">
              Illuminate Every Ritual with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">
                Pure, Sacred Cotton
              </span>
            </h1>
            <p className="text-base sm:text-xl text-stone-400 leading-relaxed mb-8">
              Hand-rolled organic cotton wicks crafted for daily home pooja, grand festivals, and long-burning Akhanda deepams.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#catalog"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-sm shadow-lg shadow-amber-600/25 transition-all flex items-center gap-2"
              >
                Browse Catalog <ChevronRight className="w-4 h-4" />
              </a>
              <div className="flex flex-wrap items-center gap-6 text-stone-400 text-xs font-medium pl-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> 100% Organic Cotton
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> Hand-Rolled Quality
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-400" /> Safe Packaging
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Storefront Catalog */}
      <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-100">
              {selectedCategory === 'All' ? 'Complete Cotton Wicks Collection' : selectedCategory}
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Showing {filteredProducts.length} items from Supabase database
            </p>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 bg-stone-900/50 rounded-2xl animate-pulse border border-stone-800/50" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-stone-900/30 rounded-2xl border border-stone-800">
            <div className="text-5xl mb-4">🪔</div>
            <h3 className="text-lg font-semibold text-stone-200">No Products Found</h3>
            <p className="text-xs text-stone-400 mt-1">Try adjusting your search query or selected category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.id === product.id);
              return (
                <div
                  key={product.id}
                  className="bg-stone-900/70 border border-stone-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-amber-950/20"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-center justify-between mb-4">
                      {product.tag ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                          {product.tag}
                        </span>
                      ) : (
                        <div />
                      )}
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold bg-stone-950/80 px-2 py-0.5 rounded-full border border-stone-800">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{product.rating || 4.9}</span>
                      </div>
                    </div>

                    {/* Product Image / Icon */}
                    <div
                      onClick={() => setSelectedProduct(product)}
                      className="cursor-pointer mb-4 h-48 w-full flex items-center justify-center rounded-xl bg-stone-950/60 border border-stone-800/80 group-hover:border-amber-500/40 transition-all duration-300 overflow-hidden relative"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            if (e.currentTarget.parentElement) {
                              const fallback = document.createElement('div');
                              fallback.className = 'text-5xl group-hover:scale-110 transition-transform duration-300';
                              fallback.innerText = '🪔';
                              e.currentTarget.parentElement.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                          🪔
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <h3
                      onClick={() => setSelectedProduct(product)}
                      className="text-base font-bold text-stone-100 mb-2 cursor-pointer hover:text-amber-400 transition-colors line-clamp-1"
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs text-stone-400 leading-relaxed mb-6 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Pricing & Add Button */}
                  <div className="pt-4 border-t border-stone-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-medium">Price</span>
                      <span className="text-xl font-extrabold text-amber-400">₹{product.price}</span>
                      {product.stock !== undefined && (
                        <span className="text-[10px] text-stone-500 block">Stock: {product.stock}</span>
                      )}
                    </div>

                    {cartItem ? (
                      <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-2 py-1 gap-2">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="text-amber-400 hover:text-amber-300 p-1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-stone-100 min-w-4 text-center">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="text-amber-400 hover:text-amber-300 p-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/80 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-stone-900 border-l border-stone-800 p-6 flex flex-col justify-between shadow-2xl">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-bold text-stone-100">Shopping Cart & Checkout</h2>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Items */}
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-3">🛒</div>
                    <p className="text-sm font-semibold text-stone-300">Your cart is currently empty</p>
                    <p className="text-xs text-stone-400 mt-1">Add items from the store to proceed.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCheckoutSubmit} className="py-4 space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                    {/* Cart Items List */}
                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">Selected Items</span>
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="bg-stone-950 border border-stone-800 p-3.5 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-stone-200 truncate">{item.name}</h4>
                            <p className="text-xs text-amber-400 font-semibold mt-0.5">₹{item.price} each</p>
                          </div>

                          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="text-stone-400 hover:text-stone-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-stone-200">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="text-stone-400 hover:text-stone-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400/80 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Customer Details */}
                    <div className="space-y-3 pt-3 border-t border-stone-800">
                      <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">Customer Delivery Details</span>
                      
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                        <input
                          type="tel"
                          required
                          placeholder="Mobile Number"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                        <textarea
                          required
                          placeholder="Full Shipping Address & Pincode"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          rows={2}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2 pt-3 border-t border-stone-800">
                      <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">Select Payment Method</span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('razorpay')}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                            paymentMethod === 'razorpay'
                              ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                              : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                          }`}
                        >
                          <CreditCard className="w-5 h-5" />
                          <span>Razorpay (UPI/Card)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cod')}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                            paymentMethod === 'cod'
                              ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                              : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                          }`}
                        >
                          <Banknote className="w-5 h-5" />
                          <span>Cash on Delivery</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isCheckingOut}
                      className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-sm shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isCheckingOut ? (
                        <span>Processing Order...</span>
                      ) : (
                        <>
                          <span>Pay & Place Order (₹{totalCartPrice.toLocaleString()})</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Summary Footer */}
              {cart.length > 0 && (
                <div className="pt-4 border-t border-stone-800">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>Subtotal ({totalCartCount} items)</span>
                    <span className="text-base font-extrabold text-amber-400">₹{totalCartPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 h-56 w-full flex items-center justify-center rounded-xl bg-stone-950/80 border border-stone-800 overflow-hidden relative">
              {selectedProduct.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-6xl">🪔</div>
              )}
            </div>

            {selectedProduct.tag && (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider inline-block mb-3">
                {selectedProduct.tag}
              </span>
            )}

            <h3 className="text-xl font-bold text-stone-100 mb-1">{selectedProduct.name}</h3>
            <p className="text-xs text-amber-400 font-medium mb-4">Category: {selectedProduct.category}</p>

            <p className="text-sm text-stone-400 leading-relaxed mb-6">
              {selectedProduct.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-stone-800">
              <div>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-medium">Price</span>
                <span className="text-2xl font-extrabold text-amber-400">₹{selectedProduct.price}</span>
              </div>

              <button
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-stone-100 mb-1">Order Confirmed! 🙏</h3>
            <p className="text-xs text-amber-400 font-mono font-bold mb-4">Order Reference: {orderSuccess}</p>
            <p className="text-xs text-stone-400 leading-relaxed mb-6">
              Your order has been recorded into the Supabase database. Your organic cotton wicks are being prepared for shipping!
            </p>
            <button
              onClick={() => {
                setOrderSuccess(null);
                setIsCartOpen(false);
              }}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
