"use client";

import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppButton() {
  const phoneNumber = "5511913299115"; // 🔁 coloque seu número com DDI e DDD
  const message = "Olá! Vim pelo site e gostaria de mais informações 😊";

  const link = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full shadow-xl transition-all duration-300 hover:scale-105"
    >
      <FaWhatsapp size={24} />
      <span className="sr-only">WhatsApp</span>
    </a>
  );
}
