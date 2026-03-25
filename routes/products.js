var express = require('express');
var router = express.Router();
const slugify = require('slugify');
let productModel = require('../schemas/products');
let inventoryController = require('../controllers/inventory');

router.get('/', async function (req, res) {
  let queries = req.query;
  let titleQ = queries.title ? queries.title : '';
  let minPrice = queries.min ? queries.min : 0;
  let maxPrice = queries.max ? queries.max : 999999999;

  let result = await productModel.find(
    {
      isDeleted: false,
      title: new RegExp(titleQ, 'i'),
      price: {
        $gte: minPrice,
        $lte: maxPrice
      }
    }
  ).populate({
    path: 'category',
    select: 'name'
  });

  res.send(result);
});

router.get('/:id', async function (req, res) {
  try {
    let result = await productModel.findById(req.params.id);
    if (!result || result.isDeleted) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    res.send(result);
  } catch (error) {
    res.status(404).send({
      message: 'ID NOT FOUND'
    });
  }
});

router.post('/', async function (req, res) {
  let categoryId = req.body.category;
  if (categoryId === 'null' || categoryId === 'undefined' || categoryId === '') {
    categoryId = null;
  }

  let newProduct = new productModel({
    title: req.body.title,
    slug: slugify(req.body.title, {
      replacement: '-',
      remove: undefined,
      lower: true
    }),
    price: req.body.price,
    description: req.body.description,
    images: req.body.images,
    category: categoryId
  });

  try {
    await newProduct.save();

    try {
      await inventoryController.CreateInventory(newProduct._id);
    } catch (error) {
      await productModel.findByIdAndDelete(newProduct._id).catch(function () { });
      throw error;
    }

    res.status(201).send(newProduct);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.put('/:id', async function (req, res) {
  try {
    let payload = { ...req.body };
    if (payload.category === 'null' || payload.category === 'undefined' || payload.category === '') {
      payload.category = null;
    }

    let result = await productModel.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        new: true
      }
    );

    res.send(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.delete('/:id', async function (req, res) {
  try {
    let result = await productModel.findById(req.params.id);
    if (!result || result.isDeleted) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    result.isDeleted = true;
    await result.save();
    res.send(result);
  } catch (error) {
    res.status(404).send({
      message: 'ID NOT FOUND'
    });
  }
});

module.exports = router;
