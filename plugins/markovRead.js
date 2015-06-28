var sql = require('sqlite3');

module.exports = function (core) {
    var plugin = {};
    var db = new sql.Database('MarkovDB.sqlite');

    function openDB() {
        db.serialize(function () {
            db.run('CREATE TABLE IF NOT EXISTS chain(link1 TEXT, link2 TEXT, n INT,'+
                   ' CONSTRAINT pk_chain PRIMARY KEY (link1,link2))');
        });
    }

    function closeDB() {
        db.close();
    }

    function checkError(err) {
        if (err)
            console.log(err);
    }

    function dbInsert(word1, word2) {
        db.run('INSERT OR REPLACE INTO chain (link1,link2,n) '+
               'VALUES ($one,$two,COALESCE(((SELECT n from chain WHERE '+
               'link1 = $one AND link2 = $two) + 1),1))',
                {$one: word1, $two: word2}, checkError);
    }

    function pubListener(nick, text) {
       var words = text.split(/[ ,]+/);
       var wordsLength = words.length;
        if (wordsLength > 1) {
            for (var i = 0; i < wordsLength -1; i++) {
                var word1 = words[i];
                var word2 = words[i + 1];
                dbInsert(word1, word2);
            }
            dbInsert(words[wordsLength - 1], ' ');
        }
    }

    plugin.load = function () {
        openDB();
        core.irc.on('pub', pubListener);
    };

    plugin.unload = function () {
        core.irc.removeListener('pub', pubListener);
        closeDB();
    };

    return plugin;
};
