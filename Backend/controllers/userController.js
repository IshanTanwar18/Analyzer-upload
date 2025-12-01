exports.getUserWithFoods = async (req, res) => {
    try {
        console.log("Received request to get user with foods:", req.query);

        // Verify token
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized: No token" });

        const decoded = jwt.verify(token, SECRET_KEY);
        if (!decoded) return res.status(403).json({ message: "Unauthorized: Invalid token" });

        // Get userId
        const userId = req.query.userId;
        if (!userId) {
            console.log("❌ Missing userId in request");
            return res.status(400).json({ message: "User ID is required" });
        }

        console.log("✅ Found userId:", userId);

        // Fetch user with populated foodHistory
        const user = await User.findById(userId).populate("foodHistory");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("✅ User found:", user.name);

        // Send only ONE response
        return res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            foodHistory: user.foodHistory || []
        });

    } catch (error) {
        console.error("Error fetching user with foods:", error);

        if (!res.headersSent) {
            return res.status(500).json({ message: "Server error" });
        }
    }
};
