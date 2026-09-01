'use client';

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
  Mail,
  Lock,
  Package,
  History,
  LogOut,
  LogIn,
  AlertCircle,
  Clock,
  RefreshCw,
  Edit3,
  Save,
  Check,
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

interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  full_name: string;
  shipping_address?: string;
}

interface OrderRecord {
  id: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address?: string;
  total_amount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  payment_status?: string;
  payment_method?: string;
  items?: string;
  items_summary?: string;
  created_at: string;
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
    image_url: 'https://images.unsplash.com/photo-1605371924599-2d0365da1ae0?w=600&q=80',
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
    image_url: 'https://images.unsplash.com/photo-1602607414963-39a7e6b77c50?w=600&q=80',
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
    image_url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80',
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
    image_url: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=600&q=80',
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
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80',
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
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80',
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

  // Customer Authentication & Profile State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [profileTab, setProfileTab] = useState<'orders' | 'profile'>('orders');
  
  // Auth Form Fields
  const [authIdentifier, setAuthIdentifier] = useState(''); // email or phone
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Profile Edit Fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Order History State
  const [userOrders, setUserOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

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
    initializeCustomerSession();
  }, []);

  // Initialize Session
  const initializeCustomerSession = async () => {
    try {
      const localUserStr = localStorage.getItem('deepa_vathulu_user');
      if (localUserStr) {
        const initialUser: UserProfile = JSON.parse(localUserStr);
        if (initialUser && initialUser.full_name) {
          setUser(initialUser);
          populateProfileFields(initialUser);
          fetchUserOrders(initialUser.phone, initialUser.email);
        }
      }
    } catch (err) {
      console.warn('Customer session init warning:', err);
    }
  };

  const populateProfileFields = (u: UserProfile) => {
    if (u.full_name) {
      setCustomerName(u.full_name);
      setEditName(u.full_name);
    }
    if (u.phone) {
      setCustomerPhone(u.phone);
      setEditPhone(u.phone);
    }
    if (u.email) {
      setEditEmail(u.email);
    }
    if (u.shipping_address) {
      setShippingAddress(u.shipping_address);
      setEditAddress(u.shipping_address);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*');
      if (error || !data || data.length === 0) {
        setProducts(SAMPLE_PRODUCTS);
      } else {
        setProducts(data);
      }
    } catch (err) {
      setProducts(SAMPLE_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Previous Order History for User from Supabase (Excludes 'Profile' rows)
  const fetchUserOrders = async (phone?: string, email?: string) => {
    try {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'Profile')
        .not('id', 'like', 'USER_PROFILE_%')
        .order('created_at', { ascending: false });

      if (error || !data) return;

      const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
      const cleanEmail = email ? email.toLowerCase().trim() : '';

      const matchedOrders = data.filter((order: any) => {
        if (order.status === 'Profile' || order.id?.startsWith('USER_PROFILE_')) return false;
        let meta: any = {};
        try { meta = JSON.parse(order.items || '{}'); } catch (e) {}
        
        const ordPhone = (order.customer_phone || '').replace(/\D/g, '').slice(-10);
        const matchPhone = cleanPhone && ordPhone && ordPhone.includes(cleanPhone);
        const matchEmail = cleanEmail && meta.email && meta.email.toLowerCase() === cleanEmail;
        return matchPhone || matchEmail;
      });

      setUserOrders(matchedOrders);
    } catch (err) {
      console.error('Error fetching user orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Save profile to Supabase database so mobile and web stay 100% in sync
  const saveProfileToSupabase = async (profile: {
    full_name: string;
    phone?: string;
    email?: string;
    shipping_address?: string;
    password?: string;
  }) => {
    const cleanPhone = (profile.phone || '').replace(/\D/g, '').slice(-10);
    const cleanEmail = (profile.email || '').toLowerCase().trim();
    const profileKey = cleanPhone || cleanEmail.replace(/[^a-z0-9]/g, '_');
    if (!profileKey) return;

    const record = {
      id: `USER_PROFILE_${profileKey}`,
      customer_name: profile.full_name,
      customer_phone: profile.phone || '',
      shipping_address: profile.shipping_address || '',
      items: JSON.stringify({
        email: profile.email || '',
        password: profile.password || '',
        full_name: profile.full_name,
        phone: profile.phone || '',
        address: profile.shipping_address || '',
      }),
      items_summary: 'Customer Account Profile',
      total_amount: 0,
      status: 'Profile',
      payment_method: 'Customer Profile',
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('orders').upsert(record, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase profile save notice:', e);
    }
  };

  // Customer Login / Signup Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      if (authTab === 'signin') {
        const identifier = authIdentifier.trim();
        const cleanPhone = identifier.replace(/\D/g, '').slice(-10);
        const cleanEmail = identifier.toLowerCase().trim();
        const isEmail = identifier.includes('@');

        if (!identifier || !authPassword) {
          setAuthMessage({ type: 'error', text: 'Please enter your phone/email and password.' });
          setAuthLoading(false);
          return;
        }

        // Fetch all profile records from Supabase
        const { data: profileRows, error } = await supabase
          .from('orders')
          .select('*')
          .or('status.eq.Profile,id.like.USER_PROFILE_%');

        let matchedRow: any = null;
        let matchedMeta: any = {};

        if (profileRows && profileRows.length > 0) {
          matchedRow = profileRows.find((r: any) => {
            let meta: any = {};
            try { meta = JSON.parse(r.items || '{}'); } catch (e) {}
            const rowPhone = (r.customer_phone || meta.phone || '').replace(/\D/g, '').slice(-10);
            const rowEmail = (meta.email || '').toLowerCase().trim();

            const phoneMatches = cleanPhone && rowPhone && rowPhone === cleanPhone;
            const emailMatches = isEmail && rowEmail && rowEmail === cleanEmail;
            return phoneMatches || emailMatches;
          });
        }

        if (!matchedRow) {
          setAuthMessage({
            type: 'error',
            text: 'Account not found! Please check your credentials or click "Create Account" to register.',
          });
          setAuthLoading(false);
          return;
        }

        try {
          matchedMeta = JSON.parse(matchedRow.items || '{}');
        } catch (e) {}

        // Verify password
        if (matchedMeta.password && matchedMeta.password !== authPassword) {
          setAuthMessage({
            type: 'error',
            text: 'Incorrect password. Please enter the password you chose during account creation.',
          });
          setAuthLoading(false);
          return;
        }

        const signedInUser: UserProfile = {
          id: matchedRow.id,
          full_name: matchedRow.customer_name || matchedMeta.full_name || 'Customer',
          phone: matchedRow.customer_phone || matchedMeta.phone || (isEmail ? '' : identifier),
          email: matchedMeta.email || (isEmail ? identifier : ''),
          shipping_address: matchedRow.shipping_address || matchedMeta.address || '',
        };

        setUser(signedInUser);
        localStorage.setItem('deepa_vathulu_user', JSON.stringify(signedInUser));
        populateProfileFields(signedInUser);
        fetchUserOrders(signedInUser.phone, signedInUser.email);
        
        setAuthMessage({ type: 'success', text: `Welcome back, ${signedInUser.full_name}!` });
        setTimeout(() => {
          setProfileTab('orders');
        }, 600);
      } else {
        // Sign Up Flow
        if (!authName.trim() || !authPassword.trim() || (!authEmail.trim() && !authPhone.trim())) {
          setAuthMessage({ type: 'error', text: 'Please enter your Full Name, Phone/Email, and a Password.' });
          setAuthLoading(false);
          return;
        }

        const cleanPhone = authPhone.replace(/\D/g, '').slice(-10);
        const cleanEmail = authEmail.toLowerCase().trim();
        const newUserId = `USER_PROFILE_${cleanPhone || cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
        
        const newProfile: UserProfile = {
          id: newUserId,
          full_name: authName.trim(),
          email: authEmail.trim() || undefined,
          phone: authPhone.trim() || undefined,
          shipping_address: authAddress.trim() || undefined,
        };

        // Save to Supabase so Mobile App and Web are always synchronized
        await saveProfileToSupabase({
          full_name: newProfile.full_name,
          phone: newProfile.phone,
          email: newProfile.email,
          shipping_address: newProfile.shipping_address,
          password: authPassword,
        });

        setUser(newProfile);
        localStorage.setItem('deepa_vathulu_user', JSON.stringify(newProfile));
        populateProfileFields(newProfile);
        fetchUserOrders(newProfile.phone, newProfile.email);

        setAuthMessage({ type: 'success', text: 'Account created successfully! You are now logged in.' });
        setTimeout(() => {
          setProfileTab('orders');
        }, 600);
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err?.message || 'Authentication error. Please try again.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('deepa_vathulu_user');
    setUserOrders([]);
    setCustomerName('');
    setCustomerPhone('');
    setShippingAddress('');
    setIsAuthModalOpen(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);

    const updatedUser: UserProfile = {
      ...user,
      full_name: editName.trim() || user.full_name,
      phone: editPhone.trim() || user.phone,
      email: editEmail.trim() || user.email,
      shipping_address: editAddress.trim() || user.shipping_address,
    };

    setUser(updatedUser);
    localStorage.setItem('deepa_vathulu_user', JSON.stringify(updatedUser));
    populateProfileFields(updatedUser);

    // Sync to Supabase
    await saveProfileToSupabase({
      full_name: updatedUser.full_name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      shipping_address: updatedUser.shipping_address,
    });

    setIsSavingProfile(false);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);
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
    // Enforce mandatory profile login
    if (!user) {
      setIsCartOpen(false);
      setIsAuthModalOpen(true);
      setAuthTab('signup');
      setAuthMessage({
        type: 'error',
        text: 'Account Required: Please create an account or sign in to complete your order.',
      });
      return;
    }

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

      const fullPayload = {
        id: newOrderId,
        customer_name: customerName || user.full_name,
        customer_phone: customerPhone || user.phone || 'Not provided',
        shipping_address: shippingAddress || user.shipping_address || 'Standard Delivery',
        total_amount: totalCartPrice,
        status: 'Pending',
        payment_method: orderMethodLabel,
        items: JSON.stringify(cleanItemsArray),
        items_summary: itemsSummary,
        created_at: new Date().toISOString(),
      };

      const { error: orderError } = await supabase.from('orders').insert(fullPayload);

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

      // Instantly add to local user order history
      const placedOrderRecord: OrderRecord = {
        id: newOrderId,
        customer_name: customerName || user.full_name,
        customer_phone: customerPhone || user.phone,
        shipping_address: shippingAddress || user.shipping_address,
        total_amount: totalCartPrice,
        status: 'Pending',
        payment_status: paymentStatus,
        payment_method: orderMethodLabel,
        items: JSON.stringify(cleanItemsArray),
        items_summary: itemsSummary,
        created_at: new Date().toISOString(),
      };

      setUserOrders((prev) => [placedOrderRecord, ...prev]);

      setOrderSuccess(newOrderId);
      setCart([]);
      setIsCartOpen(false);

      if (user) {
        fetchUserOrders(user.phone, user.email);
      }
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

    // Strict account verification before checkout
    if (!user) {
      setIsCartOpen(false);
      setIsAuthModalOpen(true);
      setAuthTab('signup');
      setAuthMessage({
        type: 'error',
        text: 'Account Required: Please create a profile or log in before placing an order.',
      });
      return;
    }

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
          '';

        const options: any = {
          key: razorpayKey,
          amount: Math.round(totalCartPrice * 100),
          currency: 'INR',
          name: 'Deepa Vathulu Store',
          description: 'Pure Sacred Cotton Wicks Order',
          prefill: {
            name: customerName || user.full_name,
            contact: customerPhone || user.phone,
            email: user.email || '',
          },
          theme: {
            color: '#D97706',
          },
          handler: function (response: any) {
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
          console.warn('Razorpay Payment Failed:', response);
          alert(`Payment Status: ${response?.error?.description || 'Payment was not completed'}`);
          setIsCheckingOut(false);
        });

        rzp.open();
      } catch (err: any) {
        console.error('Error launching Razorpay modal:', err);
        alert(`Razorpay Error: ${err?.message || 'Failed to open Razorpay payment modal'}`);
        setIsCheckingOut(false);
      }
    } else {
      await processOrderCreation('unpaid', 'COD');
    }
  };

  const getStatusBadge = (status: OrderRecord['status']) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Shipped':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Processing':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
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

      {/* Navigation Header */}
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
          <div className="flex items-center gap-3">
            {/* Customer Profile / Sign In Button */}
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                if (user) {
                  setProfileTab('orders');
                  fetchUserOrders(user.phone, user.email);
                } else {
                  setAuthTab('signin');
                  setAuthMessage(null);
                }
              }}
              className={`p-2.5 sm:px-4 sm:py-2.5 rounded-xl border transition-all flex items-center gap-2 group ${
                user
                  ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-300'
                  : 'bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-200'
              }`}
            >
              <User className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-xs font-semibold">
                {user ? (user.full_name?.split(' ')[0] || 'My Profile') : 'Sign In'}
              </span>
              {user && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block" />
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 sm:px-4 sm:py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl transition-all flex items-center gap-2 group"
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
                  : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-100">
              {selectedCategory === 'All' ? 'Sacred Catalog Items' : selectedCategory}
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Showing {filteredProducts.length} handcrafted pooja essentials
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-stone-400">Loading sacred products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-stone-900/30 border border-stone-800/80 rounded-2xl p-8">
            <p className="text-4xl mb-3">🪔</p>
            <h3 className="text-lg font-bold text-stone-200">No items found</h3>
            <p className="text-xs text-stone-400 mt-1">Try selecting a different category or adjusting search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const inCart = cart.find((item) => item.id === product.id);
              return (
                <div
                  key={product.id}
                  className="bg-stone-900/40 border border-stone-800/80 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all flex flex-col group"
                >
                  {/* Product Image */}
                  <div
                    onClick={() => setSelectedProduct(product)}
                    className="h-52 w-full overflow-hidden bg-stone-950 relative cursor-pointer"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-stone-900 to-amber-950/40">
                        🪔
                      </div>
                    )}
                    {product.tag && (
                      <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-sm text-stone-950 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {product.tag}
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-stone-950/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-semibold text-amber-400 flex items-center gap-1 border border-stone-800">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {product.rating || '4.9'}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-amber-500/90 uppercase tracking-wider block mb-1">
                        {product.category}
                      </span>
                      <h3
                        onClick={() => setSelectedProduct(product)}
                        className="text-base font-bold text-stone-100 hover:text-amber-400 transition-colors line-clamp-1 cursor-pointer"
                      >
                        {product.name}
                      </h3>
                      <p className="text-xs text-stone-400 line-clamp-2 mt-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-medium">Price</span>
                        <span className="text-lg font-extrabold text-amber-400">
                          ₹{product.price}
                        </span>
                      </div>

                      {inCart ? (
                        <div className="flex items-center gap-2 bg-stone-800/90 border border-stone-700/80 rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-7 h-7 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold px-1.5 text-amber-300">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-7 h-7 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Customer Profile & Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
                  {user ? '👤' : '🔐'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-100">
                    {user ? `Customer Account (${user.full_name})` : 'Customer Sign In & Sign Up'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {user ? 'View previous orders & manage delivery details' : 'Login or register with your email or phone number'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto py-4 flex-1">
              {!user ? (
                /* Authenticate (Sign In / Sign Up) Form */
                <div>
                  {/* Tab Navigation */}
                  <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 mb-6">
                    <button
                      onClick={() => {
                        setAuthTab('signin');
                        setAuthMessage(null);
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        authTab === 'signin'
                          ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setAuthTab('signup');
                        setAuthMessage(null);
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        authTab === 'signup'
                          ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {authMessage && (
                    <div
                      className={`p-3.5 rounded-xl text-xs mb-5 flex items-center gap-2.5 ${
                        authMessage.type === 'error'
                          ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      {authMessage.type === 'error' ? (
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      )}
                      <span>{authMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {authTab === 'signin' ? (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                            Mobile Phone Number or Email *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="e.g. 7032938500 or user@gmail.com"
                              value={authIdentifier}
                              onChange={(e) => setAuthIdentifier(e.target.value)}
                              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              required
                              placeholder="Enter your account password"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Enter your full name (e.g. Sangeetha)"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="10-digit phone number"
                              value={authPhone}
                              onChange={(e) => setAuthPhone(e.target.value)}
                              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                              Email Address (Optional)
                            </label>
                            <input
                              type="email"
                              placeholder="user@example.com"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                            Default Delivery / Shipping Address
                          </label>
                          <textarea
                            rows={2}
                            placeholder="House / Flat No, Street, City, State, Pincode"
                            value={authAddress}
                            onChange={(e) => setAuthAddress(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                            Create Password *
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="Choose a password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-sm shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <span>Authenticating with Database...</span>
                      ) : authTab === 'signin' ? (
                        <>
                          <LogIn className="w-4 h-4" /> Sign In to Account
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Create Account & Log In
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Authenticated User Profile & Order History */
                <div>
                  {/* Customer Card */}
                  <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-stone-950 font-black text-lg shadow-md">
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-stone-100">{user.full_name}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 mt-0.5">
                          {user.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-amber-400" /> {user.phone}</span>}
                          {user.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-amber-400" /> {user.email}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-red-400 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>

                  {/* Profile Tab Navigation */}
                  <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 mb-6">
                    <button
                      onClick={() => setProfileTab('orders')}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        profileTab === 'orders'
                          ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Package className="w-4 h-4" /> Order History ({userOrders.length})
                    </button>
                    <button
                      onClick={() => setProfileTab('profile')}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        profileTab === 'profile'
                          ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" /> Account & Address
                    </button>
                  </div>

                  {/* Tab 1: Order History */}
                  {profileTab === 'orders' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-stone-400 uppercase tracking-widest font-semibold">
                          Past Orders Recorded ({userOrders.length})
                        </span>
                        <button
                          onClick={() => fetchUserOrders(user.phone, user.email)}
                          disabled={ordersLoading}
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-medium"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                      </div>

                      {ordersLoading ? (
                        <div className="py-12 text-center text-stone-400 text-xs">
                          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          Fetching your previous orders from Supabase...
                        </div>
                      ) : userOrders.length === 0 ? (
                        <div className="py-12 text-center bg-stone-950/40 border border-stone-800 rounded-xl p-6">
                          <Package className="w-10 h-10 text-stone-600 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-stone-300">No Previous Orders Found</h4>
                          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                            Orders you place will appear here with live delivery status.
                          </p>
                          <button
                            onClick={() => setIsAuthModalOpen(false)}
                            className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs inline-flex items-center gap-1.5"
                          >
                            Explore Sacred Catalog
                          </button>
                        </div>
                      ) : (
                        userOrders.map((ord) => (
                          <div
                            key={ord.id}
                            className="bg-stone-950 border border-stone-800 rounded-xl p-4 hover:border-stone-700 transition-colors"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-800/80">
                              <div>
                                <span className="text-xs font-mono font-bold text-amber-400">{ord.id}</span>
                                <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-stone-500" />
                                  {new Date(ord.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(ord.status)}`}>
                                  {ord.status}
                                </span>
                                <span className="text-sm font-extrabold text-amber-400">
                                  ₹{ord.total_amount?.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div className="py-3">
                              <p className="text-xs font-semibold text-stone-300 mb-1">Items Summary:</p>
                              <p className="text-xs text-stone-400">{ord.items_summary || 'Custom order items'}</p>
                            </div>

                            <div className="pt-2 border-t border-stone-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400">
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3 text-amber-400" />
                                {ord.payment_method || 'Razorpay / Prepaid'}
                              </span>
                              {ord.shipping_address && (
                                <span className="flex items-center gap-1 truncate max-w-xs">
                                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="truncate">{ord.shipping_address}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab 2: Account & Address Details */}
                  {profileTab === 'profile' && (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      {profileSaveSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Profile details updated successfully across web and mobile!</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                            Mobile Phone Number
                          </label>
                          <input
                            type="tel"
                            required
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                          Default Shipping & Delivery Address
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="w-full mt-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isSavingProfile ? 'Saving Details...' : 'Save Profile & Address'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-stone-900 border-l border-stone-800 h-full flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="p-6 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-stone-100">Your Cart</h3>
                <span className="text-xs text-stone-400 font-medium">({totalCartCount} items)</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-stone-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-stone-600" />
                  <p className="text-sm font-semibold">Your cart is currently empty</p>
                  <p className="text-xs text-stone-500 mt-1">Add pure cotton wicks to proceed</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-stone-900 border border-stone-800 overflow-hidden shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-lg">🪔</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-200 line-clamp-1 max-w-[150px]">
                          {item.name}
                        </h4>
                        <span className="text-xs text-amber-400 font-extrabold">₹{item.price}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-stone-900 border border-stone-700/80 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-stone-300 hover:bg-stone-800"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold px-2 text-stone-200">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-stone-300 hover:bg-stone-800"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-stone-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Form & Total Section */}
            <div className="p-6 bg-stone-950 border-t border-stone-800 space-y-4">
              {cart.length > 0 && (
                <>
                  {!user ? (
                    /* Account Required Notice for Guests */
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-center space-y-3">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-300">Account Required to Place Order</h4>
                        <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                          Guests can browse items freely, but you must sign in or create an account with your delivery address to place an order.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCartOpen(false);
                          setIsAuthModalOpen(true);
                          setAuthTab('signup');
                          setAuthMessage(null);
                        }}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <User className="w-4 h-4" /> Create Account / Sign In to Checkout
                      </button>
                    </div>
                  ) : (
                    /* Authenticated Checkout Form */
                    <form onSubmit={handleCheckoutSubmit} className="space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                          Delivery Details
                        </h4>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Auto-filled for {user.full_name}
                        </span>
                      </div>

                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Full Name *"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <input
                          type="tel"
                          required
                          placeholder="Phone Number (+91) *"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <textarea
                          rows={2}
                          required
                          placeholder="Complete Shipping Address *"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <span className="block text-[11px] font-semibold text-stone-400 mb-2">
                          Payment Mode
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('razorpay')}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              paymentMethod === 'razorpay'
                                ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                : 'bg-stone-900 border-stone-800 text-stone-400'
                            }`}
                          >
                            <CreditCard className="w-4 h-4" /> Razorpay (UPI/Cards)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cod')}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              paymentMethod === 'cod'
                                ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                : 'bg-stone-900 border-stone-800 text-stone-400'
                            }`}
                          >
                            <Banknote className="w-4 h-4" /> Cash on Delivery
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                        <span>Order Total ({totalCartCount} items)</span>
                        <span className="text-base font-extrabold text-amber-400">₹{totalCartPrice.toLocaleString()}</span>
                      </div>

                      <button
                        type="submit"
                        disabled={isCheckingOut}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-sm shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
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
                </>
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
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setOrderSuccess(null);
                  setIsCartOpen(false);
                  setIsAuthModalOpen(true);
                  setProfileTab('orders');
                }}
                className="flex-1 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Package className="w-4 h-4" /> Track Order in Profile
              </button>
              <button
                onClick={() => {
                  setOrderSuccess(null);
                  setIsCartOpen(false);
                }}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
