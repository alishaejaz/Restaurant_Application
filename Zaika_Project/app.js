const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/riders", require("./routes/riderRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
// Expose restaurant routes
app.use("/api/restaurants", require("./routes/restaurantRoutes"));

const clientBuildPath = path.join(__dirname, "client", "dist");

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get(/^\/(?!api).*/, (req, res) => {
    return res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API Running...");
  });
}

const PORT = process.env.PORT || 5000;

const seedDemoUsers = async () => {
  const demoUsers = [
    { name: "Demo Customer", email: "customer@flavorloop.pk", password: "Customer123!", role: "user" },
    { name: "Demo Owner", email: "owner@flavorloop.pk", password: "Owner123!", role: "owner" },
    { name: "Demo Rider", email: "rider@flavorloop.pk", password: "Rider123!", role: "rider" },
    { name: "Demo Admin", email: "admin@flavorloop.pk", password: "Admin123!", role: "admin" },
  ];

  for (const demoUser of demoUsers) {
    const existingUser = await User.findOne({ email: demoUser.email });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(demoUser.password, 10);
      await User.create({
        name: demoUser.name,
        email: demoUser.email,
        password: hashedPassword,
        role: demoUser.role,
      });
    }
  }
};

if (require.main === module) {
  connectDB()
    .then((connected) => {
      if (connected) {
        return seedDemoUsers();
      }

      return null;
    })
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = app;
