const Firm = require("../models/Firm");
const Vendor = require("../models/Vendor");
const multer = require("multer");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

// 🔹 Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Configure Multer Storage to Upload to Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "firms", // Change this to your preferred Cloudinary folder
        format: async (req, file) => "png", // Convert all images to PNG
        public_id: (req, file) => Date.now() + path.extname(file.originalname), // Unique filename
    },
});

const upload = multer({ storage: storage });

// 🔹 Add a Firm (with Image Upload)
const addFirm = async (req, res) => {
    try {
        const { firmName, area, category, region, offer } = req.body;

        // Get Cloudinary Image URL
        const image = req.file ? req.file.path : undefined;

        const vendor = await Vendor.findById(req.vendorId);
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        if (vendor.firm.length > 0) {
            return res.status(400).json({ message: "Vendor can have only one firm" });
        }

        const firm = new Firm({
            firmName,
            area,
            category,
            region,
            offer,
            image, // Save Cloudinary Image URL
            vendor: vendor._id,
        });

        const savedFirm = await firm.save();
        vendor.firm.push(savedFirm);
        await vendor.save();

        return res.status(200).json({
            message: "Firm added successfully",
            firmId: savedFirm._id,
            vendorFirmName: savedFirm.firmName,
            imageUrl: savedFirm.image, // Return Cloudinary Image URL
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 🔹 Delete a Firm by ID
const deleteFirmById = async (req, res) => {
    try {
        const firmId = req.params.firmId;
        const firm = await Firm.findById(firmId);

        if (!firm) {
            return res.status(404).json({ error: "No firm found" });
        }

        // Delete Image from Cloudinary
        if (firm.image) {
            const imagePublicId = firm.image.split("/").pop().split(".")[0]; // Extract public_id
            await cloudinary.uploader.destroy(`firms/${imagePublicId}`);
        }

        await Firm.findByIdAndDelete(firmId);
        res.status(200).json({ message: "Firm deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { addFirm: [upload.single("image"), addFirm], deleteFirmById };
