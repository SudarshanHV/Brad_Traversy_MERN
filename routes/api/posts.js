const express = require('express');
const router = express.Router();
const User = require('../../models/Users');
const Post = require('../../models/Posts');
const Profile = require('../../models/Profile');
const {check, validationResult} = require('express-validator');
const auth = require('../../middleware/auth');


//@route:   POST api/posts
//@desc:    Route to create a new post
//@access:  Private

router.get('/',[auth, [
    check('text','Text is Required').not().isEmpty()
]],async (req,res)=>{
    
    errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.user.id).isSelected('-password');

        const newPost = new Post({
            text: req.text,
            user: req.user.id,
            name: user.name,
            avatar: user.avatar,
        });

        const post = await newPost.save();

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route:   GET api/posts
//@desc:    Route to get all posts
//@access:  Private
router.get('/',auth, async (req,res)=>{
    try {
        const posts = await Post.find().sort({date: -1}); //Get all post, sort it by most recent.
        res.json(posts);
        //@todo: Can add a possible error check to see if any posts exist at all.
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');   
    }
});

//@route:   GET api/posts/:id
//@desc:    Route to get post by post id
//@access:  Private
router.get('/:id',auth, async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            res.status(404).json({msg:'Post Not Found'});
        }

        res.json(post);
        //@todo: Can add a possible error check to see if any posts exist at all.
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json({msg: 'Post not found'});
        }
        res.status(500).send('Server Error');   
    }
});

//@route:   DELETE api/posts/:id
//@desc:    Route to delete post by id following user verification.
//@access:  Private
router.delete('/:id',auth, async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            res.status(404).json({msg:'Post Not Found'});
        }

        //Check if user requesting deletion is same as the one who posted.
        if(req.user.id !== post.user.toString()){
            res.status(401).json({msg: 'User not authorized to delete post'});
        }

        await post.remove();

        res.json({msg:'Post deleted'});
        //@todo: Can add a possible error check to see if any posts exist at all.
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json({msg: 'Post not found'});
        }
        res.status(500).send('Server Error');   
    }
});

module.exports = router;
