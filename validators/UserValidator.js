const { body } = require("express-validator");

const userValidatorRules = [
  body("name", "Name should contain at least 3 alphabets")
    .trim()
    .isLength({ min: 3 })
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Name should contain only alphabets and spaces"),
  body("phone", "Phone should contain at least 10 digits")
    .isMobilePhone()
    .isLength({ min: 10 }),
  body("email", "Invalid Email").isEmail(),
  body("password", "Password must contain at least 8 characters.").isLength({
    min: 8,
  }),
  body("confirm_password").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

module.exports = { userValidatorRules };
