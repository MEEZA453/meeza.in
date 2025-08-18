import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.js';
import { generateToken } from '../utils/generateToken.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const DEV_EMAILS = ["meejanursk@gmail.com", "raizen@gmail.com"]; // your manual dev list

export const googleLogin = async (req, res) => {
  try {
    console.log('Received Google login request');

    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Google ID token is missing' });
    }

    // 1. Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // normalize email (lowercase)
    const normalizedEmail = email.toLowerCase();
    const normalizedDevEmails = DEV_EMAILS.map(e => e.toLowerCase());

    // 2. Check if user exists
    let user = await User.findOne({ email: normalizedEmail });
    let isAlreadyUser = true;

    if (!user) {
      isAlreadyUser = false;

      // Assign role based on DEV_EMAILS
      let role = "normal";
      if (normalizedDevEmails.includes(normalizedEmail)) role = "dev";

      user = await User.create({
        name,
        email: normalizedEmail,
        googleId: sub,
        profile: picture,
        password: '',
        role,
        juryApplied: false, // default
      });

      console.log('✅ Account created for', user.email, 'with role', role);
    } else {
      // 🔄 If user already exists but is a DEV email, upgrade role
      if (normalizedDevEmails.includes(normalizedEmail) && user.role !== "dev") {
        user.role = "dev";
        await user.save();
        console.log('🔄 Updated existing user to DEV:', user.email);
      }
    }

    // 3. Respond with token + user info
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      handle: user.handle,
      instagram: user.instagram,
      bio: user.bio,
      role: user.role,
      token: generateToken(user._id),
      isAlreadyUser,
    });

  } catch (err) {
    console.log('Google login error:', err.message);
    res.status(500).json({ message: 'Google login failed' });
  }
};
