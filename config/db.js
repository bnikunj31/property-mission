const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB is live");
  } catch (err) {
    console.error("Unable to connect to the Database: ", err);
  }
};

module.exports = connectDB;
