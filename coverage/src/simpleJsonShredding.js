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
if (! _$jscoverage['/simpleJsonShredding.js']) {
  _$jscoverage['/simpleJsonShredding.js'] = {};
  _$jscoverage['/simpleJsonShredding.js'].lineData = [];
  _$jscoverage['/simpleJsonShredding.js'].lineData[6] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[7] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[37] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[38] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[39] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[40] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[41] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[43] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[44] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[45] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[46] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[48] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[49] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[50] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[51] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[52] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[54] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[56] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[57] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[58] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[63] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[70] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[71] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[95] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[96] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[97] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[98] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[99] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[101] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[102] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[112] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[113] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[114] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[116] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[117] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[118] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[120] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[121] = 0;
  _$jscoverage['/simpleJsonShredding.js'].lineData[123] = 0;
}
if (! _$jscoverage['/simpleJsonShredding.js'].functionData) {
  _$jscoverage['/simpleJsonShredding.js'].functionData = [];
  _$jscoverage['/simpleJsonShredding.js'].functionData[0] = 0;
  _$jscoverage['/simpleJsonShredding.js'].functionData[1] = 0;
  _$jscoverage['/simpleJsonShredding.js'].functionData[2] = 0;
  _$jscoverage['/simpleJsonShredding.js'].functionData[3] = 0;
  _$jscoverage['/simpleJsonShredding.js'].functionData[4] = 0;
  _$jscoverage['/simpleJsonShredding.js'].functionData[5] = 0;
  _$jscoverage['/simpleJsonShredding.js'].functionData[6] = 0;
  _$jscoverage['/simpleJsonShredding.js'].functionData[7] = 0;
  _$jscoverage['/simpleJsonShredding.js'].functionData[8] = 0;
  _$jscoverage['/simpleJsonShredding.js'].functionData[9] = 0;
  _$jscoverage['/simpleJsonShredding.js'].functionData[10] = 0;
  _$jscoverage['/simpleJsonShredding.js'].functionData[11] = 0;
}
if (! _$jscoverage['/simpleJsonShredding.js'].branchData) {
  _$jscoverage['/simpleJsonShredding.js'].branchData = {};
  _$jscoverage['/simpleJsonShredding.js'].branchData['46'] = [];
  _$jscoverage['/simpleJsonShredding.js'].branchData['46'][1] = new BranchData();
  _$jscoverage['/simpleJsonShredding.js'].branchData['47'] = [];
  _$jscoverage['/simpleJsonShredding.js'].branchData['47'][1] = new BranchData();
  _$jscoverage['/simpleJsonShredding.js'].branchData['50'] = [];
  _$jscoverage['/simpleJsonShredding.js'].branchData['50'][1] = new BranchData();
  _$jscoverage['/simpleJsonShredding.js'].branchData['113'] = [];
  _$jscoverage['/simpleJsonShredding.js'].branchData['113'][1] = new BranchData();
  _$jscoverage['/simpleJsonShredding.js'].branchData['113'][2] = new BranchData();
  _$jscoverage['/simpleJsonShredding.js'].branchData['117'] = [];
  _$jscoverage['/simpleJsonShredding.js'].branchData['117'][1] = new BranchData();
  _$jscoverage['/simpleJsonShredding.js'].branchData['117'][2] = new BranchData();
  _$jscoverage['/simpleJsonShredding.js'].branchData['117'][3] = new BranchData();
  _$jscoverage['/simpleJsonShredding.js'].branchData['117'][4] = new BranchData();
}
_$jscoverage['/simpleJsonShredding.js'].branchData['117'][4].init(37, 39);
function visit681_117_4(result) {
  _$jscoverage['/simpleJsonShredding.js'].branchData['117'][4].ranCondition(result);
  return result;
}_$jscoverage['/simpleJsonShredding.js'].branchData['117'][3].init(16, 17);
function visit680_117_3(result) {
  _$jscoverage['/simpleJsonShredding.js'].branchData['117'][3].ranCondition(result);
  return result;
}_$jscoverage['/simpleJsonShredding.js'].branchData['117'][2].init(16, 60);
function visit679_117_2(result) {
  _$jscoverage['/simpleJsonShredding.js'].branchData['117'][2].ranCondition(result);
  return result;
}_$jscoverage['/simpleJsonShredding.js'].branchData['117'][1].init(8, 68);
function visit678_117_1(result) {
  _$jscoverage['/simpleJsonShredding.js'].branchData['117'][1].ranCondition(result);
  return result;
}_$jscoverage['/simpleJsonShredding.js'].branchData['113'][2].init(23, 23);
function visit677_113_2(result) {
  _$jscoverage['/simpleJsonShredding.js'].branchData['113'][2].ranCondition(result);
  return result;
}_$jscoverage['/simpleJsonShredding.js'].branchData['113'][1].init(8, 38);
function visit676_113_1(result) {
  _$jscoverage['/simpleJsonShredding.js'].branchData['113'][1].ranCondition(result);
  return result;
}_$jscoverage['/simpleJsonShredding.js'].branchData['50'][1].init(18, 26);
function visit675_50_1(result) {
  _$jscoverage['/simpleJsonShredding.js'].branchData['50'][1].ranCondition(result);
  return result;
}_$jscoverage['/simpleJsonShredding.js'].branchData['47'][1].init(12, 18);
function visit674_47_1(result) {
  _$jscoverage['/simpleJsonShredding.js'].branchData['47'][1].ranCondition(result);
  return result;
}_$jscoverage['/simpleJsonShredding.js'].branchData['46'][1].init(14, 42);
function visit673_46_1(result) {
  _$jscoverage['/simpleJsonShredding.js'].branchData['46'][1].ranCondition(result);
  return result;
}_$jscoverage['/simpleJsonShredding.js'].lineData[6]++;
define(['./persistenceUtils'], function(persistenceUtils) {
  _$jscoverage['/simpleJsonShredding.js'].functionData[0]++;
  _$jscoverage['/simpleJsonShredding.js'].lineData[7]++;
  'use strict';
  _$jscoverage['/simpleJsonShredding.js'].lineData[37]++;
  var getShredder = function(storeName, idAttr) {
  _$jscoverage['/simpleJsonShredding.js'].functionData[1]++;
  _$jscoverage['/simpleJsonShredding.js'].lineData[38]++;
  return function(response) {
  _$jscoverage['/simpleJsonShredding.js'].functionData[2]++;
  _$jscoverage['/simpleJsonShredding.js'].lineData[39]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/simpleJsonShredding.js'].functionData[3]++;
  _$jscoverage['/simpleJsonShredding.js'].lineData[40]++;
  var responseClone = response.clone();
  _$jscoverage['/simpleJsonShredding.js'].lineData[41]++;
  var resourceIdentifier = responseClone.headers.get('Etag');
  _$jscoverage['/simpleJsonShredding.js'].lineData[70]++;
  responseClone.text().then(function(payload) {
  _$jscoverage['/simpleJsonShredding.js'].functionData[4]++;
  _$jscoverage['/simpleJsonShredding.js'].lineData[43]++;
  var idArray = [];
  _$jscoverage['/simpleJsonShredding.js'].lineData[44]++;
  var dataArray = [];
  _$jscoverage['/simpleJsonShredding.js'].lineData[45]++;
  var resourceType = 'collection';
  _$jscoverage['/simpleJsonShredding.js'].lineData[46]++;
  if (visit673_46_1(payload && visit674_47_1(payload.length > 0))) {
    _$jscoverage['/simpleJsonShredding.js'].lineData[48]++;
    try {
      _$jscoverage['/simpleJsonShredding.js'].lineData[49]++;
      var payloadJson = JSON.parse(payload);
      _$jscoverage['/simpleJsonShredding.js'].lineData[50]++;
      if (visit675_50_1(Array.isArray(payloadJson))) {
        _$jscoverage['/simpleJsonShredding.js'].lineData[51]++;
        idArray = payloadJson.map(function(jsonEntry) {
  _$jscoverage['/simpleJsonShredding.js'].functionData[5]++;
  _$jscoverage['/simpleJsonShredding.js'].lineData[52]++;
  return jsonEntry[idAttr];
});
        _$jscoverage['/simpleJsonShredding.js'].lineData[54]++;
        dataArray = payloadJson;
      } else {
        _$jscoverage['/simpleJsonShredding.js'].lineData[56]++;
        idArray[0] = payloadJson[idAttr];
        _$jscoverage['/simpleJsonShredding.js'].lineData[57]++;
        dataArray[0] = payloadJson;
        _$jscoverage['/simpleJsonShredding.js'].lineData[58]++;
        resourceType = 'single';
      }
    }    catch (err) {
}
  }
  _$jscoverage['/simpleJsonShredding.js'].lineData[63]++;
  resolve([{
  'name': storeName, 
  'resourceIdentifier': resourceIdentifier, 
  'keys': idArray, 
  'data': dataArray, 
  'resourceType': resourceType}]);
}).catch(function(err) {
  _$jscoverage['/simpleJsonShredding.js'].functionData[6]++;
  _$jscoverage['/simpleJsonShredding.js'].lineData[71]++;
  reject(err);
});
});
};
};
  _$jscoverage['/simpleJsonShredding.js'].lineData[95]++;
  var getUnshredder = function() {
  _$jscoverage['/simpleJsonShredding.js'].functionData[7]++;
  _$jscoverage['/simpleJsonShredding.js'].lineData[96]++;
  return function(data, response) {
  _$jscoverage['/simpleJsonShredding.js'].functionData[8]++;
  _$jscoverage['/simpleJsonShredding.js'].lineData[97]++;
  return Promise.resolve().then(function() {
  _$jscoverage['/simpleJsonShredding.js'].functionData[9]++;
  _$jscoverage['/simpleJsonShredding.js'].lineData[98]++;
  var dataContent = _retrieveDataContent(data);
  _$jscoverage['/simpleJsonShredding.js'].lineData[99]++;
  return persistenceUtils.setResponsePayload(response, dataContent);
}).then(function(response) {
  _$jscoverage['/simpleJsonShredding.js'].functionData[10]++;
  _$jscoverage['/simpleJsonShredding.js'].lineData[101]++;
  response.headers.set('x-oracle-jscpt-cache-expiration-date', '');
  _$jscoverage['/simpleJsonShredding.js'].lineData[102]++;
  return Promise.resolve(response);
});
};
};
  _$jscoverage['/simpleJsonShredding.js'].lineData[112]++;
  function _retrieveDataContent(valueArray) {
    _$jscoverage['/simpleJsonShredding.js'].functionData[11]++;
    _$jscoverage['/simpleJsonShredding.js'].lineData[113]++;
    if (visit676_113_1(!valueArray || visit677_113_2(valueArray.length !== 1))) {
      _$jscoverage['/simpleJsonShredding.js'].lineData[114]++;
      throw new Error({
  message: 'shredded data is not in the correct format.'});
    }
    _$jscoverage['/simpleJsonShredding.js'].lineData[116]++;
    var data = valueArray[0].data;
    _$jscoverage['/simpleJsonShredding.js'].lineData[117]++;
    if (visit678_117_1(data && visit679_117_2(visit680_117_3(data.length === 1) && visit681_117_4(valueArray[0].resourceType === 'single')))) {
      _$jscoverage['/simpleJsonShredding.js'].lineData[118]++;
      return data[0];
    }
    _$jscoverage['/simpleJsonShredding.js'].lineData[120]++;
    return data;
  }
  _$jscoverage['/simpleJsonShredding.js'].lineData[121]++;
  ;
  _$jscoverage['/simpleJsonShredding.js'].lineData[123]++;
  return {
  getShredder: getShredder, 
  getUnshredder: getUnshredder};
});
