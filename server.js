const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const Report = require("./reportModel");
const User = require("./userModel");
const SMS = require("./smsModel");
require("dotenv").config();
const authMiddleware = require("./authMiddleware");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// const client = require("twilio")(process.env.ACC_SID, process.env.AUTH_TOKEN);
// const fast2sms = require('fast-two-sms')

const nexmo =require('nexmo')


const helperSMSfunc = async(report) => {
  const users = await SMS.find()

    users.map(user => {
      sendSMS(user.phoneNumber, report )
    })
    

}


async function sendSMS(phoneNumber, report) {
  const vonage = new nexmo({
    apiKey: process.env.API_K,
    apiSecret: process.env.API_S
  })
  
    const from = "Vonage APIs"
    const to = `91${phoneNumber}`
    const text = `Record ${report.name} with description ${report.description} has not been verified yet`

    await vonage.message.sendSms(from, to, text)
  
}

// app.post("/msg_vonage",(req,res) => {

//   sendSMS();
//   res.send('helo world')
// })


mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("db connected"))
  .catch((err) => console.log("error in db", err));

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.post("/saveReport", authMiddleware, async (req, res) => {
  try {
    const { name, date, fileName, verified, fileType, file, description } =
      req.body;
    const report = new Report({
      name,
      date,
      fileName,
      verified,
      fileType,
      file,
      description,
    });

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

    allReport.filter(report => ((new Date() - report.createdAt)/3600000) > (report.smsDetails+48)).map(async report => {
      // console.log( (new Date() - report.createdAt)/3600000 ,0.001 )
      // console.log(report)
      report.smsDetails = report.smsDetails+48
      await report.save()
      helperSMSfunc(report)
    })
    
    res.send(allReport);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

app.post("/register", authMiddleware, async (req, res) => {
  try {
    const operatorExist = await User.findOne({ user: req.body.user });
    if (operatorExist) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;

    const newUser = new User(req.body);
    await newUser.save();
    res
      .status(200)
      .send({ message: "User created successfully", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error creating user", success: false, error });
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

      await user.save();

      const token = jwt.sign({ user }, process.env.JWT_SECRET_KEY, {
        expiresIn: "1d",
      });
      res
        .status(200)
        .send({
          message: "Credeentials updated successful",
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

app.post("/UpdateRecord", authMiddleware, async (req, res) => {
  console.log("in");
  try {
    const report = await Report.findById(req.body.item._id);
    report.verified = req.body.verified;
    report.remarks = req.body.remarks;

    await report.save();

    res.status(200).send({ message: "Update successful", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error deleting user", success: false, error });
  }
});

app.post("/delete_user", authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.body.id);
    res.status(200).send({ message: "User Deleted successful", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error deleting user", success: false, error });
  }
});

app.get("/all_users", authMiddleware, async (req, res) => {
  try {
    const user = await User.find();
    res.status(200).send({ success: true, data: user });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error logging in", success: false, error });
  }
});

app.get("/all_sms_user", authMiddleware, async (req, res) => {
  try {
    const smsUser = await SMS.find();
    res.status(200).send({ success: true, data: smsUser });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error logging in", success: false, error });
  }
});

app.post("/delete_sms_user", authMiddleware, async (req, res) => {
  try {
    await SMS.findByIdAndDelete(req.body.id);
    res.status(200).send({ message: "User Deleted successful", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error deleting user", success: false, error });
  }
});

app.post("/new_sms_user", authMiddleware, async (req, res) => {
  try {
    const operatorExist = await SMS.findOne({
      phoneNumber: req.body.phoneNumber,
    });
    console.log(operatorExist);
    if (operatorExist) {
      return res
        .status(200)
        .send({ message: "Phone Number already exists", success: false });
    }
    const newSMS = new SMS(req.body);
    await newSMS.save();
    res
      .status(200)
      .send({ message: "User created successfully", success: true });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error creating user", success: false, error });
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
