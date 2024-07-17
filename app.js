require('dotenv').config()
const express = require("express");
const auth = require("./routes/auth.js")
const cors = require("cors")
const cars = require("./routes/cars.js")
const user = require("./routes/user.js")
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL }));

//API Routes for user login and signup
app.use('/auth',auth);

//API Routes for rooms
app.use('/user',user);

//API Routes for users
app.use('/carppf',cars);

app.use((err, req, res, next)=>{
  console.log("Error: ", err.message);
  res.status(500).json({
    error: err.message,
    message: "Internal error",
  });
  next(err);
})

app.listen(PORT, () => {
  console.log("Server listening at:", PORT);
});
