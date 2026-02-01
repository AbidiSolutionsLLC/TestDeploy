const express = require("express");
const router = express.Router();
const holidayController = require("../../controllers/holidayController");
const { isLoggedIn } = require("../../middlewares/authMiddleware"); // Import your middleware

// Protect all holiday routes
router.use(isLoggedIn); 

router
  .route("/")
  .post(holidayController.createHoliday)
  .get(holidayController.getAllHolidays);

router.get("/year/:year", holidayController.getHolidaysByYear);

router
  .route("/:id")
  .get(holidayController.getHolidayById)
  .put(holidayController.updateHoliday)
  .delete(holidayController.deleteHoliday);

module.exports = router;