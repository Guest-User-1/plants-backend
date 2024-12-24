const pool = require("../config/db");

// Get all users zone-wise
exports.getAllUsers = async (req, res) => {
  try {
    // const { role } = req.user;

    // // Allow only admin roles to fetch all users
    // if (role !== "super-admin" && role !== "zonal-admin") {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    const result = await pool.query(
      "SELECT id, full_name, phone_number, email, zone, vibhaag, role FROM users ORDER BY zone"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Search users by name or phone number
exports.searchUsers = async (req, res) => {
  try {
    const { search } = req.query;

    const result = await pool.query(
      `SELECT id, full_name, phone_number, email, zone, vibhaag, role 
      FROM users 
      WHERE full_name ILIKE $1 OR phone_number ILIKE $2 
      ORDER BY zone`,
      [`%${search}%`, `%${search}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone_number, email, zone, vibhaag, role } = req.body;

    await pool.query(
      `UPDATE users 
      SET full_name = $1, phone_number = $2, email = $3, zone = $4, vibhaag = $5, role = $6
      WHERE id = $7`,
      [full_name, phone_number, email, zone, vibhaag, role, id]
    );

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
