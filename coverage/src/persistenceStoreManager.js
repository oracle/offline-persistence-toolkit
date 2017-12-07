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
if (! _$jscoverage['/persistenceStoreManager.js']) {
  _$jscoverage['/persistenceStoreManager.js'] = {};
  _$jscoverage['/persistenceStoreManager.js'].lineData = [];
  _$jscoverage['/persistenceStoreManager.js'].lineData[6] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[7] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[15] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[16] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[20] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[24] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[41] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[42] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[43] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[46] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[47] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[50] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[51] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[52] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[54] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[67] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[68] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[88] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[90] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[91] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[93] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[94] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[97] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[98] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[99] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[101] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[102] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[105] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[106] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[107] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[108] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[109] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[110] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[111] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[113] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[134] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[135] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[136] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[137] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[138] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[139] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[141] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[161] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[162] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[163] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[164] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[166] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[167] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[168] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[169] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[170] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[172] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[174] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[175] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[176] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[177] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[182] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[183] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[184] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[185] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[188] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[189] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[190] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[192] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[193] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[194] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[195] = 0;
  _$jscoverage['/persistenceStoreManager.js'].lineData[202] = 0;
}
if (! _$jscoverage['/persistenceStoreManager.js'].functionData) {
  _$jscoverage['/persistenceStoreManager.js'].functionData = [];
  _$jscoverage['/persistenceStoreManager.js'].functionData[0] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[1] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[2] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[3] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[4] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[5] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[6] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[7] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[8] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[9] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[10] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[11] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[12] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[13] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[14] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[15] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[16] = 0;
  _$jscoverage['/persistenceStoreManager.js'].functionData[17] = 0;
}
if (! _$jscoverage['/persistenceStoreManager.js'].branchData) {
  _$jscoverage['/persistenceStoreManager.js'].branchData = {};
  _$jscoverage['/persistenceStoreManager.js'].branchData['42'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['42'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['46'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['46'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['51'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['51'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['51'][2] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['91'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['91'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['91'][2] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['93'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['93'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['98'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['98'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['101'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['101'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['108'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['108'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['136'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['136'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['138'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['138'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['141'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['141'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['163'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['163'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['166'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['166'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['167'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['167'][1] = new BranchData();
  _$jscoverage['/persistenceStoreManager.js'].branchData['169'] = [];
  _$jscoverage['/persistenceStoreManager.js'].branchData['169'][1] = new BranchData();
}
_$jscoverage['/persistenceStoreManager.js'].branchData['169'][1].init(12, 6);
function visit550_169_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['169'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['167'][1].init(10, 7);
function visit549_167_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['167'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['166'][1].init(20, 26);
function visit548_166_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['166'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['163'][1].init(8, 12);
function visit547_163_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['163'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['141'][1].init(14, 28);
function visit546_141_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['141'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['138'][1].init(15, 28);
function visit545_138_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['138'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['136'][1].init(8, 12);
function visit544_136_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['136'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['108'][1].init(22, 17);
function visit543_108_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['108'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['101'][1].init(8, 8);
function visit542_101_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['101'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['98'][1].init(8, 8);
function visit541_98_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['98'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['93'][1].init(8, 35);
function visit540_93_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['93'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['91'][2].init(19, 26);
function visit539_91_2(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['91'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['91'][1].init(19, 34);
function visit538_91_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['91'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['51'][2].init(22, 22);
function visit537_51_2(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['51'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['51'][1].init(8, 36);
function visit536_51_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['51'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['46'][1].init(8, 5);
function visit535_46_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['46'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].branchData['42'][1].init(8, 8);
function visit534_42_1(result) {
  _$jscoverage['/persistenceStoreManager.js'].branchData['42'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceStoreManager.js'].lineData[6]++;
define([], function() {
  _$jscoverage['/persistenceStoreManager.js'].functionData[0]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[7]++;
  'use strict';
  _$jscoverage['/persistenceStoreManager.js'].lineData[15]++;
  var PersistenceStoreManager = function() {
  _$jscoverage['/persistenceStoreManager.js'].functionData[1]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[16]++;
  Object.defineProperty(this, '_stores', {
  value: {}, 
  writable: true});
  _$jscoverage['/persistenceStoreManager.js'].lineData[20]++;
  Object.defineProperty(this, '_factories', {
  value: {}, 
  writable: true});
  _$jscoverage['/persistenceStoreManager.js'].lineData[24]++;
  Object.defineProperty(this, '_DEFAULT_STORE_FACTORY_NAME', {
  value: '_defaultFactory', 
  writable: false});
};
  _$jscoverage['/persistenceStoreManager.js'].lineData[41]++;
  PersistenceStoreManager.prototype.registerStoreFactory = function(name, factory) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[2]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[42]++;
  if (visit534_42_1(!factory)) {
    _$jscoverage['/persistenceStoreManager.js'].lineData[43]++;
    throw TypeError("A valid factory must be provided.");
  }
  _$jscoverage['/persistenceStoreManager.js'].lineData[46]++;
  if (visit535_46_1(!name)) {
    _$jscoverage['/persistenceStoreManager.js'].lineData[47]++;
    throw TypeError("A valid name must be provided.");
  }
  _$jscoverage['/persistenceStoreManager.js'].lineData[50]++;
  var oldFactory = this._factories[name];
  _$jscoverage['/persistenceStoreManager.js'].lineData[51]++;
  if (visit536_51_1(oldFactory && visit537_51_2(oldFactory !== factory))) {
    _$jscoverage['/persistenceStoreManager.js'].lineData[52]++;
    throw TypeError("A factory with the same name has already been registered.");
  }
  _$jscoverage['/persistenceStoreManager.js'].lineData[54]++;
  this._factories[name] = factory;
};
  _$jscoverage['/persistenceStoreManager.js'].lineData[67]++;
  PersistenceStoreManager.prototype.registerDefaultStoreFactory = function(factory) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[3]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[68]++;
  this.registerStoreFactory(this._DEFAULT_STORE_FACTORY_NAME, factory);
};
  _$jscoverage['/persistenceStoreManager.js'].lineData[88]++;
  PersistenceStoreManager.prototype.openStore = function(name, options) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[4]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[90]++;
  var allVersions = this._stores[name];
  _$jscoverage['/persistenceStoreManager.js'].lineData[91]++;
  var version = visit538_91_1((visit539_91_2(options && options.version)) || '0');
  _$jscoverage['/persistenceStoreManager.js'].lineData[93]++;
  if (visit540_93_1(allVersions && allVersions[version])) {
    _$jscoverage['/persistenceStoreManager.js'].lineData[94]++;
    return Promise.resolve(allVersions[version]);
  }
  _$jscoverage['/persistenceStoreManager.js'].lineData[97]++;
  var factory = this._factories[name];
  _$jscoverage['/persistenceStoreManager.js'].lineData[98]++;
  if (visit541_98_1(!factory)) {
    _$jscoverage['/persistenceStoreManager.js'].lineData[99]++;
    factory = this._factories[this._DEFAULT_STORE_FACTORY_NAME];
  }
  _$jscoverage['/persistenceStoreManager.js'].lineData[101]++;
  if (visit542_101_1(!factory)) {
    _$jscoverage['/persistenceStoreManager.js'].lineData[102]++;
    return Promise.reject(new Error("no factory is registered to create the store."));
  }
  _$jscoverage['/persistenceStoreManager.js'].lineData[105]++;
  var self = this;
  _$jscoverage['/persistenceStoreManager.js'].lineData[106]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[5]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[107]++;
  factory.createPersistenceStore(name, options).then(function(store) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[6]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[108]++;
  allVersions = visit543_108_1(allVersions || {});
  _$jscoverage['/persistenceStoreManager.js'].lineData[109]++;
  allVersions[version] = store;
  _$jscoverage['/persistenceStoreManager.js'].lineData[110]++;
  self._stores[name] = allVersions;
  _$jscoverage['/persistenceStoreManager.js'].lineData[111]++;
  resolve(store);
}, function(err) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[7]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[113]++;
  reject(err);
});
});
};
  _$jscoverage['/persistenceStoreManager.js'].lineData[134]++;
  PersistenceStoreManager.prototype.hasStore = function(name, options) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[8]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[135]++;
  var allVersions = this._stores[name];
  _$jscoverage['/persistenceStoreManager.js'].lineData[136]++;
  if (visit544_136_1(!allVersions)) {
    _$jscoverage['/persistenceStoreManager.js'].lineData[137]++;
    return false;
  } else {
    _$jscoverage['/persistenceStoreManager.js'].lineData[138]++;
    if (visit545_138_1(!options || !options.version)) {
      _$jscoverage['/persistenceStoreManager.js'].lineData[139]++;
      return true;
    } else {
      _$jscoverage['/persistenceStoreManager.js'].lineData[141]++;
      return (visit546_141_1(allVersions[options.version]) ? true : false);
    }
  }
};
  _$jscoverage['/persistenceStoreManager.js'].lineData[161]++;
  PersistenceStoreManager.prototype.deleteStore = function(name, options) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[9]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[162]++;
  var allversions = this._stores[name];
  _$jscoverage['/persistenceStoreManager.js'].lineData[163]++;
  if (visit547_163_1(!allversions)) {
    _$jscoverage['/persistenceStoreManager.js'].lineData[164]++;
    return Promise.resolve(false);
  } else {
    _$jscoverage['/persistenceStoreManager.js'].lineData[166]++;
    var version = visit548_166_1(options && options.version);
    _$jscoverage['/persistenceStoreManager.js'].lineData[167]++;
    if (visit549_167_1(version)) {
      _$jscoverage['/persistenceStoreManager.js'].lineData[168]++;
      var store = allversions[version];
      _$jscoverage['/persistenceStoreManager.js'].lineData[169]++;
      if (visit550_169_1(!store)) {
        _$jscoverage['/persistenceStoreManager.js'].lineData[170]++;
        return Promise.resolve(false);
      } else {
        _$jscoverage['/persistenceStoreManager.js'].lineData[172]++;
        return new Promise(function(resolve, reject) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[10]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[176]++;
  store.delete().then(function() {
  _$jscoverage['/persistenceStoreManager.js'].functionData[11]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[174]++;
  delete allversions[version];
  _$jscoverage['/persistenceStoreManager.js'].lineData[175]++;
  resolve(true);
}).catch(function(err) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[12]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[177]++;
  reject(err);
});
});
      }
    } else {
      _$jscoverage['/persistenceStoreManager.js'].lineData[182]++;
      var mapcallback = function(origObject) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[13]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[183]++;
  return function(version) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[14]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[184]++;
  var value = origObject[version];
  _$jscoverage['/persistenceStoreManager.js'].lineData[185]++;
  return value.delete();
};
};
      _$jscoverage['/persistenceStoreManager.js'].lineData[188]++;
      var promises = Object.keys(allversions).map(mapcallback(allversions), this);
      _$jscoverage['/persistenceStoreManager.js'].lineData[189]++;
      var self = this;
      _$jscoverage['/persistenceStoreManager.js'].lineData[190]++;
      return new Promise(function(resolve, reject) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[15]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[194]++;
  Promise.all(promises).then(function() {
  _$jscoverage['/persistenceStoreManager.js'].functionData[16]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[192]++;
  delete self._stores[name];
  _$jscoverage['/persistenceStoreManager.js'].lineData[193]++;
  resolve(true);
}).catch(function(err) {
  _$jscoverage['/persistenceStoreManager.js'].functionData[17]++;
  _$jscoverage['/persistenceStoreManager.js'].lineData[195]++;
  reject(err);
});
});
    }
  }
};
  _$jscoverage['/persistenceStoreManager.js'].lineData[202]++;
  return new PersistenceStoreManager();
});
