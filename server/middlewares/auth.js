const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../user/user");

//auth

exports.auth = async (req, res, next) => {
  try {
    console.log("Auth middleware invoked delete");

    // Get token from cookie, body, or Authorization header
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization")?.replace("Bearer", "").trim();
      console.log(token)

    console.log("Extracted token:", token);

    // Token missing
    if (!token) {
      console.log("No token provided in the request");
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);

      if (!decoded) {
        console.log("Token verification failed - no payload returned");
        return res.status(401).json({
          success: false,
          message: "Token is invalid",
        });
      }

      // Token is valid, attach the decoded token to req.user
      req.user = decoded;
      console.log("User attached to request:", req.user);
      next(); // Proceed to next middleware/route
    } catch (err) {
      console.log("Error during token verification:", err.message);
      return res.status(401).json({
        success: false,
        message: "Token is invalid or expired",
      });
    }
  } catch (error) {
    console.log("Unexpected error in auth middleware:", error.message);
    return res.status(401).json({
      success: false,
      message: "Something went wrong while validating the token",
    });
  }
};


//is student 

exports.isStudent = async(req, res, next)=>{
    try {
        if(req.User.accountType !=="Student"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for students only"
              });
        }
next()
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified,please try again"
          })
    }
}


//is isnstuctor

exports.isInstructor = async (req, res, next) => {
  try {
    console.log("Instructor middleware hit");
    console.log(req.user);

    if (req.user.accountType !== "Instructor") {
      console.log("Access denied: Not an instructor");
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Instructors only",
      });
    }

    next();
  } catch (error) {
    console.error("Middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified, please try again",
    });
  }
};


//is admin

exports.isAdmin = async(req, res, next)=>{
    try {
        if(req.User.accountType !== "Admin"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Admin only"
              });
        }
next()
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified,please try again"
          })
    }
}
