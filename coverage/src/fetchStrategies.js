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
if (! _$jscoverage['/fetchStrategies.js']) {
  _$jscoverage['/fetchStrategies.js'] = {};
  _$jscoverage['/fetchStrategies.js'].lineData = [];
  _$jscoverage['/fetchStrategies.js'].lineData[6] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[8] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[38] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[39] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[40] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[42] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[44] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[45] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[49] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[50] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[51] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[52] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[53] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[54] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[55] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[56] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[58] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[59] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[61] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[62] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[63] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[64] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[68] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[69] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[72] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[75] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[78] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[79] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[84] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[86] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[97] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[98] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[99] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[100] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[103] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[104] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[105] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[108] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[114] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[115] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[116] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[118] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[121] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[122] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[124] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[125] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[129] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[132] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[134] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[135] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[139] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[140] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[143] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[144] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[146] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[150] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[152] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[153] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[154] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[156] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[157] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[158] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[159] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[160] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[161] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[162] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[163] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[165] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[166] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[167] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[169] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[170] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[172] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[174] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[175] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[180] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[181] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[185] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[187] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[188] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[193] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[194] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[195] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[199] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[201] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[203] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[205] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[207] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[209] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[211] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[213] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[215] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[217] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[218] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[221] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[222] = 0;
  _$jscoverage['/fetchStrategies.js'].lineData[224] = 0;
}
if (! _$jscoverage['/fetchStrategies.js'].functionData) {
  _$jscoverage['/fetchStrategies.js'].functionData = [];
  _$jscoverage['/fetchStrategies.js'].functionData[0] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[1] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[2] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[3] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[4] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[5] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[6] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[7] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[8] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[9] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[10] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[11] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[12] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[13] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[14] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[15] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[16] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[17] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[18] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[19] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[20] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[21] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[22] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[23] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[24] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[25] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[26] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[27] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[28] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[29] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[30] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[31] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[32] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[33] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[34] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[35] = 0;
  _$jscoverage['/fetchStrategies.js'].functionData[36] = 0;
}
if (! _$jscoverage['/fetchStrategies.js'].branchData) {
  _$jscoverage['/fetchStrategies.js'].branchData = {};
  _$jscoverage['/fetchStrategies.js'].branchData['39'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['39'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['42'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['42'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['50'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['50'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['63'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['63'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['64'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['64'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['64'][2] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['65'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['65'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['66'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['66'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['66'][2] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['67'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['67'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['99'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['99'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['103'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['103'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['121'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['121'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['139'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['139'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['159'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['159'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['161'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['161'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['169'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['169'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['188'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['188'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['205'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['205'][1] = new BranchData();
  _$jscoverage['/fetchStrategies.js'].branchData['217'] = [];
  _$jscoverage['/fetchStrategies.js'].branchData['217'][1] = new BranchData();
}
_$jscoverage['/fetchStrategies.js'].branchData['217'][1].init(10, 31);
function visit20_217_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['217'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['205'][1].init(10, 20);
function visit19_205_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['205'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['188'][1].init(10, 22);
function visit18_188_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['188'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['169'][1].init(22, 22);
function visit17_169_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['169'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['161'][1].init(18, 14);
function visit16_161_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['161'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['159'][1].init(14, 14);
function visit15_159_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['159'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['139'][1].init(12, 21);
function visit14_139_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['139'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['121'][1].init(18, 8);
function visit13_121_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['121'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['103'][1].init(18, 11);
function visit12_103_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['103'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['99'][1].init(12, 29);
function visit11_99_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['99'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['67'][1].init(22, 24);
function visit10_67_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['67'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['66'][2].init(21, 23);
function visit9_66_2(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['66'][2].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['66'][1].init(21, 74);
function visit8_66_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['66'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['65'][1].init(20, 163);
function visit7_65_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['65'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['64'][2].init(22, 34);
function visit6_64_2(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['64'][2].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['64'][1].init(22, 222);
function visit5_64_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['64'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['63'][1].init(20, 10);
function visit4_63_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['63'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['50'][1].init(12, 22);
function visit3_50_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['50'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['42'][1].init(10, 23);
function visit2_42_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['42'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].branchData['39'][1].init(16, 13);
function visit1_39_1(result) {
  _$jscoverage['/fetchStrategies.js'].branchData['39'][1].ranCondition(result);
  return result;
}_$jscoverage['/fetchStrategies.js'].lineData[6]++;
define(['./persistenceManager', './persistenceUtils', './impl/defaultCacheHandler', './impl/logger'], function(persistenceManager, persistenceUtils, cacheHandler, logger) {
  _$jscoverage['/fetchStrategies.js'].functionData[0]++;
  _$jscoverage['/fetchStrategies.js'].lineData[8]++;
  'use strict';
  _$jscoverage['/fetchStrategies.js'].lineData[38]++;
  function getCacheFirstStrategy(options) {
    _$jscoverage['/fetchStrategies.js'].functionData[1]++;
    _$jscoverage['/fetchStrategies.js'].lineData[39]++;
    options = visit1_39_1(options || {});
    _$jscoverage['/fetchStrategies.js'].lineData[40]++;
    var serverResponseCallback = options['serverResponseCallback'];
    _$jscoverage['/fetchStrategies.js'].lineData[42]++;
    if (visit2_42_1(!serverResponseCallback)) {
      _$jscoverage['/fetchStrategies.js'].lineData[44]++;
      serverResponseCallback = function(request, response) {
  _$jscoverage['/fetchStrategies.js'].functionData[2]++;
  _$jscoverage['/fetchStrategies.js'].lineData[45]++;
  return Promise.resolve(response);
};
    }
    _$jscoverage['/fetchStrategies.js'].lineData[49]++;
    return function(request, options) {
  _$jscoverage['/fetchStrategies.js'].functionData[3]++;
  _$jscoverage['/fetchStrategies.js'].lineData[50]++;
  if (visit3_50_1(serverResponseCallback)) {
    _$jscoverage['/fetchStrategies.js'].lineData[51]++;
    var wrappedServerResponseCallback = function(request, response) {
  _$jscoverage['/fetchStrategies.js'].functionData[4]++;
  _$jscoverage['/fetchStrategies.js'].lineData[52]++;
  var endpointKey = persistenceUtils.buildEndpointKey(request);
  _$jscoverage['/fetchStrategies.js'].lineData[53]++;
  cacheHandler.registerEndpointOptions(endpointKey, options);
  _$jscoverage['/fetchStrategies.js'].lineData[54]++;
  var localVars = {};
  _$jscoverage['/fetchStrategies.js'].lineData[55]++;
  return persistenceUtils._cloneResponse(response).then(function(responseClone) {
  _$jscoverage['/fetchStrategies.js'].functionData[5]++;
  _$jscoverage['/fetchStrategies.js'].lineData[56]++;
  return serverResponseCallback(request, responseClone);
}).then(function(resolvedResponse) {
  _$jscoverage['/fetchStrategies.js'].functionData[6]++;
  _$jscoverage['/fetchStrategies.js'].lineData[58]++;
  localVars.resolvedResponse = resolvedResponse;
  _$jscoverage['/fetchStrategies.js'].lineData[59]++;
  return persistenceManager.getCache().hasMatch(request, {
  ignoreSearch: true});
}).then(function(matchExist) {
  _$jscoverage['/fetchStrategies.js'].functionData[7]++;
  _$jscoverage['/fetchStrategies.js'].lineData[61]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/fetchStrategies.js'].functionData[8]++;
  _$jscoverage['/fetchStrategies.js'].lineData[62]++;
  var responseClone = localVars.resolvedResponse.clone();
  _$jscoverage['/fetchStrategies.js'].lineData[63]++;
  if (visit4_63_1(matchExist)) {
    _$jscoverage['/fetchStrategies.js'].lineData[64]++;
    if (visit5_64_1(visit6_64_2(localVars.resolvedResponse != null) && visit7_65_1(!persistenceUtils.isCachedResponse(localVars.resolvedResponse) && (visit8_66_1(visit9_66_2(request.method == 'GET') || visit10_67_1(request.method == 'HEAD')))))) {
      _$jscoverage['/fetchStrategies.js'].lineData[68]++;
      return persistenceManager.getCache().put(request, localVars.resolvedResponse).then(function() {
  _$jscoverage['/fetchStrategies.js'].functionData[9]++;
  _$jscoverage['/fetchStrategies.js'].lineData[69]++;
  resolve(responseClone);
});
    } else {
      _$jscoverage['/fetchStrategies.js'].lineData[72]++;
      resolve(responseClone);
    }
  } else {
    _$jscoverage['/fetchStrategies.js'].lineData[75]++;
    resolve(responseClone);
  }
}).then(function(response) {
  _$jscoverage['/fetchStrategies.js'].functionData[10]++;
  _$jscoverage['/fetchStrategies.js'].lineData[78]++;
  cacheHandler.unregisterEndpointOptions(endpointKey);
  _$jscoverage['/fetchStrategies.js'].lineData[79]++;
  return Promise.resolve(response);
});
});
};
  }
  _$jscoverage['/fetchStrategies.js'].lineData[84]++;
  return _fetchFromCacheOrServerIfEmpty(request, options, wrappedServerResponseCallback);
};
  }
  _$jscoverage['/fetchStrategies.js'].lineData[86]++;
  ;
  _$jscoverage['/fetchStrategies.js'].lineData[97]++;
  function getCacheIfOfflineStrategy() {
    _$jscoverage['/fetchStrategies.js'].functionData[11]++;
    _$jscoverage['/fetchStrategies.js'].lineData[98]++;
    return function(request, options) {
  _$jscoverage['/fetchStrategies.js'].functionData[12]++;
  _$jscoverage['/fetchStrategies.js'].lineData[99]++;
  if (visit11_99_1(persistenceManager.isOnline())) {
    _$jscoverage['/fetchStrategies.js'].lineData[100]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/fetchStrategies.js'].functionData[13]++;
  _$jscoverage['/fetchStrategies.js'].lineData[124]++;
  persistenceManager.browserFetch(request).then(function(response) {
  _$jscoverage['/fetchStrategies.js'].functionData[14]++;
  _$jscoverage['/fetchStrategies.js'].lineData[103]++;
  if (visit12_103_1(response.ok)) {
    _$jscoverage['/fetchStrategies.js'].lineData[104]++;
    persistenceUtils._cloneResponse(response).then(function(responseClone) {
  _$jscoverage['/fetchStrategies.js'].functionData[15]++;
  _$jscoverage['/fetchStrategies.js'].lineData[105]++;
  resolve(responseClone);
});
  } else {
    _$jscoverage['/fetchStrategies.js'].lineData[108]++;
    return _handleResponseNotOk(request, response, options);
  }
}, function(err) {
  _$jscoverage['/fetchStrategies.js'].functionData[16]++;
  _$jscoverage['/fetchStrategies.js'].lineData[114]++;
  logger.log(err);
  _$jscoverage['/fetchStrategies.js'].lineData[115]++;
  _fetchFromCacheOrServerIfEmpty(request, options).then(function(response) {
  _$jscoverage['/fetchStrategies.js'].functionData[17]++;
  _$jscoverage['/fetchStrategies.js'].lineData[116]++;
  resolve(response);
}, function(err) {
  _$jscoverage['/fetchStrategies.js'].functionData[18]++;
  _$jscoverage['/fetchStrategies.js'].lineData[118]++;
  reject(err);
});
}).then(function(response) {
  _$jscoverage['/fetchStrategies.js'].functionData[19]++;
  _$jscoverage['/fetchStrategies.js'].lineData[121]++;
  if (visit13_121_1(response)) {
    _$jscoverage['/fetchStrategies.js'].lineData[122]++;
    resolve(response);
  }
}).catch(function(err) {
  _$jscoverage['/fetchStrategies.js'].functionData[20]++;
  _$jscoverage['/fetchStrategies.js'].lineData[125]++;
  reject(err);
});
});
  } else {
    _$jscoverage['/fetchStrategies.js'].lineData[129]++;
    return _fetchFromCacheOrServerIfEmpty(request, options);
  }
};
  }
  _$jscoverage['/fetchStrategies.js'].lineData[132]++;
  ;
  _$jscoverage['/fetchStrategies.js'].lineData[134]++;
  function _handleResponseNotOk(request, response, options) {
    _$jscoverage['/fetchStrategies.js'].functionData[21]++;
    _$jscoverage['/fetchStrategies.js'].lineData[135]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/fetchStrategies.js'].functionData[22]++;
  _$jscoverage['/fetchStrategies.js'].lineData[139]++;
  if (visit14_139_1(response.status < 500)) {
    _$jscoverage['/fetchStrategies.js'].lineData[140]++;
    resolve(response);
  } else {
    _$jscoverage['/fetchStrategies.js'].lineData[143]++;
    _fetchFromCacheOrServerIfEmpty(request, options).then(function(response) {
  _$jscoverage['/fetchStrategies.js'].functionData[23]++;
  _$jscoverage['/fetchStrategies.js'].lineData[144]++;
  resolve(response);
}, function(err) {
  _$jscoverage['/fetchStrategies.js'].functionData[24]++;
  _$jscoverage['/fetchStrategies.js'].lineData[146]++;
  reject(err);
});
  }
});
  }
  _$jscoverage['/fetchStrategies.js'].lineData[150]++;
  ;
  _$jscoverage['/fetchStrategies.js'].lineData[152]++;
  function _checkCacheForMatch(request) {
    _$jscoverage['/fetchStrategies.js'].functionData[25]++;
    _$jscoverage['/fetchStrategies.js'].lineData[153]++;
    return persistenceManager.getCache().match(request, {
  ignoreSearch: true});
  }
  _$jscoverage['/fetchStrategies.js'].lineData[154]++;
  ;
  _$jscoverage['/fetchStrategies.js'].lineData[156]++;
  function _fetchFromCacheOrServerIfEmpty(request, options, serverResponseCallback) {
    _$jscoverage['/fetchStrategies.js'].functionData[26]++;
    _$jscoverage['/fetchStrategies.js'].lineData[157]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/fetchStrategies.js'].functionData[27]++;
  _$jscoverage['/fetchStrategies.js'].lineData[158]++;
  _processQueryParams(request, options).then(function(queryResponse) {
  _$jscoverage['/fetchStrategies.js'].functionData[28]++;
  _$jscoverage['/fetchStrategies.js'].lineData[159]++;
  if (visit15_159_1(!queryResponse)) {
    _$jscoverage['/fetchStrategies.js'].lineData[160]++;
    _checkCacheForMatch(request).then(function(cachedResponse) {
  _$jscoverage['/fetchStrategies.js'].functionData[29]++;
  _$jscoverage['/fetchStrategies.js'].lineData[161]++;
  if (visit16_161_1(cachedResponse)) {
    _$jscoverage['/fetchStrategies.js'].lineData[162]++;
    resolve(cachedResponse);
    _$jscoverage['/fetchStrategies.js'].lineData[163]++;
    _fetchForServerResponseCallback(request, serverResponseCallback);
  } else {
    _$jscoverage['/fetchStrategies.js'].lineData[165]++;
    persistenceManager.browserFetch(request).then(function(response) {
  _$jscoverage['/fetchStrategies.js'].functionData[30]++;
  _$jscoverage['/fetchStrategies.js'].lineData[166]++;
  var responseClone = response.clone();
  _$jscoverage['/fetchStrategies.js'].lineData[167]++;
  resolve(responseClone);
  _$jscoverage['/fetchStrategies.js'].lineData[169]++;
  if (visit17_169_1(serverResponseCallback)) {
    _$jscoverage['/fetchStrategies.js'].lineData[170]++;
    serverResponseCallback(request, response);
  }
  _$jscoverage['/fetchStrategies.js'].lineData[172]++;
  return;
}, function(err) {
  _$jscoverage['/fetchStrategies.js'].functionData[31]++;
  _$jscoverage['/fetchStrategies.js'].lineData[174]++;
  var init = {
  'status': 503, 
  'statusText': 'No cached response exists'};
  _$jscoverage['/fetchStrategies.js'].lineData[175]++;
  resolve(new Response(null, init));
});
  }
});
  } else {
    _$jscoverage['/fetchStrategies.js'].lineData[180]++;
    resolve(queryResponse.clone());
    _$jscoverage['/fetchStrategies.js'].lineData[181]++;
    _fetchForServerResponseCallback(request, serverResponseCallback);
  }
});
});
  }
  _$jscoverage['/fetchStrategies.js'].lineData[185]++;
  ;
  _$jscoverage['/fetchStrategies.js'].lineData[187]++;
  function _fetchForServerResponseCallback(request, serverResponseCallback) {
    _$jscoverage['/fetchStrategies.js'].functionData[32]++;
    _$jscoverage['/fetchStrategies.js'].lineData[188]++;
    if (visit18_188_1(serverResponseCallback)) {
      _$jscoverage['/fetchStrategies.js'].lineData[193]++;
      persistenceManager.browserFetch(request).then(function(response) {
  _$jscoverage['/fetchStrategies.js'].functionData[33]++;
  _$jscoverage['/fetchStrategies.js'].lineData[194]++;
  persistenceUtils._cloneResponse(response).then(function(responseClone) {
  _$jscoverage['/fetchStrategies.js'].functionData[34]++;
  _$jscoverage['/fetchStrategies.js'].lineData[195]++;
  serverResponseCallback(request, responseClone);
});
});
    }
  }
  _$jscoverage['/fetchStrategies.js'].lineData[199]++;
  ;
  _$jscoverage['/fetchStrategies.js'].lineData[201]++;
  function _processQueryParams(request, options) {
    _$jscoverage['/fetchStrategies.js'].functionData[35]++;
    _$jscoverage['/fetchStrategies.js'].lineData[203]++;
    var queryHandler = _getQueryHandler(options);
    _$jscoverage['/fetchStrategies.js'].lineData[205]++;
    if (visit19_205_1(queryHandler == null)) {
      _$jscoverage['/fetchStrategies.js'].lineData[207]++;
      return Promise.resolve();
    } else {
      _$jscoverage['/fetchStrategies.js'].lineData[209]++;
      return queryHandler(request, options);
    }
  }
  _$jscoverage['/fetchStrategies.js'].lineData[211]++;
  ;
  _$jscoverage['/fetchStrategies.js'].lineData[213]++;
  function _getQueryHandler(options) {
    _$jscoverage['/fetchStrategies.js'].functionData[36]++;
    _$jscoverage['/fetchStrategies.js'].lineData[215]++;
    var queryHandler = null;
    _$jscoverage['/fetchStrategies.js'].lineData[217]++;
    if (visit20_217_1(options['queryHandler'] != null)) {
      _$jscoverage['/fetchStrategies.js'].lineData[218]++;
      queryHandler = options['queryHandler'];
    }
    _$jscoverage['/fetchStrategies.js'].lineData[221]++;
    return queryHandler;
  }
  _$jscoverage['/fetchStrategies.js'].lineData[222]++;
  ;
  _$jscoverage['/fetchStrategies.js'].lineData[224]++;
  return {
  'getCacheFirstStrategy': getCacheFirstStrategy, 
  'getCacheIfOfflineStrategy': getCacheIfOfflineStrategy};
});
