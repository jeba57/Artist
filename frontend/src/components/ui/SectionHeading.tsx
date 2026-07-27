import { cx } from "@/lib/format";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
}) {
  return (
    <div className={cx("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className={cx("label-text", light ? "text-stone/50" : "text-terracotta")}>{eyebrow}</p>
      <h2 className={cx("mt-3 font-display text-3xl sm:text-4xl leading-tight", light ? "text-stone" : "text-ink")}>
        {title}
      </h2>
      {description && (
        <p className={cx("mt-3 text-[15px] leading-relaxed", light ? "text-stone/65" : "text-ink-soft")}>
          {description}
        </p>
      )}
    </div>
  );
}
