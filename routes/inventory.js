var express = require('express');
var router = express.Router();
let inventoryController = require('../controllers/inventory');

function parseQuantity(rawQuantity) {
    let quantity = Number(rawQuantity);
    return Number.isFinite(quantity) ? quantity : NaN;
}

function validateInventoryPayload(body) {
    let quantity = parseQuantity(body.quantity);

    if (!body.product || !Number.isFinite(quantity) || quantity <= 0) {
        return {
            isValid: false,
            message: 'product and quantity (> 0) are required'
        };
    }

    return {
        isValid: true,
        quantity: quantity
    };
}

async function handleInventoryMutation(req, res, action) {
    let validation = validateInventoryPayload(req.body);
    if (!validation.isValid) {
        return res.status(400).send({ message: validation.message });
    }

    try {
        let result = await action(req.body.product, validation.quantity);
        res.send(result);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
}

router.get('/', async function (req, res) {
    try {
        let result = await inventoryController.GetAllInventories();
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.get('/:id', async function (req, res) {
    try {
        let result = await inventoryController.GetInventoryById(req.params.id);
        if (!result) {
            return res.status(404).send({ message: 'Inventory not found' });
        }

        res.send(result);
    } catch (error) {
        res.status(404).send({ message: 'Inventory not found' });
    }
});

router.post('/add_stock', async function (req, res) {
    await handleInventoryMutation(req, res, inventoryController.AddStock);
});

router.post('/remove_stock', async function (req, res) {
    await handleInventoryMutation(req, res, inventoryController.RemoveStock);
});

router.post('/reservation', async function (req, res) {
    await handleInventoryMutation(req, res, inventoryController.Reservation);
});

router.post('/sold', async function (req, res) {
    await handleInventoryMutation(req, res, inventoryController.Sold);
});

module.exports = router;
