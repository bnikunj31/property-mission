const express = require("express");
const {
  addEnquiry,
  getEnquires,
  updateEnquries,
  getUnreadCount,
} = require("../controllers/Enquiry");
const router = express.Router();

router.post("/add", addEnquiry);
router.get("/fetch", getEnquires);
router.get("/readall", updateEnquries);
router.get("/unread", getUnreadCount);

module.exports = router;
