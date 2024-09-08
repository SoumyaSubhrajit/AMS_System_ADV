const pool = require('../database/index');

const employeeController = {
    //Add Employees
    createEmployee: async (req, res) =>{
        try {
            const {empid, empname, empdesignation, empemailid, laptoppassword, emailpassword} = req.body
                const sql = "insert into employee values(?, ?, ?, ?, ?, ?)"
                const [rows, fields] = await pool.query(sql, [empid, empname, empdesignation, empemailid, laptoppassword, emailpassword])
                res.json({
                    message: 'Employee added successfully',
                    data: rows
                })
           
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    },  

    //edit Employees
    editEmployee: async (req, res) =>{
        try {
            const {empname, empdesignation, empemailid, laptoppassword, emailpassword} = req.body
            const {id} = req.params
                const sql = "UPDATE employee SET empname = COALESCE(?, empname), empdesignation = COALESCE(?, empdesignation), empemailid = COALESCE(?, empemailid), laptoppassword = COALESCE(?, laptoppassword), emailpassword = COALESCE(?, emailpassword) WHERE empid = ?"
                const [rows, fields] = await pool.query(sql, [empname, empdesignation, empemailid, laptoppassword, emailpassword, id])
                res.json({
                    message: 'Employee details updated successfully',
                    data: rows
                })
           
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    },

    paginateEmployee: async (req,res) => {
        const { page = 1, limit = 4 } = req.query;
        const offset = (page - 1) * limit;
          try{
      const [results] = await pool.query('SELECT * FROM employee LIMIT ? OFFSET ?', [parseInt(limit), parseInt(offset)]);
       
        // Calculate total number of pages
        const [totalResults] = await pool.query("SELECT COUNT(*) as count FROM employee");
        const totalRecords = totalResults[0].count;
        const totalPages = Math.ceil(totalRecords / limit);
   
        res.status(200).json({
          data: results,
              pagination: {
                totalRecords,
                totalPages,
                currentPage: parseInt(page),
                pageSize: parseInt(limit)
              }
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
};

module.exports = employeeController;