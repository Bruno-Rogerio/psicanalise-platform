"use client";

import { FaEnvelope } from "react-icons/fa";

export default function EmailButton() {
  const email = "contato@raizaconvento.com.br"; // 🔁 troque pelo seu e-mail
  const subject = "Contato pelo site";
  const body = "Olá, vim pelo site e gostaria de mais informações.";

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  return (
    <a
      href={mailtoLink}
      className="fixed bottom-6 right-24 z-50 flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-full shadow-xl transition-all duration-300 hover:scale-105"
    >
      <FaEnvelope size={20} />
      <span className="hidden sm:inline font-medium">Enviar e-mail</span>
    </a>
  );
}
