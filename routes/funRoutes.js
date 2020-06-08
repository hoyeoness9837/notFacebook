const { join } = require("path");
const axios = require("axios");
const { User } = require("../models");
const router = require("express").Router();

// let isLogin = false

router.get("/", (req, res) => {
  let temp = JSON.stringify(req.headers.cookie);
  temp = temp.split(/[.,\/ ;"]/);
  let found = false;
  temp.forEach((item) => {
    if (item.includes("name")) {
      console.log(item);
      let temp2 = item.split("=");
      if (temp2[1] !== "undefined") {
        found = true;
      }
    }
  });

  if (found) {
    res.sendFile(join(__dirname, "../public/profile.html"));
  } else {
    res.sendFile(join(__dirname, "../public/main.html"));
  }
});

module.exports = router;
