const express = require('express');

const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');

const {
  check,
  validatiomResult,
  validationResult,
} = require('express-validator');

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectID') {
      return res.status(400).json({ msg: 'There is no profile' });
    }
    res.status(500).send('Server Error');
  }
});

router.post(
  '/',
  [
    check('status', 'status is required').not().isEmpty(),
    check('skills', 'Atleast one skill is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername)
      profileFields.githubusername = req.body.githubusername;
    // Skills - Spilt into array
    if (req.body.skills) {
      profileFields.skills = req.body.skills
        .split(',')
        .map((skill) => skill.trim());
    }

    // Social
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    try {
      let profile = await Profile.findOne({ user: req.used.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      profile = new Profile(profileFields);
      await profile.save();

      res.json(profile);
    } catch (err) {
      return res.status(500).send(' Server Error');
    }
  }
);

router.get('/all', async (req, res) => {
  const errors = {};

  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    if (!profiles) {
      errors.noprofile = 'There are no profiles';
      return res.status(404).json(errors);
    }

    res.json(profiles);
  } catch (err) {
    res.status(404).json({ profile: 'There are no profiles' });
  }
});

router.get('/user/:user_id', async (req, res) => {
  const errors = {};

  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      errors.noprofile = 'There are no profiles';
      return res.status(404).json(errors);
    }

    res.json(profile);
  } catch (err) {
    res.status(404).json({ profile: 'There are no profiles' });
  }
});

// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id });

    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'Success ' });
  } catch (err) {
    res.status(404).json({ profile: 'There are no profiles' });
  }
});

// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'company is required').not().isEmpty(),
      check('from', 'from date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    // Check Validation
    if (!errors.isEmpty()) {
      // Return any errors with 400 status
      return res.status(400).json(errors.array());
    }

    const { title, company, location, from, to, current, description } =
      req.body;
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      return res.status(400).json('error');
    }
    // Add to exp array
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    res.status(404).json('Error');
  }
  // Get remove index
  // Splice out of array
});
router.post(
  '/education',
  [
    auth,
    [
      check('degree', 'degree is required').not().isEmpty(),
      check('school', 'school is required').not().isEmpty(),
      check('fieldofstudy', 'fieldofstudy is required').not().isEmpty(),
      check('from', 'from date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    // Check Validation
    if (!errors.isEmpty()) {
      // Return any errors with 400 status
      return res.status(400).json(errors.array());
    }

    const { school, degree, fieldofstudy, from, to, current, description } =
      req.body;
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      return res.status(400).json('error');
    }
    // Add to exp array
  }
);

router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
      const profile = await Profile.findOne({ user: req.user.id });
  
      const removeIndex = profile.education
        .map((item) => item.id)
        .indexOf(req.params.edu_id);
  
      profile.education.splice(removeIndex, 1);
  
      await profile.save();
  
      res.json(profile);
    } catch (err) {
      res.status(404).json('Error');
    }
    // Get remove index
    // Splice out of array
  });

  //@route  GET api/profile/github/:username
  //@desc   Get user repos from GitHub
  //@access Public

  router.get('/github/:username',(req,res)=>{
    try {
      const options = {
        uri :`https://api.github.com/users/${req.params.username}/repos?per_page=5&
        sort=creates:asc&client_id=${config.get('githubClientID')}&client_secret=
        ${config.get('githubSecret')}`,
        method: 'GET',
        headers:{ 'user-agent':'node.js'}
      };

      request(options,(error,response,body)=>{
        if(error) console.error(error);

        if(response.statusCode!==200){
          res.status(404).json({msg:'No github profile found'});
        }
        res.json(JSON.parse(body));
      })
    } catch (err) {
      res.status(500).send('Server Error');
    }
  })

module.exports = router;
