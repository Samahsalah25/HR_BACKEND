const Assets = require("../models/AssetsSchema.js")
const Employee = require('../models/employee');

exports.createAssets = async (req, res) => {
    try {
        const { assetType, assetName, description, serialNumber, brand, model, purchasePrice, supplierName, invoiceNumber, warrantyPeriod } = req.body

        const assets = await Assets.create({ assetType, assetName, description, serialNumber, brand, model, purchasePrice, supplierName, invoiceNumber, warrantyPeriod })

        return res.status(201).json({
            success: true,
            data: assets
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
}


exports.updateAssets = async (req, res) => {
    try {
        const { id } = req.params
        const assets = await Assets.findOneAndUpdate({ _id: id }, { $set: { ...req.body } }, { new: true })
        if (!assets) {
            return res.status(400).json({
                status: false,
                message: "لم يتم العثور على العهدة المطلوبة"
            });
        }
        return res.status(200).json({
            status: "success",
            message: "تم تحديث بيانات العهدة بنجاح.",
            data: assets
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ status: 'fail', message: err.message });
    }

}

exports.deleteAssets = async (req, res) => {
    try {
        const { id } = req.params
        const assets = await Assets.findOneAndDelete({ _id: id })
        if (!assets) {
            return res.status(400).json({
                status: false,
                message: "لم يتم العثور على العهدة المطلوبة"
            });
        }
        return res.status(200).json({
            status: "success",
            message: "تم حذف بيانات العهدة بنجاح.",
            data: assets
        });

    } catch (err) {
        console.error(err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
}


exports.getAssetsById = async (req, res) => {
    try {
        const { id } = req.params
        const assets = await Assets.find({ _id: id }).select('assetId assetName status currentEmployee');
        if (assets.length == 0) {
            return res.status(400).json({
                status: false,
                message: "لم يتم العثور على العهدة المطلوبة"
            });
        }
        return res.status(200).json({
            status: "success",
            message: "success",
            data: assets
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ status: 'fail', message: err.message });
    }

}

exports.getAllAssets = async (req, res) => {
    try {
        const { assetType } = req.body
        const assets = await Assets.find({ assetType: assetType }).select('assetId assetName status currentEmployee');
        if (assets.length == 0) {
            return res.status(400).json({
                status: false,
                message: "لم يتم العثور على العهدة المطلوبة"
            });
        }
        return res.status(200).json({
            status: "success",
            message: "success",
            data: assets
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ status: 'fail', message: err.message });
    }

}








