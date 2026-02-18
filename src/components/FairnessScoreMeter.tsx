interface FairnessScoreMeterProps {
  score: number;
}

export function FairnessScoreMeter({ score }: FairnessScoreMeterProps) {
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Black and white only - use opacity to indicate score
  const getColor = () => {
    if (score >= 80) return "#000000";
    if (score >= 50) return "#666666";
    return "#999999";
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2}>
          {/* Background circle */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + " " + circumference}
            style={{
              strokeDashoffset,
              transition: "stroke-dashoffset 0.5s ease",
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl text-foreground">
            {score}%
          </div>
          <div className="text-xs text-muted-foreground">Fairness</div>
        </div>
      </div>
    </div>
  );
}
