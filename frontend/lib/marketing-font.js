import { Poppins } from "next/font/google";

// Shared across every public marketing page (not the authenticated app's
// own --font-main/Inter) so the whole site uses one consistent, rounder
// display face instead of each page loading its own copy.
export const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
