const express = require("express");
const router = express.Router();
const multer = require("multer");
const { userProfileStorage } = require("../../storageConfig");
const upload = multer({ storage: userProfileStorage });
const catchAsync = require("../../utils/catchAsync");
const userController = require("../../controllers/userController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

// User Routes
router
  .route("/")
  .post(upload.single("profilePhoto"), userController.createUser)
  .get(userController.getAllUsers);

router.get("/:role/by-role", userController.getUserByRole);

router.get('/birthdays/upcoming', userController.getUpcomingBirthdays);
router.get("/org-chart", isLoggedIn, userController.getOrgChart);

router
  .route("/search")
  .get(userController.getUserById);


router
  .route("/:id")
  .get(userController.getUserById)
  .put(upload.single("profilePhoto"), userController.updateUser)
  .delete(userController.deleteUser);

router
  .route('/:id/dashboard-cards')
  .get(userController.getDashboardCards);

router
  .route('/:id/dashboard-cards/add')
  .post(userController.addDashboardCard);

router
  .route('/:id/dashboard-cards/:cardId')
  .delete(userController.removeDashboardCard);

  router
  .route('/:id/leaves')
  .get(userController.getUserLeaves)
  .put(userController.updateUserLeaves);

  router.post(
  '/:id/upload-avatar',
  upload.single('avatar'),
  userController.uploadAvatar
);

module.exports = router;