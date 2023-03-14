import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import Ajv from "ajv";
import S from 'fluent-json-schema';
import mongoose from "mongoose"
import userModel from "./models/user.js";
import petModel from "./models/pet.js"
import jwt from 'jsonwebtoken';
import fs from 'fs';
import multer from 'multer';
import uploadToCloudinary from './lib/cloudinary.js'
import pets from './routes/pets.js'
import users from './routes/users.js'
const app = express();
app.use(cors({
  origin: 'http://localhost:3000'
}));

  // Connecting to the database
mongoose
  .connect("mongodb://localhost:27017/pets_project", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to database");
  })
  .catch((error) => {
    console.log("database connection failed. exiting now...");
    console.error(error);
    process.exit(1);
  });


const uploadedFilesFolderName = 'uploads';
if (!fs.existsSync(uploadedFilesFolderName)) {
  fs.mkdirSync(uploadedFilesFolderName);
}
app.use('/' + uploadedFilesFolderName, express.static(uploadedFilesFolderName));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./" + uploadedFilesFolderName)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });
   
    
app.post('/image', upload.single('image'), async function (req, res) {
  // ...validate authorized user
  // req.file is the name of your file in the form above, here 'user_image'
  // req.body will hold the text fields, if there were any
  //const fileUrl = encodeURI('http://localhost:3000' + "/" + req.file.path);
  // save fileUrl to user record in the db
  //res.send({ fileUrl });
  const result = await uploadToCloudinary(req.file.path);
  fs.unlinkSync(req.file.path); // remove file from disk
  const fileUrl = result.secure_url;
  // save fileUrl to user record in the db
  res.send({ fileUrl });

  });
     
app.use(express.json());
const ajv = new Ajv();

const signupSchema = S.object()
    .prop('email', S.string().required())
    .prop('password', S.string().required())
    .prop('passwordAgain', S.string().required())
    .prop('firstname', S.string().required())
    .prop('lastname', S.string().required())
    .prop('phonenumber', S.string().required())
    .valueOf();
const validatSignup = ajv.compile(signupSchema);

const loginSchema = S.object()
    .prop('email', S.string().required())
    .prop('password', S.string().required())
    .valueOf();
const validateLogin = ajv.compile(loginSchema);

app.post("/signup",async (req, res) => {
  const valid = validatSignup(req.body);
  if (!valid) {
     res.status(406).send("error: invalid request format");
  }
  else if (req.body.password != req.body.passwordAgain) {
      res.status(406).send("error: passwords aren't the same");
  }
  else {
    let emailExists = await userModel.findOne({email: req.body.email})
    if(emailExists)
    {
      res.status(406).send("error: email already taken");
    }
    else
    {
      bcrypt.hash(req.body.password, 10,  (err, hash) => {
        let newUser = { email: req.body.email, password: hash, firstname: req.body.firstname, lastname: req.body.lastname, phonenumber: req.body.phonenumber, isAdmin: false, bio:""};
        userModel.create(newUser);
        res.send("OK");
      });
    }
  }
});

app.post("/login",async (req, res) => {
  const valid = validateLogin(req.body);
  if (!valid) {
     res.status(406).send("error: invalid request format");
  }
  else
  {
    let userExists = await userModel.findOne({email: req.body.email, })
    if (userExists)
    {
      console.log(userExists.password, typeof userExists.password)
      bcrypt.compare(req.body.password, userExists.password, function (err, result) {
        if (result) {
          const token = jwt.sign({ id: userExists._id.toString() }, "superbigsecretasdfasdfasdfasf");
          res.send({ token, 'id':userExists._id.toString(), 'firstname':userExists.firstname, 'lastname':userExists.lastname, 'email': userExists.email, 'phone':userExists.phonenumber, 'bio':userExists.bio})
        }
        else
        {
          res.send("error: wrong username and/or password")     
        }
      })
    }
    else
    {
      res.send("error: wrong username and/or password")
    }
  }
});

app.post("/spet",async (req, res) => {
  let pets = await petModel.find(req.body);
  res.send(pets)
})

app.use('/pet', pets);
app.use('/user', users);

app.listen(8080, () => {
  console.log(`app listening on port 8080...`);
});