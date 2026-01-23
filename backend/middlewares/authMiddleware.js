const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const User = require('../models/userSchema');
const { UnauthorizedError } = require('../utils/ExpressError');

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
  timeout: 30000, // Add timeout
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
  
  try {
    const decoded = jwt.decode(token, { complete: true });
  } catch (e) {
    console.error("Failed to decode token:", e.message);
  }

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
      console.error("Error Name:", err.name);
      console.error("Error Message:", err.message);
      console.error("Stack:", err.stack);
      return next(new UnauthorizedError("Invalid or expired token"));
    }
    try {
      let user = await User.findOne({ azureId: decoded.oid });

      if (!user) {
        const email = decoded.upn || decoded.preferred_username || decoded.email;

        if (!email) {
          console.error("Token missing email/upn:", decoded);
          return next(new UnauthorizedError("Token does not contain an email address"));
        }

        user = await User.findOne({ email: email });

        if (user) {
          user.azureId = decoded.oid;
          await user.save();
          console.log(`Mapped existing user ${user.email} to Azure ID`);
        } else {
          console.log(`Creating new user for ${email}`);
          user = await User.create({
            azureId: decoded.oid,
            email: email,
            name: decoded.name || "Azure User",
            role: "Employee",
            phoneNumber: `000-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            empID: `EMP-${Date.now()}`,
          });
        }
      }

      req.user = {
        id: user.id,
        azureId: user.azureId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
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


// const jwt = require('jsonwebtoken');
// const { UnauthorizedError } = require('../utils/ExpressError');
// const BlacklistedToken = require('../models/BlacklistedTokenSchema');
// const User = require('../models/userSchema');

// const isLoggedIn = async (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return next(new UnauthorizedError("Please login first."));
//   }

//   const token = authHeader.split(" ")[1];

//   const isBlacklisted = await BlacklistedToken.findOne({ token });
//   if (isBlacklisted) {
//     return next(new UnauthorizedError("Access token has been revoked"));
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.id).select("name email role");
//     if (!user) {
//       return next(new UnauthorizedError("User not found."));
//     }

//     req.user = {
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//     };

//     req.token = token;
//     next();
//   } catch (err) {
//     return next(new UnauthorizedError("Invalid or expired access token"));
//   }
// };

// module.exports = { isLoggedIn };
