import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.js';
import { generateToken } from '../utils/generateToken.js';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage' // redirect URI for web apps using auth code flow
);

const DEV_EMAILS = ["meejanursk@gmail.com", "raizen@gmail.com"];

export const googleLogin = async (req, res) => {
  console.log('➡️ Reached Google login endpoint');
  
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Google auth code missing' });

    // Exchange auth code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Verify ID token to get user info
    if (!tokens.id_token) return res.status(400).json({ message: 'No ID token returned by Google' });

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // Normalize email
    const normalizedEmail = email.toLowerCase();
    const normalizedDevEmails = DEV_EMAILS.map(e => e.toLowerCase());

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });
    let isAlreadyUser = true;

    if (!user) {
      isAlreadyUser = false;
      const role = normalizedDevEmails.includes(normalizedEmail) ? 'dev' : 'normal';

      user = await User.create({
        name,
        email: normalizedEmail,
        googleId: sub,
        profile: picture,
        password: '',
        role,
        juryApplied: false,
      });

      console.log(`✅ Account created for ${user.email} with role ${role}`);
    } else if (normalizedDevEmails.includes(normalizedEmail) && user.role !== 'dev') {
      user.role = 'dev';
      await user.save();
      console.log(`🔄 Updated existing user to DEV: ${user.email}`);
    }

    const token = generateToken(user._id);

res.cookie("token", token, {
  httpOnly: true,
  secure : false,
  // secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      handle: user.handle,
      instagram: user.instagram,
      bio: user.bio,
      premium: user.premium,
      role: user.role,
      isAlreadyUser,
    });
  } catch (err) {
  console.log(err)
    console.error('Google login error:', err.message);
    res.status(500).json({ message: 'Google login failed' });
  }
};
