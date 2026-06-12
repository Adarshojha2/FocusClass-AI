const AppBlocking = require("../models/appBlocking");

exports.logBlockedApp = async (req, res) => {
  try {
    const { appName, classSessionId, reason, durationSeconds } = req.body;

    if (!appName) {
      return res.status(400).json({
        message: "appName is required",
      });
    }

    const appBlock = await AppBlocking.create({
      user: req.user,
      appName,
      classSession: classSessionId,
      reason: reason || "Distraction",
      durationSeconds,
      blockedAt: new Date(),
    });

    res.status(201).json({
      message: "App blocking logged successfully",
      appBlock,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.unblockApp = async (req, res) => {
  try {
    const { blockingId } = req.params;

    const appBlock = await AppBlocking.findByIdAndUpdate(
      blockingId,
      {
        unblockedAt: new Date(),
      },
      { new: true }
    );

    if (!appBlock) {
      return res.status(404).json({
        message: "App blocking record not found",
      });
    }

    res.json({
      message: "App unblocked",
      appBlock,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getBlockedApps = async (req, res) => {
  try {
    const { classSessionId } = req.query;

    let query = { user: req.user };
    if (classSessionId) {
      query.classSession = classSessionId;
    }

    const blockedApps = await AppBlocking.find(query).sort({ blockedAt: -1 });

    const stats = {
      totalBlocked: blockedApps.length,
      totalDurationSeconds: blockedApps.reduce(
        (sum, app) => sum + (app.durationSeconds || 0),
        0
      ),
      uniqueApps: [...new Set(blockedApps.map((app) => app.appName))],
    };

    res.json({
      blockedApps,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
