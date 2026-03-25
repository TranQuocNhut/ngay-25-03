let inventoryModel = require('../schemas/inventory');

const productPopulate = {
    path: 'product',
    select: 'title slug price description images category isDeleted'
};

async function populateInventoryDocument(inventory) {
    await inventory.populate(productPopulate);
    return inventory;
}

async function getInventoryByProductOrThrow(productId) {
    let inventory = await inventoryModel.findOne({ product: productId });
    if (!inventory) {
        throw new Error('Inventory not found for this product');
    }

    return inventory;
}

async function updateInventoryOrThrow(query, update, insufficientMessage) {
    let inventory = await inventoryModel.findOneAndUpdate(
        query,
        update,
        {
            new: true,
            runValidators: true
        }
    ).populate(productPopulate);

    if (inventory) {
        return inventory;
    }

    await getInventoryByProductOrThrow(query.product);
    throw new Error(insufficientMessage);
}

module.exports = {
    CreateInventory: async function (productId) {
        let inventory = await inventoryModel.findOne({ product: productId });
        if (inventory) {
            return await populateInventoryDocument(inventory);
        }

        inventory = await inventoryModel.create({
            product: productId,
            stock: 0,
            reserved: 0,
            soldCount: 0
        });

        return await populateInventoryDocument(inventory);
    },

    GetAllInventories: async function () {
        return await inventoryModel.find()
            .sort({ createdAt: -1 })
            .populate(productPopulate);
    },

    GetInventoryById: async function (id) {
        return await inventoryModel.findById(id).populate(productPopulate);
    },

    GetInventoryByProduct: async function (productId) {
        return await inventoryModel.findOne({ product: productId }).populate(productPopulate);
    },

    AddStock: async function (productId, quantity) {
        let inventory = await inventoryModel.findOneAndUpdate(
            { product: productId },
            { $inc: { stock: quantity } },
            {
                new: true,
                runValidators: true
            }
        ).populate(productPopulate);

        if (!inventory) {
            throw new Error('Inventory not found for this product');
        }

        return inventory;
    },

    RemoveStock: async function (productId, quantity) {
        return await updateInventoryOrThrow(
            {
                product: productId,
                stock: { $gte: quantity }
            },
            { $inc: { stock: -quantity } },
            'Not enough stock to remove'
        );
    },

    Reservation: async function (productId, quantity) {
        return await updateInventoryOrThrow(
            {
                product: productId,
                stock: { $gte: quantity }
            },
            { $inc: { stock: -quantity, reserved: quantity } },
            'Not enough stock to reserve'
        );
    },

    Sold: async function (productId, quantity) {
        return await updateInventoryOrThrow(
            {
                product: productId,
                reserved: { $gte: quantity }
            },
            { $inc: { reserved: -quantity, soldCount: quantity } },
            'Not enough reserved stock to sell'
        );
    }
};
