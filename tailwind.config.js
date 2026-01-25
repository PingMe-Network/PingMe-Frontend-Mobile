/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#DF40A3", // Neon Orchid
        secondary: "#00E5FF", // Aqua Tech
        background: {
          light: "#FFF9FA", // Rosy White - Nền Sáng
          dark: "#1C191B", // Midnight Velvet - Nền Tối
        },
        "brand-pink": "#FF4D94",
        "aqua-tech": "#00E5FF",
        "rosy-white": "#FFF9FA",
        "midnight-velvet": "#1C191B",
      },
      borderRadius: {
        'custom': '20px',
      }
    },
  },
  plugins: [],
};
