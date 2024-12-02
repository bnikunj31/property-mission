const mongoose = require("mongoose");

const EnquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  date_submitted: {
    type: Date,
    default: Date.now,
  },
});

const Enquiry = mongoose.model("Enquiry", EnquirySchema);
module.exports = Enquiry;
