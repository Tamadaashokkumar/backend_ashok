const userController = require("../controllers/userController");
const express = require("express");

const router = express.Router();

router.post("/register", userController.userRegister);
router.post("/login", userController.userLogin);

// router.get("/all-vendors", vendorController.getAllVendors);
// router.get("/single-vendor/:apple", vendorController.getVendorById);

module.exports = router;
