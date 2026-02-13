const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
    console.log("SCORING VERSION ACTIVE");

  try {
    const { githubUrl } = req.body;

    if (!githubUrl) {
      return res.status(400).json({ error: "GitHub URL is required" });
    }

    const username = githubUrl.split("github.com/")[1].split("/")[0];

    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    };

    // Fetch user profile
    const userResponse = await axios.get(
      `https://api.github.com/users/${username}`,
      { headers }
    );

    // Fetch repositories
    const repoResponse = await axios.get(
      `https://api.github.com/users/${username}/repos`,
      { headers }
    );

    const repos = repoResponse.data;

    const totalStars = repos.reduce(
      (acc, repo) => acc + repo.stargazers_count,
      0
    );

    const languages = [
      ...new Set(repos.map(repo => repo.language).filter(Boolean)),
    ];

    // =============================
    // SCORING LOGIC STARTS HERE
    // =============================

    // 1️⃣ Documentation Score
    const reposWithReadme = repos.filter(repo => repo.has_wiki || repo.description);
    const documentationScore = Math.min(
      20,
      Math.round((reposWithReadme.length / repos.length) * 20)
    );

    // 2️⃣ Activity Score (based on public repos count)
    const activityScore = Math.min(
      20,
      userResponse.data.public_repos > 10 ? 20 : userResponse.data.public_repos * 2
    );

    // 3️⃣ Impact Score (based on stars)
    const impactScore = Math.min(20, totalStars > 50 ? 20 : totalStars / 3);

    // 4️⃣ Technical Depth Score (language diversity)
    const technicalDepthScore = Math.min(20, languages.length * 4);

    const finalScore =
      documentationScore +
      activityScore +
      impactScore +
      technicalDepthScore;

    // =============================
    // FEEDBACK GENERATION
    // =============================

    const suggestions = [];

    if (documentationScore < 10) {
      suggestions.push("Improve README files with clear problem statement and tech stack.");
    }

    if (activityScore < 10) {
      suggestions.push("Increase consistency by contributing regularly to repositories.");
    }

    if (impactScore < 10) {
      suggestions.push("Build impactful projects that attract stars and engagement.");
    }

    if (technicalDepthScore < 10) {
      suggestions.push("Work with multiple technologies to demonstrate technical depth.");
    }

    res.json({
      profile: {
        name: userResponse.data.name,
        followers: userResponse.data.followers,
      },
      stats: {
        totalRepos: repos.length,
        totalStars,
        languages,
      },
      scores: {
        documentationScore,
        activityScore,
        impactScore,
        technicalDepthScore,
        finalScore,
      },
      suggestions,
    });

  } catch (error) {
    console.error("FULL ERROR:", error.response?.data || error.message);

    res.status(500).json({
      error: "Failed to fetch GitHub data",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
