import { Cart } from "@/data/model/cart";
import Cookies from "js-cookie";

const CART_COOKIE_KEY = "vg_furniture_cart";
const LEGACY_CART_COOKIE_KEY = "bakeryCartItems";

export const getCartCookies = () => {
  const current = Cookies.get(CART_COOKIE_KEY);
  const legacy = Cookies.get(LEGACY_CART_COOKIE_KEY);
  if (current === undefined && legacy !== undefined) {
    try {
      const cartItems = JSON.parse(legacy) as Cart[];
      Cookies.set(CART_COOKIE_KEY, legacy);
      Cookies.remove(LEGACY_CART_COOKIE_KEY);
      return cartItems;
    } catch {
      Cookies.remove(LEGACY_CART_COOKIE_KEY);
      return [] as Cart[];
    }
  }
  if (current === undefined) {
    return [] as Cart[];
  }
  const cartItems = JSON.parse(current) as Cart[];
  return cartItems;
};

export const setCartCookies = (cart: Cart[]): void => {
  Cookies.set(CART_COOKIE_KEY, JSON.stringify(cart));
};
