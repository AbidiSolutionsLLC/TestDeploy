const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const User = require('../models/userSchema');
const { UnauthorizedError } = require('../utils/ExpressError');

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
  timeout: 30000,
  cache: true,
  cacheMaxAge: 86400000
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const isLoggedIn = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("No token provided."));
  }

  const token = authHeader.split(" ")[1];

  const verifyOptions = {
    audience: [
      process.env.AZURE_CLIENT_ID, 
      `api://${process.env.AZURE_CLIENT_ID}`
    ],
    issuer: [
      `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
      `https://sts.windows.net/${process.env.AZURE_TENANT_ID}/`
    ],
    algorithms: ['RS256']
  };

  jwt.verify(token, getKey, verifyOptions, async (err, decoded) => {
    if (err) {
      console.error("--- TOKEN VERIFICATION FAILED ---");
      return next(new UnauthorizedError("Invalid or expired token"));
    }

    try {
      // 1. Try to find user by their Azure ID (Best match)
      let user = await User.findOne({ azureId: decoded.oid });

      // 2. If not found, try to find by Email (Invitation match)
      if (!user) {
        const email = decoded.upn || decoded.preferred_username || decoded.email;

        if (!email) {
          return next(new UnauthorizedError("Token does not contain an email address"));
        }

        user = await User.findOne({ email: email });

        if (user) {
          // Found them via invite! Link their Azure ID
          user.azureId = decoded.oid;
          console.log(`Mapped existing user ${user.email} to Azure ID`);
        } else {
          // --- SECURITY: REJECT UNINVITED USERS ---
          console.warn(`Blocked login attempt from uninvited email: ${email}`);
          return next(new UnauthorizedError("Access Denied: You must be invited to the portal by an Admin."));
        }
      }

      // --- AUTO-ACTIVATE USER ON JOIN ---
      if (user.empStatus === 'Pending') {
        console.log(`🚀 Activating user ${user.email} on first login!`);
        user.empStatus = 'Active';
        if (!user.azureId) user.azureId = decoded.oid;
        await user.save();
      }
      // --------------------------------

      // 3. Attach user to request
      req.user = {
        id: user.id,
        azureId: user.azureId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isTechnician: user.isTechnician
      };

      req.token = token;
      next();
      
    } catch (dbError) {
      console.error("User mapping error:", dbError);
      return next(new UnauthorizedError("Authentication failed during user mapping"));
    }
  });
};

module.exports = { isLoggedIn };