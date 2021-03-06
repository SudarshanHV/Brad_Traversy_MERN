const express = require("express");
const request = require("request");
const config = require("config");
const axios = require("axios");
const router = express.Router();

const Profile = require("../../models/Profile");
const User = require("../../models/Users");
const Post = require("../../models/Posts");

const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

//@route:   GET api/profile/me
//@desc:    Get the current user's profile when logged in
//@access:  Private

router.get("/me", auth, async (req, res) => {
    try {
        //Find profile, and populate with username and avatar.
        const profile = await Profile.findOne({ user: req.user.id }).populate(
            "user",
            ["name", "avatar"]
        );

        if (!profile) {
            return res
                .status(400)
                .json({ msg: "There is no profile for this user" });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server Side Error" });
    }
});

//@route:   POST api/profile
//@desc:    Create or Update User profile
//@access:  Private

router.post(
    "/",
    [
        auth,
        [
            check("status", "Status cannot be empty").not().isEmpty(),
            check("skills", "Skills cannot be empty").not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
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
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        //Manipulate skills array.
        if (skills) {
            profileFields.skills = Array.isArray(skills)
                ? skills
                : skills.split(",").map((skill) => " " + skill.trim());
        }

        console.log(profileFields.skills);
        //Create a socials object.
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (facebook) profileFields.social.facebook = facebook;
        if (twitter) profileFields.social.twitter = twitter;
        if (instagram) profileFields.social.instagram = instagram;
        if (linkedin) profileFields.social.linkedine = linkedin;

        try {
            let profile = await Profile.findOne({ user: req.user.id });

            if (profile) {
                //Update profile if profile exists.
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                );

                return res.json(profile);
            }

            //Create a new profile if it doesnt exist.
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

//@route:   GET api/profile
//@desc:    Get all user profiles
//@access:  Public

router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find().populate("user", [
            "name",
            "avatar"
        ]);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//@route:   GET api/profile/user/:user_id
//@desc:    Get all user profiles
//@access:  Public

router.get("/user/:user_id", async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id
        }).populate("user", ["name", "avatar"]);
        if (!profile) return res.status(404).json({ msg: "Profile not found" });
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Profile not found" });
        }
        res.status(500).send("Server Error");
    }
});

//@route:   DELETE api/profile
//@desc:    Delete a specific user,profile and all posts.
//@access:  Private

router.delete("/", auth, async (req, res) => {
    try {
        //Remove user posts
        await Post.deleteMany({ user: req.user.id });
        //Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id });
        //Remove User
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: "User and Profile successfully deleted" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//@route:   PUT api/profile/experience
//@desc:    Create a new experience tab
//@access:  Private

router.put(
    "/experience",
    [
        auth,
        [
            check("title", "Title is required").not().isEmpty(),
            check("company", "Company is required").not().isEmpty(),
            check("from", "From is required").not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
        }
        //Add date in MM-DD-YYYY format
        const { title, company, location, from, to, current, description } =
            req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        };

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            profile.experience.unshift(newExp);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

//@route:   DELETE api/profile/experience/:exp_id
//@desc:    Delete a specific work experience by id.
//@access:  Private

router.delete("/experience/:exp_id", auth, async (req, res) => {
    try {
        //Find user
        const profile = await Profile.findOne({ user: req.user.id });

        //Get index of experience to be removed.
        const removeIndex = profile.experience
            .map((item) => item.id)
            .indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//@route:   PUT api/profile/education
//@desc:    Create a new educatiom tab
//@access:  Private

router.put(
    "/education",
    [
        auth,
        [
            check("school", "School is required").not().isEmpty(),
            check("degree", "Degree is required").not().isEmpty(),
            check("fieldofstudy", "Field of Study is required").not().isEmpty(),
            check("from", "From is required").not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
        }
        //Add date in MM-DD-YYYY format
        const { school, degree, fieldofstudy, from, to, current, description } =
            req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        };

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            profile.education.unshift(newEdu);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

//@route:   DELETE api/profile/education/:edu_id
//@desc:    Delete a specific work education by id.
//@access:  Private

router.delete("/education/:edu_id", auth, async (req, res) => {
    try {
        //Find user
        const profile = await Profile.findOne({ user: req.user.id });

        //Get index of education to be removed.
        const removeIndex = profile.education
            .map((item) => item.id)
            .indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get("/github/:username", async (req, res) => {
    try {
        const uri = encodeURI(
            `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
        );
        const headers = {
            "user-agent": "node.js",
            Authorization: `token ${config.get("githubToken")}`
        };

        const gitHubResponse = await axios.get(uri, { headers });
        return res.json(gitHubResponse.data);
    } catch (err) {
        console.error(err.message);
        return res.status(404).json({ msg: "No Github profile found" });
    }
});

module.exports = router;
