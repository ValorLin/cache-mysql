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

module.exports = function (connection, opts) {
    var realQuery, expire, cacheDir;

    expire = opts.expire || '1 hour';
    cacheDir = opts.cache_dir || 'cache';

    realQuery = connection.query;
    connection.query = function (sql, values, callback) {
        var key, cacheFileName, cacheFilePath, result;

        if (typeof values === 'function') {
            callback = values;
            values = [];
        }

        key = JSON.stringify(sql) + JSON.stringify(values);
        cacheFileName = crypto.createHash('sha1').update(key).digest('hex');
        cacheFilePath = path.join(cacheDir, cacheFileName);

        if (isCacheAvailable(cacheFilePath, expire)) {
            // hit
            result = fs.readFileSync(cacheFilePath);
            callback(null, JSON.parse(result));

        } else {
            // no hit

            // execute the real query
            return realQuery.apply(connection, [sql, values, function (err, result) {
                callback.apply(this, arguments);

                if (!fs.existsSync(cacheDir)) {
                    fs.mkdirSync(cacheDir);
                }

                // cache the result
                fs.writeFile(cacheFilePath, JSON.stringify([result]));
            }]);
        }
    };
    return connection;
};