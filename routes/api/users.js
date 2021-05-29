const express = require('express');
const router = express.Router();
const {check , validationResult} = require('express-validator/check');

//@route:   POST api/users
//@desc:    Register User
//@access:  Public

router.post('/',[
    check('name','Name is Required')
    .not()
    .isEmpty(),
    check('email','Valid Email is Required').isEmail(),
    check('password','Please Enter a Password with 6 characters or more')
    .isLength({min:6})
],
(req,res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    res.send('Users Route');
});
module.exports = router;
