const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
    
    this.timeout(10000); // 10 seconds

    suite('GET /api/stock-prices => stockData object', function () {

        test('1 stock', function (done) {
            chai.request(server)
                .get('/api/stock-prices')
                .query({ stock: 'goog' })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, 'response should be an object');
                    assert.property(res.body, 'stockData', 'response should contain stockData');
                    assert.property(res.body.stockData, 'stock', 'stockData should contain stock');
                    assert.property(res.body.stockData, 'price', 'stockData should contain price');
                    assert.property(res.body.stockData, 'likes', 'stockData should contain likes');
                    done();
                });
        });

        test('1 stock with like', function (done) {
            chai.request(server)
                .get('/api/stock-prices')
                .query({ stock: 'goog', like: true })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, 'response should be an object');
                    assert.property(res.body, 'stockData', 'response should contain stockData');
                    assert.property(res.body.stockData, 'stock', 'stockData should contain stock');
                    assert.property(res.body.stockData, 'price', 'stockData should contain price');
                    assert.property(res.body.stockData, 'likes', 'stockData should contain likes');
                    assert.equal(res.body.stockData.likes, 1, 'likes should be 1');
                    done();
                });
        });

        test('1 stock with like again (ensure likes arent double counted)', function (done) {
            chai.request(server)
                .get('/api/stock-prices')
                .query({ stock: 'goog', like: true })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, 'response should be an object');
                    assert.property(res.body, 'stockData', 'response should contain stockData');
                    assert.property(res.body.stockData, 'stock', 'stockData should contain stock');
                    assert.property(res.body.stockData, 'price', 'stockData should contain price');
                    assert.property(res.body.stockData, 'likes', 'stockData should contain likes');
                    assert.equal(res.body.stockData.likes, 1, 'likes should be 1');
                    done();
                });
        });

        test('2 stocks', function (done) {
            chai.request(server)
                .get('/api/stock-prices')
                .query({ stock: ['goog', 'msft'] })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, 'response should be an object');
                    assert.property(res.body, 'stockData', 'response should contain stockData');
                    assert.isArray(res.body.stockData, 'stockData should be an array');
                    assert.equal(res.body.stockData.length, 2, 'stockData should contain 2 items');
                    assert.property(res.body.stockData[0], 'stock', 'stockData should contain stock');
                    assert.property(res.body.stockData[0], 'price', 'stockData should contain price');
                    assert.property(res.body.stockData[0], 'rel_likes', 'stockData should contain rel_likes');
                    assert.property(res.body.stockData[1], 'stock', 'stockData should contain stock');
                    assert.property(res.body.stockData[1], 'price', 'stockData should contain price');
                    assert.property(res.body.stockData[1], 'rel_likes', 'stockData should contain rel_likes');
                    done();
                });
        });

        test('2 stocks with like', function (done) {
            chai.request(server)
                .get('/api/stock-prices')
                .query({ stock: ['goog', 'msft'], like: true })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, 'response should be an object');
                    assert.property(res.body, 'stockData', 'response should contain stockData');
                    assert.isArray(res.body.stockData, 'stockData should be an array');
                    assert.equal(res.body.stockData.length, 2, 'stockData should contain 2 items');
                    assert.property(res.body.stockData[0], 'stock', 'stockData should contain stock');
                    assert.property(res.body.stockData[0], 'price', 'stockData should contain price');
                    assert.property(res.body.stockData[0], 'rel_likes', 'stockData should contain rel_likes');
                    assert.property(res.body.stockData[1], 'stock', 'stockData should contain stock');
                    assert.property(res.body.stockData[1], 'price', 'stockData should contain price');
                    assert.property(res.body.stockData[1], 'rel_likes', 'stockData should contain rel_likes');
                    assert.equal(res.body.stockData[0].rel_likes + res.body.stockData[1].rel_likes, 0, 'rel_likes should be 0');
                    done();
                });
        });
    });
});
