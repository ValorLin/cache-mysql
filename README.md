# cache-mysql
Cache mysql queries, it's useful for slow query and it's very easy to use.

## Basic Usage
```js
var mysql = require('mysql');
var cacheMysql = require('cache-mysql');
var connection = mysql.createConnection(yourOpts);

connection = cacheMysql(connection);
```
Yes, it's so easy.
## Advanced Usage
```
var mysql = require('mysql');
var cacheMysql = require('cache-mysql');

var connection = mysql.createConnection(yourOpts);
connection = cacheMysql(connection, {
    expire: '1 day',
    cache_dir: __dirname + '/cache'
});
```