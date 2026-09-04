import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { toMinorUnits } from "../lib/format";
import type { MenuItem, Restaurant } from "../types/restaurant";

const CART_STORAGE_KEY = "tomato.cart";

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

interface CartState {
  restaurant: Restaurant | null;
  lines: CartLine[];
}

interface CartContextValue extends CartState {
  itemCount: number;
  subtotalMinor: number;
  addItem: (restaurant: Restaurant, menuItem: MenuItem) => boolean;
  replaceRestaurantAndAdd: (
    restaurant: Restaurant,
    menuItem: MenuItem,
  ) => void;
  decrementItem: (menuItemId: number) => void;
  setQuantity: (menuItemId: number, quantity: number) => void;
  removeItem: (menuItemId: number) => void;
  clearCart: () => void;
}

const EMPTY_CART: CartState = {
  restaurant: null,
  lines: [],
};

const CartContext = createContext<CartContextValue | null>(null);

function readInitialCart(): CartState {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return EMPTY_CART;
  }

  try {
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed.lines)) {
      throw new Error("Invalid cart");
    }
    return parsed;
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return EMPTY_CART;
  }
}

export function CartProvider({ children }: PropsWithChildren) {
  const [cart, setCart] = useState<CartState>(readInitialCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = useCallback(
    (restaurant: Restaurant, menuItem: MenuItem): boolean => {
      if (cart.restaurant && cart.restaurant.id !== restaurant.id) {
        return false;
      }

      setCart((current) => {
        const existing = current.lines.find(
          (line) => line.menuItem.id === menuItem.id,
        );

        return {
          restaurant: current.restaurant ?? restaurant,
          lines: existing
            ? current.lines.map((line) =>
                line.menuItem.id === menuItem.id
                  ? { ...line, quantity: Math.min(line.quantity + 1, 99) }
                  : line,
              )
            : [...current.lines, { menuItem, quantity: 1 }],
        };
      });

      return true;
    },
    [cart.restaurant],
  );

  const replaceRestaurantAndAdd = useCallback(
    (restaurant: Restaurant, menuItem: MenuItem) => {
      setCart({
        restaurant,
        lines: [{ menuItem, quantity: 1 }],
      });
    },
    [],
  );

  const setQuantity = useCallback((menuItemId: number, quantity: number) => {
    setCart((current) => {
      if (quantity <= 0) {
        const lines = current.lines.filter(
          (line) => line.menuItem.id !== menuItemId,
        );
        return {
          restaurant: lines.length > 0 ? current.restaurant : null,
          lines,
        };
      }

      return {
        ...current,
        lines: current.lines.map((line) =>
          line.menuItem.id === menuItemId
            ? { ...line, quantity: Math.min(quantity, 99) }
            : line,
        ),
      };
    });
  }, []);

  const decrementItem = useCallback(
    (menuItemId: number) => {
      const line = cart.lines.find((item) => item.menuItem.id === menuItemId);
      if (line) {
        setQuantity(menuItemId, line.quantity - 1);
      }
    },
    [cart.lines, setQuantity],
  );

  const removeItem = useCallback((menuItemId: number) => {
    setCart((current) => {
      const lines = current.lines.filter(
        (line) => line.menuItem.id !== menuItemId,
      );
      return {
        restaurant: lines.length > 0 ? current.restaurant : null,
        lines,
      };
    });
  }, []);

  const clearCart = useCallback(() => setCart(EMPTY_CART), []);

  const itemCount = useMemo(
    () => cart.lines.reduce((total, line) => total + line.quantity, 0),
    [cart.lines],
  );

  const subtotalMinor = useMemo(
    () =>
      cart.lines.reduce(
        (total, line) =>
          total + toMinorUnits(line.menuItem.price) * line.quantity,
        0,
      ),
    [cart.lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      ...cart,
      itemCount,
      subtotalMinor,
      addItem,
      replaceRestaurantAndAdd,
      decrementItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [
      addItem,
      cart,
      clearCart,
      decrementItem,
      itemCount,
      removeItem,
      replaceRestaurantAndAdd,
      setQuantity,
      subtotalMinor,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
