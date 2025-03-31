const Product = require("../models/Product");
const Firm = require("../models/Firm");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// 🔹 Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Set up Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "product_images",
        format: async (req, file) => "jpg", // Convert all uploads to JPG format
        public_id: (req, file) => Date.now() + "-" + file.originalname, // Unique file name
    },
});

const upload = multer({ storage: storage });

// 🔹 Add Product (Uploads Image to Cloudinary)
const addProduct = async (req, res) => {
    try {
        const { productName, price, category, bestSeller, description } = req.body;
        const firmId = req.params.firmId;

        const firm = await Firm.findById(firmId);
        if (!firm) {
            return res.status(404).json({ error: "No firm found" });
        }

        // 🔹 Upload Image to Cloudinary
        let imageUrl = "";
        if (req.file) {
            imageUrl = req.file.path; // Cloudinary auto-returns the file URL
        }

        // 🔹 Save product to MongoDB
        const product = new Product({
            productName,
            price,
            category,
            bestSeller,
            description,
            image: imageUrl, // Store Cloudinary URL
            firm: firm._id,
        });

        const savedProduct = await product.save();
        firm.products.push(savedProduct);
        await firm.save();

        res.status(200).json(savedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 🔹 Get Products by Firm ID
const getProductByFirm = async (req, res) => {
    try {
        const firmId = req.params.firmId;
        const firm = await Firm.findById(firmId);

        if (!firm) {
            return res.status(404).json({ error: "No firm found" });
        }

        const restaurantName = firm.firmName;
        const products = await Product.find({ firm: firmId });

        res.status(200).json({ restaurantName, products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 🔹 Delete Product by ID
const deleteProductById = async (req, res) => {
    try {
        const productId = req.params.productId;
        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ error: "No product found" });
        }

        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 🔹 Export Routes
module.exports = {
    addProduct: [upload.single("image"), addProduct],
    getProductByFirm,
    deleteProductById
};
