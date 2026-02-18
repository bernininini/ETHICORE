interface BiasChipProps {
  label: string;
}

export function BiasChip({ label }: BiasChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border border-border bg-muted text-foreground">
      #{label.replace(/\s+/g, "")}
    </span>
  );
}
