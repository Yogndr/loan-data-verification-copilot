require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User");

const users = [
  {
    name: "Data Operator",
    email: "operator@loan-copilot.com",
    password: "Operator@123",
    role: "DATA_OPERATOR",
  },
  {
    name: "Reviewer",
    email: "reviewer@loan-copilot.com",
    password: "Reviewer@123",
    role: "REVIEWER",
  },
  {
    name: "Data Consumer",
    email: "consumer@loan-copilot.com",
    password: "Consumer@123",
    role: "DATA_CONSUMER",
  },
];

const createUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    for (const user of users) {
      const existingUser = await User.findOne({
        email: user.email,
      });

      if (existingUser) {
        console.log(`User already exists: ${user.email}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(
        user.password,
        10
      );

      await User.create({
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      });

      console.log(`Created: ${user.email}`);
    }

    console.log("Users setup complete");

    await mongoose.disconnect();
  } catch (error) {
    console.error("User setup failed:", error);
    process.exit(1);
  }
};

createUsers();