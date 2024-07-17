require('dotenv').config();
const express = require("express");
const router = express.Router();
const db = require("../data/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const globals = require("../globals.js");

router.post("/:username/warranty", registerCarPpfWarranty);

router.get("/:username/warranty", getCarPpfWarranty);

router.get("/:username/getMyCars", getMyCarsPpfInfo);

router.get("/getAllCars", getAllCarsPpfInfo);

function registerCarPpfWarranty(req, res, next) {
  console.log("Entering registerCarPpfWarranty");
  let token = req.headers.authorization;
  let { quantity, roll_no, customer, car_details } = req.body;
  let username = req.body.username || req.params.username;

  console.log('req.body', req.body);

  jwt.verify(token, JWT_SECRET, async function(err, decodedUsername) {
    //If not valid
    if (err || decodedUsername !== username) {
      return res.status(401).json({ error: "Invalid Token" });
    }
    
    try {
      // Check car exists in db or not
      let carObj = await db.findCarInDb({roll_no: roll_no});
        
      if (!carObj) {
        // insert photos in s3 first.

        let timestamp = Date.now();
        // Insert db record.
        let createOptions = {
          roll_no: roll_no,
          application_date: timestamp,
          quantity: quantity,
          dealer_username: username,
          customer: customer,
          car_details: {
            car_no: car_details.car_no,
            mfd_year: car_details.mfd_year,
            model_name: car_details.model_name,
            photos: {
              link1: 'https://cdn-icons-png.flaticon.com/512/5087/5087579.png',
              link2: 'https://cdn-icons-png.flaticon.com/512/5087/5087579.png',
              link3: 'https://cdn-icons-png.flaticon.com/512/5087/5087579.png',
              link4: 'https://cdn-icons-png.flaticon.com/512/5087/5087579.png',
              link5: 'https://cdn-icons-png.flaticon.com/512/5087/5087579.png',
              link6: 'https://cdn-icons-png.flaticon.com/512/5087/5087579.png'
            }
          },
          warranty_card: 'https://drive.google.com/file/d/1AsZsaxVh7sauBmVmiJfRM9Dv0AididFh/view',
          created: timestamp,
         }
        await db.createWrappedCarRecordInDb(createOptions);
        res.status(201).json({ message: "Car PPF warranty registered successfully" });
      } else {
        console.log(`registerCarPpfWarranty | err: Car number: ${car_details.car_no} OR Roll No: ${car_details.roll_no} already exists in db.`);
        res
        .status(406)
        .json({ message: `Car number: ${car_details.car_no} already exists in db.` });
      }
    } catch (err) {
      next(err);
    }
  });
}

function getCarPpfWarranty(req, res, next) {
  console.log("Entering getSingleCarPpfInfo");
  let username = req.params.username;
  let token = req.headers.authorization;
  let roll_no = req.query.roll_no;
  let car_no = req.query.car_no;
  console.log('query: ', req.query);
  console.log('params: ', req.params);

  jwt.verify(token, JWT_SECRET, async function(err, decodedUsername) {
    // If not valid
    if (err || decodedUsername !== username) {
      return res.status(401).json({ error: "Invalid Token" });
    }
    
    try {
      let getOptions = { roll_no, car_no };
      let wrappedCarObj = await db.findCarInDb(getOptions);

      if (!wrappedCarObj) {
        return res.status(404).json({ error: "Warranty doesn't exists for rollno / carno" });
      }

      // Validate whether the car is of that specific dealer or not
      if (username !== globals.ADMIN_USERNAME && username !== wrappedCarObj.dealer_username) {
        return res.status(401).json({ error: "Dealer is not authorized to view the car." });
      }
      delete wrappedCarObj._id;
      res.status(200).json(wrappedCarObj);
    }
    catch (err) {
      next(err);
    }
  });
}

function getAllCarsPpfInfo(req, res, next)  {
  console.log("Entering getAllCarsPpfInfo");
  let token = req.headers.authorization;
  let startdate = Number(req.query.startdate);
  let enddate = Number(req.query.enddate);
  try {
    // Verify User
    jwt.verify(token, JWT_SECRET, async function(err, decodedUsername) {
      //If not valid
      if (err || decodedUsername !== globals.ADMIN_USERNAME) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      try {
        console.log('startdate: ', startdate);
        console.log('enddate: ', enddate);
        let carDetails = await db.getCarsOfSpecificPeriodFromDb({startdate: startdate, enddate: enddate});
        console.log('carDetails: ', carDetails);
        console.log('carDetails len: ', carDetails.length);
        if (carDetails) {
          res.status(200).json(carDetails);
        } else {
          res.status(404).json({ error: "No car present for specific duration" });
        }
      } catch (err) {
        next(err);
      }

    });
  }
  catch (err) {
    next(err);
  }
}

function getMyCarsPpfInfo(req, res, next) {
  console.log("Entering getMyCarsPpfInfo");
  let dealer_username = req.params.username;
  let token = req.headers.authorization;
  // let { startdate, enddate } = req.query;
  let startdate = Number(req.query.startdate);
  let enddate = Number(req.query.enddate);

  console.log('startdate', startdate);
  console.log('enddate', enddate);
  console.log('dealer_username', dealer_username);
  console.log('token', token);
  try {
    // Verify User
    jwt.verify(token, JWT_SECRET, async function(err, decodedUsername) {
      //If not valid
      if (err || (decodedUsername !== dealer_username && decodedUsername !== globals.ADMIN_USERNAME)) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      try {
        // Find user details from db
        let carDetails = await db.getCarsOfSpecificPeriodFromDb({dealer_username, startdate, enddate});
        console.log('carDetails.length: ', carDetails.length);
        if (carDetails.length) {
          res.status(200).json(carDetails);
        } else {
          res.status(404).json({ error: "No car present for specific duration" });
        }
      } catch (err) {
        next(err);
      }

    });
  }
  catch (err) {
    next(err);
  }
}

// function getCurrentDateEpoch() {
//   // Get current epoch time in milliseconds
//   let currentEpochTime = Date.now();

//   // Create a new Date object using the current epoch time
//   let dateObject = new Date(currentEpochTime);

//   // Set the time to midnight (00:00:00) for the current date
//   dateObject.setHours(0, 0, 0, 0);

//   // Get epoch time in milliseconds for midnight of the current date
//   let dateEpochTime = dateObject.getTime();

//   return dateEpochTime;
// }

module.exports = router;
