const cookieParser = require("cookie-parser");

// Middleware to handle cookies
const cookieMiddleware = (req, res, next) => {
  // Check if a specific cookie exists
  if (!req.cookies.userData) {
    console.log("No userData cookie found, setting default value.");

    // Set a default cookie
    res.cookie("userData", JSON.stringify({ user: "Guest" }), {
      httpOnly: true, // Prevent client-side JavaScript access
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
  } else {
    console.log("User data from cookies:", JSON.parse(req.cookies.userData));
  }

  next();
};

module.exports = cookieMiddleware;
