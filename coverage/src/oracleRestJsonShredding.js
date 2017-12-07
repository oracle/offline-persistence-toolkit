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
if (! _$jscoverage['/oracleRestJsonShredding.js']) {
  _$jscoverage['/oracleRestJsonShredding.js'] = {};
  _$jscoverage['/oracleRestJsonShredding.js'].lineData = [];
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[6] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[7] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[38] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[39] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[40] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[41] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[42] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[44] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[45] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[46] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[47] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[49] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[50] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[51] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[52] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[53] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[55] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[57] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[58] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[59] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[64] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[71] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[72] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[100] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[101] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[102] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[103] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[104] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[105] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[106] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[112] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[113] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[114] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[116] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[117] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[118] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[119] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[121] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[124] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[125] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[127] = 0;
}
if (! _$jscoverage['/oracleRestJsonShredding.js'].functionData) {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData = [];
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[0] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[1] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[2] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[3] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[4] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[5] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[6] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[7] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[8] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[9] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[10] = 0;
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[11] = 0;
}
if (! _$jscoverage['/oracleRestJsonShredding.js'].branchData) {
  _$jscoverage['/oracleRestJsonShredding.js'].branchData = {};
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['47'] = [];
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['47'][1] = new BranchData();
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['47'][2] = new BranchData();
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['48'] = [];
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['48'][1] = new BranchData();
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['51'] = [];
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['51'][1] = new BranchData();
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['113'] = [];
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['113'][1] = new BranchData();
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['113'][2] = new BranchData();
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['118'] = [];
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][1] = new BranchData();
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][2] = new BranchData();
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][3] = new BranchData();
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][4] = new BranchData();
}
_$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][4].init(37, 34);
function visit422_118_4(result) {
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][4].ranCondition(result);
  return result;
}_$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][3].init(16, 17);
function visit421_118_3(result) {
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][3].ranCondition(result);
  return result;
}_$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][2].init(16, 55);
function visit420_118_2(result) {
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][2].ranCondition(result);
  return result;
}_$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][1].init(8, 63);
function visit418_118_1(result) {
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['118'][1].ranCondition(result);
  return result;
}_$jscoverage['/oracleRestJsonShredding.js'].branchData['113'][2].init(18, 18);
function visit417_113_2(result) {
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['113'][2].ranCondition(result);
  return result;
}_$jscoverage['/oracleRestJsonShredding.js'].branchData['113'][1].init(8, 28);
function visit415_113_1(result) {
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['113'][1].ranCondition(result);
  return result;
}_$jscoverage['/oracleRestJsonShredding.js'].branchData['51'][1].init(18, 25);
function visit413_51_1(result) {
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['51'][1].ranCondition(result);
  return result;
}_$jscoverage['/oracleRestJsonShredding.js'].branchData['48'][1].init(12, 18);
function visit412_48_1(result) {
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['48'][1].ranCondition(result);
  return result;
}_$jscoverage['/oracleRestJsonShredding.js'].branchData['47'][2].init(14, 15);
function visit411_47_2(result) {
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['47'][2].ranCondition(result);
  return result;
}_$jscoverage['/oracleRestJsonShredding.js'].branchData['47'][1].init(14, 50);
function visit410_47_1(result) {
  _$jscoverage['/oracleRestJsonShredding.js'].branchData['47'][1].ranCondition(result);
  return result;
}_$jscoverage['/oracleRestJsonShredding.js'].lineData[6]++;
define(['./persistenceUtils'], function(persistenceUtils) {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[0]++;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[7]++;
  'use strict';
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[38]++;
  var getShredder = function(storeName, idAttr) {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[1]++;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[39]++;
  return function(response) {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[2]++;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[40]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[3]++;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[41]++;
  var responseClone = response.clone();
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[42]++;
  var resourceIdentifier = responseClone.headers.get('X-ORACLE-DMS-ECID');
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[71]++;
  responseClone.text().then(function(payload) {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[4]++;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[44]++;
  var idArray = [];
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[45]++;
  var dataArray = [];
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[46]++;
  var resourceType = 'collection';
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[47]++;
  if (visit410_47_1(visit411_47_2(payload != null) && visit412_48_1(payload.length > 0))) {
    _$jscoverage['/oracleRestJsonShredding.js'].lineData[49]++;
    try {
      _$jscoverage['/oracleRestJsonShredding.js'].lineData[50]++;
      var payloadJson = JSON.parse(payload);
      _$jscoverage['/oracleRestJsonShredding.js'].lineData[51]++;
      if (visit413_51_1(payloadJson.items != null)) {
        _$jscoverage['/oracleRestJsonShredding.js'].lineData[52]++;
        idArray = payloadJson.items.map(function(jsonEntry) {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[5]++;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[53]++;
  return jsonEntry[idAttr];
});
        _$jscoverage['/oracleRestJsonShredding.js'].lineData[55]++;
        dataArray = payloadJson.items;
      } else {
        _$jscoverage['/oracleRestJsonShredding.js'].lineData[57]++;
        idArray[0] = payloadJson[idAttr];
        _$jscoverage['/oracleRestJsonShredding.js'].lineData[58]++;
        dataArray[0] = payloadJson;
        _$jscoverage['/oracleRestJsonShredding.js'].lineData[59]++;
        resourceType = 'single';
      }
    }    catch (err) {
}
  }
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[64]++;
  resolve([{
  'name': storeName, 
  'resourceIdentifier': resourceIdentifier, 
  'keys': idArray, 
  'data': dataArray, 
  'resourceType': resourceType}]);
}).catch(function(err) {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[6]++;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[72]++;
  reject(err);
});
});
};
};
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[100]++;
  var getUnshredder = function() {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[7]++;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[101]++;
  return function(value, response) {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[8]++;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[102]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[9]++;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[103]++;
  var payload = _buildPayload(value, response);
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[104]++;
  persistenceUtils.setResponsePayload(response, payload).then(function(response) {
  _$jscoverage['/oracleRestJsonShredding.js'].functionData[10]++;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[105]++;
  response.headers.set('x-oracle-jscpt-cache-expiration-date', '');
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[106]++;
  resolve(response);
});
});
};
};
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[112]++;
  function _buildPayload(value, response) {
    _$jscoverage['/oracleRestJsonShredding.js'].functionData[11]++;
    _$jscoverage['/oracleRestJsonShredding.js'].lineData[113]++;
    if (visit415_113_1(!value || visit417_113_2(value.length !== 1))) {
      _$jscoverage['/oracleRestJsonShredding.js'].lineData[114]++;
      throw new Error({
  message: 'shredded data is not in the correct format.'});
    }
    _$jscoverage['/oracleRestJsonShredding.js'].lineData[116]++;
    var payload;
    _$jscoverage['/oracleRestJsonShredding.js'].lineData[117]++;
    var data = value[0].data;
    _$jscoverage['/oracleRestJsonShredding.js'].lineData[118]++;
    if (visit418_118_1(data && visit420_118_2(visit421_118_3(data.length === 1) && visit422_118_4(value[0].resourceType === 'single')))) {
      _$jscoverage['/oracleRestJsonShredding.js'].lineData[119]++;
      payload = data[0];
    } else {
      _$jscoverage['/oracleRestJsonShredding.js'].lineData[121]++;
      payload = {
  items: data, 
  count: data.length};
    }
    _$jscoverage['/oracleRestJsonShredding.js'].lineData[124]++;
    return payload;
  }
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[125]++;
  ;
  _$jscoverage['/oracleRestJsonShredding.js'].lineData[127]++;
  return {
  getShredder: getShredder, 
  getUnshredder: getUnshredder};
});
