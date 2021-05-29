const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');
const {check , validationResult} = require('express-validator');
const User = require('../../models/Users');
//@route:   POST api/users
//@desc:    Register User
//@access:  Public

//Express validation to check if form details are valid
router.post('/',[
    check('name','Name is Required')
    .not()
    .isEmpty(),
    check('email','Valid Email is Required').isEmail(),
    check('password','Please Enter a Password with 6 characters or more')
    .isLength({min:6})
],
async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    //Extracting the necessary variables
    const {name, email, password} = req.body;
    
    try{
        //Verify if user is unique
        let user = await User.findOne({email});

        if(user){
           return res.status(400).json({error: [{msg : 'User Already Exists'}]});
        }

        //Initialize Gravatar if user is unique
        const avatar = gravatar.url(email,{
            s: '200', //Size
            r: 'pg',  //Rating
            d: 'mm'   //Default icon incase gravatar doesnt exist.
        })

        //Create new instance of User
        user = new User({
            name,
            avatar,
            password,
            email
        });

        //Encrypting the password and saving the user to Database
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password,salt);
        user.save()

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
