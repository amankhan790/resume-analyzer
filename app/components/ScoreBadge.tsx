import React from "react";

type ScoreBadgeProps = {
  score: number;
};

const ScoreBadge = ({ score }: ScoreBadgeProps) => {
  const { label, className } =
    score > 70
      ? { label: "Strong", className: "bg-badge-green text-badge-green-text" }
      : score > 49
        ? {
            label: "Good Start",
            className: "bg-badge-yellow text-badge-yellow-text",
          }
        : { label: "Needs Work", className: "bg-badge-red text-badge-red-text" };

  return (
    <div className={`score-badge ${className}`}>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
};

export default ScoreBadge;