interface BiasChipProps {
  label: string;
}

export function BiasChip({ label }: BiasChipProps) {
  // Color mapping for different bias types
  const getChipColor = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes("gender")) return "bg-purple-100 text-purple-700 border-purple-300";
    if (lowerLabel.includes("age")) return "bg-blue-100 text-blue-700 border-blue-300";
    if (lowerLabel.includes("race") || lowerLabel.includes("racial")) return "bg-red-100 text-red-700 border-red-300";
    if (lowerLabel.includes("tone")) return "bg-orange-100 text-orange-700 border-orange-300";
    if (lowerLabel.includes("socioeconomic")) return "bg-green-100 text-green-700 border-green-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${getChipColor(label)}`}>
      #{label.replace(/\s+/g, "")}
    </span>
  );
}
