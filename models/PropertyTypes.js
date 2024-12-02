const mongoose = require("mongoose");

const propertyTypeSchema = new mongoose.Schema({
  type_name: {
    type: String,
    unique: true,
    required: true,
  },
});

const PropertyType = mongoose.model("PropertyType", propertyTypeSchema);
module.exports = PropertyType;
