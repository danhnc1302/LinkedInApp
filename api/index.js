require('dotenv').config();
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const nodemailer = require("nodemailer");
const moongoose = require("mongoose")

const app = express()
const PORT = 8000
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const nodemailerPassword = process.env.NODEMAILER_PASSWORD;
const nodemailerUser = process.env.NODEMAILER_USER;
const serverHostTest = process.env.SERVER_HOST_TEST;

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

moongoose
    .connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.odq4lar.mongodb.net/`)
    .then(() => {
        console.log("Connected to MongoDB")
    })
    .catch((error) => {
        console.log("Error connecting to MongoDB", error)
    })

app.listen(PORT, () => {
    console.log("Server is running on PORT:", PORT)
})

const User = require("./models/user");
const Post = require("./models/post");


//endpoint to register a user in the backend
app.post("/register", async (req, res) => {
    try {
        const { name, email, password, profileImage } = req.body
        const existingUser = await User.findOne({ email })
        //check if the email is already registered
        if (existingUser) {
            console.log("Email already registered!")
            res.status(400).json({ message: "Email already registered!" })
        }
        //create a new User
        const newUser = new User({
            name,
            email,
            password,
            profileImage
        })
        //generate the verification token
        newUser.verificationToken = crypto.randomBytes(20).toString("hex");
        //save the user to the database
        await newUser.save();
        //send the verification email to the registered user
        sendVerificationEmail(newUser.email, newUser.verificationToken)
        res.status(202).json({ message: "Registration successful.Please check your mail for verification" })
    } catch (error) {
        console.log("Error registering user", error);
        res.status(500).json({ message: "Registration failed" });
    }
})

const sendVerificationEmail = async (email, verificationToken) => {
    //Create a nodemailer transport
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or your email service provider
        auth: {
            user: nodemailerUser,
            pass: nodemailerPassword
        }
    })

    //Compose the email message
    const mailOptions = {
        from: "linkedin@gmail.com",
        to: email,
        subject: "Email Verification",
        text: `Please click the following link to verify your email : ${serverHostTest}/verify/${verificationToken}`
    }

    //Send mail
    try {
        await transporter.sendMail(mailOptions)
    } catch (error) {
        console.log("Error sending verification email", error)
    }
}

//endpoint to verify email
app.get("/verify/:token", async (req, res) => {
    try {
        const token = req.params.token
        const user = await User.findOne({ verificationToken: token })

        if (!user) {
            return res.status(404).json({ message: "Invalid verification token" });
        }
        //mark the user as verified
        user.verified = true;
        user.verificationToken = undefined;
        await user.save();
        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        res.status(500).json({ message: "Email verification failed" });
    }
})

//endpoint to login a user
app.post("/login", async (req, res) => {
    try {
        console.log(req.body)
        const { email, password } = req.body
        //check if user exists already
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" })
        }
        //check if password is correct
        if (user.password != password) {
            return res.status(401).json({ message: "Invalid password" })
        }
        const secretKey = crypto.randomBytes(32).toString("hex");
        const token = jwt.sign({ userId: user._id }, secretKey)
        res.status(200).json({ token })
    } catch (error) {
        res.status(500).json({ message: "Login failed!" })
    }
})

//endpoint user's profile
app.get("/profile/:userId", async (req, res) => {
    try {
        const userId = req.params.userId
        const user = await User.findById(userId)
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving users" });
    }
})

app.get("/users/:userId", async (req, res) => {
    try {
        const loggedInUserId = req.params.userId
        //fetch the logged-in user's connections
        const loggedInUser = await User.findById(loggedInUserId).populate(
            "connections",
            "_id"
        )
        if (!loggedInUser) {
            return res.status(400).json({ message: "User not found" });
        }
        //get the ID's of the connected users
        const connectedUserIds = loggedInUser.connections.map(
            (connection) => connection._id
        );
        //find the users who are not connected to the logged-in user Id
        const users = await User.find({
            _id: { $ne: loggedInUserId, $nin: connectedUserIds },
        });
        res.status(200).json(users);
    } catch (error) {
        console.log("Error retrieving users", error);
        res.status(500).json({ message: "Error retrieving users" });
    }
})

//send a connect request
app.post("/connection-request", async (req, res) => {
    try {
        console.log(req.body)
        const { currentUserId, selectedUserId } = req.body

        await User.findByIdAndUpdate(selectedUserId, {
            $push: { connectionRequests: currentUserId },
        });

        await User.findByIdAndUpdate(currentUserId, {
            $push: { sentConnectionRequests: selectedUserId },
        });

        res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ message: "Error creating connection request" });
    }
})

//endpoint to show all of connections
app.get("/connection-request/:userId", async (req, res) => {
    try {
        const userId = req.params.userId
        const user = await User.findById(userId)
            .populate("connectionRequests", "name email profileImage")
            .lean()

        const connectionRequests = user.connectionRequests;
        res.json(connectionRequests);
    } catch (error) {
        console.log("Error retrieving users", error);
        res.status(500).json({ message: "Error retrieving users" });
    }
})


//endpoint to accept a connection request
app.post("/connection-request/accept", async (req, res) => {
    try {
      const { senderId, recepientId } = req.body;
  
      const sender = await User.findById(senderId);
      const recepient = await User.findById(recepientId);
  
      sender.connections.push(recepientId);
      recepient.connections.push(senderId);
  
      recepient.connectionRequests = recepient.connectionRequests.filter(
        (request) => request.toString() !== senderId.toString()
      );
  
      sender.sentConnectionRequests = sender.sentConnectionRequests.filter(
        (request) => request.toString() !== recepientId.toString()
      );
  
      await sender.save();
      await recepient.save();
  
      res.status(200).json({ message: "Friend request acccepted" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });