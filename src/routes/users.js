import express from "express";
import auth from '../lib/auth.js'
import mongodb from 'mongodb';
import petModel from "../models/pet.js"
import userModel from "../models/user.js";
import Ajv from "ajv";
import S from 'fluent-json-schema';
import bcrypt from "bcrypt";
const router = express.Router();

const ajv = new Ajv();
const updateSchema = S.object()
    .prop('password', S.string().required())
    .prop('email', S.string().required())
    .prop('firstname', S.string().required())
    .prop('lastname', S.string().required())
    .prop('phonenumber', S.string().required())
    .prop('bio', S.string().required())
    .valueOf();
const validateUpdate = ajv.compile(updateSchema);

router.get("/:id",async (req, res) => {
    console.log(req.params.id)
    let user = await userModel.findOne({_id: new mongodb.ObjectId(req.params.id)}).select("-password")
    res.send(user)
  })
  
  router.put("/:id",auth,async (req, res) => {
    const valid = validateUpdate(req.body);
    if (!valid) {
       res.status(406).send("error: invalid request format");
    }
    else
    {
      let emailExists = await userModel.findOne({email: req.body.email})
      if(emailExists)
      {
        res.status(406).send("error: email already taken");
      }
      else
      {
        
        bcrypt.hash(req.body.password, 10,  async(err, hash) => {
          console.log(req.decoded.id)
          await userModel.updateOne({ _id: new mongodb.ObjectId(req.decoded.id) }, {password: hash, email: req.body.email, firstname: req.body.firstname, lastname:req.body.lastname, phonenumber: req.body.phonenumber, bio: req.body.bio});
          res.send('ok')
        })
      }
    }
  })
  
  router.post("/",auth,async (req, res) => {
    let user = await userModel.findOne({_id: new mongodb.ObjectId(req.decoded.id)})
    if (user.isAdmin)
    {
      let users = await userModel.find({}).select("-password");
      res.send(users)
    }
    else
    {
      res.send('permission denied');
    }
  })
  
  router.get("/:id/full",async (req, res) => {
      let resArr = []
      let user = await userModel.findOne({_id: new mongodb.ObjectId(req.params.id)}).select("-password")
      resArr.push(user)
      let pets = await petModel.find({currentOwner: req.params.id})
      resArr.push(pets)
      res.send(resArr)
  
  
  })
  
  router.post("/petsaved/:id",auth,async (req, res) => {
    let user = await userModel.findOne({_id: new mongodb.ObjectId(req.decoded.id)})
    console.log(user.savedPets)
    res.send(user.savedPets.includes(req.params.id))
  
  })
  
  router.post("/:id/ch",auth,async (req, res) => {
    let user = await userModel.findOne({_id: new mongodb.ObjectId(req.decoded.id)})
    res.send(user.isAdmin)
  })




export default router;