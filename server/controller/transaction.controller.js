const pool = require('../database/index');

const transactionController = {
  viewTransaction: async (req, res) => {
    try {
      const sqlQuery = `
      SELECT DISTINCT
          e.empid,
          a.producttype,
          a.productid,
          h.issuedate,
          h.returndate,
          a.remarks
      FROM
          employee e
      INNER JOIN
          assets a ON e.empid = a.empid
      INNER JOIN
          history h ON e.empid = h.empid
      WHERE
          a.status = 'Active';
      `;
 
      // Use async/await with pool.query
      const [results, fields] = await pool.query(sqlQuery);
 
      if (results.length === 0) {
        return res.status(404).json({ message: 'No transactions found' });
      }
 
      res.status(200).json(results);
    } catch (error) {
      console.error('Error in viewTransaction:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = transactionController;