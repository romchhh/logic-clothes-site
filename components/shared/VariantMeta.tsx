import { variantLines, type OrderVariantFields } from "@/lib/orderVariant";

export default function VariantMeta({
  item,
  labels,
  className = "",
}: {
  item: OrderVariantFields;
  labels?: { size: string; length: string; material: string; color: string };
  className?: string;
}) {
  const lines = variantLines(item, labels);
  if (!lines.length) return null;

  return (
    <ul className={className || "variant-meta"}>
      {lines.map((line) => (
        <li key={`${line.label}-${line.value}`}>
          <span className="variant-meta-label">{line.label}:</span>{" "}
          <span className="variant-meta-value">{line.value}</span>
        </li>
      ))}
    </ul>
  );
}
