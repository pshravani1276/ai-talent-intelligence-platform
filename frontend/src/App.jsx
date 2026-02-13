import { useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./App.css";

ChartJS.register(CategoryScale, LinearScale, BarElement);

function App() {
  const [githubUrl, setGithubUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("candidate");
  const reportRef = useRef();

  const analyzeProfile = async () => {
    if (!githubUrl) return alert("Enter GitHub URL");

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/analyze", {
          githubUrl,
        }
      );
      setResult(response.data);
      setLoading(false);
    } catch (error) {
      alert("Error analyzing profile");
      setLoading(false);
    }
  };

  const getRank = (score) => {
    if (score < 30) return "Beginner 🚀";
    if (score < 55) return "Pro 💻";
    return "Elite Developer 👑";
  };

  const getHireStatus = (score) => {
    if (score > 60) return "✅ Strong Hire Recommendation";
    if (score > 40) return "⚖ Moderate – Consider Further Review";
    return "❌ Needs Improvement Before Hiring";
  };

  const getConfidenceLevel = (data) => {
    const { totalRepos, totalStars, languages } = data.stats;

    let score = 0;
    if (totalRepos > 8) score++;
    if (totalStars > 30) score++;
    if (languages.length > 3) score++;

    if (score >= 3) return "High AI Confidence";
    if (score === 2) return "Medium AI Confidence";
    return "Developing Profile";
  };

  const generateAISummary = (data) => {
    const { totalRepos, totalStars, languages } = data.stats;
    const score = data.scores.finalScore;

    let feedback = "";

    if (score > 60) {
      feedback +=
        "This profile demonstrates strong technical expertise and community impact. ";
    } else if (score > 40) {
      feedback +=
        "This profile shows good development potential with room for strategic improvement. ";
    } else {
      feedback +=
        "This profile is in early growth stage and can significantly improve with focused development efforts. ";
    }

    if (totalStars < 20) {
      feedback +=
        "Increasing impactful projects can boost visibility and engagement. ";
    }

    if (languages.length < 3) {
      feedback +=
        "Expanding the tech stack will demonstrate stronger technical depth. ";
    }

    if (totalRepos < 5) {
      feedback +=
        "Consistency in contributions will improve overall professional presence. ";
    }

    return feedback;
  };

  const generateGrowthPlan = () => {
    return [
      "Week 1: Improve README documentation and project descriptions.",
      "Week 2: Build one impactful project solving a real-world problem.",
      "Week 3: Learn and integrate a new technology into a project.",
      "Week 4: Optimize GitHub profile branding and contribution consistency.",
    ];
  };

  const downloadPDF = async () => {
    const canvas = await html2canvas(reportRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 180, 0);
    pdf.save("GitHub-Analysis-Report.pdf");
  };

  const chartData =
    result && {
      labels: ["Repos", "Stars", "Followers"],
      datasets: [
        {
          label: "GitHub Stats",
          data: [
            result.stats.totalRepos,
            result.stats.totalStars,
            result.profile.followers,
          ],
          backgroundColor: ["#3b82f6", "#8b5cf6", "#22d3ee"],
        },
      ],
    };

  const scorePercent =
    result && (result.scores.finalScore / 80) * 100;

  return (
    <div className="container">
      <h1 className="title">
        AI-Powered Talent Intelligence Platform 🚀
      </h1>

      {/* Role Toggle */}
      <div className="roleToggle">
        <button
          className={role === "candidate" ? "activeRole" : ""}
          onClick={() => setRole("candidate")}
        >
          Candidate
        </button>
        <button
          className={role === "recruiter" ? "activeRole" : ""}
          onClick={() => setRole("recruiter")}
        >
          Recruiter
        </button>
      </div>

      {/* Input */}
      <div className="inputSection">
        <input
          type="text"
          placeholder="Enter GitHub Profile URL"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
        />
        <button onClick={analyzeProfile}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {loading && <div className="loader"></div>}

      {result && (
        <motion.div
          ref={reportRef}
          className="card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <img
            src={`https://github.com/${githubUrl
              .split("github.com/")[1]
              .split("/")[0]}.png`}
            alt="avatar"
            className="avatar"
          />

          <h2>{result.profile.name}</h2>
          <h3 className="rank">
            {getRank(result.scores.finalScore)}
          </h3>

          {/* Global Badge */}
          {result.scores.finalScore > 60 && (
            <div className="globalBadge">
              🌍 Global-Ready Developer
            </div>
          )}

          {/* Circular Score */}
          <div className="circleWrapper">
            <svg className="progressRing" width="150" height="150">
              <circle
                stroke="#334155"
                strokeWidth="10"
                fill="transparent"
                r="60"
                cx="75"
                cy="75"
              />
              <circle
                stroke="url(#gradient)"
                strokeWidth="10"
                fill="transparent"
                r="60"
                cx="75"
                cy="75"
                strokeDasharray="377"
                strokeDashoffset={
                  377 - (377 * scorePercent) / 100
                }
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="scoreText">
              {result.scores.finalScore}/80
            </div>
          </div>

          {/* Recruiter Mode */}
          {role === "recruiter" && (
            <>
              <h3 className="hireStatus">
                {getHireStatus(result.scores.finalScore)}
              </h3>

              <div className="confidenceBox">
                <h4>AI Confidence Level</h4>
                <p>{getConfidenceLevel(result)}</p>
              </div>

              <div className="scoreBreakdown">
                <h4>Detailed Evaluation Metrics</h4>
                <p>Documentation: {result.scores.documentationScore}</p>
                <p>Activity: {result.scores.activityScore}</p>
                <p>Impact: {result.scores.impactScore}</p>
                <p>Technical Depth: {result.scores.technicalDepthScore}</p>
              </div>
            </>
          )}

          {/* Chart */}
          <div className="chartSection">
            <Bar data={chartData} />
          </div>

          {/* Candidate Mode */}
          {role === "candidate" && (
            <>
              <div className="aiSummary">
                <h4>AI Portfolio Review</h4>
                <p>{generateAISummary(result)}</p>
              </div>

              <div className="growthPlan">
                <h4>30-Day AI Growth Plan</h4>
                <ul>
                  {generateGrowthPlan().map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Ethics */}
          <div className="ethicsBox">
            <h4>Bias-Free AI Evaluation</h4>
            <p>
              This system evaluates only technical GitHub metrics
              to ensure skill-based, unbiased hiring decisions.
            </p>
          </div>

          {/* Future Vision */}
          <div className="futureBox">
            <h4>Enterprise Vision</h4>
            <p>Bulk Candidate Screening (Coming Soon)</p>
          </div>

          <button className="pdfBtn" onClick={downloadPDF}>
            Download PDF Report
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default App;
