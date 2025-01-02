const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

exports.registerPlant = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      plant_name,
      plant_number,
      plant_zone,
      height,
      stump,
      girth,
      planted_on,
      latitude,
      longitude,
      health_status,
      upload_date,
    } = req.body;

    // Fetch user details
    const userResult = await pool.query(
      "SELECT full_name, zone AS user_zone, vibhaag FROM users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const { full_name, user_zone, vibhaag } = userResult.rows[0];

    // Handle image as binary data
    const plantImage = req.file ? req.file.buffer : null;

    const insertQuery = `
      INSERT INTO plants (
        plant_name, plant_number, plant_zone, height, stump, girth, planted_on, latitude, longitude, plant_image,
        health_status,
        registered_by, registered_by_full_name, registered_by_zone, registered_by_vibhaag, upload_date
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING id, plant_name, plant_number, plant_zone, height, stump, girth, planted_on, latitude, longitude,
               health_status, registered_by, registered_by_full_name, registered_by_zone, registered_by_vibhaag, upload_date;
    `;

    const result = await pool.query(insertQuery, [
      plant_name,
      plant_number,
      plant_zone,
      height,
      stump,
      girth,
      planted_on,
      latitude,
      longitude,
      plantImage,
      health_status,
      userId,
      full_name,
      user_zone,
      vibhaag,
      upload_date,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to register plant" });
  }
};

exports.getPlantDetails = async (req, res) => {
  try {
    const { plant_zone, plant_number } = req.query;

    const result = await pool.query(
      "SELECT * FROM plants WHERE plant_zone = $1 AND plant_number = $2",
      [plant_zone, plant_number]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Plant not found" });
    }

    const plant = result.rows[0];

    // Convert binary image data to base64 if image exists
    if (plant.plant_image) {
      plant.plant_image = `data:image/jpeg;base64,${plant.plant_image.toString(
        "base64"
      )}`;
    }

    // Format the planted_on field
    if (plant.planted_on) {
      plant.planted_on = new Date(plant.planted_on).toISOString().split("T")[0];
    }

    res.status(200).json(plant);
  } catch (error) {
    console.error("Error fetching plant details:", error);
    res.status(500).json({ message: "Failed to fetch plant details" });
  }
};

exports.updatePlant = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      id,
      plant_name,
      plant_number,
      plant_zone,
      height,
      stump,
      girth,
      planted_on,
      latitude,
      longitude,
      health_status,
    } = req.body;

    const updatedBy = req.body.updated_by
      ? JSON.parse(req.body.updated_by)
      : {};
    const { full_name, zone, vibhaag } = updatedBy;

    // First check if plant exists
    const checkPlant = await client.query(
      "SELECT id FROM plants WHERE plant_number = $1 AND plant_zone = $2",
      [plant_number, plant_zone]
    );

    if (checkPlant.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Plant not found" });
    }

    // Handle image processing
    let plantImage = null;
    let imageUpdateClause = "";
    let imageParam = null;

    if (req.file) {
      // New file uploaded via multer
      plantImage = req.file.buffer;
      imageUpdateClause = ", plant_image = $16";
      imageParam = plantImage;
    } else if (
      req.body.plant_image &&
      req.body.plant_image.startsWith("data:image")
    ) {
      // Base64 image data
      const base64Data = req.body.plant_image.split(";base64,").pop();
      plantImage = Buffer.from(base64Data, "base64");
      imageUpdateClause = ", plant_image = $16";
      imageParam = plantImage;
    }

    // Construct dynamic update query
    const updateQuery = `
      UPDATE plants
      SET 
        plant_name = $1,
        plant_number = $2,
        plant_zone = $3,
        height = $4,
        stump = $5,
        girth = $6,
        planted_on = $7,
        latitude = $8,
        longitude = $9,
        health_status = $10,
        updated_by_full_name = $11,
        updated_by_zone = $12,
        updated_by_vibhaag = $13,
        updated_time = NOW()
        ${imageUpdateClause}
      WHERE id = $14 AND plant_zone = $15
      RETURNING *;
    `;

    // Create params array based on whether we're updating the image
    const params = [
      plant_name,
      plant_number,
      plant_zone,
      height,
      stump,
      girth,
      planted_on,
      latitude,
      longitude,
      health_status,
      full_name,
      zone,
      vibhaag,
      id,
      plant_zone,
    ];

    if (imageParam) {
      params.push(imageParam);
    }

    const result = await client.query(updateQuery, params);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Plant not found or update failed" });
    }

    await client.query("COMMIT");

    // Don't send the image data back in the response
    const { plant_image, ...plantData } = result.rows[0];
    res.status(200).json(plantData);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating plant:", error);
    res.status(500).json({
      message: "Failed to update plant",
      error: error.message,
    });
  } finally {
    client.release();
  }
};
exports.deletePlant = async (req, res) => {
  try {
    const { plant_number, zone } = req.body;

    // Validate if both zone and plant number are provided
    if (!plant_number || !zone) {
      return res
        .status(400)
        .json({ message: "Zone and Plant Number are required." });
    }

    // Check if the plant exists
    const plantResult = await pool.query(
      "SELECT * FROM plants WHERE plant_number = $1 AND plant_zone = $2",
      [plant_number, zone]
    );

    if (plantResult.rows.length === 0) {
      return res.status(404).json({ message: "Plant not found." });
    }

    const plant = plantResult.rows[0];
    const plantImagePath = plant.plant_image;

    // Delete the plant from the database
    const deleteResult = await pool.query(
      "DELETE FROM plants WHERE plant_number = $1 AND plant_zone = $2 RETURNING *",
      [plant_number, zone]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: "Error deleting plant." });
    }

    // Check if the plant has an image and delete it
    if (plantImagePath) {
      // The image path will be something like '/uploads/1234567890-image.jpg'
      const imagePath = path.join(__dirname, "..", plantImagePath); // Join to get the absolute path

      // Check if the file exists and then delete it
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Error deleting image:", err);
          return res.status(500).json({ message: "Failed to delete image." });
        }
        console.log("Image deleted successfully");
      });
    }

    res.status(200).json({ message: "Plant and image deleted successfully." });
  } catch (error) {
    console.error("Error deleting plant:", error);
    res.status(500).json({ message: "Failed to delete plant." });
  }
};

// Get all plant details zone-wise
exports.getPlantsByZone = async (req, res) => {
  try {
    // Query to fetch all plants ordered by zone
    const result = await pool.query("SELECT * FROM plants ORDER BY plant_zone");

    // Convert binary image data to base64 for all plants
    const plantsWithImages = result.rows.map((plant) => ({
      ...plant,
      plant_image: plant.plant_image
        ? `data:image/jpeg;base64,${plant.plant_image.toString("base64")}`
        : null,
    }));

    res.json(plantsWithImages);
  } catch (error) {
    console.error("Error fetching plants data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deletePlantByZone = async (req, res) => {
  try {
    const { plant_number, zone } = req.query; // Changed to req.query
    console.log("Received Query Params:", { plant_number, zone });

    // Validate if both zone and plant number are provided
    if (!plant_number || !zone) {
      return res
        .status(400)
        .json({ message: "Zone and Plant Number are required." });
    }

    // Check if the plant exists in the database
    const plantResult = await pool.query(
      "SELECT * FROM plants WHERE plant_number = $1 AND plant_zone = $2::INTEGER",
      [plant_number, zone]
    );

    if (plantResult.rows.length === 0) {
      return res.status(404).json({ message: "Plant not found." });
    }

    const plant = plantResult.rows[0];
    const plantImagePath = plant.plant_image;

    // Delete the plant from the database
    const deleteResult = await pool.query(
      "DELETE FROM plants WHERE plant_number = $1 AND plant_zone = $2::INTEGER RETURNING *",
      [plant_number, zone]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: "Error deleting plant." });
    }

    // Check if the plant has an image and delete it
    if (plantImagePath) {
      const imagePath = path.join(__dirname, "..", plantImagePath); // Join to get the absolute path
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Error deleting image:", err);
          return res.status(500).json({ message: "Failed to delete image." });
        }
        console.log("Image deleted successfully");
      });
    }

    res.status(200).json({ message: "Plant and image deleted successfully." });
  } catch (error) {
    console.error("Error deleting plant:", error);
    res.status(500).json({ message: "Failed to delete plant." });
  }
};

exports.getAllPlants = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, plant_name, plant_number, plant_zone, height, stump, girth, planted_on, latitude, longitude, health_status, plant_image, registered_by, registered_by_full_name, registered_by_zone, registered_by_vibhaag, upload_date, updated_by_full_name, updated_by_zone, updated_by_vibhaag, updated_time FROM plants"
    );

    // Convert binary image data to base64 for all plants
    const plantsWithImages = result.rows.map((plant) => ({
      ...plant,
      plant_image: plant.plant_image
        ? `data:image/jpeg;base64,${plant.plant_image.toString("base64")}`
        : null,
    }));

    res.json(plantsWithImages);
  } catch (error) {
    console.error("Error fetching plants:", error);
    res.status(500).json({ message: "Failed to fetch plants data" });
  }
};
