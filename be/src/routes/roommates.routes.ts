import { Router, Response } from "express";
import { RoommateProfile, User } from "../models";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// GET /api/roommates - List public roommate profiles
router.get("/", async (req, res: Response) => {
  try {
    const { university, page = 1, limit = 20 } = req.query;

    const query: Record<string, any> = { isPublic: true };
    if (university) query.university = university;

    const skip = (Number(page) - 1) * Number(limit);

    const [profiles, total] = await Promise.all([
      RoommateProfile.find(query)
        .populate("userId", "fullName avatarUrl isVerified university")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RoommateProfile.countDocuments(query),
    ]);

    res.json({
      profiles,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get roommates error:", error);
    res.status(500).json({ error: "Failed to get roommate profiles" });
  }
});

// GET /api/roommates/my - Get current user's profile
router.get("/my", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let profile = await RoommateProfile.findOne({ userId: req.userId });

    if (!profile) {
      // Create empty profile if not exists
      profile = new RoommateProfile({ userId: req.userId });
      await profile.save();
    }

    res.json({ profile });
  } catch (error) {
    console.error("Get my profile error:", error);
    res.status(500).json({ error: "Failed to get your profile" });
  }
});

// PUT /api/roommates/my - Update current user's profile
router.put("/my", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await RoommateProfile.findOneAndUpdate(
      { userId: req.userId },
      { $set: req.body },
      { new: true, upsert: true },
    );

    res.json({ message: "Profile updated", profile });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// POST /api/roommates/match - Find matching roommates
router.post(
  "/match",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const myProfile = await RoommateProfile.findOne({ userId: req.userId });
      if (!myProfile || !myProfile.preferences) {
        res.status(400).json({ error: "Please complete your quiz first" });
        return;
      }

      // Get all public profiles except current user
      const profiles = await RoommateProfile.find({
        userId: { $ne: req.userId },
        isPublic: true,
      }).populate("userId", "fullName avatarUrl isVerified university");

      // Calculate match scores
      const matches = profiles.map((profile) => {
        let score = 0;
        let matchingTraits: string[] = [];

        const myPrefs = myProfile.preferences as Record<string, string>;
        const theirPrefs = profile.preferences as Record<string, string>;

        // Compare each preference
        for (const key of Object.keys(myPrefs)) {
          if (
            myPrefs[key] &&
            theirPrefs[key] &&
            myPrefs[key] === theirPrefs[key]
          ) {
            score += 1;
            matchingTraits.push(key);
          }
        }

        // Normalize score to percentage
        const totalPrefs = Object.keys(myPrefs).filter(
          (k) => myPrefs[k],
        ).length;
        const percentage =
          totalPrefs > 0 ? Math.round((score / totalPrefs) * 100) : 0;

        return {
          profile,
          score: percentage,
          matchingTraits,
        };
      });

      // Sort by score descending
      matches.sort((a, b) => b.score - a.score);

      res.json({ matches: matches.slice(0, 20) });
    } catch (error) {
      console.error("Match error:", error);
      res.status(500).json({ error: "Failed to find matches" });
    }
  },
);

// GET /api/roommates/:id - Get specific profile
router.get("/:id", async (req, res: Response) => {
  try {
    const profile = await RoommateProfile.findById(req.params.id).populate(
      "userId",
      "fullName avatarUrl isVerified university",
    );

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    if (!profile.isPublic) {
      res.status(403).json({ error: "Profile is private" });
      return;
    }

    res.json({ profile });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

export default router;
