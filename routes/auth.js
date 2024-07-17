require('dotenv').config();
const express = require("express");
const router = express.Router();
const db = require("../data/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

//Signup API
router.post("/signup", signup);

//Login API
router.post("/login", login);

async function signup(req, res, next) {
  console.log("Entering signup");
  try {
    let { username, password, name, address, state, city, pincode, mobile_no, email } = req.body;
    let token = req.headers.authorization;
    let active = req.body.active || true;
    let created = Date.now();
    
    // Check Authorization whether the user who is registering dealer is admin or not.
    jwt.verify(token, JWT_SECRET, async function(err, decodedUsername) {
      // If not authorized.
      if (err || decodedUsername !== globals.ADMIN_USERNAME) {
        return res.status(401).json({ error: "Invalid Token" });
      }
      
      try {
        // Check username exists in db or not
        let userObj = await db.findUserInDb(username);
        console.log('userObj: ', userObj);
        if (!userObj) {
          // Encrypt the Password
          let encryptedPassword = await bcrypt.hash(password, 10);

          let createUserOptions = { 
            username, password: encryptedPassword, name, address,
            state, city, pincode, mobile_no, email, active, created
          }

          // Create the user in DB
          await db.createUserInDb(createUserOptions);
          res.status(201).json({ username, name,  message: "User created successfully" });
        } else {
          res
          .status(406)
          .json({ message: `username: ${username} already exists` });
        }
      }
      catch (err) {
        next(err);
      }
    });
  }
  catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  console.log("Entering login");
  try {
    //Extract fields from body
    let { username, password } = req.body;

    //check username exists in db or not
    let userObj = await db.findUserInDb(username);
    if (userObj) {
      // Check password is correct or not
      let isValid = await bcrypt.compare(password, userObj.password);
      if (isValid) {

        if (userObj.active) {
          // Get token
          userObj.token = await jwt.sign(username, JWT_SECRET);;
          
          delete userObj._id;
          delete userObj.password;
          res.status(200).json(userObj);
        } else {
          // User is deactivated and is not authorized.
          res.status(403).json({ message: "Your account is deactivated. Please contact admin." });
        }
      } else {
        res.status(401).json({ message: "Incorrect Password" });
      }
    } else {
      res.status(404).json({ error: "username does not exists" });
    }
  }
  catch (err) {
    next(err);
  }
}

module.exports = router;
