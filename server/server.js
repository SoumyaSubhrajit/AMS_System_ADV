const express = require("express")
const app = express()
const cors = require('cors');

app.use(cors());

require('dotenv').config()

const assetRouter = require('./routes/asset.router')
const dashboardRouter = require('./routes/dashboard.router')
const singleassetRouter = require('./routes/singleassetedit.router')
const employeeRouter = require('./routes/employee.router')
const  transactionRouter  = require('./routes/transaction.router');


app.use(express.urlencoded({extended: false}))
app.use(express.json())

//Routes
app.use("/api/v1/asset", assetRouter)
app.use("/api/v1/asset", dashboardRouter)
app.use("/api/v1/asset", singleassetRouter)
app.use("/api/v1/asset", employeeRouter)
app.use("/api/v1/asset", transactionRouter)

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
})