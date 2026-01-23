export function PaymentActions({
  disabled,
  onCard,
  onPix,
}: {
  disabled: boolean;
  onCard: () => void;
  onPix: () => void;
}) {
  return (
    <div className="space-y-2">
      <button
        disabled={disabled}
        onClick={onCard}
        className="w-full rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        Pagar com cartão
      </button>

      <button
        disabled={disabled}
        onClick={onPix}
        className="w-full rounded-xl border border-[#D6DED9] bg-white px-5 py-3 text-sm font-semibold text-[#111111] disabled:opacity-50"
      >
        Pagar com PIX
      </button>

      <p className="text-xs text-[#5F6B64]">
        O horário será confirmado após o pagamento.
      </p>
    </div>
  );
}
