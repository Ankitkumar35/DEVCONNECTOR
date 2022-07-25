const express = require('express');
const { check, validationResult } = require('express-validator');
// const {chj,klj}=require('express-validator');
const gravatar = require('gravatar');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt= require('jsonwebtoken');
const config=require('config');
const User = require('../../models/User');

router.post(
  '/',
  [
    check('name', 'name is required').not().isEmpty(),
    check('email', 'Email should be valid').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more charater'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'user already exist' }] });
      }
      // see if user exist

      // get user avatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      //Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      // return jsonwebtoken
      const payload={
        user:{
            id: user.id
        }
      }
      jwt.sign(payload, config.get('jwtSecret'),
      {
        expiresIn: 3600
      },
      (err,token)=>{
        if(err) throw err;
        res.send({token});
      })
    //   res.send('User registered');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
