// tailwind.config.js
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* … your colors & radii … */
    },
  },
  variants: {
    extend: { translate: ["group-hover"] },
  },
  plugins: [
    animate,              // ← now a real ESM import, no shims
  ],
};
