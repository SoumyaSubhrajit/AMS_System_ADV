const express = require("express")
const router = express.Router()

const employeeController = require("../controller/employee.controller")

router.post("/addempdetails",employeeController.createEmployee)
router.put("/editempdetails/:id",employeeController.editEmployee)
router.get("/paginateemployee",employeeController.paginateEmployee)

module.exports = router