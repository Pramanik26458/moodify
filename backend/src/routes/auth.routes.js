const { Router } = require("express");

const authController = require("../controllers/auth.controller");
const authMiddleware=require("../middlewares/auth.middleware")
const router = Router();



/**
 * @action Register User
 * @description Create a new user account with
 * username, email, and password
 * @access Public
 * @route POST /auth/register
 */
router.post(
  "/register",
  authController.registerUser
);



/**
 * @action Login User
 * @description Authenticate user and generate JWT token
 * @access Public
 * @route POST /auth/login
 */
router.post(
  "/login",
  authController.login
);



/**
 * @action Logout User
 * @description Logout user and clear authentication cookie
 * @access Private
 * @route POST /auth/logout
 */
router.post(
  "/logout",
  authController.logout
);


router.get(
  "/get-me",
  authMiddleware,
  authController.getMe
);


module.exports = router;