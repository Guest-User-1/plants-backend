const pool = require("../config/db");

// const submitForm = async (req, res) => {
//   try {
//     const {
//       plantZone,
//       plantNumber,
//       water_scheduled,
//       insects_present,
//       fertilizers_applied,
//       soil_level_maintained,
//       tree_burnt,
//       unwanted_grass,
//       water_logging,
//       compound_maintained,
//       comments,
//     } = req.body;

//     const userId = req.user.id;
//     const userName = req.user.name;
//     const userPhone = req.user.phone;

//     // Find the plant ID
//     const plant = await pool.query(
//       "SELECT id FROM plants WHERE plant_zone = $1 AND plant_number = $2",
//       [plantZone, plantNumber]
//     );

//     if (plant.rows.length === 0) {
//       return res.status(404).json({ message: "Plant not found" });
//     }

//     const plantId = plant.rows[0].id;

//     // Insert into the questions_form table
//     await pool.query(
//       `INSERT INTO questions_form
//       (plant_id, water_scheduled, insects_present, fertilizers_applied, soil_level_maintained, tree_burnt, unwanted_grass, water_logging, compound_maintained, comments, submitted_by_name, submitted_by_phone)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
//       [
//         plantId,
//         water_scheduled,
//         insects_present,
//         fertilizers_applied,
//         soil_level_maintained,
//         tree_burnt,
//         unwanted_grass,
//         water_logging,
//         compound_maintained,
//         comments,
//         userName,
//         userPhone,
//       ]
//     );

//     // Update plant health status
//     const healthStatus =
//       water_scheduled === "true" &&
//       fertilizers_applied === "true" &&
//       soil_level_maintained === "true" &&
//       compound_maintained === "true" &&
//       insects_present !== "true" &&
//       unwanted_grass !== "true" &&
//       water_logging !== "true" &&
//       tree_burnt !== "true"
//         ? "Good"
//         : "Infected";

//     await pool.query("UPDATE plants SET health_status = $1 WHERE id = $2", [
//       healthStatus,
//       plantId,
//     ]);

//     res.status(200).json({ message: "Form submitted successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error submitting form" });
//   }
// };

// module.exports = { submitForm };

const submitForm = async (req, res) => {
  try {
    const {
      plantZone,
      plantNumber,
      water_scheduled = false,
      insects_present = false,
      fertilizers_applied = false,
      soil_level_maintained = false,
      tree_burnt = false,
      unwanted_grass = false,
      water_logging = false,
      compound_maintained = false,
      comments,
    } = req.body;

    // Ensure user info is present
    const userId = req.user?.id;
    const userName = req.user?.full_name || "Unknown";
    const userPhone = req.user?.phone_number || "0000000000";

    if (!userId) {
      return res.status(400).json({ message: "User is not authenticated." });
    }

    // Parse boolean fields from string to actual booleans
    const parsedBooleans = {
      water_scheduled: water_scheduled === "true",
      insects_present: insects_present === "true",
      fertilizers_applied: fertilizers_applied === "true",
      soil_level_maintained: soil_level_maintained === "true",
      tree_burnt: tree_burnt === "true",
      unwanted_grass: unwanted_grass === "true",
      water_logging: water_logging === "true",
      compound_maintained: compound_maintained === "true",
    };

    // Find the plant ID
    const plant = await pool.query(
      "SELECT id FROM plants WHERE plant_zone = $1 AND plant_number = $2",
      [plantZone, plantNumber]
    );

    if (plant.rows.length === 0) {
      return res.status(404).json({ message: "Plant not found" });
    }

    const plantId = plant.rows[0].id;

    // Insert into the questions_form table
    await pool.query(
      `INSERT INTO questions_form 
        (plant_id, water_scheduled, insects_present, fertilizers_applied, soil_level_maintained, tree_burnt, unwanted_grass, water_logging, compound_maintained, comments, submitted_by_name, submitted_by_phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        plantId,
        parsedBooleans.water_scheduled,
        parsedBooleans.insects_present,
        parsedBooleans.fertilizers_applied,
        parsedBooleans.soil_level_maintained,
        parsedBooleans.tree_burnt,
        parsedBooleans.unwanted_grass,
        parsedBooleans.water_logging,
        parsedBooleans.compound_maintained,
        comments,
        userName,
        userPhone,
      ]
    );

    // Update plant health status
    const healthStatus =
      parsedBooleans.water_scheduled &&
      parsedBooleans.fertilizers_applied &&
      parsedBooleans.soil_level_maintained &&
      parsedBooleans.compound_maintained &&
      !parsedBooleans.insects_present &&
      !parsedBooleans.unwanted_grass &&
      !parsedBooleans.water_logging &&
      !parsedBooleans.tree_burnt
        ? "Good"
        : "Infected";

    await pool.query("UPDATE plants SET health_status = $1 WHERE id = $2", [
      healthStatus,
      plantId,
    ]);

    res.status(200).json({ message: "Form submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error submitting form" });
  }
};

module.exports = { submitForm };
