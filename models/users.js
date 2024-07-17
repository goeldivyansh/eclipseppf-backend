const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  mobile_no: { type: String, required: true },
  email: { type: String, required: true },
  active: { type: Boolean, required: true },
  created: { type: Number, required: true }
});

module.exports = mongoose.model("Users", userSchema);
