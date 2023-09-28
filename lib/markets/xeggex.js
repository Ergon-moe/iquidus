var request = require('request');

var base_url = 'https://xeggex.com/api/v2';
function get_summary(coin, exchange, cb) {
  var summary = {};
  request({uri: base_url + '/market/getbysymbol/'+ coin + '_' +exchange, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      summary['bid'] = "0.00000000";
      summary['ask'] = "0.00000000";
      summary['volume'] = parseFloat(body['volume']).toFixed(8);
      summary['volume_btc'] = parseFloat(body['volume']).toFixed(8);
      summary['high'] = parseFloat(body['highPrice']).toFixed(8);
      summary['low'] = parseFloat(body['lowPrice']).toFixed(8);
      summary['last'] = parseFloat(body['lastPrice']).toFixed(8);
      summary['change'] = 0;
      return cb(null, summary);
    }
  });
}

function get_trades(coin, exchange,  cb) {
  var req_url = base_url + '/historical_trades' +'?ticker_id='+ coin + '_' + exchange+ '&limit=100';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, null);
    } else {
      return cb (null, body);
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/market/getorderbookbysymbol/' + coin +'_'+ exchange;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, [], [])
    } else {
      var orders = body;
      var buys = [];
      var sells = [];
      if (orders['bids'].length > 0){
        for (var i = 0; i < orders['bids'].length; i++) {
          var order = {
            amount: parseFloat(orders['bids'][i]["quantity"]).toFixed(8),
            price: orders['bids'][i]["numberprice"].toFixed(8),
            total: (parseFloat(orders['bids'][i]["quantity"]).toFixed(8) * orders["bids"][i]["numberprice"]).toFixed(8)
          }
          buys.push(order);
        }
      } else {}
      if (orders['asks'].length > 0) {
        for (var i = 0; i < orders['asks'].length; i++) {
          var order = {
            amount: parseFloat(orders['asks'][i]["quantity"]).toFixed(8),
            price: orders['asks'][i]["numberprice"].toFixed(8),
            total: (parseFloat(orders['asks'][i]["quantity"]).toFixed(8) * orders["asks"][i]["numberprice"]).toFixed(8)
          }
          sells.push(order);
        }
      } else {}
      var sells = sells.reverse();
      return cb(null, buys, sells);
    }
  });
}

module.exports = {
  get_data: function(settings, cb) {
    var error = null;
    get_orders(settings.coin, settings.exchange, function(err, buys, sells) {
      if (err) { error = err; }
      get_trades(settings.coin, settings.exchange, function(err, trades) {
        if (err) { error = err; }
        get_summary(settings.coin, settings.exchange, function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};
