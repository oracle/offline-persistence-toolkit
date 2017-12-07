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
if (! _$jscoverage['/PersistenceStore.js']) {
  _$jscoverage['/PersistenceStore.js'] = {};
  _$jscoverage['/PersistenceStore.js'].lineData = [];
  _$jscoverage['/PersistenceStore.js'].lineData[6] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[7] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[15] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[16] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[19] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[29] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[30] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[41] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[42] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[58] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[59] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[60] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[62] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[64] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[82] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[83] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[98] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[99] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[123] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[124] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[141] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[142] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[157] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[158] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[176] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[177] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[190] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[191] = 0;
  _$jscoverage['/PersistenceStore.js'].lineData[194] = 0;
}
if (! _$jscoverage['/PersistenceStore.js'].functionData) {
  _$jscoverage['/PersistenceStore.js'].functionData = [];
  _$jscoverage['/PersistenceStore.js'].functionData[0] = 0;
  _$jscoverage['/PersistenceStore.js'].functionData[1] = 0;
  _$jscoverage['/PersistenceStore.js'].functionData[2] = 0;
  _$jscoverage['/PersistenceStore.js'].functionData[3] = 0;
  _$jscoverage['/PersistenceStore.js'].functionData[4] = 0;
  _$jscoverage['/PersistenceStore.js'].functionData[5] = 0;
  _$jscoverage['/PersistenceStore.js'].functionData[6] = 0;
  _$jscoverage['/PersistenceStore.js'].functionData[7] = 0;
  _$jscoverage['/PersistenceStore.js'].functionData[8] = 0;
  _$jscoverage['/PersistenceStore.js'].functionData[9] = 0;
  _$jscoverage['/PersistenceStore.js'].functionData[10] = 0;
  _$jscoverage['/PersistenceStore.js'].functionData[11] = 0;
}
if (! _$jscoverage['/PersistenceStore.js'].branchData) {
  _$jscoverage['/PersistenceStore.js'].branchData = {};
  _$jscoverage['/PersistenceStore.js'].branchData['59'] = [];
  _$jscoverage['/PersistenceStore.js'].branchData['59'][1] = new BranchData();
}
_$jscoverage['/PersistenceStore.js'].branchData['59'][1].init(8, 26);
function visit510_59_1(result) {
  _$jscoverage['/PersistenceStore.js'].branchData['59'][1].ranCondition(result);
  return result;
}_$jscoverage['/PersistenceStore.js'].lineData[6]++;
define([], function() {
  _$jscoverage['/PersistenceStore.js'].functionData[0]++;
  _$jscoverage['/PersistenceStore.js'].lineData[7]++;
  'use strict';
  _$jscoverage['/PersistenceStore.js'].lineData[15]++;
  var PersistenceStore = function(name) {
  _$jscoverage['/PersistenceStore.js'].functionData[1]++;
  _$jscoverage['/PersistenceStore.js'].lineData[16]++;
  this._name = name;
};
  _$jscoverage['/PersistenceStore.js'].lineData[19]++;
  PersistenceStore.prototype = {};
  _$jscoverage['/PersistenceStore.js'].lineData[29]++;
  PersistenceStore.prototype.getName = function() {
  _$jscoverage['/PersistenceStore.js'].functionData[2]++;
  _$jscoverage['/PersistenceStore.js'].lineData[30]++;
  return this._name;
};
  _$jscoverage['/PersistenceStore.js'].lineData[41]++;
  PersistenceStore.prototype.getVersion = function() {
  _$jscoverage['/PersistenceStore.js'].functionData[3]++;
  _$jscoverage['/PersistenceStore.js'].lineData[42]++;
  return this._version;
};
  _$jscoverage['/PersistenceStore.js'].lineData[58]++;
  PersistenceStore.prototype.Init = function(options) {
  _$jscoverage['/PersistenceStore.js'].functionData[4]++;
  _$jscoverage['/PersistenceStore.js'].lineData[59]++;
  if (visit510_59_1(options && options.version)) {
    _$jscoverage['/PersistenceStore.js'].lineData[60]++;
    this._version = options.version;
  } else {
    _$jscoverage['/PersistenceStore.js'].lineData[62]++;
    this._version = '0';
  }
  _$jscoverage['/PersistenceStore.js'].lineData[64]++;
  return Promise.resolve();
};
  _$jscoverage['/PersistenceStore.js'].lineData[82]++;
  PersistenceStore.prototype.upsert = function(key, metadata, value, expectedVersionIdentifier) {
  _$jscoverage['/PersistenceStore.js'].functionData[5]++;
  _$jscoverage['/PersistenceStore.js'].lineData[83]++;
  throw TypeError("failed in abstract function");
};
  _$jscoverage['/PersistenceStore.js'].lineData[98]++;
  PersistenceStore.prototype.upsertAll = function(values) {
  _$jscoverage['/PersistenceStore.js'].functionData[6]++;
  _$jscoverage['/PersistenceStore.js'].lineData[99]++;
  throw TypeError("failed in abstract function");
};
  _$jscoverage['/PersistenceStore.js'].lineData[123]++;
  PersistenceStore.prototype.find = function(findExpression) {
  _$jscoverage['/PersistenceStore.js'].functionData[7]++;
  _$jscoverage['/PersistenceStore.js'].lineData[124]++;
  throw TypeError("failed in abstract function");
};
  _$jscoverage['/PersistenceStore.js'].lineData[141]++;
  PersistenceStore.prototype.findByKey = function(key) {
  _$jscoverage['/PersistenceStore.js'].functionData[8]++;
  _$jscoverage['/PersistenceStore.js'].lineData[142]++;
  throw TypeError("failed in abstract function");
};
  _$jscoverage['/PersistenceStore.js'].lineData[157]++;
  PersistenceStore.prototype.removeByKey = function(key) {
  _$jscoverage['/PersistenceStore.js'].functionData[9]++;
  _$jscoverage['/PersistenceStore.js'].lineData[158]++;
  throw TypeError("failed in abstract function");
};
  _$jscoverage['/PersistenceStore.js'].lineData[176]++;
  PersistenceStore.prototype.delete = function(findExpression) {
  _$jscoverage['/PersistenceStore.js'].functionData[10]++;
  _$jscoverage['/PersistenceStore.js'].lineData[177]++;
  throw TypeError("failed in abstract function");
};
  _$jscoverage['/PersistenceStore.js'].lineData[190]++;
  PersistenceStore.prototype.keys = function() {
  _$jscoverage['/PersistenceStore.js'].functionData[11]++;
  _$jscoverage['/PersistenceStore.js'].lineData[191]++;
  throw TypeError("failed in abstract function");
};
  _$jscoverage['/PersistenceStore.js'].lineData[194]++;
  return PersistenceStore;
});
