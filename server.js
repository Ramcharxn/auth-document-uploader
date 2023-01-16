const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const Report = require("./models/reportModel");
const User = require("./models/userModel");
require("dotenv").config();
const authMiddleware = require("./authMiddleware");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const client = require("twilio")(process.env.ACC_SID, process.env.AUTH_TOKEN);
// const fast2sms = require('fast-two-sms')
// const nexmo = require("nexmo");


// change setInterval time stamp
// change report.smsDetails value 

setInterval(() => {
  helperSMSfunc();
}, 3600000);

const helperSMSfunc = async () => {
  const allReport = await Report.find();
  const user = await User.find();

  allReport
    .filter(
      (report) =>
        report.verified == "Pending" &&
        (new Date() - report.createdAt) / 3600000 > report.smsDetails + 48
    )
    .map(async (report) => {
      sendTwilioSMS(user[0].phoneNumber, report.name, report.description)
      report.smsDetails = report.smsDetails + 48;


      // sendVonageSMS(user[0].phoneNumber, report.name, report.description);
      await report.save();
    });
};

const sendTwilioSMS = (phoneNumber, name, description) => {
  // console.log(phoneNumber, name, description)
  client.messages
    .create({
      body: `Record ${name} with description ${description} has not been verified yet`,
      to: `+91${phoneNumber}`,
      from: process.env.TWILIO_NUM,
    })
    .then((msg) => console.log(msg))
    .catch((err) => console.log(err));
};

// async function sendVonageSMS(phoneNumber, name, description) {
//   const vonage = new nexmo({
//     apiKey: process.env.API_K,
//     apiSecret: process.env.API_S,
//   });

//   const from = "Vonage APIs";
//   const to = `91${phoneNumber}`;
//   const text = `Record ${name} with description ${description} has not been verified yet`;

//   console.log(from, text, to);

//   try {
//     // vonage.message
//     //   .sendSms(from, to, text)
//     //   .then((res) => console.log(res))
//     //   .catch((err) => console.log(err));
//   } catch (err) {
//     console.log(err);
//   }
// }

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("db connected"))
  .catch((err) => console.log("error in db", err));

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.send("why r you hear? :)");
});

app.post("/saveReport", authMiddleware, async (req, res) => {
  try {
    const { name, date, verified, file, description } = req.body;
    const report = new Report({
      name,
      date,
      verified,
      file,
      description,
    });
    report.updateCount = 1;

    await report.save();

    res.send("Report stored successfully");
  } catch (err) {
    res.send(err);
  }
});

app.get("/getReport", authMiddleware, async (req, res) => {
  try {
    const allReport = await Report.find();
    allReport.reverse();

    res.send(allReport);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ user: req.body.user });

    if (!user) {
      return res.status(200).send({ message: "Invalid User", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Invalid password", success: false });
    } else {
      const token = jwt.sign({ user }, process.env.JWT_SECRET_KEY, {
        expiresIn: "1d",
      });
      res
        .status(200)
        .send({ message: "Login successful", success: true, token: token });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error logging in", success: false, error });
  }
});

app.post("/updateProfile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);

    const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Password Incorrect", success: false });
    } else {
      if (req.body.user != "") {
        user.user = req.body.user;
      }

      if (req.body.password != "") {
        const password = req.body.user.password;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user.password = hashedPassword;
      }

      if (req.body.phoneNumber != "") {
        user.phoneNumber = req.body.phoneNumber;
      }

      await user.save();

      const token = jwt.sign({ user }, process.env.JWT_SECRET_KEY, {
        expiresIn: "1d",
      });
      res.status(200).send({
        message: "Credentials updated successful",
        success: true,
        token: token,
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error logging in", success: false, error });
  }
});

// app.post("/NewUser", async (req, res) => {
//   try {
//     const {user, phoneNumber, role} = req.body
//     var password = req.body.password;
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     var password = hashedPassword;
//     console.log(user)
//     const newUser = new User({user, password, phoneNumber, role})
//     await newUser.save()
//     res.send("new User Created")
//   } catch (error) {
//     console.log(error);
//     res
//       .status(500)
//       .send({ message: "Error logging in", success: false, error });
//   }
// });

app.post("/deleteReport", authMiddleware, async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.body.id);

    res.status(200).send({ message: "Deleted successful", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error deleting record", success: false, error });
  }
});

app.post("/UpdateRecord", authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.body.id);
    // report.verified = req.body.verified;
    report.file = req.body.file;
    report.updateCount = report.updateCount + 1;

    if (req.body.name != "") {
      report.name = req.body.name;
    }

    if (req.body.verified == "") {
      report.verified = "Pending";
    } else {
        report.verified = req.body.verified;
        report.lastUpdate = new Date().getDate() + '-' + (new Date().getMonth() + 1) + '-' +  new Date().getFullYear()
      }

    if (req.body.date != "") {
      report.date = req.body.date;
    }

    if (req.body.remarks != "") {
      report.remarks = req.body.remarks;
    }

    if (req.body.description != "") {
      report.description = req.body.description;
    }

    
    if (req.body.clarification != "") {
      report.clarification = req.body.clarification;
    }

    await report.save();

    res.status(200).send({ message: "Update successful", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error deleting user", success: false, error });
  }
});

// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static('client/build'));

//   // app.get('*', (req,res) => res.sendFile(path.resolve(__dirname, 'client', 'build','index.html')));
// }

// app.get("/send_msg_twilio", (req, res) => {
//   sendTextMessage();
//   res.send("helo msg");
// });

// const sendTextMessage = () => {
//   client.messages
//     .create({
//       body: "hello from web",
//       to: "+916382944040",
//       from: "+12058135028",
//     })
//     .then((msg) => console.log(msg))
//     .catch((err) => console.log(err));
// };

// app.post("/send_msg_fast2sms",async (req, res) => {

//   var options = {authorization : process.env.API_KEY , message : 'YOUR_MESSAGE_HERE' ,  numbers : ['6382944040']}

//   const response = await fast2sms.sendMessage(options)

//     console.log(response)
//   res.send("helo msg");
// });

// const sendTextMessageFast2Sms = async() => {

//     .then((res) => console.log(res, 'here'))
//     .catch((err) => console.log(err));
// };

app.listen(process.env.PORT || 5000, () =>
  console.log("listening to port 5000")
);
