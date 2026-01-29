import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta "Acolhimento Sereno"
        warm: {
          50: "#FFFDFB",
          100: "#FDF8F6", // Fundo principal - creme rosado
          200: "#F5F0ED",
          300: "#E8E0DC", // Bordas/divisores - bege neutro
          400: "#D4C8C2",
          500: "#C4A484", // Destaque primário - terracota suave
          600: "#A68B6A",
          700: "#8B7355",
          800: "#6F5C44",
          900: "#3D3535", // Texto principal - marrom escuro
        },
        soft: {
          50: "#FDFCFE",
          100: "#F5F3F8", // Fundo secundário - lavanda suave
          200: "#EBE7F0",
          300: "#DED8E6",
          400: "#C9C0D6",
          500: "#B5A8C6",
          600: "#9A8AB0",
          700: "#7F6D99",
          800: "#665783",
          900: "#4D406D",
        },
        rose: {
          50: "#FDF9F9",
          100: "#F9EFEF",
          200: "#F0DFDF",
          300: "#E5CCCC",
          400: "#D4A5A5", // Destaque secundário - rosa antigo
          500: "#C28F8F",
          600: "#A97777",
          700: "#8F6161",
          800: "#754C4C",
          900: "#5C3939",
        },
        sage: {
          50: "#F6F8F6",
          100: "#ECF0EC",
          200: "#D9E1D9",
          300: "#C2CEC2",
          400: "#A8B8A8",
          500: "#8B9A8B", // Botão principal - verde sálvia
          600: "#728272",
          700: "#5C695C",
          800: "#475247",
          900: "#343D34",
        },
        muted: {
          DEFAULT: "#7A7070", // Texto secundário - cinza acolhedor
          light: "#9A9090", // Texto terciário
          foreground: "#3D3535", // Texto escuro para fundos claros
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(61, 53, 53, 0.08), 0 4px 16px -4px rgba(61, 53, 53, 0.04)",
        "soft-lg":
          "0 4px 16px -4px rgba(61, 53, 53, 0.1), 0 8px 32px -8px rgba(61, 53, 53, 0.08)",
        "soft-xl":
          "0 8px 24px -8px rgba(61, 53, 53, 0.12), 0 16px 48px -16px rgba(61, 53, 53, 0.1)",
        glow: "0 0 40px -10px rgba(212, 165, 165, 0.3)",
      },
      transitionDuration: {
        "400": "400ms",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
