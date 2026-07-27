export const formatPrice = (amount: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
