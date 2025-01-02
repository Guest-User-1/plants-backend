const pool = require("../config/db");

// Helper function to determine health status
const calculateHealthStatus = (answers) => {
  const {
    water_scheduled = false,
    fertilizers_applied = false,
    soil_level_maintained = false,
    compound_maintained = false,
    insects_present = false,
    unwanted_grass = false,
    water_logging = false,
    tree_burnt = false,
    tree_inspection = false,
    tree_height = false,
    water_in_compound = false,
    tree_dead = false,
  } = answers;

  if (
    insects_present ||
    unwanted_grass ||
    tree_burnt ||
    water_in_compound ||
    tree_dead
  ) {
    return "Infected";
  }

  if (
    water_scheduled &&
    fertilizers_applied &&
    water_logging &&
    soil_level_maintained &&
    compound_maintained &&
    tree_inspection &&
    tree_height
  ) {
    return "Good";
  }

  return "Infected"; // Default to Infected if conditions aren't met
};

// Create a new report
const createPlantReport = async (req, res) => {
  const userId = req.user.id;
  const {
    plant_number,
    plant_zone,
    water_scheduled,
    insects_present,
    fertilizers_applied,
    soil_level_maintained,
    tree_burnt,
    unwanted_grass,
    water_logging,
    compound_maintained,
    tree_inspection,
    water_in_compound,
    tree_height,
    tree_dead,
    comments,
  } = req.body;

  console.log("Plant Number:", plant_number);
  console.log("Plant Zone:", plant_zone);

  if (!plant_number || !plant_zone) {
    return res
      .status(400)
      .json({ message: "Plant number and zone are required" });
  }

  const userResult = await pool.query(
    "SELECT full_name, phone_number FROM users WHERE id = $1",
    [userId]
  );
  if (userResult.rows.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }
  //   const { full_name, user_zone, vibhaag } = userResult.rows[0];
  const { full_name, phone_number } = userResult.rows[0]; // From authMiddleware

  const health_status = calculateHealthStatus({
    water_scheduled,
    fertilizers_applied,
    soil_level_maintained,
    compound_maintained,
    insects_present,
    unwanted_grass,
    water_logging,
    tree_burnt,
    tree_inspection,
    water_in_compound,
    tree_height,
    tree_dead,
  });

  try {
    const result = await pool.query(
      `INSERT INTO plant_reports 
                (plant_number, plant_zone, water_scheduled, insects_present, fertilizers_applied, soil_level_maintained, tree_burnt, unwanted_grass, water_logging, compound_maintained, tree_inspection, water_in_compound, tree_height, tree_dead, comments, health_status, reported_by_full_name, reported_by_phone) 
             VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [
        plant_number,
        plant_zone,
        water_scheduled,
        insects_present,
        fertilizers_applied,
        soil_level_maintained,
        tree_burnt,
        unwanted_grass,
        water_logging,
        compound_maintained,
        tree_inspection,
        water_in_compound,
        tree_height,
        tree_dead,
        comments,
        health_status,
        full_name,
        phone_number,
      ]
    );

    // Update health status in the plants table
    await pool.query(
      `UPDATE plants SET health_status = $1 WHERE plant_number = $2 AND plant_zone = $3`,
      [health_status, plant_number, plant_zone]
    );

    res.status(201).json({
      message: "Report submitted successfully",
      report: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error submitting report", error: err.message });
  }
};

const getPlantDateRecord = async (req, res) => {
  const { zone, number, date } = req.query;

  if (!zone || !number || !date) {
    return res
      .status(400)
      .json({ message: "Please provide zone, number, and date!" });
  }

  try {
    const query = `
      SELECT * FROM plant_reports 
      WHERE plant_zone = $1 AND plant_number = $2 AND DATE(report_date) = $3;
    `;
    const params = [zone, number, date];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No reports found!" });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error fetching records", error: err.message });
  }
};

// const getPlantDetailsWithLastReport = async (req, res) => {
//   try {
//     const query = `
//       SELECT
//           p.id AS plant_id,
//           p.plant_name,
//           p.plant_number,
//           p.plant_zone,
//           p.health_status,
//           p.latitude,
//           p.longitude,
//           p.height,
//           p.stump,
//           p.girth,
//           p.plant_image,
//           p.upload_date,
//           p.updated_time,
//           pr.report_date AS last_reported_date
//       FROM
//           plants p
//       LEFT JOIN
//           plant_reports pr
//       ON
//           p.plant_number = pr.plant_number AND p.plant_zone = pr.plant_zone
//       WHERE
//           pr.report_date = (
//               SELECT MAX(report_date)
//               FROM plant_reports
//               WHERE
//                   plant_reports.plant_number = p.plant_number
//                   AND plant_reports.plant_zone = p.plant_zone
//           )
//       OR pr.report_date IS NULL;
//     `;

//     const result = await pool.query(query);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "No plant details found!" });
//     }

//     res.status(200).json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res
//       .status(500)
//       .json({ message: "Error fetching plant details", error: err.message });
//   }
// };

// Update super admin comment for a specific report
const getPlantDetailsWithLastReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id AS plant_id,
        p.plant_name,
        p.plant_number,
        p.plant_zone,
        p.health_status,
        p.latitude,
        p.longitude,
        p.height,
        p.stump,
        p.girth,
        p.plant_image,
        p.upload_date,
        p.updated_time,
        pr.report_date AS last_reported_date
      FROM 
        plants p
      LEFT JOIN 
        plant_reports pr
      ON 
        p.plant_number = pr.plant_number AND p.plant_zone = pr.plant_zone
      WHERE 
        pr.report_date = (
          SELECT MAX(report_date)
          FROM plant_reports
          WHERE
            plant_reports.plant_number = p.plant_number
            AND plant_reports.plant_zone = p.plant_zone
        )
      OR pr.report_date IS NULL;
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No plant details found!" });
    }

    // Transform the rows to include proper image data URLs
    const transformedRows = result.rows.map((row) => {
      try {
        if (!row.plant_image) {
          return { ...row, plant_image: null };
        }

        // Check if the image is already a Buffer
        const imageBuffer = Buffer.isBuffer(row.plant_image)
          ? row.plant_image
          : Buffer.from(row.plant_image);

        // Detect image type from buffer header
        let mimeType = "image/jpeg"; // default
        if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
          mimeType = "image/png";
        }

        // Convert buffer to base64 and create data URL
        const base64Image = imageBuffer.toString("base64");

        return {
          ...row,
          plant_image: `data:${mimeType};base64,${base64Image}`,
        };
      } catch (error) {
        console.error(
          `Error processing image for plant ${row.plant_number}:`,
          error
        );
        return { ...row, plant_image: null };
      }
    });

    res.status(200).json(transformedRows);
  } catch (err) {
    console.error("Error in getPlantDetailsWithLastReport:", err);
    res.status(500).json({
      message: "Error fetching plant details",
      error: err.message,
    });
  }
};

const updateSuperAdminComment = async (req, res) => {
  const { id } = req.params; // Report ID from route parameters
  const { comment } = req.body; // New comment from request body

  try {
    const result = await pool.query(
      "UPDATE plant_reports SET super_admin_comment = $1 WHERE id = $2 RETURNING *",
      [comment, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({
      message: "Super Admin Comment updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error updating comment", error: error.message });
  }
};

const getPlantReports = async (req, res) => {
  const { zones, healthStatus } = req.query;

  try {
    const zoneFilter = zones ? `AND p.plant_zone = ANY($1)` : "";
    const healthFilter = healthStatus ? `AND p.health_status = $2` : "";

    const query = `
      SELECT 
        p.plant_number, 
        p.plant_name, 
        p.plant_zone,
        p.health_status, 
        r.water_scheduled,
        r.insects_present,
        r.fertilizers_applied,
        r.soil_level_maintained,
        r.tree_burnt,
        r.unwanted_grass,
        r.water_logging,
        r.compound_maintained,
        r.tree_inspection,
        r.water_in_compound,
        r.tree_height,
        r.tree_dead,
        r.comments,
        r.report_date, 
        r.reported_by_full_name, 
        r.reported_by_phone
      FROM plants p
      JOIN plant_reports r ON p.plant_number = r.plant_number AND p.plant_zone = r.plant_zone
      WHERE r.report_date = (
        SELECT MAX(report_date) 
        FROM plant_reports 
        WHERE plant_reports.plant_number = r.plant_number AND plant_reports.plant_zone = p.plant_zone
      )
      ${zoneFilter}
      ${healthFilter}
      ORDER BY r.report_date DESC
    `;

    const params = [];
    if (zones) params.push(zones.split(","));
    if (healthStatus) params.push(healthStatus);

    const results = await pool.query(query, params);
    res.json(results.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// module.exports = { createPlantReport, getPlantReports, getPlantDateRecord };
module.exports = {
  createPlantReport,
  getPlantDateRecord,
  getPlantDetailsWithLastReport,
  updateSuperAdminComment,
  getPlantReports,
};
