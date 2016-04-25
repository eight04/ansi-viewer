// This module is based on https://github.com/ettoolong/BBSFox-E10S/blob/master/modules/uao.js

// Javascript module for Unicode-at-on support
// Reference: http://moztw.org/docs/big5/
// http://moztw.org/docs/big5/table/uao250-u2b.txt

var {Cc, Ci, Cu} = require("chrome"),
    {NetUtil} = Cu.import("resource://gre/modules/NetUtil.jsm");

var uao = {
    b2uTab: '',
    conv: Cc["@mozilla.org/intl/utf8converterservice;1"].getService(Ci.nsIUTF8ConverterService),

    init_b2u: function (callback) {
        var self = this;
        NetUtil.asyncFetch(module.uri + "/../b2u.tab", function(instream) {
            self.b2uTab = NetUtil.readInputStreamToString(instream, instream.available());
            callback();
        });
    },

    b2u: function(data, callback) {
        var self = this;
          if(!this.b2uTab) {
              this.init_b2u(function() {
                  callback(self.b2uConvert(data));
              });
          } else {
              callback(self.b2uConvert(data));
          }
    },
    
    b2uConvert: function(data) {
        var ret = '';
          var b2u = this.b2uTab; // the table
          var i, n = data.length;
          for(i = 0; i < n; ++i) {
              if(data.charCodeAt(i) >= 129 && i < n-1) { // use UAO table
                  var code = data.charCodeAt(i)*0x100 + data.charCodeAt(i+1);
                  var idx = (code - 0x8001) * 2;
                  // dump('idx = ' + idx + ', len = ' + b2u.length + '\n');
                  var uni = b2u.charCodeAt(idx)*0x100 + b2u.charCodeAt(idx+1);
                  ret += String.fromCharCode(uni);
                  ++i;
              }
              else // this is an ascii character
                  ret += data[i];
          }
          return ret;
    }
};

module.exports = {uao: uao};
