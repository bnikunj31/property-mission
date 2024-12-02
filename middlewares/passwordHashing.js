const bcrypt = require("bcryptjs");

const hashedPassword = async (req, res, next) => {
  const { password } = req.body;
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    req.body.password = hashedPassword;
    next();
  } catch (err) {
    res.status(500).json({ message: "Encryption Error" });
  }
};

module.exports = hashedPassword;
