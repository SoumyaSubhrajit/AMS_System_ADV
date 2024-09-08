const fs = require('fs');
const path = require('path');
const pool = require("../database/index");
const { error } = require('console');

const assetController = {
    getAll: async (req, res) => {
        try {
            const [row, fields] = await pool.query("SELECT DISTINCT * FROM employee INNER JOIN assets ON employee.empid = assets.empid INNER JOIN history ON employee.empid=history.empid");
            const dbFilePath = path.join(__dirname, 'db.json');
            fs.writeFile(dbFilePath, JSON.stringify(row), (err) => {
                if (err) {
                    console.error('Error writing to db.json:', err);
                    return res.status(500).json({ error: 'Error writing to db.json' });
                }
                console.log('Data successfully written to db.json');
                res.json({
                    data: row
                });
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).json({ error: 'Error fetching data from database' });
        }
    },
    //Add Assets
    create: async (req, res) =>{
        try {
            const {productid, producttype, productmodel, status, empid, productbrand, productserialno} = req.body
            const slno = null;
            if(status === 'Available' || status === 'Defective') {
                const sql = "insert into assets values(?, ?, ?, ?, ?, ?, ?, ?)"
                const [rows, fields] = await pool.query(sql, [slno, productid, producttype, productmodel, status, null, productbrand, productserialno])
                res.json({
                    message: 'Asset created successfully',
                    data: rows
                })
            } else if(status === 'Active') {
                const sql = "insert into assets values(?, ?, ?, ?, ?, ?, ?, ?)"
                const [rows, fields] = await pool.query(sql, [slno, productid, producttype, productmodel, status, empid, productbrand, productserialno])
                res.json({
                    message: 'Asset created successfully',
                    data: rows
                })
            }
           
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    },    

    // For Dashboard Paged
    addAssetAndEmployee: async (req, res) => {
        const {
            productid, producttype, productmodel, status, productbrand, productserialno,
            empid, empname, empdesignation, empemailid, laptoppassword, emailpassword,
            issuedate, returndate
        } = req.body;
        const slno = null
        let connection;
        try {
            connection = await pool.getConnection();
   
            await connection.beginTransaction();
   
            // Check if empid already exists
            const [existingEmployee] = await connection.query('SELECT empid FROM employee WHERE empid = ?', [empid]);
   
            let employeeResult;
            if (existingEmployee.length === 0) {
                // Insert into employee table if empid does not exist
                [employeeResult] = await connection.query(
                    'INSERT INTO employee (empid, empname, empdesignation, empemailid, laptoppassword, emailpassword) VALUES (?, ?, ?, ?, ?, ?)',
                    [empid, empname, empdesignation, empemailid, laptoppassword, emailpassword]
                );
            }
   
            // Insert into assets table
            const [assetResult] = await connection.query(
                'INSERT INTO assets (slno, productid, producttype, productmodel, status, empid, productbrand, productserialno) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [slno, productid, producttype, productmodel, status, empid, productbrand, productserialno]
            );
   
            // Insert into history table
            const [historyResult] = await connection.query(
                'INSERT INTO history (empid, productid, issuedate, returndate) VALUES (?, ?, ?, ?)',
                [empid, productid, issuedate, returndate]
            );
 
            await connection.commit();
   
            connection.release();
   
            res.json({
                message: 'Asset and Employee added successfully',
                assetId: assetResult.insertId,
                employeeId: employeeResult ? employeeResult.insertId : empid,
                historyId: historyResult.insertId
            });
        } catch (error) {
           
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            console.error(error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    //Individual Table Details
    getData : async (req, res) => {
        try {
            // Query database for assets, employees, and history
            const [assets] = await pool.query('SELECT * FROM assets');
            const [employees] = await pool.query('SELECT * FROM employee');
            const [history] = await pool.query('SELECT * FROM history');
     
            // Structure data for db.json
            const data = {
                assets: assets.map(asset => ({
                    "slno": asset.slno,
                    "productid": asset.productid,
                    "producttype": asset.producttype,
                    "productmodel": asset.productmodel,
                    "status": asset.status,
                    "empid": asset.empid,
                    "productbrand": asset.productbrand,
                    "productserialno": asset.productserialno
                })),
                employee: employees.map(employee => ({
                    "empid": employee.empid,
                    "empname": employee.empname,
                    "empdesignation": employee.empdesignation,
                    "empemailid": employee.empmailid,
                    "laptoppassword": employee.laptoppassword,
                    "emailpassword": employee.emailpassword
                })),
                history: history.map(record => ({
                    "empid": record.empid,
                    "productid": record.productid,
                    "issuedate": record.issuedate,
                    "returndate": record.returndate
                }))
            };
     
            // Write data to db.json file
            const filePath = path.join(__dirname, '..', 'db.json');
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
     
            // Respond with data as JSON
            res.json({ data });
        } catch (error) {
            console.error(error); 
            res.status(500).json({ error: 'An error occurred while fetching data.' });
        }
    },

    //Edit API
    editAll: async (req, res) => {
        const { empid, empname, empdesignation, empemailid, laptoppassword, emailpassword, slno, producttype, productmodel, status, productbrand, productserialno, issuedate, returndate } = req.body;
        const {id} = req.params
        let connection;
        try {
            connection = await pool.getConnection();
 
            await connection.beginTransaction();
 
            // Update assets table if fields are present
            if ((status === 'Available' || status === 'Defective') && id && (slno || producttype || productmodel || status || empid || productbrand || productserialno || issuedate || returndate)) {
               
                const sqlHistory = `
                    INSERT INTO history (empid, productid, issuedate, returndate)
                    VALUES ((SELECT empid FROM assets WHERE productid = ?), ?, ?, ?)`;
 
                    await connection.query(sqlHistory, [id, id, issuedate, returndate]);
 
                const sqlAssets = `
                    UPDATE assets
                    SET producttype = COALESCE(?, producttype),
                        productmodel = COALESCE(?, productmodel),
                        status = COALESCE(?, status),
                        empid = NULL,
                        productbrand = COALESCE(?, productbrand),
                        productserialno = COALESCE(?, productserialno)
                    WHERE productid = ?`;
 
                    await connection.query(sqlAssets, [producttype, productmodel, status, productbrand, productserialno,id]);
 
   
            }else if ((status === 'Active') && id && (slno || producttype || productmodel || status || empid || productbrand || productserialno || empname || empdesignation || empemailid || laptoppassword || emailpassword || issuedate || returndate)) {
 
                const sqlEmployee = `
                    UPDATE employee
                    SET empname = COALESCE(?, empname),
                        empdesignation = COALESCE(?, empdesignation),
                        empemailid = COALESCE(?, empemailid),
                        laptoppassword = COALESCE(?, laptoppassword),
                        emailpassword = COALESCE(?, emailpassword)
                    WHERE empid = (SELECT empid FROM assets WHERE productid = ?)`;
 
                    await connection.query(sqlEmployee, [empname, empdesignation, empemailid, laptoppassword, emailpassword, id]);
 
                const sqlAssets = `
                    UPDATE assets
                    SET producttype = COALESCE(?, producttype),
                        productmodel = COALESCE(?, productmodel),
                        status = COALESCE(?, status),
                        empid = COALESCE(?, empid),
                        productbrand = COALESCE(?, productbrand),
                        productserialno = COALESCE(?, productserialno)
                    WHERE productid = ?`;
 
                    await connection.query(sqlAssets, [producttype, productmodel, status, empid, productbrand, productserialno,id]);
 
                    const curEmp = `SELECT empid from assets WHERE productid = ?`;
                    await connection.query(curEmp, id);
 
                    if(curEmp[0].empid === empid){
 
                    const sqlHistory = `
                    UPDATE history SET
                        issuedate = COALESCE(?, issuedate),
                        returndate = COALESCE(?, returndate)
                    WHERE empid = (SELECT empid FROM assets WHERE productid = ?) AND productid = ?`;
 
                    await connection.query(sqlHistory, [empid, issuedate, returndate, id, id]);
                    } else {
 
                        const sqlHistory = `
                    INSERT INTO history (empid, productid, issuedate, returndate)
                    VALUES ((SELECT empid FROM assets WHERE productid = ?), ?, ?, ?)`;
 
                    await connection.query(sqlHistory, [id, id, issuedate, returndate]);
 
                    }
            }
 
            await connection.commit();
            connection.release();
 
            res.json({
                message: 'Records updated successfully'
            });
        } catch (error) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            console.error(error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },


    // Pagination API For Asset.
    paginateAssets: async (req, res) => {
        const { page = 1, limit = 4 } = req.query;
        const offset = (page - 1) * limit;
   
        try {
          const [results] = await pool.query("SELECT * FROM assets LIMIT ? OFFSET ?", [parseInt(limit), parseInt(offset)]);
         
          // Get the total number of records to calculate total pages
          const [totalResults] = await pool.query("SELECT COUNT(*) as count FROM assets");
          const totalRecords = totalResults[0].count;
          const totalPages = Math.ceil(totalRecords / limit);
   
          res.json({
            data: results,
            pagination: {
              totalRecords,
              totalPages,
              currentPage: parseInt(page),
              pageSize: parseInt(limit)
            }
          });
        } catch (error) {
          console.error('Error fetching paginated assets:', error);
          res.status(500).json({ error: 'Error fetching paginated assets from database' });
        }
      },    
 
 
    // Pagination method for dashboard
    paginateDashboard: async (req, res) => {
        const { page = 1, limit = 4 } = req.query;
        const offset = (page - 1) * limit;
     
        try {
            // Main query to fetch data
            const [results] = await pool.query(
                `SELECT DISTINCT e.empname, e.empid, e.empdesignation, e.empemailid, a.productid, a.producttype, a.slno, a.productmodel, a.status,a.productbrand, a.productserialno, h.issuedate, h.returndate
                    FROM (
                        SELECT DISTINCT productid
                        FROM assets
                    ) AS distinct_products
                    INNER JOIN assets AS a ON distinct_products.productid = a.productid
                    INNER JOIN employee AS e ON e.empid = a.empid
                    INNER JOIN (
                        SELECT h1.productid, h1.empid, MAX(h1.issuedate) AS max_issuedate
                        FROM history h1
                        GROUP BY h1.productid, h1.empid
                    ) AS latest_history ON latest_history.productid = a.productid 
                    INNER JOIN history AS h ON h.productid = latest_history.productid 
                                            AND h.empid = latest_history.empid 
                                            AND h.issuedate = latest_history.max_issuedate
                 LIMIT ? OFFSET ?`,
                [parseInt(limit), parseInt(offset)]
            );
     
            // Query to get the total count of records
            const [totalRecords] = await pool.query(
                `SELECT COUNT(DISTINCT employee.empid, assets.productid) AS count
                 FROM employee
                 INNER JOIN assets ON employee.empid = assets.empid
                 INNER JOIN history ON employee.empid = history.empid`
            );
     
            const totalPages = Math.ceil(totalRecords[0].count / limit);
            
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json({
                data: results,
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalRecords: totalRecords[0].count
            });
        } catch (error) {
            console.error('Error fetching paginated data for dashboard:', error);
            res.status(500).json({ error: error.message });
        }
    },
  
    globalSearch: async (req, res) => {
        const { searchTerm, page = 1, limit = 4 } = req.query;
        const offset = (page - 1) * limit;
     
        try {
            const query = `
                SELECT DISTINCT
                    e.empid, e.empname, e.empdesignation, e.empemailid,
                    a.slno, a.productid, a.producttype, a.productmodel, a.status, a.productbrand, a.productserialno,
                    h.issuedate, h.returndate
                FROM
                    employee e
                INNER JOIN
                    assets a ON e.empid = a.empid
                INNER JOIN
                    history h ON a.productid = h.productid
                WHERE
                    e.empid LIKE ? OR e.empname LIKE ? OR e.empdesignation LIKE ? OR e.empemailid LIKE ? OR
                    a.productid LIKE ? OR a.producttype LIKE ? OR a.productmodel LIKE ? OR a.status LIKE ? OR a.productbrand LIKE ? OR a.productserialno LIKE ? OR
                    h.productid LIKE ? OR h.issuedate LIKE ? OR h.returndate LIKE ?
                LIMIT ? OFFSET ?
            `;
     
            const searchTermPattern = `%${searchTerm}%`;
            const [results] = await pool.query(query, [
                searchTermPattern, searchTermPattern, searchTermPattern, searchTermPattern,
                searchTermPattern, searchTermPattern, searchTermPattern, searchTermPattern, searchTermPattern, searchTermPattern,
                searchTermPattern, searchTermPattern, searchTermPattern, parseInt(limit), parseInt(offset)
            ]);
     
            // Query to get the total number of matching records
            const [totalRecords] = await pool.query(`
                SELECT COUNT(*) AS count
                FROM
                    employee e
                INNER JOIN
                    assets a ON e.empid = a.empid
                INNER JOIN
                    history h ON e.empid = h.empid
                WHERE
                    e.empid LIKE ? OR e.empname LIKE ? OR e.empdesignation LIKE ? OR e.empemailid LIKE ? OR
                    a.productid LIKE ? OR a.producttype LIKE ? OR a.productmodel LIKE ? OR a.status LIKE ? OR a.productbrand LIKE ? OR a.productserialno LIKE ? OR
                    h.productid LIKE ? OR h.issuedate LIKE ? OR h.returndate LIKE ?
            `, [
                searchTermPattern, searchTermPattern, searchTermPattern, searchTermPattern,
                searchTermPattern, searchTermPattern, searchTermPattern, searchTermPattern, searchTermPattern, searchTermPattern,
                searchTermPattern, searchTermPattern, searchTermPattern
            ]);
     
            const totalPages = Math.ceil(totalRecords[0].count / limit);
     
            res.json({
                message: 'Global search results',
                data: results,
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalRecords: totalRecords[0].count
            });
        } catch (error) {
            console.error('Error during global search:', error);
            res.status(500).json({ error: 'Error performing global search' });
        }
    },

    assetsSearch: async (req, res) => {
        const { searchTerm, page = 1, limit = 4 } = req.query;
        const offset = (page - 1) * limit;
     
        try {
            const query = `
                SELECT
                    a.slno, a.productid, a.producttype, a.productmodel, a.status, a.productbrand, a.productserialno
                FROM assets a
                WHERE
                    a.productid LIKE ? OR a.producttype LIKE ? OR a.productmodel LIKE ? OR a.status LIKE ? OR a.productbrand LIKE ? OR a.productserialno LIKE ? OR a.empid LIKE ?
                LIMIT ? OFFSET ?
            `;
     
            const searchTermPattern = `%${searchTerm}%`;
            const [results] = await pool.query(query, [
                searchTermPattern, searchTermPattern, searchTermPattern, searchTermPattern,
                searchTermPattern, searchTermPattern, searchTermPattern, parseInt(limit), parseInt(offset)
            ]);
     
            // Query to get the total number of matching records
            const [totalRecords] = await pool.query(`
                SELECT COUNT(*) AS count
                FROM
                    assets a
                WHERE
                    a.productid LIKE ? OR a.producttype LIKE ? OR a.productmodel LIKE ? OR a.status LIKE ? OR a.productbrand LIKE ? OR a.productserialno LIKE ? OR a.empid LIKE ?
            `, [
                searchTermPattern, searchTermPattern, searchTermPattern, searchTermPattern,
                searchTermPattern, searchTermPattern, searchTermPattern
            ]);
     
            const totalPages = Math.ceil(totalRecords[0].count / limit);
     
            res.json({
                message: 'Global search results',
                data: results,
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalRecords: totalRecords[0].count
            });
        } catch (error) {
            console.error('Error during global search:', error);
            res.status(500).json({ error: 'Error performing global search' });
        }
    },
    
    productIdValidation:async(req, res) => {
        const {productid} = req.body
        let connection
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();
            if(productid){
                const query = "SELECT COUNT(*) as totalNumber FROM assets WHERE productid = ? "
                const [val] = await connection.query(query, productid);
 
                const totalRow = {
                    totalNumber: val[0].totalNumber
                  };
                console.log(totalRow.totalNumber);
                if(totalRow.totalNumber > 0){
                    res.json({
                        message: true
                    });
                }else{
                    res.json({
                        message: false
                    });
                }
            }
            await connection.commit();
            connection.release();
           
        } catch (error) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            console.error(error);
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
};
module.exports = assetController;