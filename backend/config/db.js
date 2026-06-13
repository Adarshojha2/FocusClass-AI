const dns = require("dns");
const mongoose = require("mongoose");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    console.log("DNS servers:", dns.getServers());
    console.log("URI CHECK:");
    console.log(mongoUri);

    console.log("Connecting MongoDB...");

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    console.log("MongoDB Connected");

    // Seed Principal account if it does not exist
    const User = require("../models/user");
    const bcrypt = require("bcryptjs");
    const principalEmail = "principalfocosclass@gmail.com";
    const principalExists = await User.findOne({ email: principalEmail });
    if (!principalExists) {
      const hashedPassword = await bcrypt.hash("principal", 10);
      await User.create({
        name: "Principal Administration",
        email: principalEmail,
        password: hashedPassword,
        role: "principal",
        phone: "+1 555 0199",
        lifeProfile: "Principal and Chief Executive Administrator of FocusClass AI Academy.",
        isDashboardActive: true,
        photoUploaded: true,
        photoUrl: ""
      });
      console.log("Seeded default Principal user: principalfocosclass@gmail.com / principal");
    }

  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;