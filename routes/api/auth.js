const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/Users')
const jwt = require('jsonwebtoken');
const {check , validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const config = require('config');
//@route:   GET api/auth
//@desc:    Test Route
//@access:  Public

router.get('/',auth,async (req,res)=> {
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(err){
        console.error(err.message);
        res.status(500).json({msg: "Server Error is auth.js APIs"})
    }
});


//@route:   POST api/auth
//@desc:    
//@access:  Public

//Express validation to check if form details are valid
router.post('/',[
    check('email','Valid Email is Required').isEmail(),
    check('password','Enter a password').exists()
],
async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    //Extracting the necessary variables
    const {email, password} = req.body;
    
    try{
        //Verify if user exists in the database
        let user = await User.findOne({email});

        if(!user){
           return res.status(400).json({error: [{msg : 'Invalid Credentials: Check your username and password again.'}]});
        }

        //Match the password entered, and the hashed password in the database.
        
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({error: [{msg : 'Invalid Credentials: Check your username and password again.'}]});
         }

         //NOTE: Keep the error messages same for user and password mismatch. Security reasons, so that hacker doesnt know if user exists/not
        //JWT Token Generation
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            {expiresIn: 360000},
            (err, token) => {
                if(err) throw err;
                res.json({token});
            }
        );
        //Sanity Checks
        // res.send('User has been registered');
        console.log(req.body.name);
    }catch(err){
        console.log(err.message);
        res.status(500).send('Server Error')
    }
    
    
});
module.exports = router;
