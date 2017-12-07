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
if (! _$jscoverage['/impl/logger.js']) {
  _$jscoverage['/impl/logger.js'] = {};
  _$jscoverage['/impl/logger.js'].lineData = [];
  _$jscoverage['/impl/logger.js'].lineData[6] = 0;
  _$jscoverage['/impl/logger.js'].lineData[7] = 0;
  _$jscoverage['/impl/logger.js'].lineData[50] = 0;
  _$jscoverage['/impl/logger.js'].lineData[51] = 0;
  _$jscoverage['/impl/logger.js'].lineData[55] = 0;
  _$jscoverage['/impl/logger.js'].lineData[59] = 0;
  _$jscoverage['/impl/logger.js'].lineData[63] = 0;
  _$jscoverage['/impl/logger.js'].lineData[67] = 0;
  _$jscoverage['/impl/logger.js'].lineData[71] = 0;
  _$jscoverage['/impl/logger.js'].lineData[74] = 0;
  _$jscoverage['/impl/logger.js'].lineData[77] = 0;
  _$jscoverage['/impl/logger.js'].lineData[80] = 0;
  _$jscoverage['/impl/logger.js'].lineData[83] = 0;
  _$jscoverage['/impl/logger.js'].lineData[86] = 0;
  _$jscoverage['/impl/logger.js'].lineData[90] = 0;
  _$jscoverage['/impl/logger.js'].lineData[102] = 0;
  _$jscoverage['/impl/logger.js'].lineData[103] = 0;
  _$jscoverage['/impl/logger.js'].lineData[116] = 0;
  _$jscoverage['/impl/logger.js'].lineData[117] = 0;
  _$jscoverage['/impl/logger.js'].lineData[130] = 0;
  _$jscoverage['/impl/logger.js'].lineData[131] = 0;
  _$jscoverage['/impl/logger.js'].lineData[144] = 0;
  _$jscoverage['/impl/logger.js'].lineData[145] = 0;
  _$jscoverage['/impl/logger.js'].lineData[171] = 0;
  _$jscoverage['/impl/logger.js'].lineData[172] = 0;
  _$jscoverage['/impl/logger.js'].lineData[173] = 0;
  _$jscoverage['/impl/logger.js'].lineData[174] = 0;
  _$jscoverage['/impl/logger.js'].lineData[175] = 0;
  _$jscoverage['/impl/logger.js'].lineData[176] = 0;
  _$jscoverage['/impl/logger.js'].lineData[179] = 0;
  _$jscoverage['/impl/logger.js'].lineData[181] = 0;
  _$jscoverage['/impl/logger.js'].lineData[182] = 0;
  _$jscoverage['/impl/logger.js'].lineData[185] = 0;
  _$jscoverage['/impl/logger.js'].lineData[186] = 0;
  _$jscoverage['/impl/logger.js'].lineData[188] = 0;
  _$jscoverage['/impl/logger.js'].lineData[189] = 0;
  _$jscoverage['/impl/logger.js'].lineData[190] = 0;
  _$jscoverage['/impl/logger.js'].lineData[191] = 0;
  _$jscoverage['/impl/logger.js'].lineData[202] = 0;
  _$jscoverage['/impl/logger.js'].lineData[203] = 0;
  _$jscoverage['/impl/logger.js'].lineData[205] = 0;
  _$jscoverage['/impl/logger.js'].lineData[206] = 0;
  _$jscoverage['/impl/logger.js'].lineData[209] = 0;
  _$jscoverage['/impl/logger.js'].lineData[210] = 0;
  _$jscoverage['/impl/logger.js'].lineData[211] = 0;
  _$jscoverage['/impl/logger.js'].lineData[212] = 0;
  _$jscoverage['/impl/logger.js'].lineData[213] = 0;
  _$jscoverage['/impl/logger.js'].lineData[215] = 0;
  _$jscoverage['/impl/logger.js'].lineData[216] = 0;
  _$jscoverage['/impl/logger.js'].lineData[217] = 0;
  _$jscoverage['/impl/logger.js'].lineData[218] = 0;
  _$jscoverage['/impl/logger.js'].lineData[219] = 0;
  _$jscoverage['/impl/logger.js'].lineData[222] = 0;
  _$jscoverage['/impl/logger.js'].lineData[227] = 0;
  _$jscoverage['/impl/logger.js'].lineData[228] = 0;
  _$jscoverage['/impl/logger.js'].lineData[230] = 0;
  _$jscoverage['/impl/logger.js'].lineData[231] = 0;
  _$jscoverage['/impl/logger.js'].lineData[232] = 0;
  _$jscoverage['/impl/logger.js'].lineData[233] = 0;
  _$jscoverage['/impl/logger.js'].lineData[234] = 0;
  _$jscoverage['/impl/logger.js'].lineData[236] = 0;
  _$jscoverage['/impl/logger.js'].lineData[237] = 0;
  _$jscoverage['/impl/logger.js'].lineData[238] = 0;
}
if (! _$jscoverage['/impl/logger.js'].functionData) {
  _$jscoverage['/impl/logger.js'].functionData = [];
  _$jscoverage['/impl/logger.js'].functionData[0] = 0;
  _$jscoverage['/impl/logger.js'].functionData[1] = 0;
  _$jscoverage['/impl/logger.js'].functionData[2] = 0;
  _$jscoverage['/impl/logger.js'].functionData[3] = 0;
  _$jscoverage['/impl/logger.js'].functionData[4] = 0;
  _$jscoverage['/impl/logger.js'].functionData[5] = 0;
  _$jscoverage['/impl/logger.js'].functionData[6] = 0;
  _$jscoverage['/impl/logger.js'].functionData[7] = 0;
  _$jscoverage['/impl/logger.js'].functionData[8] = 0;
}
if (! _$jscoverage['/impl/logger.js'].branchData) {
  _$jscoverage['/impl/logger.js'].branchData = {};
  _$jscoverage['/impl/logger.js'].branchData['173'] = [];
  _$jscoverage['/impl/logger.js'].branchData['173'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['175'] = [];
  _$jscoverage['/impl/logger.js'].branchData['175'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['181'] = [];
  _$jscoverage['/impl/logger.js'].branchData['181'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['181'][2] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['181'][3] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['182'] = [];
  _$jscoverage['/impl/logger.js'].branchData['182'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['185'] = [];
  _$jscoverage['/impl/logger.js'].branchData['185'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['190'] = [];
  _$jscoverage['/impl/logger.js'].branchData['190'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['205'] = [];
  _$jscoverage['/impl/logger.js'].branchData['205'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['210'] = [];
  _$jscoverage['/impl/logger.js'].branchData['210'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['211'] = [];
  _$jscoverage['/impl/logger.js'].branchData['211'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['211'][2] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['215'] = [];
  _$jscoverage['/impl/logger.js'].branchData['215'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['217'] = [];
  _$jscoverage['/impl/logger.js'].branchData['217'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['231'] = [];
  _$jscoverage['/impl/logger.js'].branchData['231'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['233'] = [];
  _$jscoverage['/impl/logger.js'].branchData['233'][1] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['233'][2] = new BranchData();
  _$jscoverage['/impl/logger.js'].branchData['233'][3] = new BranchData();
}
_$jscoverage['/impl/logger.js'].branchData['233'][3].init(48, 28);
function visit191_233_3(result) {
  _$jscoverage['/impl/logger.js'].branchData['233'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['233'][2].init(15, 29);
function visit190_233_2(result) {
  _$jscoverage['/impl/logger.js'].branchData['233'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['233'][1].init(15, 61);
function visit189_233_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['233'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['231'][1].init(8, 21);
function visit188_231_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['231'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['217'][1].init(17, 14);
function visit187_217_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['217'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['215'][1].init(10, 38);
function visit186_215_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['215'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['211'][2].init(10, 16);
function visit185_211_2(result) {
  _$jscoverage['/impl/logger.js'].branchData['211'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['211'][1].init(10, 49);
function visit184_211_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['211'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['210'][1].init(8, 14);
function visit183_210_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['210'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['205'][1].init(8, 28);
function visit182_205_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['205'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['190'][1].init(12, 27);
function visit181_190_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['190'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['185'][1].init(8, 23);
function visit180_185_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['185'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['182'][1].init(13, 32);
function visit179_182_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['182'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['181'][3].init(35, 19);
function visit178_181_3(result) {
  _$jscoverage['/impl/logger.js'].branchData['181'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['181'][2].init(8, 23);
function visit177_181_2(result) {
  _$jscoverage['/impl/logger.js'].branchData['181'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['181'][1].init(8, 46);
function visit176_181_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['181'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['175'][1].init(12, 33);
function visit175_175_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['175'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].branchData['173'][1].init(8, 21);
function visit174_173_1(result) {
  _$jscoverage['/impl/logger.js'].branchData['173'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/logger.js'].lineData[6]++;
define([], function() {
  _$jscoverage['/impl/logger.js'].functionData[0]++;
  _$jscoverage['/impl/logger.js'].lineData[7]++;
  'use strict';
  _$jscoverage['/impl/logger.js'].lineData[50]++;
  function Logger() {
    _$jscoverage['/impl/logger.js'].functionData[1]++;
    _$jscoverage['/impl/logger.js'].lineData[51]++;
    Object.defineProperty(this, 'LEVEL_NONE', {
  value: 0, 
  enumerable: true});
    _$jscoverage['/impl/logger.js'].lineData[55]++;
    Object.defineProperty(this, 'LEVEL_ERROR', {
  value: 1, 
  enumerable: true});
    _$jscoverage['/impl/logger.js'].lineData[59]++;
    Object.defineProperty(this, 'LEVEL_WARN', {
  value: 2, 
  enumerable: true});
    _$jscoverage['/impl/logger.js'].lineData[63]++;
    Object.defineProperty(this, 'LEVEL_INFO', {
  value: 3, 
  enumerable: true});
    _$jscoverage['/impl/logger.js'].lineData[67]++;
    Object.defineProperty(this, 'LEVEL_LOG', {
  value: 4, 
  enumerable: true});
    _$jscoverage['/impl/logger.js'].lineData[71]++;
    Object.defineProperty(this, '_METHOD_ERROR', {
  value: 'error'});
    _$jscoverage['/impl/logger.js'].lineData[74]++;
    Object.defineProperty(this, '_METHOD_WARN', {
  value: 'warn'});
    _$jscoverage['/impl/logger.js'].lineData[77]++;
    Object.defineProperty(this, '_METHOD_INFO', {
  value: 'info'});
    _$jscoverage['/impl/logger.js'].lineData[80]++;
    Object.defineProperty(this, '_METHOD_LOG', {
  value: 'log'});
    _$jscoverage['/impl/logger.js'].lineData[83]++;
    Object.defineProperty(this, '_defaultOptions', {
  value: {
  'level': this.LEVEL_ERROR, 
  'writer': null}});
    _$jscoverage['/impl/logger.js'].lineData[86]++;
    Object.defineProperty(this, '_options', {
  value: this._defaultOptions, 
  writable: true});
  }
  _$jscoverage['/impl/logger.js'].lineData[90]++;
  ;
  _$jscoverage['/impl/logger.js'].lineData[102]++;
  Logger.prototype.error = function(args) {
  _$jscoverage['/impl/logger.js'].functionData[2]++;
  _$jscoverage['/impl/logger.js'].lineData[103]++;
  _write(this, this.LEVEL_ERROR, this._METHOD_ERROR, arguments);
};
  _$jscoverage['/impl/logger.js'].lineData[116]++;
  Logger.prototype.info = function(args) {
  _$jscoverage['/impl/logger.js'].functionData[3]++;
  _$jscoverage['/impl/logger.js'].lineData[117]++;
  _write(this, this.LEVEL_INFO, this._METHOD_INFO, arguments);
};
  _$jscoverage['/impl/logger.js'].lineData[130]++;
  Logger.prototype.warn = function(args) {
  _$jscoverage['/impl/logger.js'].functionData[4]++;
  _$jscoverage['/impl/logger.js'].lineData[131]++;
  _write(this, this.LEVEL_WARN, this._METHOD_WARN, arguments);
};
  _$jscoverage['/impl/logger.js'].lineData[144]++;
  Logger.prototype.log = function(args) {
  _$jscoverage['/impl/logger.js'].functionData[5]++;
  _$jscoverage['/impl/logger.js'].lineData[145]++;
  _write(this, this.LEVEL_LOG, this._METHOD_LOG, arguments);
};
  _$jscoverage['/impl/logger.js'].lineData[171]++;
  Logger.prototype.option = function(key, value) {
  _$jscoverage['/impl/logger.js'].functionData[6]++;
  _$jscoverage['/impl/logger.js'].lineData[172]++;
  var ret = {}, opt;
  _$jscoverage['/impl/logger.js'].lineData[173]++;
  if (visit174_173_1(arguments.length == 0)) {
    _$jscoverage['/impl/logger.js'].lineData[174]++;
    for (opt in this._options) {
      _$jscoverage['/impl/logger.js'].lineData[175]++;
      if (visit175_175_1(this._options.hasOwnProperty(opt))) {
        _$jscoverage['/impl/logger.js'].lineData[176]++;
        ret[opt] = this._options[opt];
      }
    }
    _$jscoverage['/impl/logger.js'].lineData[179]++;
    return ret;
  }
  _$jscoverage['/impl/logger.js'].lineData[181]++;
  if (visit176_181_1(visit177_181_2(typeof key === "string") && visit178_181_3(value === undefined))) {
    _$jscoverage['/impl/logger.js'].lineData[182]++;
    return visit179_182_1(this._options[key] === undefined) ? null : this._options[key];
  }
  _$jscoverage['/impl/logger.js'].lineData[185]++;
  if (visit180_185_1(typeof key === "string")) {
    _$jscoverage['/impl/logger.js'].lineData[186]++;
    this._options[key] = value;
  } else {
    _$jscoverage['/impl/logger.js'].lineData[188]++;
    var options = key;
    _$jscoverage['/impl/logger.js'].lineData[189]++;
    for (opt in options) {
      _$jscoverage['/impl/logger.js'].lineData[190]++;
      if (visit181_190_1(options.hasOwnProperty(opt))) {
        _$jscoverage['/impl/logger.js'].lineData[191]++;
        this.option(opt, options[opt]);
      }
    }
  }
};
  _$jscoverage['/impl/logger.js'].lineData[202]++;
  function _write(logger, level, method, args) {
    _$jscoverage['/impl/logger.js'].functionData[7]++;
    _$jscoverage['/impl/logger.js'].lineData[203]++;
    var self = logger;
    _$jscoverage['/impl/logger.js'].lineData[205]++;
    if (visit182_205_1(self.option("level") < level)) {
      _$jscoverage['/impl/logger.js'].lineData[206]++;
      return;
    }
    _$jscoverage['/impl/logger.js'].lineData[209]++;
    var writer = _getWriter(self);
    _$jscoverage['/impl/logger.js'].lineData[210]++;
    if (visit183_210_1(writer != null)) {
      _$jscoverage['/impl/logger.js'].lineData[211]++;
      if (visit184_211_1(visit185_211_2(args.length == 1) && (args[0] instanceof Function))) {
        _$jscoverage['/impl/logger.js'].lineData[212]++;
        var msg = args[0]();
        _$jscoverage['/impl/logger.js'].lineData[213]++;
        args = [msg];
      }
      _$jscoverage['/impl/logger.js'].lineData[215]++;
      if (visit186_215_1(writer[method] && writer[method].apply)) {
        _$jscoverage['/impl/logger.js'].lineData[216]++;
        writer[method].apply(writer, args);
      } else {
        _$jscoverage['/impl/logger.js'].lineData[217]++;
        if (visit187_217_1(writer[method])) {
          _$jscoverage['/impl/logger.js'].lineData[218]++;
          writer[method] = Function.prototype.bind.call(writer[method], writer);
          _$jscoverage['/impl/logger.js'].lineData[219]++;
          _write(self, level, method, args);
        }
      }
    }
  }
  _$jscoverage['/impl/logger.js'].lineData[222]++;
  ;
  _$jscoverage['/impl/logger.js'].lineData[227]++;
  function _getWriter(logger) {
    _$jscoverage['/impl/logger.js'].functionData[8]++;
    _$jscoverage['/impl/logger.js'].lineData[228]++;
    var self = logger;
    _$jscoverage['/impl/logger.js'].lineData[230]++;
    var writer = null;
    _$jscoverage['/impl/logger.js'].lineData[231]++;
    if (visit188_231_1(self.option("writer"))) {
      _$jscoverage['/impl/logger.js'].lineData[232]++;
      writer = self.option("writer");
    } else {
      _$jscoverage['/impl/logger.js'].lineData[233]++;
      if (visit189_233_1(visit190_233_2(typeof window !== 'undefined') && visit191_233_3(window.console !== undefined))) {
        _$jscoverage['/impl/logger.js'].lineData[234]++;
        writer = window.console;
      }
    }
    _$jscoverage['/impl/logger.js'].lineData[236]++;
    return writer;
  }
  _$jscoverage['/impl/logger.js'].lineData[237]++;
  ;
  _$jscoverage['/impl/logger.js'].lineData[238]++;
  return new Logger();
});
