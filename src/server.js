require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 8000;


async function startServer() {

  try {

    // Connect to MongoDB first
    await connectDB();

    // Start server only after database connection
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {

    console.error("Failed to start server:", error);

    process.exit(1);
  }
}


startServer();

