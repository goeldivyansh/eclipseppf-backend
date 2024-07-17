require('dotenv').config();
const express = require("express");
const router = express.Router();
const db = require("../data/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const globals = require("../globals.js");

// Update User Details (also password)
router.put("/:username/updateUser", updateUserInfo);

// Get dealer info along with pssword  
router.get("/:username/getUser", getUserInfo);

function updateUserInfo(req, res, next) {
  console.log("Entering updateUserInfo");
  let username = req.params.username;
  let token = req.headers.authorization;
  let { password, name, address, mobile_no, email, active } = req.body;

  // Verify User
  jwt.verify(token, JWT_SECRET, async function(err, decodedUsername) {
    //If not valid
    if (err || decodedUsername != globals.ADMIN_USERNAME) {
      return res.status(401).json({ error: "Invalid Token" });
    }

    try {
      let encryptedPassword;
      if (password) { encryptedPassword = await bcrypt.hash(password, 10); }

      let updateOptions = {
        name, address, mobile_no, email, active,
        username, password: encryptedPassword
      }

      let result = await db.updateUserInDb(updateOptions)
      if (result.matchedCount === 0) {
        res.status(404).json({
          username: username, message: "User not found in db.",
        });
      } else {
        res.status(200).json({
          username: username, name, address, mobile_no, email, active,
          message: "User updated successfully.",
        });
      }
    }
    catch (err) {
      res
        .status(400)
        .json({ error: err.message, message: "Internal error" });
    }
  });
  
}

function getUserInfo(req, res, next) {
  console.log("Entering getUserInfo");
  let dealer_username = req.params.username;
  let token = req.headers.authorization;

  try {
    // Check Authorization whether the user is admin or not.
    jwt.verify(token, JWT_SECRET, async function(err, decodedUsername) {
      // If not authorized.
      if (err || decodedUsername !== globals.ADMIN_USERNAME) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      // If authorized, Find user details from db
      let userObj = await db.findUserInDb(dealer_username);
      if (userObj) {
        delete userObj._id;
        delete userObj.password;
        console.log('userObj: ', userObj);
        res.status(200).json(userObj);
      } else {
        res.status(404).json({ error: "Dealer does not exists" });
      }
    });
  }
  catch (err) {
    next(err);
  }
}

module.exports = router;
