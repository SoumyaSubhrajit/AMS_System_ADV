const pool = require('../database/index');

exports.getDashboardSummary = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // To get total number of assets
    const [totalAssetsResult] = await connection.query('SELECT COUNT(*) AS totalAssets FROM assets');

    // To get total number of active assets
    const [activeAssetsResult] = await connection.query("SELECT COUNT(*) AS activeAssets FROM assets WHERE status = 'Active'");

    // To get total number of employees
    const [totalEmployeesResult] = await connection.query('SELECT COUNT(*) AS totalEmployees FROM employee');

    connection.release();

    const summary = {
      totalAssets: totalAssetsResult[0].totalAssets,
      activeAssets: activeAssetsResult[0].activeAssets,
      totalEmployees: totalEmployeesResult[0].totalEmployees,
    };

    res.json(summary);

  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Error fetching dashboard summary' });
  }
};
