const pool = require('../database/index');
 
const editAll = async (req, res) => {
    const {
        empid, empname, empdesignation, empemailid, laptoppassword, emailpassword,
        slno, productid, producttype, productmodel, status, productbrand, productserialno,
        issuedate, returndate, idType
    } = req.body;
    const { id } = req.params;
 
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
 
        if (idType === 'employee') {
            // Update employee table if fields are present
            if (id && (empname || empdesignation || empemailid || laptoppassword || emailpassword)) {
                const sqlEmployee = `
                    UPDATE employee
                    SET empname = COALESCE(?, empname),
                        empdesignation = COALESCE(?, empdesignation),
                        empemailid = COALESCE(?, empemailid),
                        laptoppassword = COALESCE(?, laptoppassword),
                        emailpassword = COALESCE(?, emailpassword)
                    WHERE empid = ?`;
 
                const [employeeResult] = await connection.query(sqlEmployee, [empname, empdesignation, empemailid, laptoppassword, emailpassword, id]);
 
                if (employeeResult.affectedRows === 0) {
                    throw new Error('Employee not found');
                }
            }
        } else if (idType === 'assets') {
            // Update assets table if fields are present
            if ((status === "Available" || status === "Defective") && id && (producttype || productmodel || status || empid || productbrand || productserialno)) {
                const sqlAssets = `
                    UPDATE assets
                    SET producttype = COALESCE(?, producttype),
                        productmodel = COALESCE(?, productmodel),
                        status = COALESCE(?, status),
                        empid = NULL,
                        productbrand = COALESCE(?, productbrand),
                        productserialno = COALESCE(?, productserialno)
                    WHERE productid = ?`;
 
                const [assetResult] = await connection.query(sqlAssets, [producttype, productmodel, status, productbrand, productserialno, id]);
 
                if (assetResult.affectedRows === 0) {
                    throw new Error('Asset not found');
                }
            } else {
                const sqlAssets = `
                    UPDATE assets
                    SET producttype = COALESCE(?, producttype),
                        productmodel = COALESCE(?, productmodel),
                        status = COALESCE(?, status),
                        empid = COALESCE(?, empid),
                        productbrand = COALESCE(?, productbrand),
                        productserialno = COALESCE(?, productserialno)
                    WHERE productid = ?`;
 
                const [assetResult] = await connection.query(sqlAssets, [producttype, productmodel, status, empid, productbrand, productserialno, id]);
 
                if (assetResult.affectedRows === 0) {
                    throw new Error('Asset not found');
                }
            }
        } else if (idType === 'history') {
            // Update history table if fields are present
            if (empid && id && (issuedate || returndate)) {
                const sqlHistory = `
                    UPDATE history
                    SET issuedate = COALESCE(?, issuedate),
                        returndate = COALESCE(?, returndate)
                    WHERE empid = ? AND productid = ?`;
 
                const [historyResult] = await connection.query(sqlHistory, [issuedate, returndate, empid, id]);
 
                if (historyResult.affectedRows === 0) {
                    throw new Error('History record not found');
                }
            }
        } else {
            throw new Error('Invalid idType provided');
        }
 
        await connection.commit();
        connection.release();
 
        res.json({ message: 'Records updated successfully' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error(error);
        res.status(500).json({ error: 'Error updating records' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
 
module.exports = {
    editAll,
};