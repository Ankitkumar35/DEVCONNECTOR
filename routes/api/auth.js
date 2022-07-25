const express = require('express');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const router =express.Router();
const { check, validationResult } = require('express-validator');
const jwt= require('jsonwebtoken');
const config=require('config');
const { exists } = require('../../models/User');


router.get('/',auth, async (req,res)=>{
    try{
        const user= await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(err){
        console.error(err.message);
        res.status(500).send('server error')
    }
}); 

router.post(
    '/',
    
      check('email', 'Email should be valid').isEmail(),
      check(
        'password',
        'Password is required'
      ).exists()
    ,
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
      }
  
      const {email, password } = req.body;
  
      try {
        let user = await User.findOne({ email });
  
        if (!user) {
          return res
            .status(400)
            .json({ errors: [{ msg: 'Invalid Credentials' }] });
        }
        const isMatch= await bcrypt.compare(password,user.password);
        if(!isMatch)
        {
            return res
            .status(400)
            .json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

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
        });
      //   res.send('User registered');
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    }
  );
  

module.exports = router;