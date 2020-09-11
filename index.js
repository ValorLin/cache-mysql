var crypto = require('crypto'),
    path = require('path'),
    fs = require('fs');

var moment = require('moment');

/**
 * Check if cache available
 * @param cachedFilePath
 * @param expire
 * @returns {boolean}
 */
function isCacheAvailable(cachedFilePath, expire) {
    var cacheModifiedTime, arr;

    if (!fs.existsSync(cachedFilePath)) return false;

    cacheModifiedTime = moment(fs.statSync(cachedFilePath).mtime);

    arr = expire.split(' ');
    return cacheModifiedTime.add(arr[0], arr[1]) > moment();
}

module.exports = (connection, opts) => {
    var realQuery, expire, cacheDir;

    expire = opts.expire || '1 hour';
    cacheDir = opts.cache_dir || 'cache';

    realQuery = connection.query;

    connection.query = (sql, values, callback, cacheInThisQuery = true) => {
        var key, cacheFileName, cacheFilePath, cache;

        if (typeof values === 'function') {
            callback = values;
            values = [];
        }

        key = JSON.stringify(sql) + JSON.stringify(values);
        cacheFileName = crypto.createHash('sha1').update(key).digest('hex');
        cacheFilePath = path.join(cacheDir, cacheFileName);

        if (cacheInThisQuery && isCacheAvailable(cacheFilePath, expire)) {
            // hit
            cache = JSON.parse(fs.readFileSync(cacheFilePath).toString());
            callback(null, cache.rows, cache.fields);
        } else {
            // no hit

            // execute the real query
            return realQuery.apply(connection, [sql, values, function (err, rows, fields) {
                callback.apply(this, arguments);

                if (err) return;

                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

                // cache the result
                fs.writeFile(cacheFilePath, JSON.stringify({
                    rows: rows,
                    fields: fields
                }), err => {});
            }]);
        }
    };

    return connection;
};