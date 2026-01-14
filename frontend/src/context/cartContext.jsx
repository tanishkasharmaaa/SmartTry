import { createContext, useContext, useEffect, useState } from "react";
import AuthContext from "./authContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { authenticated } = useContext(AuthContext);

  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!authenticated) {
      setCartItems([]);
      setCartCount(0);
      setTotalAmount(0);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
        credentials: "include",
      });

      const data = await res.json();

      setCartItems(data.cartItems || []);
      setCartCount(data.totalItems || 0);
      setTotalAmount(data.totalAmount || 0);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Sync cart on auth change
  useEffect(() => {
    fetchCart();
  }, [authenticated]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        totalAmount,
        loading,
        fetchCart, // 👈 important
        setCartItems, // optional
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
