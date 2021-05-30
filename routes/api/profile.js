const express = require('express');
const router = express.Router();
const Profile = require('../../models/Profile');
const User = require('../../models/Users');
const auth = require('../../middleware/auth');
const {check , validationResult } = require('express-validator');

//@route:   GET api/profile/me
//@desc:    Get the current user's profile when logged in
//@access:  Private

router.get('/me',auth, async (req,res)=>{
    try{
        //Find profile, and populate with username and avatar.
        const profile = await Profile.findOne({user: req.user.id}).populate(
            'user',
            ['name','avatar']
        );

        if(!profile){
            return res.status(400).json({msg: 'There is no profile for this user'});
        }

        res.json(profile);

    }catch(err){
        console.error(err.message);
        res.status(500).json({msg: 'Server Side Error'});
    }
});

//@route:   POST api/profile
//@desc:    Create or Update User profile
//@access:  Private

router.post('/', [auth, [
    check('status','Status cannot be empty').not().isEmpty(),
    check('skills','Skills cannot be empty').not().isEmpty()]
    ],
    async (req,res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(400).json({errors: errors.array()});
        }
        
        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        //Create a profile Object.
        const profileFields ={};
        profileFields.user = req.user.id;
        if(company) profileFields.company = company;
        if(website) profileFields.website = website;
        if(location) profileFields.location = location;
        if(bio) profileFields.bio = bio;
        if(status) profileFields.status = status;
        if(githubusername) profileFields.githubusername = githubusername;
        //Manipulate skills array.
        if(skills){
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }

        console.log(profileFields.skills);
        //Create a socials object.
        profileFields.social = {}
        if(youtube) profileFields.social.youtube = youtube;
        if(facebook) profileFields.social.facebook = facebook;
        if(twitter) profileFields.social.twitter = twitter;
        if(instagram) profileFields.social.instagram = instagram;
        if(linkedin) profileFields.social.linkedine = linkedin;

        try{
            let profile = await Profile.FindOne({user: req.user.id});

            if(profile){
                //Update profile if profile exists.
                profile = await Profile.findOneAndUpdate(
                    {user: req.user.id},
                    {$set: profileFields},
                    {new:true}
                );

                return res.json(profile);
            }

            //Create a new profile if it doesnt exist.
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);

        } catch(err){
            console.error(err.message);
            res.status(500).send('Server Error');
        }

    
});

module.exports = router;
