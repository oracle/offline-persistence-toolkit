function BranchData() {
    this.position = -1;
    this.nodeLength = -1;
    this.evalFalse = 0;
    this.evalTrue = 0;

    this.init = function(position, nodeLength) {
        this.position = position;
        this.nodeLength = nodeLength;
        return this;
    };

    this.ranCondition = function(result) {
        if (result)
            this.evalTrue++;
        else
            this.evalFalse++;
    };

    this.pathsCovered = function() {
        var paths = 0;
        if (this.evalTrue > 0)
          paths++;
        if (this.evalFalse > 0)
          paths++;
        return paths;
    };

    this.covered = function() {
        return this.evalTrue > 0 && this.evalFalse > 0;
    };

    this.toJSON = function() {
        return '{"position":' + this.position
            + ',"nodeLength":' + this.nodeLength
            + ',"evalFalse":' + this.evalFalse
            + ',"evalTrue":' + this.evalTrue + '}';
    };

    this.message = function(src) {
        if (this.evalTrue === 0 && this.evalFalse === 0)
            return 'Condition never evaluated         :\t' + src;
        else if (this.evalTrue === 0)
            return 'Condition never evaluated to true :\t' + src;
        else if (this.evalFalse === 0)
            return 'Condition never evaluated to false:\t' + src;
        else
            return 'Condition covered';
    };
}

BranchData.fromJson = function(jsonString) {
    var json = eval('(' + jsonString + ')');
    var branchData = new BranchData();
    branchData.init(json.position, json.nodeLength);
    branchData.evalFalse = json.evalFalse;
    branchData.evalTrue = json.evalTrue;
    return branchData;
};

BranchData.fromJsonObject = function(json) {
    var branchData = new BranchData();
    branchData.init(json.position, json.nodeLength);
    branchData.evalFalse = json.evalFalse;
    branchData.evalTrue = json.evalTrue;
    return branchData;
};

function buildBranchMessage(conditions) {
    var message = 'The following was not covered:';
    var i;
    for (i = 0; i < conditions.length; i++) {
        if (conditions[i] !== undefined && conditions[i] !== null && !conditions[i].covered())
            message += '\n- '+ conditions[i].message(conditions[i].src);
    }
    return message;
}

function convertBranchDataConditionArrayToJSON(branchDataConditionArray) {
    var condition, branchDataObject, value;
    var array = [];
    var length = branchDataConditionArray.length;
    for (condition = 0; condition < length; condition++) {
        branchDataObject = branchDataConditionArray[condition];
        if (branchDataObject === undefined || branchDataObject === null) {
            value = 'null';
        } else {
            value = branchDataObject.toJSON();
        }
        array.push(value);
    }
    return '[' + array.join(',') + ']';
}

function convertBranchDataLinesToJSON(branchData) {
    if (branchData === undefined) {
        return '{}'
    }
    var line;
    var json = '';
    for (line in branchData) {
        if (isNaN(line))
            continue;
        if (json !== '')
            json += ',';
        json += '"' + line + '":' + convertBranchDataConditionArrayToJSON(branchData[line]);
    }
    return '{' + json + '}';
}

function convertBranchDataLinesFromJSON(jsonObject) {
    if (jsonObject === undefined) {
        return {};
    }
    var line, branchDataJSON, conditionIndex, condition;
    for (line in jsonObject) {
        branchDataJSON = jsonObject[line];
        if (branchDataJSON !== null) {
            for (conditionIndex = 0; conditionIndex < branchDataJSON.length; conditionIndex ++) {
                condition = branchDataJSON[conditionIndex];
                if (condition !== null) {
                    branchDataJSON[conditionIndex] = BranchData.fromJsonObject(condition);
                }
            }
        }
    }
    return jsonObject;
}
function jscoverage_quote(s) {
    return '"' + s.replace(/[\u0000-\u001f"\\\u007f-\uffff]/g, function (c) {
        switch (c) {
            case '\b':
                return '\\b';
            case '\f':
                return '\\f';
            case '\n':
                return '\\n';
            case '\r':
                return '\\r';
            case '\t':
                return '\\t';
            // IE doesn't support this
            /*
             case '\v':
             return '\\v';
             */
            case '"':
                return '\\"';
            case '\\':
                return '\\\\';
            default:
                return '\\u' + jscoverage_pad(c.charCodeAt(0).toString(16));
        }
    }) + '"';
}

function getArrayJSON(coverage) {
    var array = [];
    if (coverage === undefined)
        return array;

    var length = coverage.length;
    for (var line = 0; line < length; line++) {
        var value = coverage[line];
        if (value === undefined || value === null) {
            value = 'null';
        }
        array.push(value);
    }
    return array;
}

function jscoverage_serializeCoverageToJSON() {
    var json = [];
    for (var file in _$jscoverage) {
        var lineArray = getArrayJSON(_$jscoverage[file].lineData);
        var fnArray = getArrayJSON(_$jscoverage[file].functionData);

        json.push(jscoverage_quote(file) + ':{"lineData":[' + lineArray.join(',') + '],"functionData":[' + fnArray.join(',') + '],"branchData":' + convertBranchDataLinesToJSON(_$jscoverage[file].branchData) + '}');
    }
    return '{' + json.join(',') + '}';
}

function jscoverage_parseCoverageJSON(data) {
    var result = {};
    var json = eval('(' + data + ')');
    var file;
    for (file in json) {
        var fileCoverage = json[file];
        result[file] = {};
        result[file].lineData = fileCoverage.lineData;
        result[file].functionData = fileCoverage.functionData;
        result[file].branchData = convertBranchDataLinesFromJSON(fileCoverage.branchData);
    }
    return result;
}

function jscoverage_pad(s) {
    return '0000'.substr(s.length) + s;
}

function jscoverage_html_escape(s) {
    return s.replace(/[<>\&\"\']/g, function (c) {
        return '&#' + c.charCodeAt(0) + ';';
    });
}
var jsCover_isolateBrowser = false;
if (!jsCover_isolateBrowser) {
    try {
        if (typeof top === 'object' && top !== null && typeof top.opener === 'object' && top.opener !== null) {
            // this is a browser window that was opened from another window

            if (!top.opener._$jscoverage) {
                top.opener._$jscoverage = {};
            }
        }
    } catch (e) {
    }

    try {
        if (typeof top === 'object' && top !== null) {
            // this is a browser window

            try {
                if (typeof top.opener === 'object' && top.opener !== null && top.opener._$jscoverage) {
                    top._$jscoverage = top.opener._$jscoverage;
                }
            } catch (e) {
            }

            if (!top._$jscoverage) {
                top._$jscoverage = {};
            }
        }
    } catch (e) {
    }

    try {
        if (typeof top === 'object' && top !== null && top._$jscoverage) {
            this._$jscoverage = top._$jscoverage;
        }
    } catch (e) {
    }
}
if (!this._$jscoverage) {
    this._$jscoverage = {};
}
if (! _$jscoverage['/impl/offlineCacheManager.js']) {
  _$jscoverage['/impl/offlineCacheManager.js'] = {};
  _$jscoverage['/impl/offlineCacheManager.js'].lineData = [];
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[6] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[8] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[21] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[22] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[24] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[26] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[39] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[40] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[42] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[43] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[44] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[46] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[49] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[50] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[51] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[52] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[54] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[55] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[89] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[90] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[92] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[93] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[94] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[96] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[98] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[99] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[100] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[101] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[103] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[106] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[110] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[124] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[125] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[126] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[128] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[143] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[144] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[145] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[146] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[147] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[148] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[149] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[150] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[151] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[153] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[156] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[170] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[171] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[172] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[173] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[175] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[178] = 0;
}
if (! _$jscoverage['/impl/offlineCacheManager.js'].functionData) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData = [];
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[0] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[1] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[2] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[3] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[4] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[5] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[6] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[7] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[8] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[9] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[10] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[11] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[12] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[13] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[14] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[15] = 0;
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[16] = 0;
}
if (! _$jscoverage['/impl/offlineCacheManager.js'].branchData) {
  _$jscoverage['/impl/offlineCacheManager.js'].branchData = {};
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['43'] = [];
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['43'][1] = new BranchData();
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['94'] = [];
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['94'][1] = new BranchData();
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['100'] = [];
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['100'][1] = new BranchData();
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['125'] = [];
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['125'][1] = new BranchData();
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['147'] = [];
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['147'][1] = new BranchData();
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['172'] = [];
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['172'][1] = new BranchData();
}
_$jscoverage['/impl/offlineCacheManager.js'].branchData['172'][1].init(22, 28);
function visit238_172_1(result) {
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['172'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/offlineCacheManager.js'].branchData['147'][1].init(12, 5);
function visit237_147_1(result) {
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['147'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/offlineCacheManager.js'].branchData['125'][1].init(10, 23);
function visit236_125_1(result) {
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['125'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/offlineCacheManager.js'].branchData['100'][1].init(18, 8);
function visit235_100_1(result) {
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['100'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/offlineCacheManager.js'].branchData['94'][1].init(14, 34);
function visit234_94_1(result) {
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['94'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/offlineCacheManager.js'].branchData['43'][1].init(10, 5);
function visit233_43_1(result) {
  _$jscoverage['/impl/offlineCacheManager.js'].branchData['43'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/offlineCacheManager.js'].lineData[6]++;
define(['../persistenceStoreManager', './OfflineCache'], function(persistenceStoreManager, OfflineCache) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[0]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[8]++;
  'use strict';
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[21]++;
  function OfflineCacheManager() {
    _$jscoverage['/impl/offlineCacheManager.js'].functionData[1]++;
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[22]++;
    this._prefix = "offlineCaches-";
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[24]++;
    this._caches = {};
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[26]++;
    this._cachesArray = [];
  }
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[39]++;
  OfflineCacheManager.prototype.open = function(cacheName) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[2]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[40]++;
  var self = this;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[42]++;
  var cache = self._caches[cacheName];
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[43]++;
  if (visit233_43_1(cache)) {
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[44]++;
    return Promise.resolve(cache);
  } else {
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[46]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[3]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[54]++;
  persistenceStoreManager.openStore(self._prefix + cacheName).then(function(store) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[4]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[49]++;
  cache = new OfflineCache(cacheName, store);
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[50]++;
  self._caches[cacheName] = cache;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[51]++;
  self._cachesArray.push(cache);
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[52]++;
  resolve(cache);
}).catch(function(err) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[5]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[55]++;
  reject(err);
});
});
  }
};
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[89]++;
  OfflineCacheManager.prototype.match = function(request, options) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[6]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[90]++;
  var self = this;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[92]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[7]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[93]++;
  var getFirstMatch = function(cacheArray, currentIndex) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[8]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[94]++;
  if (visit234_94_1(currentIndex === cacheArray.length)) {
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[96]++;
    resolve();
  } else {
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[98]++;
    var currentCache = cacheArray[currentIndex];
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[99]++;
    currentCache.match(request, options).then(function(response) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[9]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[100]++;
  if (visit235_100_1(response)) {
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[101]++;
    resolve(response.clone());
  } else {
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[103]++;
    getFirstMatch(cacheArray, currentIndex + 1);
  }
}, function(err) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[10]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[106]++;
  reject(err);
});
  }
};
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[110]++;
  getFirstMatch(self._cachesArray, 0);
});
};
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[124]++;
  OfflineCacheManager.prototype.has = function(cacheName) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[11]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[125]++;
  if (visit236_125_1(this._caches[cacheName])) {
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[126]++;
    return Promise.resolve(true);
  } else {
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[128]++;
    return Promise.resolve(false);
  }
};
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[143]++;
  OfflineCacheManager.prototype.delete = function(cacheName) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[12]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[144]++;
  var self = this;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[145]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[13]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[146]++;
  var cache = self._caches[cacheName];
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[147]++;
  if (visit237_147_1(cache)) {
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[148]++;
    cache.delete().then(function() {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[14]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[149]++;
  self._cachesArray.splice(self._cachesArray.indexOf(cacheName), 1);
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[150]++;
  delete self._caches[cacheName];
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[151]++;
  resolve(true);
}, function(err) {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[15]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[153]++;
  reject(err);
});
  } else {
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[156]++;
    resolve(false);
  }
});
};
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[170]++;
  OfflineCacheManager.prototype.keys = function() {
  _$jscoverage['/impl/offlineCacheManager.js'].functionData[16]++;
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[171]++;
  var keysArray = [];
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[172]++;
  for (var i = 0; visit238_172_1(i < this._cachesArray.length); i++) {
    _$jscoverage['/impl/offlineCacheManager.js'].lineData[173]++;
    keysArray.push(this._cachesArray[i].getName());
  }
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[175]++;
  return Promise.resolve(keysArray);
};
  _$jscoverage['/impl/offlineCacheManager.js'].lineData[178]++;
  return new OfflineCacheManager();
});
