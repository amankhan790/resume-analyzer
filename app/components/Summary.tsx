import React from "react";
import ScoreGauge from "./ScoreGauge";
import ScoreBadge from "./ScoreBadge";

const Category = ({ title, score }: { title: string; score: number }) => {
  const textColor =
    score > 70
      ? "text-green-500"
      : score > 49
        ? "text-yellow-500"
        : "text-red-500";
  return (
    <div className="resume-summary">
      <div className="category">
        <div className="flex flex-row gap-2 items-center justify-center">
          <p className="text-2xl">{title}</p>
          <ScoreBadge score={score} />
        </div>
      </div>
      <p className="text-2xl">
        <span className={textColor}>{score}</span>
      </p>
    </div>
  );
};

const Summary = ({ feedback }: { feedback: Feedback | null }) => {
  return (
    <div className="bg-white rounded-2xl w-full shadow-md">
      <div className="flex items-center p-4 gap-8 flex-row">
        <ScoreGauge score={feedback?.overallScore || 0} />

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Your Resume Score</h2>
          <p className="text-sm text-gray-500">
            The Score is calculated based on variable listed below.
          </p>
        </div>
      </div>

      <Category
        title="Tone & Style"
        score={feedback?.toneAndStyle.score || 0}
      />
      <Category title="Content" score={feedback?.content.score || 0} />
      <Category title="Structure" score={feedback?.structure.score || 0} />
      <Category title="Skills" score={feedback?.skills.score || 0} />
    </div>
  );
};

export default Summary;
