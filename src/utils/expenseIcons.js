import {
  Baby,
  Banknote,
  CarFront,
  CircleDollarSign,
  CircleEllipsis,
  Coffee,
  Droplets,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Plane,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Utensils,
  Wifi,
  Zap,
} from "lucide-react";

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function getExpenseIcon(category = "", description = "") {
  const categoryText = normalize(category);
  const detailText = normalize(description);
  const text = `${categoryText} ${detailText}`;

  if (/insurance|takaful|insurans/.test(text)) return ShieldCheck;
  if (/electric|electricity|tnb|power|letrik/.test(text)) return Zap;
  if (/water|air bill|syabas/.test(text)) return Droplets;
  if (/internet|wifi|broadband|unifi|data plan/.test(text)) return Wifi;
  if (/phone|mobile|telco|prepaid|postpaid/.test(text)) return Smartphone;
  if (/petrol|fuel|diesel|minyak kereta/.test(text)) return Fuel;
  if (/transport|grab|car|parking|toll|vehicle|kereta/.test(text)) return CarFront;
  if (/school|tuition|education|yuran|kelas|book|buku/.test(text)) return GraduationCap;
  if (/health|clinic|doctor|ubat|pharmacy|hospital|medical/.test(text)) return HeartPulse;
  if (/food|makan|hunger|naim|breakfast|lunch|dinner|restaurant|pizza|coffee shop|cafe/.test(text)) return Utensils;
  if (/coffee|kopi/.test(text)) return Coffee;
  if (/grocery|groceries|market|barang dapur|supermarket/.test(text)) return ShoppingCart;
  if (/kids|anak|baby|child/.test(text)) return Baby;
  if (/shopping|wife req|shopee|lazada|mall|clothes|baju/.test(text)) return ShoppingBag;
  if (/home|house|rent|rumah|furniture/.test(text)) return House;
  if (/game|gaming|movie|cinema|netflix|playstation|entertainment/.test(text)) return Gamepad2;
  if (/travel|flight|hotel|holiday|vacation/.test(text)) return Plane;
  if (/gift|present|donation|sedekah/.test(text)) return Gift;
  if (/bill|bills|utility|payment|bayaran/.test(text)) return Banknote;
  if (/other|uncategorized|lain/.test(text)) return CircleEllipsis;

  return CircleDollarSign;
}
