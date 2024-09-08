const express = require("express")
const router = express.Router()

const assetsController = require("../controller/asset.controller")


router.get("/dashboard", assetsController.getAll)
router.post("/assets", assetsController.create)
router.post("/assetempdetails", assetsController.addAssetAndEmployee)
router.get("/tabledetails", assetsController.getData)
router.put("/editall/:id", assetsController.editAll)
router.get("/paginateasset", assetsController.paginateAssets);
router.get("/paginatedashboard", assetsController.paginateDashboard);
router.get("/search", assetsController.globalSearch);
router.post("/checkpid", assetsController.productIdValidation)
router.get("/assetssearch", assetsController.assetsSearch);

module.exports = router