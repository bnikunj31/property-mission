const express = require("express");
const {
  signup,
  login,
  getOTP,
  verifyOTP,
  fetchUsers,
  updateUser,
  deleteUser,
  forgotPass,
  updatePass,
  googleSignin,
} = require("../controllers/Users");
const { userValidatorRules } = require("../validators/UserValidator");
const hashedPassword = require("../middlewares/passwordHashing");
const router = express.Router();

router.post("/signup", userValidatorRules, hashedPassword, signup);
router.post("/googleSignin", googleSignin);
router.route("/otp").post(verifyOTP);
router.post("/login", login);
router.route("/fetch").get(fetchUsers);
router.route("/:id").patch(updateUser).delete(deleteUser);
router.route("/forgot").post(forgotPass);
router.route("/updatePassword").post(updatePass);

module.exports = router;
