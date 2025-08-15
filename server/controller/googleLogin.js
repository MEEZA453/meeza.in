import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.js';
import { generateToken } from '../utils/generateToken.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    console.log('Received Google login request');

    const { token } = req.body;
    console.log(token)
    if (!token) {
      return res.status(400).json({ message: 'Google ID token is missing' });
    }

    // 1. Verify the ID token (sent from frontend)
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // 2. Check if user exists or create one
    let user = await User.findOne({ email });
 let isAlreadyUser = true;
    if (!user) {
      user = await User.create({

        name,
        email,
        googleId: sub,
        profile: picture,
        password: '',
       
      });
    }

    // 3. Respond with token + user info
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      handle : user.handle,
      instagram : user.instagram,
    bio : user.bio, 
      token: generateToken(user._id),
      isAlreadyUser,
    });
    console.log('account created successfully of', user.handle)
  } catch (err) {
    
    console.log('Google login error:', err.message);
    res.status(500).json({ message: 'Google login failed' });
  }
};
