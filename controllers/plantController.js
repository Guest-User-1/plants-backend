const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

exports.registerPlant = async (req, res) => {
  try {
    const userId = req.user.id; // Assumes middleware attaches user info to req.user
    const {
      plant_name,
      plant_number,
      plant_zone, // Updated to plant_zone
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

    // Save plant information
    const plantImage = req.file ? req.file.path : null; // Handle image upload
    const insertQuery = `
      INSERT INTO plants (
        plant_name, plant_number, plant_zone, height, stump, girth, planted_on, latitude, longitude, plant_image,
        health_status,
        registered_by, registered_by_full_name, registered_by_zone, registered_by_vibhaag, upload_date
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [
      plant_name,
      plant_number,
      plant_zone, // Updated to plant_zone
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
      user_zone, // Updated to user_zone
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

    // Format the `planted_on` field to `YYYY-MM-DD`
    if (plant.planted_on) {
      plant.planted_on = new Date(plant.planted_on).toISOString().split("T")[0];
    }

    res.status(200).json(plant);
  } catch (error) {
    console.error("Error fetching plant details:", error);
    res.status(500).json({ message: "Failed to fetch plant details" });
  }
};

// exports.updatePlant = async (req, res) => {
//   try {
//     const {
//       id, // Add a unique identifier for the plant
//       plant_name,
//       plant_number,
//       plant_zone,
//       height,
//       stump,
//       girth,
//       planted_on,
//       latitude,
//       longitude,
//       health_status,
//     } = req.body;

//     // Fetch existing plant details from the database using the unique ID
//     const plantResult = await pool.query(
//       "SELECT plant_image FROM plants WHERE id = $1",
//       [id]
//     );

//     if (plantResult.rows.length === 0) {
//       return res.status(404).json({ message: "Plant not found" });
//     }

//     const existingImage = plantResult.rows[0].plant_image;

//     // File handling: if new image is uploaded, replace the existing one
//     let plantImage = existingImage; // Default to the existing image
//     if (req.file) {
//       // Remove the existing image from the uploads folder
//       if (
//         existingImage &&
//         fs.existsSync(path.join(__dirname, "..", existingImage))
//       ) {
//         fs.unlinkSync(path.join(__dirname, "..", existingImage));
//       }

//       // Update with the new image
//       plantImage = `/uploads/${req.file.filename}`;
//     }

//     // Update query to include plant_number and plant_zone updates
//     const updateQuery = `
//         UPDATE plants
//         SET
//           plant_name = $1,
//           plant_number = $2,
//           plant_zone = $3,
//           height = $4,
//           stump = $5,
//           girth = $6,
//           planted_on = $7,
//           latitude = $8,
//           longitude = $9,
//           health_status = $10,
//           plant_image = $11
//         WHERE id = $12
//         RETURNING *;
//       `;

//     const result = await pool.query(updateQuery, [
//       plant_name,
//       plant_number,
//       plant_zone,
//       height,
//       stump,
//       girth,
//       planted_on,
//       latitude,
//       longitude,
//       health_status,
//       plantImage, // Add image path here
//       id,
//     ]);

//     if (result.rows.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "Plant not found or no changes made" });
//     }

//     res.status(200).json(result.rows[0]);
//   } catch (error) {
//     console.error("Error updating plant:", error);
//     res.status(500).json({ message: "Failed to update plant" });
//   }
// };

exports.updatePlant = async (req, res) => {
  try {
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

    // Assuming userInfo is sent from frontend
    // const { full_name, zone, vibhaag } = req.body.updated_by;
    const updatedBy = req.body.updated_by
      ? JSON.parse(req.body.updated_by)
      : {};
    const { full_name, zone, vibhaag } = updatedBy;

    const plantResult = await pool.query(
      "SELECT plant_image FROM plants WHERE id = $1",
      [id]
    );

    if (plantResult.rows.length === 0) {
      return res.status(404).json({ message: "Plant not found" });
    }

    const existingImage = plantResult.rows[0].plant_image;

    let plantImage = existingImage;
    if (req.file) {
      if (
        existingImage &&
        fs.existsSync(path.join(__dirname, "..", existingImage))
      ) {
        fs.unlinkSync(path.join(__dirname, "..", existingImage));
      }
      plantImage = `/uploads/${req.file.filename}`;
    }

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
        plant_image = $11,
        updated_by_full_name = $12,
        updated_by_zone = $13,
        updated_by_vibhaag = $14,
        updated_time = NOW()
      WHERE id = $15
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, [
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
      plantImage,
      full_name,
      zone,
      vibhaag,
      id,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Plant not found or no changes made" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating plant:", error);
    res.status(500).json({ message: "Failed to update plant" });
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

    // Respond with the plant data
    res.json(result.rows);
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

// Get All Plants
exports.getAllPlants = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM plants");

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching plants:", error);
    res.status(500).json({ message: "Failed to fetch plants data" });
  }
};
