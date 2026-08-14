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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase';

LogBox.ignoreAllLogs();

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

  // Form Details
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
  }, []);

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
        customer_name: customerName,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
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
        console.warn('Retrying mobile order insert without optional columns:', orderError.message);
        const safePayload = {
          id: newOrderId,
          customer_name: customerName,
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
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
        console.error('Mobile Supabase Order Insert Error:', orderError);
        Alert.alert('Order Placement Error', orderError.message || JSON.stringify(orderError));
        setOrderPlaced(false);
        return;
      }

      // Decrement stock
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

      setOrderRef(newOrderId);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setShippingAddress('');
      setIsRazorpayOverlayVisible(false);
      setIsCheckoutModalVisible(false);

      const paymentMsg =
        paymentMethod === 'razorpay'
          ? `Razorpay Payment Completed (${selectedMobilePaymentMethod.toUpperCase()} Ref: ${refId})`
          : 'Cash on Delivery Selected';

      Alert.alert(
        'Order Placed Successfully! 🙏',
        `Order Ref: ${newOrderId}\n${paymentMsg}\nYour sacred cotton wicks will be dispatched soon!`
      );
    } catch (err) {
      console.error('Unexpected Mobile Checkout Error:', err);
      Alert.alert('Unexpected Error', err?.message || 'Failed to place order.');
    } finally {
      setOrderPlaced(false);
    }
  };

  const handleRazorpaySuccessPayment = () => {
    const paymentId = `pay_rzp_live_${Math.floor(100000000 + Math.random() * 900000000)}`;
    processOrderCreation('paid', paymentId);
  };

  // Generate dynamic UPI Deep-Link & QR Code URL for Mobile App
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(selectedUpiOption)}&pn=${encodeURIComponent('Deepa Vathulu Store')}&am=${totalCartPrice}&cu=INR`;
  const upiQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(upiDeepLink)}`;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0D00" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandSubtitle}>PURE SACRED COTTON WICKS</Text>
          <Text style={styles.brandTitle}>🪔 Deepa Vathulu</Text>
        </View>
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

                    <Text style={styles.productIcon}>🪔</Text>

                    <Text style={styles.productTitle} numberOfLines={2}>
                      {product.name}
                    </Text>

                    <Text style={styles.productDesc} numberOfLines={2}>
                      {product.description}
                    </Text>

                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.priceLabel}>Price</Text>
                        <Text style={styles.productPrice}>₹{product.price}</Text>
                        {product.stock !== undefined && (
                          <Text style={{ fontSize: 9, color: '#9CA3AF' }}>Stock: {product.stock}</Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => addToCart(product)}
                      >
                        <Text style={styles.addButtonText}>
                          {inCartItem ? `Added (${inCartItem.quantity})` : '+ Add'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Cart Summary Bar at Bottom */}
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

                <View style={styles.modalHeaderIcon}>
                  <Text style={{ fontSize: 60 }}>🪔</Text>
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
                <Text style={{ fontSize: 50, marginBottom: 12 }}>🛒</Text>
                <Text style={styles.emptyCartTitle}>Your Cart is Empty</Text>
                <Text style={styles.emptyCartSubtitle}>Browse our organic cotton wicks to add items.</Text>
              </View>
            ) : (
              <ScrollView
                style={{ flex: 1, padding: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.formSectionTitle}>Cart Items</Text>
                {cart.map((item) => (
                  <View key={item.id} style={styles.cartItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
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
                      onPress={() => removeFromCart(item.id)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Delivery Details Inputs */}
                <Text style={[styles.formSectionTitle, { marginTop: 16 }]}>Delivery Details</Text>
                
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter customer name"
                  placeholderTextColor="#A08875"
                  value={customerName}
                  onChangeText={setCustomerName}
                  returnKeyType="next"
                />

                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#A08875"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  returnKeyType="next"
                />

                <Text style={styles.inputLabel}>Shipping Address *</Text>
                <TextInput
                  style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="Enter complete shipping address and pincode"
                  multiline
                  placeholderTextColor="#A08875"
                  value={shippingAddress}
                  onChangeText={setShippingAddress}
                />

                {/* Payment Method Selector */}
                <Text style={[styles.formSectionTitle, { marginTop: 16 }]}>Payment Method</Text>
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
                      💳 Razorpay (UPI/Card)
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

                {/* Submit Button */}
                <View style={styles.cartFooter}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>₹{totalCartPrice.toLocaleString()}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.placeOrderBtn, orderPlaced && { backgroundColor: '#059669' }]}
                    onPress={handleCheckoutInitiation}
                    disabled={orderPlaced}
                  >
                    {orderPlaced ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.placeOrderBtnText}>
                        Place Order (₹{totalCartPrice.toLocaleString()})
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Full Screen Razorpay Mobile WebCheckout Gateway Overlay */}
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
                <Text style={styles.rzpHeaderTitle}>Razorpay Secure Payment</Text>
                <Text style={styles.rzpHeaderSub}>Deepa Vathulu Store • Test Mode</Text>
              </View>
              <TouchableOpacity onPress={() => setIsRazorpayOverlayVisible(false)}>
                <Text style={styles.rzpCloseText}>Cancel ✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1, padding: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.rzpAmountCard}>
                <Text style={{ color: '#94A3B8', fontSize: 12, textTransform: 'uppercase' }}>Amount to Pay</Text>
                <Text style={{ color: '#F59E0B', fontSize: 32, fontWeight: '900', marginTop: 4 }}>
                  ₹{totalCartPrice.toLocaleString()}
                </Text>
                <Text style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>
                  UPI: {selectedUpiOption}
                </Text>
              </View>

              <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
                Select Payment Method
              </Text>

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
  modalHeaderIcon: {
    alignItems: 'center',
    marginVertical: 12,
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
    fontSize: 18,
    fontWeight: '700',
  },
  cartModalClose: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '600',
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
