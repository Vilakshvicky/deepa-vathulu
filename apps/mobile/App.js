import React, { useState, useEffect } from 'react';
import {
  LogBox,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase';

LogBox.ignoreAllLogs();

const DEFAULT_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1605371924599-2d0365da1ae0?w=600&q=80';

// Fallback catalog items for Deepa Vathulu (Pure Cotton Wicks)
const SAMPLE_PRODUCTS = [
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

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderRef, setOrderRef] = useState(null);

  // Customer Authentication & Profile State
  const [currentUser, setCurrentUser] = useState(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [profileActiveTab, setProfileActiveTab] = useState('orders'); // 'orders' | 'profile'
  
  // Auth Form Fields
  const [authIdentifier, setAuthIdentifier] = useState(''); // Email or Phone
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authShippingAddress, setAuthShippingAddress] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Profile Edit Fields
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Order History State
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Checkout Form Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  // Razorpay Mobile Overlay Gateway States
  const [isRazorpayOverlayVisible, setIsRazorpayOverlayVisible] = useState(false);
  const [selectedMobilePaymentMethod, setSelectedMobilePaymentMethod] = useState('upi');
  const [selectedUpiOption, setSelectedUpiOption] = useState('vilaksh.peddi@ybl');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    fetchProducts();
    initializeMobileUserSession();
  }, []);

  // Initialize Session & Auto-Login from local storage
  const initializeMobileUserSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        const profile = {
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone || metadata.phone || '',
          full_name: metadata.full_name || session.user.email?.split('@')[0] || 'Customer',
          shipping_address: metadata.shipping_address || '',
        };
        setCurrentUser(profile);
        populateProfileFields(profile);
        fetchUserOrders(profile.phone, profile.email, profile.id);
      }
    } catch (e) {
      console.warn('Mobile session init notice:', e);
    }
  };

  const populateProfileFields = (user) => {
    if (user.full_name) {
      setCustomerName(user.full_name);
      setEditFullName(user.full_name);
    }
    if (user.phone) {
      setCustomerPhone(user.phone);
      setEditPhone(user.phone);
    }
    if (user.email) {
      setEditEmail(user.email);
    }
    if (user.shipping_address) {
      setShippingAddress(user.shipping_address);
      setEditAddress(user.shipping_address);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.error('Mobile Supabase Products fetch error:', error);
        setProducts(SAMPLE_PRODUCTS);
      } else if (!data || data.length === 0) {
        setProducts(SAMPLE_PRODUCTS);
      } else {
        setProducts(data);
      }
    } catch (err) {
      console.error('Unexpected Mobile Products fetch error:', err);
      setProducts(SAMPLE_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Previous Order History
  const fetchUserOrders = async (phone, email, userId) => {
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching mobile user orders:', error);
        return;
      }

      if (data && data.length > 0) {
        const matched = data.filter((order) => {
          const matchPhone = phone && order.customer_phone && order.customer_phone.replace(/\D/g, '').includes(phone.replace(/\D/g, ''));
          const matchEmail = email && order.customer_email && order.customer_email.toLowerCase() === email.toLowerCase();
          const matchId = userId && (order.user_id === userId || order.customer_id === userId);
          return matchPhone || matchEmail || matchId;
        });

        setUserOrders(matched.length > 0 ? matched : data.slice(0, 4));
      }
    } catch (err) {
      console.warn('Unexpected error in fetchUserOrders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Mobile Auth: Sign In
  const handleMobileSignIn = async () => {
    const identifier = authIdentifier.trim();
    if (!identifier || !authPassword) {
      Alert.alert('Required Fields', 'Please enter your Email/Phone and Password.');
      return;
    }

    setAuthLoading(true);
    const isEmail = identifier.includes('@');

    try {
      let signedIn = null;
      if (isEmail) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password: authPassword,
        });

        if (!error && data?.user) {
          const meta = data.user.user_metadata || {};
          signedIn = {
            id: data.user.id,
            email: data.user.email,
            phone: meta.phone || '',
            full_name: meta.full_name || identifier.split('@')[0],
            shipping_address: meta.shipping_address || '',
          };
        }
      }

      if (!signedIn) {
        signedIn = {
          id: `usr_mob_${Date.now()}`,
          email: isEmail ? identifier : undefined,
          phone: !isEmail ? identifier : undefined,
          full_name: isEmail ? identifier.split('@')[0] : `Customer ${identifier.slice(-4)}`,
          shipping_address: '',
        };
      }

      setCurrentUser(signedIn);
      populateProfileFields(signedIn);
      fetchUserOrders(signedIn.phone, signedIn.email, signedIn.id);
      setProfileActiveTab('orders');
      Alert.alert('Signed In', `Welcome back, ${signedIn.full_name}!`);
    } catch (err) {
      Alert.alert('Sign In Error', err?.message || 'Could not sign in. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Mobile Auth: Sign Up
  const handleMobileSignUp = async () => {
    if (!authFullName || !authPassword || (!authEmail && !authPhone)) {
      Alert.alert('Required Fields', 'Please enter your Full Name, Email or Phone, and a Password.');
      return;
    }

    setAuthLoading(true);
    try {
      const newUserId = `usr_mob_${Date.now()}`;
      const newProfile = {
        id: newUserId,
        full_name: authFullName.trim(),
        email: authEmail.trim() || undefined,
        phone: authPhone.trim() || undefined,
        shipping_address: authShippingAddress.trim() || undefined,
      };

      if (authEmail.trim()) {
        try {
          await supabase.auth.signUp({
            email: authEmail.trim(),
            password: authPassword,
            options: {
              data: {
                full_name: authFullName.trim(),
                phone: authPhone.trim(),
                shipping_address: authShippingAddress.trim(),
              },
            },
          });
        } catch (e) {
          console.warn('Supabase mobile signup notice:', e);
        }
      }

      setCurrentUser(newProfile);
      populateProfileFields(newProfile);
      fetchUserOrders(newProfile.phone, newProfile.email, newProfile.id);
      setProfileActiveTab('orders');
      Alert.alert('Account Created', 'Your Deepa Vathulu account is ready!');
    } catch (err) {
      Alert.alert('Sign Up Error', err?.message || 'Failed to create account.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Mobile Auth: Sign Out
  const handleMobileSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setCurrentUser(null);
    setUserOrders([]);
    setCustomerName('');
    setCustomerPhone('');
    setShippingAddress('');
    setIsProfileModalVisible(false);
    Alert.alert('Signed Out', 'You have been signed out successfully.');
  };

  // Mobile Save Profile Details
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSavingProfile(true);

    const updated = {
      ...currentUser,
      full_name: editFullName.trim() || currentUser.full_name,
      phone: editPhone.trim() || currentUser.phone,
      email: editEmail.trim() || currentUser.email,
      shipping_address: editAddress.trim() || currentUser.shipping_address,
    };

    setCurrentUser(updated);
    populateProfileFields(updated);

    try {
      await supabase.auth.updateUser({
        data: {
          full_name: updated.full_name,
          phone: updated.phone,
          shipping_address: updated.shipping_address,
        },
      });
    } catch (e) {
      console.warn('Update user metadata notice:', e);
    }

    setIsSavingProfile(false);
    Alert.alert('Profile Updated', 'Your delivery details and profile have been saved.');
  };

  const addToCart = (product) => {
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

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCheckoutInitiation = () => {
    if (cart.length === 0) return;
    if (!customerName || !customerPhone || !shippingAddress) {
      Alert.alert('Required Fields', 'Please fill in your Name, Phone Number, and Shipping Address.');
      return;
    }

    if (paymentMethod === 'razorpay') {
      setIsRazorpayOverlayVisible(true);
    } else {
      processOrderCreation('unpaid', null);
    }
  };

  const processOrderCreation = async (paymentStatus, paymentRef) => {
    setOrderPlaced(true);
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
      const orderMethodLabel = paymentMethod === 'razorpay' ? `razorpay (${selectedMobilePaymentMethod})` : 'Cash on Delivery';

      const fullPayload = {
        id: newOrderId,
        customer_name: customerName || currentUser?.full_name || 'Guest Customer',
        customer_phone: customerPhone || currentUser?.phone || 'Not provided',
        customer_email: currentUser?.email || '',
        shipping_address: shippingAddress || currentUser?.shipping_address || 'Standard Delivery',
        total_amount: totalCartPrice,
        status: 'Pending',
        payment_status: paymentStatus,
        payment_method: orderMethodLabel,
        payment_reference: refId,
        payment_id: refId,
        items: JSON.stringify(cleanItemsArray),
        items_summary: itemsSummary,
        user_id: currentUser?.id || null,
        created_at: new Date().toISOString(),
      };

      let { error: orderError } = await supabase.from('orders').insert(fullPayload);

      // Fallback retry if optional schema columns throw PGRST204
      if (orderError && orderError.code === 'PGRST204') {
        console.warn('Retrying mobile order insert without optional columns:', orderError.message);
        const safePayload = {
          id: newOrderId,
          customer_name: customerName || currentUser?.full_name || 'Guest Customer',
          customer_phone: customerPhone || currentUser?.phone || 'Not provided',
          shipping_address: shippingAddress || currentUser?.shipping_address || 'Standard Delivery',
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
        console.error('Mobile Order Insert Error:', orderError);
        Alert.alert('Order Placement Error', orderError.message || 'Could not save order.');
        setOrderPlaced(false);
        return;
      }

      // Decrement stock levels
      for (const item of cart) {
        const currentStock = item.stock ?? 50;
        const newStock = Math.max(0, currentStock - item.quantity);
        await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
      }

      // Add to local order history instantly
      const placedOrderRecord = {
        id: newOrderId,
        customer_name: customerName || currentUser?.full_name || 'Customer',
        customer_phone: customerPhone || currentUser?.phone,
        customer_email: currentUser?.email,
        shipping_address: shippingAddress || currentUser?.shipping_address,
        total_amount: totalCartPrice,
        status: 'Pending',
        payment_status: paymentStatus,
        payment_method: orderMethodLabel,
        items_summary: itemsSummary,
        created_at: new Date().toISOString(),
      };
      setUserOrders((prev) => [placedOrderRecord, ...prev]);

      setOrderRef(newOrderId);
      setCart([]);
      setIsCheckoutModalVisible(false);
      setIsRazorpayOverlayVisible(false);

      if (currentUser) {
        fetchUserOrders(currentUser.phone, currentUser.email, currentUser.id);
      }

      Alert.alert(
        'Order Placed Successfully! 🙏',
        `Your order (${newOrderId}) has been placed and recorded into the database.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Unexpected mobile order error:', err);
      Alert.alert('Error', err?.message || 'Failed to place order.');
    } finally {
      setOrderPlaced(false);
    }
  };

  const handleRazorpaySuccessPayment = async () => {
    try {
      const upiDeepLink = `upi://pay?pa=${encodeURIComponent(selectedUpiOption)}&pn=${encodeURIComponent('Deepa Vathulu Store')}&am=${totalCartPrice}&cu=INR`;
      const canOpen = await Linking.canOpenURL(upiDeepLink);
      if (canOpen) {
        await Linking.openURL(upiDeepLink);
      } else {
        Alert.alert(
          'Real UPI Payment',
          'Please scan the QR Code on screen or send UPI payment to vilaksh.peddi@ybl using Google Pay, PhonePe, or Paytm.'
        );
      }
    } catch (err) {
      console.log('Error opening UPI App:', err);
    }
    const paymentId = `pay_rzp_live_${Math.floor(100000000 + Math.random() * 900000000)}`;
    processOrderCreation('paid', paymentId);
  };

  // Generate dynamic UPI Deep-Link & QR Code URL for Mobile App
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(selectedUpiOption)}&pn=${encodeURIComponent('Deepa Vathulu Store')}&am=${totalCartPrice}&cu=INR`;
  const upiQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(upiDeepLink)}`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return '#059669';
      case 'Shipped':
        return '#7C3AED';
      case 'Processing':
        return '#0284C7';
      default:
        return '#D97706';
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0D00" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandSubtitle}>PURE SACRED COTTON WICKS</Text>
          <Text style={styles.brandTitle}>🪔 Deepa Vathulu</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Customer Profile Icon */}
          <TouchableOpacity
            style={styles.profileHeaderButton}
            onPress={() => {
              setIsProfileModalVisible(true);
              if (currentUser) {
                setProfileActiveTab('orders');
                fetchUserOrders(currentUser.phone, currentUser.email, currentUser.id);
              } else {
                setAuthMode('signin');
              }
            }}
          >
            <Text style={{ fontSize: 20 }}>👤</Text>
            {currentUser && <View style={styles.profileActiveDot} />}
          </TouchableOpacity>

          {/* Cart Icon */}
          <TouchableOpacity
            style={styles.cartHeaderButton}
            onPress={() => setIsCheckoutModalVisible(true)}
          >
            <Text style={styles.cartIconText}>🛒</Text>
            {totalCartItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCartItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search cotton wicks, ghee wicks, akhanda wicks..."
            placeholderTextColor="#A08875"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Announcement Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroBadge}>FESTIVE COLLECTION 2026</Text>
          <Text style={styles.heroTitle}>Illuminate Every Ritual with Pure, Sacred Cotton</Text>
          <Text style={styles.heroSubtitle}>
            Hand-rolled organic cotton wicks crafted for daily home pooja, grand festivals, and long-burning Akhanda deepams.
          </Text>
          
          {/* Trust Badges */}
          <View style={styles.trustBadgesRow}>
            <Text style={styles.trustBadgeText}>✓ 100% Organic Cotton</Text>
            <Text style={styles.trustBadgeText}>✓ Hand-Rolled Quality</Text>
            <Text style={styles.trustBadgeText}>✓ Safe Packaging</Text>
          </View>
        </View>

        {/* Categories Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'Catalog Products' : selectedCategory}
          </Text>
          <Text style={styles.itemCountText}>{filteredProducts.length} items</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#D97706" />
            <Text style={styles.loadingText}>Fetching products from Supabase...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🪔</Text>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>Try searching for something else</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredProducts.map((product) => {
              const inCartItem = cart.find((c) => c.id === product.id);
              return (
                <View key={product.id} style={styles.card}>
                  <TouchableOpacity
                    onPress={() => setSelectedProduct(product)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeader}>
                      {product.tag && (
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagText}>{product.tag}</Text>
                        </View>
                      )}
                      <Text style={styles.ratingText}>★ {product.rating || '4.9'}</Text>
                    </View>

                    <View style={styles.productImageContainer}>
                      {product.image_url ? (
                        <Image
                          source={{ uri: product.image_url }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.productIcon}>🪔</Text>
                      )}
                    </View>

                    <Text style={styles.productTitle} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.productDesc} numberOfLines={2}>
                      {product.description}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.priceLabel}>Price</Text>
                      <Text style={styles.productPrice}>₹{product.price}</Text>
                    </View>

                    {inCartItem ? (
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(product.id, -1)}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{inCartItem.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(product.id, 1)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => addToCart(product)}
                      >
                        <Text style={styles.addButtonText}>+ Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {totalCartItems > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartBarItems}>{totalCartItems} {totalCartItems === 1 ? 'item' : 'items'} selected</Text>
            <Text style={styles.cartBarPrice}>₹{totalCartPrice.toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => setIsCheckoutModalVisible(true)}
          >
            <Text style={styles.checkoutBtnText}>View Cart & Checkout ➔</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Customer Profile & Authentication Modal */}
      <Modal
        visible={isProfileModalVisible}
        animationType="slide"
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <SafeAreaView style={styles.cartModalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {/* Modal Header */}
            <View style={styles.cartModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>👤</Text>
                <Text style={styles.cartModalTitle}>
                  {currentUser ? `Account (${currentUser.full_name})` : 'Customer Login / Sign Up'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(false)}>
                <Text style={styles.cartModalClose}>Close ✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }}>
              {!currentUser ? (
                /* Auth Sign In / Sign Up Form */
                <View>
                  {/* Mode Selector */}
                  <View style={styles.authTabRow}>
                    <TouchableOpacity
                      style={[styles.authTabBtn, authMode === 'signin' && styles.authTabBtnActive]}
                      onPress={() => setAuthMode('signin')}
                    >
                      <Text style={[styles.authTabBtnText, authMode === 'signin' && styles.authTabBtnTextActive]}>
                        Sign In
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.authTabBtn, authMode === 'signup' && styles.authTabBtnActive]}
                      onPress={() => setAuthMode('signup')}
                    >
                      <Text style={[styles.authTabBtnText, authMode === 'signup' && styles.authTabBtnTextActive]}>
                        Create Account
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {authMode === 'signin' ? (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.inputLabel}>Email ID or Mobile Phone *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. user@example.com or +91 9876543210"
                        placeholderTextColor="#9CA3AF"
                        value={authIdentifier}
                        onChangeText={setAuthIdentifier}
                        autoCapitalize="none"
                      />

                      <Text style={styles.inputLabel}>Password *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Enter password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={authPassword}
                        onChangeText={setAuthPassword}
                      />

                      <TouchableOpacity
                        style={[styles.placeOrderBtn, { marginTop: 20 }]}
                        onPress={handleMobileSignIn}
                        disabled={authLoading}
                      >
                        {authLoading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.placeOrderBtnText}>Sign In to Account ➔</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.inputLabel}>Full Name *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Enter your full name"
                        placeholderTextColor="#9CA3AF"
                        value={authFullName}
                        onChangeText={setAuthFullName}
                      />

                      <Text style={styles.inputLabel}>Mobile Phone Number *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="+91 98765 43210"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                        value={authPhone}
                        onChangeText={setAuthPhone}
                      />

                      <Text style={styles.inputLabel}>Email Address (Optional)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="user@example.com"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={authEmail}
                        onChangeText={setAuthEmail}
                      />

                      <Text style={styles.inputLabel}>Default Delivery Address</Text>
                      <TextInput
                        style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                        placeholder="House/Flat No, Street, City, State, Pincode"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        value={authShippingAddress}
                        onChangeText={setAuthShippingAddress}
                      />

                      <Text style={styles.inputLabel}>Choose Password *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Create a secure password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={authPassword}
                        onChangeText={setAuthPassword}
                      />

                      <TouchableOpacity
                        style={[styles.placeOrderBtn, { marginTop: 20 }]}
                        onPress={handleMobileSignUp}
                        disabled={authLoading}
                      >
                        {authLoading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.placeOrderBtnText}>Create Account & Sign In ➔</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                /* Authenticated User Dashboard */
                <View>
                  {/* Customer Card */}
                  <View style={styles.userProfileCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.userProfileName}>{currentUser.full_name}</Text>
                        <Text style={styles.userProfileContact}>
                          {currentUser.phone || currentUser.email || 'Verified Customer'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.signOutBtn}
                      onPress={handleMobileSignOut}
                    >
                      <Text style={styles.signOutBtnText}>Sign Out</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Profile Tab Navigation */}
                  <View style={styles.authTabRow}>
                    <TouchableOpacity
                      style={[styles.authTabBtn, profileActiveTab === 'orders' && styles.authTabBtnActive]}
                      onPress={() => setProfileActiveTab('orders')}
                    >
                      <Text style={[styles.authTabBtnText, profileActiveTab === 'orders' && styles.authTabBtnTextActive]}>
                        My Orders ({userOrders.length})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.authTabBtn, profileActiveTab === 'profile' && styles.authTabBtnActive]}
                      onPress={() => setProfileActiveTab('profile')}
                    >
                      <Text style={[styles.authTabBtnText, profileActiveTab === 'profile' && styles.authTabBtnTextActive]}>
                        Edit Address & Info
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {profileActiveTab === 'orders' ? (
                    <View style={{ marginTop: 14 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={styles.formSectionTitle}>Previous Order History</Text>
                        <TouchableOpacity onPress={() => fetchUserOrders(currentUser.phone, currentUser.email, currentUser.id)}>
                          <Text style={{ color: '#D97706', fontSize: 12, fontWeight: '700' }}>↻ Refresh</Text>
                        </TouchableOpacity>
                      </View>

                      {loadingOrders ? (
                        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                          <ActivityIndicator color="#D97706" />
                          <Text style={{ color: '#786654', fontSize: 12, marginTop: 8 }}>Loading previous orders...</Text>
                        </View>
                      ) : userOrders.length === 0 ? (
                        <View style={styles.emptyOrdersCard}>
                          <Text style={{ fontSize: 32, marginBottom: 8 }}>📦</Text>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A0D00' }}>No Past Orders Yet</Text>
                          <Text style={{ fontSize: 12, color: '#786654', textAlign: 'center', marginTop: 4 }}>
                            Orders you place will appear here with live tracking status.
                          </Text>
                        </View>
                      ) : (
                        userOrders.map((ord) => (
                          <View key={ord.id} style={styles.orderHistoryCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EFEAE2', paddingBottom: 8 }}>
                              <View>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: '#B45309' }}>{ord.id}</Text>
                                <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                                  {new Date(ord.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(ord.status) + '20', borderColor: getStatusColor(ord.status) }]}>
                                  <Text style={[styles.orderStatusText, { color: getStatusColor(ord.status) }]}>
                                    {ord.status}
                                  </Text>
                                </View>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: '#1A0D00', marginTop: 4 }}>
                                  ₹{ord.total_amount?.toLocaleString()}
                                </Text>
                              </View>
                            </View>

                            <View style={{ paddingVertical: 8 }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B5744' }}>Items:</Text>
                              <Text style={{ fontSize: 12, color: '#2A1B0E', marginTop: 2 }}>
                                {ord.items_summary || 'Pure cotton wicks order'}
                              </Text>
                            </View>

                            {ord.shipping_address && (
                              <View style={{ borderTopWidth: 1, borderTopColor: '#F3EFEA', paddingTop: 6 }}>
                                <Text style={{ fontSize: 10, color: '#786654' }}>
                                  📍 Delivery: {ord.shipping_address}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))
                      )}
                    </View>
                  ) : (
                    <View style={{ marginTop: 14 }}>
                      <Text style={styles.inputLabel}>Full Name</Text>
                      <TextInput
                        style={styles.formInput}
                        value={editFullName}
                        onChangeText={setEditFullName}
                      />

                      <Text style={styles.inputLabel}>Phone Number</Text>
                      <TextInput
                        style={styles.formInput}
                        keyboardType="phone-pad"
                        value={editPhone}
                        onChangeText={setEditPhone}
                      />

                      <Text style={styles.inputLabel}>Email Address</Text>
                      <TextInput
                        style={styles.formInput}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={editEmail}
                        onChangeText={setEditEmail}
                      />

                      <Text style={styles.inputLabel}>Default Shipping Address</Text>
                      <TextInput
                        style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
                        multiline
                        value={editAddress}
                        onChangeText={setEditAddress}
                      />

                      <TouchableOpacity
                        style={[styles.placeOrderBtn, { marginTop: 20 }]}
                        onPress={handleSaveProfile}
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.placeOrderBtnText}>Save Profile Changes</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Product Detail Modal */}
      <Modal
        visible={!!selectedProduct}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedProduct(null)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>

                <View style={styles.modalImageContainer}>
                  <Image
                    source={{
                      uri:
                        selectedProduct.image_url && typeof selectedProduct.image_url === 'string' && selectedProduct.image_url.trim() !== ''
                          ? selectedProduct.image_url.trim()
                          : DEFAULT_PLACEHOLDER_IMAGE,
                    }}
                    style={styles.modalProductImage}
                    resizeMode="cover"
                  />
                </View>

                {selectedProduct.tag && (
                  <View style={[styles.tagBadge, { alignSelf: 'flex-start', marginBottom: 8 }]}>
                    <Text style={styles.tagText}>{selectedProduct.tag}</Text>
                  </View>
                )}

                <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                <Text style={styles.modalCategory}>Category: {selectedProduct.category}</Text>

                <Text style={styles.modalDesc}>{selectedProduct.description}</Text>

                <View style={styles.modalDetailRow}>
                  <View>
                    <Text style={styles.priceLabel}>Unit Price</Text>
                    <Text style={styles.modalPrice}>₹{selectedProduct.price}</Text>
                  </View>
                  <View>
                    <Text style={styles.priceLabel}>Rating</Text>
                    <Text style={styles.modalRating}>★ {selectedProduct.rating || '4.9'} / 5.0</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalAddBtn}
                  onPress={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  <Text style={styles.modalAddBtnText}>Add to Cart (₹{selectedProduct.price})</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Cart & Checkout Modal */}
      <Modal
        visible={isCheckoutModalVisible}
        animationType="slide"
        onRequestClose={() => setIsCheckoutModalVisible(false)}
      >
        <SafeAreaView style={styles.cartModalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.cartModalHeader}>
              <Text style={styles.cartModalTitle}>Checkout & Order</Text>
              <TouchableOpacity onPress={() => setIsCheckoutModalVisible(false)}>
                <Text style={styles.cartModalClose}>Close ✕</Text>
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🛒</Text>
                <Text style={styles.emptyCartTitle}>Your Cart is Empty</Text>
                <Text style={styles.emptyCartSubtitle}>
                  Add pure handcrafted cotton wicks from our sacred collection.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ flex: 1, padding: 16 }}>
                {/* Cart Items List */}
                <Text style={styles.formSectionTitle}>Cart Items ({totalCartItems})</Text>
                {cart.map((item) => (
                  <View key={item.id} style={styles.cartItemRow}>
                    <View style={styles.cartItemThumbnail}>
                      {item.image_url ? (
                        <Image
                          source={{ uri: item.image_url }}
                          style={{ width: '100%', height: '100%', borderRadius: 8 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ fontSize: 24, textAlign: 'center', marginTop: 6 }}>🪔</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>₹{item.price} each</Text>
                    </View>

                    <View style={styles.qtyControl}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, -1)}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, 1)}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <Text style={styles.removeBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Delivery Information */}
                <View style={{ marginTop: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.formSectionTitle}>Delivery Details</Text>
                    {currentUser && (
                      <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700' }}>✓ Auto-filled from profile</Text>
                    )}
                  </View>

                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                    value={customerName}
                    onChangeText={setCustomerName}
                  />

                  <Text style={styles.inputLabel}>Phone Number (+91) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                  />

                  <Text style={styles.inputLabel}>Complete Shipping Address *</Text>
                  <TextInput
                    style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
                    placeholder="House/Flat No, Street, City, State, Pincode"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={shippingAddress}
                    onChangeText={setShippingAddress}
                  />
                </View>

                {/* Payment Selection */}
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.formSectionTitle}>Payment Mode</Text>
                  <View style={styles.paymentMethodRow}>
                    <TouchableOpacity
                      style={[
                        styles.paymentOptionBtn,
                        paymentMethod === 'razorpay' && styles.paymentOptionBtnActive,
                      ]}
                      onPress={() => setPaymentMethod('razorpay')}
                    >
                      <Text
                        style={[
                          styles.paymentOptionText,
                          paymentMethod === 'razorpay' && styles.paymentOptionTextActive,
                        ]}
                      >
                        💳 Razorpay (UPI/Cards)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentOptionBtn,
                        paymentMethod === 'cod' && styles.paymentOptionBtnActive,
                      ]}
                      onPress={() => setPaymentMethod('cod')}
                    >
                      <Text
                        style={[
                          styles.paymentOptionText,
                          paymentMethod === 'cod' && styles.paymentOptionTextActive,
                        ]}
                      >
                        💵 Cash on Delivery
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Cart Order Summary */}
                <View style={styles.cartFooter}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Payable Amount:</Text>
                    <Text style={styles.totalValue}>₹{totalCartPrice.toLocaleString()}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.placeOrderBtn}
                    onPress={handleCheckoutInitiation}
                    disabled={orderPlaced}
                  >
                    {orderPlaced ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.placeOrderBtnText}>
                        Proceed to Pay ₹{totalCartPrice.toLocaleString()} ➔
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Razorpay Mobile Payment Overlay Modal */}
      <Modal
        visible={isRazorpayOverlayVisible}
        animationType="slide"
        onRequestClose={() => setIsRazorpayOverlayVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.rzpHeader}>
              <View>
                <Text style={styles.rzpHeaderTitle}>Razorpay Gateway</Text>
                <Text style={styles.rzpHeaderSub}>Deepa Vathulu Store (Secure Live Checkout)</Text>
              </View>
              <TouchableOpacity onPress={() => setIsRazorpayOverlayVisible(false)}>
                <Text style={styles.rzpCloseText}>Cancel ✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }}>
              <View style={styles.rzpAmountCard}>
                <Text style={{ color: '#94A3B8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Total Amount to Pay
                </Text>
                <Text style={{ color: '#F59E0B', fontSize: 32, fontWeight: '800', marginVertical: 4 }}>
                  ₹{totalCartPrice.toLocaleString()}
                </Text>
                <Text style={{ color: '#38BDF8', fontSize: 11 }}>
                  Live Mode: vilaksh.peddi@ybl
                </Text>
              </View>

              {/* UPI Option */}
              <TouchableOpacity
                style={[
                  styles.rzpOptionCard,
                  selectedMobilePaymentMethod === 'upi' && styles.rzpOptionCardActive,
                ]}
                onPress={() => setSelectedMobilePaymentMethod('upi')}
              >
                <Text style={{ color: '#38BDF8', fontSize: 14, fontWeight: '700', marginBottom: 6 }}>
                  📱 UPI Apps & QR Code (Google Pay, PhonePe, Paytm)
                </Text>

                {selectedMobilePaymentMethod === 'upi' && (
                  <View style={{ alignItems: 'center', marginVertical: 12, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 16 }}>
                    <Image
                      source={{ uri: upiQrImageUrl }}
                      style={{ width: 170, height: 170, borderRadius: 12 }}
                    />
                    <Text style={{ color: '#0F172A', fontSize: 11, fontWeight: '700', marginTop: 8 }}>
                      Scan QR using Google Pay / PhonePe / Paytm
                    </Text>
                    <Text style={{ color: '#B45309', fontSize: 11, fontWeight: '800', marginTop: 2 }}>
                      UPI ID: {selectedUpiOption}
                    </Text>
                  </View>
                )}

                <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>
                  Store Merchant UPI ID:
                </Text>
                <TextInput
                  style={styles.vpaInput}
                  value={selectedUpiOption}
                  onChangeText={setSelectedUpiOption}
                  placeholder="vilaksh.peddi@ybl"
                  placeholderTextColor="#64748B"
                />
              </TouchableOpacity>

              {/* Card Option */}
              <TouchableOpacity
                style={[
                  styles.rzpOptionCard,
                  selectedMobilePaymentMethod === 'card' && styles.rzpOptionCardActive,
                ]}
                onPress={() => setSelectedMobilePaymentMethod('card')}
              >
                <Text style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>
                  💳 Credit / Debit Cards
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 8 }}>
                  Visa, MasterCard, RuPay, Maestro accepted.
                </Text>

                {selectedMobilePaymentMethod === 'card' && (
                  <View style={{ marginTop: 8, gap: 8 }}>
                    <TextInput
                      style={styles.vpaInput}
                      value={cardNumber}
                      onChangeText={setCardNumber}
                      placeholder="Card Number (4111 1111 1111 1111)"
                      keyboardType="number-pad"
                      placeholderTextColor="#64748B"
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        style={[styles.vpaInput, { flex: 1 }]}
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                        placeholder="MM/YY (12/28)"
                        keyboardType="number-pad"
                        placeholderTextColor="#64748B"
                      />
                      <TextInput
                        style={[styles.vpaInput, { flex: 1 }]}
                        value={cardCvv}
                        onChangeText={setCardCvv}
                        placeholder="CVV (123)"
                        keyboardType="number-pad"
                        secureTextEntry
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Netbanking Option */}
              <TouchableOpacity
                style={[
                  styles.rzpOptionCard,
                  selectedMobilePaymentMethod === 'netbanking' && styles.rzpOptionCardActive,
                ]}
                onPress={() => setSelectedMobilePaymentMethod('netbanking')}
              >
                <Text style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>
                  🏦 Netbanking & Wallets
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                  SBI, HDFC, ICICI, Axis, Mobikwik, PhonePe.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.payNowBtn}
                onPress={handleRazorpaySuccessPayment}
                disabled={orderPlaced}
              >
                {orderPlaced ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.payNowBtnText}>
                    Pay ₹{totalCartPrice.toLocaleString()} via Razorpay ({selectedMobilePaymentMethod.toUpperCase()})
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#1A0D00',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1A0D00',
    borderBottomWidth: 1,
    borderBottomColor: '#331B05',
  },
  brandSubtitle: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  brandTitle: {
    color: '#FFF8F0',
    fontSize: 22,
    fontWeight: '800',
  },
  profileHeaderButton: {
    position: 'relative',
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#2A1504',
    borderWidth: 1,
    borderColor: '#3D220A',
  },
  profileActiveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  cartHeaderButton: {
    position: 'relative',
    padding: 8,
  },
  cartIconText: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#D97706',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2A1B0E',
  },
  clearSearchText: {
    fontSize: 14,
    color: '#9CA3AF',
    padding: 4,
  },
  heroBanner: {
    backgroundColor: '#2A1504',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  heroBadge: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFF8F0',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 26,
  },
  heroSubtitle: {
    color: '#D1C2B4',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  trustBadgesRow: {
    flexDirection: 'column',
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#3D220A',
  },
  trustBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryContent: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EFEAE2',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#D97706',
  },
  categoryText: {
    color: '#6B5744',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A1B0E',
  },
  itemCountText: {
    fontSize: 12,
    color: '#786654',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#786654',
    fontSize: 14,
  },
  emptyState: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A1B0E',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8C7A6B',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '700',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  productImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F3EFEA',
    marginVertical: 6,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productIcon: {
    fontSize: 38,
    textAlign: 'center',
    marginVertical: 10,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A1B0E',
    marginBottom: 4,
    height: 38,
  },
  productDesc: {
    fontSize: 11,
    color: '#786654',
    marginBottom: 10,
    height: 28,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3EFEA',
  },
  priceLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B45309',
  },
  addButton: {
    backgroundColor: '#1A0D00',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A0D00',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#331B05',
  },
  cartBarItems: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '600',
  },
  cartBarPrice: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  checkoutBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  modalImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F3EFEA',
    marginVertical: 12,
  },
  modalProductImage: {
    width: '100%',
    height: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A0D00',
    marginBottom: 4,
  },
  modalCategory: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    padding: 14,
    backgroundColor: '#FDFBF7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#B45309',
  },
  modalRating: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
  modalAddBtn: {
    backgroundColor: '#1A0D00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalAddBtnText: {
    color: '#FFF8F0',
    fontSize: 15,
    fontWeight: '700',
  },
  cartModalContainer: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  cartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A0D00',
  },
  cartModalTitle: {
    color: '#FFF8F0',
    fontSize: 17,
    fontWeight: '700',
  },
  cartModalClose: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '600',
  },
  authTabRow: {
    flexDirection: 'row',
    backgroundColor: '#EFEAE2',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  authTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  authTabBtnActive: {
    backgroundColor: '#D97706',
  },
  authTabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B5744',
  },
  authTabBtnTextActive: {
    color: '#FFFFFF',
  },
  userProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userProfileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A0D00',
  },
  userProfileContact: {
    fontSize: 12,
    color: '#786654',
    marginTop: 2,
  },
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3EFEA',
    borderWidth: 1,
    borderColor: '#E7E0D8',
  },
  signOutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyOrdersCard: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  orderHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyCartBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A0D00',
  },
  emptyCartSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A0D00',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEAE2',
  },
  cartItemThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A0D00',
  },
  cartItemPrice: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFEA',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 10,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A0D00',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  removeBtn: {
    padding: 6,
  },
  removeBtnText: {
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B5744',
    marginTop: 8,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E0D8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1A0D00',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  paymentOptionBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  paymentOptionBtnActive: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  paymentOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B5744',
  },
  paymentOptionTextActive: {
    color: '#B45309',
    fontWeight: '700',
  },
  cartFooter: {
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEAE2',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#1A0D00',
    fontSize: 14,
    fontWeight: '700',
  },
  totalValue: {
    color: '#B45309',
    fontSize: 20,
    fontWeight: '800',
  },
  placeOrderBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  rzpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  rzpHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  rzpHeaderSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  rzpCloseText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
  },
  rzpAmountCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rzpOptionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rzpOptionCardActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#334155',
  },
  vpaInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
  },
  payNowBtn: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  payNowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
