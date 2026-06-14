import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const storageKey = 'zaika-cart';

const loadCart = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  const stored = window.localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : [];
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const addItem = (product) => {
    setItems((current) => {
      const match = current.find((entry) => entry._id === product._id);

      if (match) {
        return current.map((entry) => (
          entry._id === product._id ? { ...entry, quantity: entry.quantity + 1 } : entry
        ));
      }

      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setItems((current) => current
      .map((entry) => (entry._id === productId ? { ...entry, quantity } : entry))
      .filter((entry) => entry.quantity > 0));
  };

  const removeItem = (productId) => {
    setItems((current) => current.filter((entry) => entry._id !== productId));
  };

  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, entry) => sum + entry.price * entry.quantity, 0);
    const delivery = subtotal > 0 ? 60 : 0;
    const tax = Math.round(subtotal * 0.05);

    return {
      subtotal,
      delivery,
      tax,
      total: subtotal + delivery + tax,
      itemCount: items.reduce((sum, entry) => sum + entry.quantity, 0),
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        ...totals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);