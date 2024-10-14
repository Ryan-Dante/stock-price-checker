'use strict';

const bcrypt = require('bcrypt');
const https = require('https');
const StockModel = require('../models/stockModel');

// Clear the database for testing purposes
async function clearDatabase() {
  try {
    await StockModel.deleteMany({});
    console.log('Database cleared');
  } catch (err) {
    console.error('Error clearing database:', err);
  }
}

clearDatabase();

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const stock = req.query.stock;
      const like = req.query.like;
      const ip = req.ip;

      console.log(`Received request for stock: ${stock}, like: ${like}`);

      // Hash the IP address
      const hash = bcrypt.hashSync(ip, 12);
      console.log('IP hash:', hash);

      try {
        if (like) {
          // Check if multiple stocks are being processed
          const stocks = Array.isArray(stock) ? stock : [stock];

          for (let i = 0; i < stocks.length; i++) {
            const singleStock = stocks[i];

            // Retrieve all hashed IPs for the given stock
            const likedStocks = await StockModel.find({ stock: singleStock });

            // Check if the current hashed IP matches any stored hashed IPs
            const alreadyLiked = likedStocks.some(likedStock => bcrypt.compareSync(ip, likedStock.ip));
            if (alreadyLiked) {
              console.log(`IP has already liked the stock ${singleStock}`);
            } else {
              // Store the like in the database
              await StockModel.create({ ip: hash, stock: singleStock, likes: 1 });
              console.log(`IP stored in database for stock ${singleStock}`);
            }
          }
        }

        // Process stock data
        await processStockData(stock, res);

      } catch (err) {
        console.error('Database connection error:', err);
        return res.status(500).json({ error: 'Database connection error' });
      }
    });

  // Process stock data and return the response
  async function processStockData(stock, res) {
    try {
      // Check if multiple stocks are being processed
      const stocks = Array.isArray(stock) ? stock : [stock];
      console.log('Stocks:', stocks);

      if (stocks.length > 1) {
        let stockData = [];
        let processedCount = 0;

        // Process each stock
        for (let i = 0; i < stocks.length; i++) {
          const singleStock = stocks[i];

          // Fetch likes for each stock
          const result = await StockModel.aggregate([
            { $match: { stock: singleStock } },
            { $group: { _id: "$stock", totalLikes: { $sum: "$likes" } } }
          ]);

          const totalLikes = result.length > 0 ? result[0].totalLikes : 0;
          console.log(`Total likes for ${singleStock}: ${totalLikes}`);

          // Fetch stock price
          https.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${singleStock}/quote`, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
              try {
                data = JSON.parse(data);
                console.log('Stock price data:', data);

                // Create stock data item
                let stockDataItem = {
                  stock: singleStock,
                  price: data.latestPrice,
                  likes: totalLikes
                };

                stockData.push(stockDataItem);
                processedCount++;

                // Check if all stocks have been processed
                if (processedCount === stocks.length) {
                  // Calculate relative likes if there are two stocks
                  if (stocks.length === 2) {
                    const relLikes = stockData[0].likes - stockData[1].likes;
                    stockData[0].rel_likes = relLikes;
                    stockData[1].rel_likes = -relLikes;
                  }

                  console.log('All stock data processed');
                  return res.status(200).json({ stockData: stockData });
                }

              } catch (err) {
                console.error('Error parsing stock price data:', err);
                processedCount++; // Ensure to increment even on error
                if (processedCount === stocks.length) {
                  return res.status(500).json({ error: 'Error fetching stock price data' });
                }
              }
            });
          }).on('error', (err) => {
            console.error('Request error:', err);
            processedCount++; // Increment the processed count on error
            if (processedCount === stocks.length) {
              return res.status(500).json({ error: 'Error fetching stock price data' });
            }
          });
        }
      } else {
        // Single stock processing
        const singleStock = stocks[0];

        // Fetch likes for the stock
        const result = await StockModel.aggregate([
          { $match: { stock: singleStock } },
          { $group: { _id: "$stock", totalLikes: { $sum: "$likes" } } }
        ]);

        const totalLikes = result.length > 0 ? result[0].totalLikes : 0;
        console.log(`Total likes for ${singleStock}: ${totalLikes}`);

        // Fetch stock price
        https.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${singleStock}/quote`, (response) => {
          let data = '';
          response.on('data', (chunk) => { data += chunk; });
          response.on('end', () => {
            try {
              data = JSON.parse(data);
              console.log('Stock price data:', data);

              // Create stock data item
              let stockDataItem = {
                stock: singleStock,
                price: data.latestPrice,
                likes: totalLikes
              };

              console.log('Final stock data:', stockDataItem);
              return res.status(200).json({ stockData: stockDataItem });

            } catch (err) {
              console.error('Error parsing stock price data:', err);
              return res.status(500).json({ error: 'Error fetching stock price data' });
            }
          });
        }).on('error', (err) => {
          console.error('Request error:', err);
          return res.status(500).json({ error: 'Error fetching stock price data' });
        });
      }

    } catch (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }
};