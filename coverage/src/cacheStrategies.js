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
if (! _$jscoverage['/cacheStrategies.js']) {
  _$jscoverage['/cacheStrategies.js'] = {};
  _$jscoverage['/cacheStrategies.js'].lineData = [];
  _$jscoverage['/cacheStrategies.js'].lineData[6] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[7] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[31] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[32] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[33] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[38] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[40] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[42] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[44] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[46] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[47] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[48] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[52] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[54] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[58] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[59] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[61] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[64] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[66] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[67] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[69] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[73] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[75] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[76] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[77] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[78] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[79] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[81] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[82] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[83] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[84] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[87] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[88] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[90] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[92] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[93] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[95] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[96] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[97] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[99] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[103] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[105] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[106] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[107] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[108] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[109] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[112] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[116] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[118] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[119] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[120] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[121] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[122] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[127] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[129] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[130] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[132] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[137] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[138] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[140] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[144] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[145] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[146] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[147] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[148] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[149] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[151] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[152] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[156] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[157] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[159] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[160] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[161] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[164] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[166] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[168] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[169] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[170] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[173] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[174] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[175] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[177] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[180] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[182] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[184] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[185] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[187] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[189] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[191] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[193] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[195] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[197] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[198] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[200] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[201] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[202] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[203] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[204] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[207] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[208] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[209] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[216] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[217] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[219] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[229] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[230] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[236] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[237] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[239] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[240] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[241] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[242] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[243] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[247] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[250] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[251] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[252] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[253] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[257] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[258] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[262] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[269] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[270] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[272] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[273] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[275] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[279] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[280] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[281] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[284] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[287] = 0;
  _$jscoverage['/cacheStrategies.js'].lineData[289] = 0;
}
if (! _$jscoverage['/cacheStrategies.js'].functionData) {
  _$jscoverage['/cacheStrategies.js'].functionData = [];
  _$jscoverage['/cacheStrategies.js'].functionData[0] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[1] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[2] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[3] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[4] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[5] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[6] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[7] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[8] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[9] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[10] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[11] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[12] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[13] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[14] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[15] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[16] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[17] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[18] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[19] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[20] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[21] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[22] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[23] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[24] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[25] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[26] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[27] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[28] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[29] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[30] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[31] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[32] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[33] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[34] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[35] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[36] = 0;
  _$jscoverage['/cacheStrategies.js'].functionData[37] = 0;
}
if (! _$jscoverage['/cacheStrategies.js'].branchData) {
  _$jscoverage['/cacheStrategies.js'].branchData = {};
  _$jscoverage['/cacheStrategies.js'].branchData['61'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['61'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['62'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['62'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['63'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['63'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['63'][2] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['75'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['75'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['76'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['76'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['78'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['78'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['95'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['95'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['96'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['96'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['99'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['99'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['100'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['100'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['112'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['112'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['113'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['113'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['145'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['145'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['147'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['147'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['151'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['151'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['160'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['160'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['169'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['169'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['174'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['174'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['174'][2] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['182'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['182'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['184'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['184'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['197'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['197'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['203'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['203'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['207'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['207'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['209'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['209'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['209'][2] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['229'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['229'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['230'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['230'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['236'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['236'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['252'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['252'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['275'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['275'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['275'][2] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['276'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['276'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['277'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['277'][1] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['277'][2] = new BranchData();
  _$jscoverage['/cacheStrategies.js'].branchData['278'] = [];
  _$jscoverage['/cacheStrategies.js'].branchData['278'][1] = new BranchData();
}
_$jscoverage['/cacheStrategies.js'].branchData['278'][1].init(8, 24);
function visit173_278_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['278'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['277'][2].init(9, 23);
function visit172_277_2(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['277'][2].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['277'][1].init(9, 60);
function visit171_277_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['277'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['276'][1].init(8, 119);
function visit170_276_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['276'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['275'][2].init(10, 16);
function visit169_275_2(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['275'][2].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['275'][1].init(10, 148);
function visit168_275_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['275'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['252'][1].init(16, 28);
function visit167_252_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['252'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['236'][1].init(12, 14);
function visit166_236_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['236'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['230'][1].init(10, 30);
function visit165_230_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['230'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['229'][1].init(8, 43);
function visit163_229_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['229'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['209'][2].init(18, 19);
function visit161_209_2(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['209'][2].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['209'][1].init(18, 20);
function visit159_209_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['209'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['207'][1].init(12, 40);
function visit157_207_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['207'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['203'][1].init(18, 29);
function visit155_203_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['203'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['197'][1].init(8, 12);
function visit153_197_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['197'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['184'][1].init(10, 43);
function visit150_184_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['184'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['182'][1].init(8, 15);
function visit148_182_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['182'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['174'][2].init(29, 35);
function visit146_174_2(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['174'][2].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['174'][1].init(11, 54);
function visit144_174_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['174'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['169'][1].init(8, 55);
function visit142_169_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['169'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['160'][1].init(8, 30);
function visit140_160_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['160'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['151'][1].init(12, 33);
function visit138_151_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['151'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['147'][1].init(10, 19);
function visit136_147_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['147'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['145'][1].init(8, 14);
function visit134_145_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['145'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['113'][1].init(10, 30);
function visit130_113_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['113'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['112'][1].init(19, 56);
function visit128_112_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['112'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['100'][1].init(10, 25);
function visit126_100_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['100'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['99'][1].init(12, 47);
function visit124_99_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['99'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['96'][1].init(10, 30);
function visit122_96_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['96'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['95'][1].init(8, 22);
function visit120_95_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['95'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['78'][1].init(12, 12);
function visit118_78_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['78'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['76'][1].init(10, 43);
function visit116_76_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['76'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['75'][1].init(8, 26);
function visit114_75_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['75'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['63'][2].init(31, 31);
function visit112_63_2(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['63'][2].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['63'][1].init(7, 55);
function visit111_63_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['63'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['62'][1].init(6, 111);
function visit109_62_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['62'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].branchData['61'][1].init(8, 133);
function visit107_61_1(result) {
  _$jscoverage['/cacheStrategies.js'].branchData['61'][1].ranCondition(result);
  return result;
}_$jscoverage['/cacheStrategies.js'].lineData[6]++;
define(['./persistenceManager', './persistenceUtils'], function(persistenceManager, persistenceUtils) {
  _$jscoverage['/cacheStrategies.js'].functionData[0]++;
  _$jscoverage['/cacheStrategies.js'].lineData[7]++;
  'use strict';
  _$jscoverage['/cacheStrategies.js'].lineData[31]++;
  function getHttpCacheHeaderStrategy() {
    _$jscoverage['/cacheStrategies.js'].functionData[1]++;
    _$jscoverage['/cacheStrategies.js'].lineData[32]++;
    return function(request, response) {
  _$jscoverage['/cacheStrategies.js'].functionData[2]++;
  _$jscoverage['/cacheStrategies.js'].lineData[33]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/cacheStrategies.js'].functionData[3]++;
  _$jscoverage['/cacheStrategies.js'].lineData[47]++;
  _handleExpires(request, response).then(function(response) {
  _$jscoverage['/cacheStrategies.js'].functionData[4]++;
  _$jscoverage['/cacheStrategies.js'].lineData[38]++;
  return _handleMaxAge(request, response);
}).then(function(response) {
  _$jscoverage['/cacheStrategies.js'].functionData[5]++;
  _$jscoverage['/cacheStrategies.js'].lineData[40]++;
  return _handleIfCondMatch(request, response);
}).then(function(response) {
  _$jscoverage['/cacheStrategies.js'].functionData[6]++;
  _$jscoverage['/cacheStrategies.js'].lineData[42]++;
  return _handleMustRevalidate(request, response);
}).then(function(response) {
  _$jscoverage['/cacheStrategies.js'].functionData[7]++;
  _$jscoverage['/cacheStrategies.js'].lineData[44]++;
  return _handleNoCache(request, response);
}).then(function(response) {
  _$jscoverage['/cacheStrategies.js'].functionData[8]++;
  _$jscoverage['/cacheStrategies.js'].lineData[46]++;
  return _handleNoStore(request, response);
}).then(function(response) {
  _$jscoverage['/cacheStrategies.js'].functionData[9]++;
  _$jscoverage['/cacheStrategies.js'].lineData[48]++;
  resolve(response);
});
});
};
  }
  _$jscoverage['/cacheStrategies.js'].lineData[52]++;
  ;
  _$jscoverage['/cacheStrategies.js'].lineData[54]++;
  function _handleExpires(request, response) {
    _$jscoverage['/cacheStrategies.js'].functionData[10]++;
    _$jscoverage['/cacheStrategies.js'].lineData[58]++;
    var expiresDate = response.headers.get('Expires');
    _$jscoverage['/cacheStrategies.js'].lineData[59]++;
    var cacheExpirationDate = response.headers.get('x-oracle-jscpt-cache-expiration-date');
    _$jscoverage['/cacheStrategies.js'].lineData[61]++;
    if (visit107_61_1(expiresDate && visit109_62_1(persistenceUtils.isCachedResponse(response) && (visit111_63_1(!cacheExpirationDate || visit112_63_2(cacheExpirationDate.length == 0)))))) {
      _$jscoverage['/cacheStrategies.js'].lineData[64]++;
      response.headers.set('x-oracle-jscpt-cache-expiration-date', expiresDate);
    }
    _$jscoverage['/cacheStrategies.js'].lineData[66]++;
    return Promise.resolve(response);
  }
  _$jscoverage['/cacheStrategies.js'].lineData[67]++;
  ;
  _$jscoverage['/cacheStrategies.js'].lineData[69]++;
  function _handleMaxAge(request, response) {
    _$jscoverage['/cacheStrategies.js'].functionData[11]++;
    _$jscoverage['/cacheStrategies.js'].lineData[73]++;
    var cacheControlMaxAge = _getCacheControlDirective(response.headers, 'max-age');
    _$jscoverage['/cacheStrategies.js'].lineData[75]++;
    if (visit114_75_1(cacheControlMaxAge != null)) {
      _$jscoverage['/cacheStrategies.js'].lineData[76]++;
      if (visit116_76_1(persistenceUtils.isCachedResponse(response))) {
        _$jscoverage['/cacheStrategies.js'].lineData[77]++;
        var requestDate = request.headers.get('Date');
        _$jscoverage['/cacheStrategies.js'].lineData[78]++;
        if (visit118_78_1(!requestDate)) {
          _$jscoverage['/cacheStrategies.js'].lineData[79]++;
          requestDate = (new Date()).toUTCString();
        }
        _$jscoverage['/cacheStrategies.js'].lineData[81]++;
        var requestTime = (new Date(requestDate)).getTime();
        _$jscoverage['/cacheStrategies.js'].lineData[82]++;
        var expirationTime = requestTime + 1000 * cacheControlMaxAge;
        _$jscoverage['/cacheStrategies.js'].lineData[83]++;
        var expirationDate = new Date(expirationTime);
        _$jscoverage['/cacheStrategies.js'].lineData[84]++;
        response.headers.set('x-oracle-jscpt-cache-expiration-date', expirationDate.toUTCString());
      }
    }
    _$jscoverage['/cacheStrategies.js'].lineData[87]++;
    return Promise.resolve(response);
  }
  _$jscoverage['/cacheStrategies.js'].lineData[88]++;
  ;
  _$jscoverage['/cacheStrategies.js'].lineData[90]++;
  function _handleIfCondMatch(request, response) {
    _$jscoverage['/cacheStrategies.js'].functionData[12]++;
    _$jscoverage['/cacheStrategies.js'].lineData[92]++;
    var ifMatch = request.headers.get('If-Match');
    _$jscoverage['/cacheStrategies.js'].lineData[93]++;
    var ifNoneMatch = request.headers.get('If-None-Match');
    _$jscoverage['/cacheStrategies.js'].lineData[95]++;
    if (visit120_95_1(ifMatch || ifNoneMatch)) {
      _$jscoverage['/cacheStrategies.js'].lineData[96]++;
      if (visit122_96_1(!persistenceManager.isOnline())) {
        _$jscoverage['/cacheStrategies.js'].lineData[97]++;
        var etag = response.headers.get('ETag');
        _$jscoverage['/cacheStrategies.js'].lineData[99]++;
        if (visit124_99_1(ifMatch && visit126_100_1(etag.indexOf(ifMatch) < 0))) {
          _$jscoverage['/cacheStrategies.js'].lineData[103]++;
          return new Promise(function(resolve, reject) {
  _$jscoverage['/cacheStrategies.js'].functionData[13]++;
  _$jscoverage['/cacheStrategies.js'].lineData[108]++;
  persistenceUtils.responseToJSON(response).then(function(responseData) {
  _$jscoverage['/cacheStrategies.js'].functionData[14]++;
  _$jscoverage['/cacheStrategies.js'].lineData[105]++;
  responseData.status = 412;
  _$jscoverage['/cacheStrategies.js'].lineData[106]++;
  responseData.statusText = 'If-Match failed due to no matching ETag while offline';
  _$jscoverage['/cacheStrategies.js'].lineData[107]++;
  return persistenceUtils.responseFromJSON(responseData);
}).then(function(response) {
  _$jscoverage['/cacheStrategies.js'].functionData[15]++;
  _$jscoverage['/cacheStrategies.js'].lineData[109]++;
  resolve(response);
});
});
        } else {
          _$jscoverage['/cacheStrategies.js'].lineData[112]++;
          if (visit128_112_1(ifNoneMatch && visit130_113_1(etag.indexOf(ifNoneMatch) >= 0))) {
            _$jscoverage['/cacheStrategies.js'].lineData[116]++;
            return new Promise(function(resolve, reject) {
  _$jscoverage['/cacheStrategies.js'].functionData[16]++;
  _$jscoverage['/cacheStrategies.js'].lineData[121]++;
  persistenceUtils.responseToJSON(response).then(function(responseData) {
  _$jscoverage['/cacheStrategies.js'].functionData[17]++;
  _$jscoverage['/cacheStrategies.js'].lineData[118]++;
  responseData.status = 412;
  _$jscoverage['/cacheStrategies.js'].lineData[119]++;
  responseData.statusText = 'If-None-Match failed due to matching ETag while offline';
  _$jscoverage['/cacheStrategies.js'].lineData[120]++;
  return persistenceUtils.responseFromJSON(responseData);
}).then(function(response) {
  _$jscoverage['/cacheStrategies.js'].functionData[18]++;
  _$jscoverage['/cacheStrategies.js'].lineData[122]++;
  resolve(response);
});
});
          }
        }
      } else {
        _$jscoverage['/cacheStrategies.js'].lineData[127]++;
        return new Promise(function(resolve, reject) {
  _$jscoverage['/cacheStrategies.js'].functionData[19]++;
  _$jscoverage['/cacheStrategies.js'].lineData[129]++;
  _handleRevalidate(request, response, false).then(function(response) {
  _$jscoverage['/cacheStrategies.js'].functionData[20]++;
  _$jscoverage['/cacheStrategies.js'].lineData[130]++;
  resolve(response);
}, function(err) {
  _$jscoverage['/cacheStrategies.js'].functionData[21]++;
  _$jscoverage['/cacheStrategies.js'].lineData[132]++;
  reject(err);
});
});
      }
    }
    _$jscoverage['/cacheStrategies.js'].lineData[137]++;
    return Promise.resolve(response);
  }
  _$jscoverage['/cacheStrategies.js'].lineData[138]++;
  ;
  _$jscoverage['/cacheStrategies.js'].lineData[140]++;
  function _handleMustRevalidate(request, response) {
    _$jscoverage['/cacheStrategies.js'].functionData[22]++;
    _$jscoverage['/cacheStrategies.js'].lineData[144]++;
    var mustRevalidate = _getCacheControlDirective(response.headers, 'must-revalidate');
    _$jscoverage['/cacheStrategies.js'].lineData[145]++;
    if (visit134_145_1(mustRevalidate)) {
      _$jscoverage['/cacheStrategies.js'].lineData[146]++;
      var cacheExpirationDate = response.headers.get('x-oracle-jscpt-cache-expiration-date');
      _$jscoverage['/cacheStrategies.js'].lineData[147]++;
      if (visit136_147_1(cacheExpirationDate)) {
        _$jscoverage['/cacheStrategies.js'].lineData[148]++;
        var cacheExpirationTime = (new Date(cacheExpirationDate)).getTime();
        _$jscoverage['/cacheStrategies.js'].lineData[149]++;
        var currentTime = (new Date()).getTime();
        _$jscoverage['/cacheStrategies.js'].lineData[151]++;
        if (visit138_151_1(currentTime > cacheExpirationTime)) {
          _$jscoverage['/cacheStrategies.js'].lineData[152]++;
          return _handleRevalidate(request, response, true);
        }
      }
    }
    _$jscoverage['/cacheStrategies.js'].lineData[156]++;
    return Promise.resolve(response);
  }
  _$jscoverage['/cacheStrategies.js'].lineData[157]++;
  ;
  _$jscoverage['/cacheStrategies.js'].lineData[159]++;
  function _handleNoCache(request, response) {
    _$jscoverage['/cacheStrategies.js'].functionData[23]++;
    _$jscoverage['/cacheStrategies.js'].lineData[160]++;
    if (visit140_160_1(!_isNoCache(request, response))) {
      _$jscoverage['/cacheStrategies.js'].lineData[161]++;
      return Promise.resolve(response);
    } else {
      _$jscoverage['/cacheStrategies.js'].lineData[164]++;
      return _handleRevalidate(request, response);
    }
  }
  _$jscoverage['/cacheStrategies.js'].lineData[166]++;
  ;
  _$jscoverage['/cacheStrategies.js'].lineData[168]++;
  function _isNoCache(request, response) {
    _$jscoverage['/cacheStrategies.js'].functionData[24]++;
    _$jscoverage['/cacheStrategies.js'].lineData[169]++;
    if (visit142_169_1(_getCacheControlDirective(response.headers, 'no-cache'))) {
      _$jscoverage['/cacheStrategies.js'].lineData[170]++;
      return true;
    }
    _$jscoverage['/cacheStrategies.js'].lineData[173]++;
    var pragmaNoCache = request.headers.get('Pragma');
    _$jscoverage['/cacheStrategies.js'].lineData[174]++;
    return visit144_174_1(pragmaNoCache && (visit146_174_2(pragmaNoCache.trim() === 'no-cache')));
  }
  _$jscoverage['/cacheStrategies.js'].lineData[175]++;
  ;
  _$jscoverage['/cacheStrategies.js'].lineData[177]++;
  function _handleNoStore(request, response) {
    _$jscoverage['/cacheStrategies.js'].functionData[25]++;
    _$jscoverage['/cacheStrategies.js'].lineData[180]++;
    var noStore = _getCacheControlDirective(response.headers, 'no-store');
    _$jscoverage['/cacheStrategies.js'].lineData[182]++;
    if (visit148_182_1(noStore != null)) {
      _$jscoverage['/cacheStrategies.js'].lineData[184]++;
      if (visit150_184_1(persistenceUtils.isCachedResponse(response))) {
        _$jscoverage['/cacheStrategies.js'].lineData[185]++;
        response.headers.delete('x-oracle-jscpt-cache-expiration-date');
      }
      _$jscoverage['/cacheStrategies.js'].lineData[187]++;
      return Promise.resolve(response);
    } else {
      _$jscoverage['/cacheStrategies.js'].lineData[189]++;
      return _cacheResponse(request, response);
    }
  }
  _$jscoverage['/cacheStrategies.js'].lineData[191]++;
  ;
  _$jscoverage['/cacheStrategies.js'].lineData[193]++;
  function _getCacheControlDirective(headers, directive) {
    _$jscoverage['/cacheStrategies.js'].functionData[26]++;
    _$jscoverage['/cacheStrategies.js'].lineData[195]++;
    var cacheControl = headers.get('Cache-Control');
    _$jscoverage['/cacheStrategies.js'].lineData[197]++;
    if (visit153_197_1(cacheControl)) {
      _$jscoverage['/cacheStrategies.js'].lineData[198]++;
      var cacheControlValues = cacheControl.split(',');
      _$jscoverage['/cacheStrategies.js'].lineData[200]++;
      var i;
      _$jscoverage['/cacheStrategies.js'].lineData[201]++;
      var cacheControlVal;
      _$jscoverage['/cacheStrategies.js'].lineData[202]++;
      var splitVal;
      _$jscoverage['/cacheStrategies.js'].lineData[203]++;
      for (i = 0; visit155_203_1(i < cacheControlValues.length); i++) {
        _$jscoverage['/cacheStrategies.js'].lineData[204]++;
        cacheControlVal = cacheControlValues[i].trim();
        _$jscoverage['/cacheStrategies.js'].lineData[207]++;
        if (visit157_207_1(cacheControlVal.indexOf(directive) === 0)) {
          _$jscoverage['/cacheStrategies.js'].lineData[208]++;
          splitVal = cacheControlVal.split('=');
          _$jscoverage['/cacheStrategies.js'].lineData[209]++;
          return visit159_209_1((visit161_209_2(splitVal.length > 1))) ? splitVal[1].trim() : true;
        }
      }
    }
    _$jscoverage['/cacheStrategies.js'].lineData[216]++;
    return null;
  }
  _$jscoverage['/cacheStrategies.js'].lineData[217]++;
  ;
  _$jscoverage['/cacheStrategies.js'].lineData[219]++;
  function _handleRevalidate(request, response, mustRevalidate) {
    _$jscoverage['/cacheStrategies.js'].functionData[27]++;
    _$jscoverage['/cacheStrategies.js'].lineData[229]++;
    if (visit163_229_1(persistenceUtils.isCachedResponse(response))) {
      _$jscoverage['/cacheStrategies.js'].lineData[230]++;
      if (visit165_230_1(!persistenceManager.isOnline())) {
        _$jscoverage['/cacheStrategies.js'].lineData[236]++;
        if (visit166_236_1(mustRevalidate)) {
          _$jscoverage['/cacheStrategies.js'].lineData[237]++;
          return new Promise(function(resolve, reject) {
  _$jscoverage['/cacheStrategies.js'].functionData[28]++;
  _$jscoverage['/cacheStrategies.js'].lineData[242]++;
  persistenceUtils.responseToJSON(response).then(function(responseData) {
  _$jscoverage['/cacheStrategies.js'].functionData[29]++;
  _$jscoverage['/cacheStrategies.js'].lineData[239]++;
  responseData.status = 504;
  _$jscoverage['/cacheStrategies.js'].lineData[240]++;
  responseData.statusText = 'cache-control: must-revalidate failed due to application being offline';
  _$jscoverage['/cacheStrategies.js'].lineData[241]++;
  return persistenceUtils.responseFromJSON(responseData);
}).then(function(response) {
  _$jscoverage['/cacheStrategies.js'].functionData[30]++;
  _$jscoverage['/cacheStrategies.js'].lineData[243]++;
  resolve(response);
});
});
        } else {
          _$jscoverage['/cacheStrategies.js'].lineData[247]++;
          return Promise.resolve(response);
        }
      } else {
        _$jscoverage['/cacheStrategies.js'].lineData[250]++;
        return new Promise(function(resolve, reject) {
  _$jscoverage['/cacheStrategies.js'].functionData[31]++;
  _$jscoverage['/cacheStrategies.js'].lineData[251]++;
  persistenceManager.browserFetch(request).then(function(serverResponse) {
  _$jscoverage['/cacheStrategies.js'].functionData[32]++;
  _$jscoverage['/cacheStrategies.js'].lineData[252]++;
  if (visit167_252_1(serverResponse.status == 304)) {
    _$jscoverage['/cacheStrategies.js'].lineData[253]++;
    resolve(response);
  } else {
    _$jscoverage['/cacheStrategies.js'].lineData[257]++;
    persistenceManager.getCache().delete(request).then(function() {
  _$jscoverage['/cacheStrategies.js'].functionData[33]++;
  _$jscoverage['/cacheStrategies.js'].lineData[258]++;
  resolve(serverResponse);
});
  }
}, function(err) {
  _$jscoverage['/cacheStrategies.js'].functionData[34]++;
  _$jscoverage['/cacheStrategies.js'].lineData[262]++;
  reject(err);
});
});
      }
    }
    _$jscoverage['/cacheStrategies.js'].lineData[269]++;
    return Promise.resolve(response);
  }
  _$jscoverage['/cacheStrategies.js'].lineData[270]++;
  ;
  _$jscoverage['/cacheStrategies.js'].lineData[272]++;
  function _cacheResponse(request, response) {
    _$jscoverage['/cacheStrategies.js'].functionData[35]++;
    _$jscoverage['/cacheStrategies.js'].lineData[273]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/cacheStrategies.js'].functionData[36]++;
  _$jscoverage['/cacheStrategies.js'].lineData[275]++;
  if (visit168_275_1(visit169_275_2(response != null) && visit170_276_1(!persistenceUtils.isCachedResponse(response) && (visit171_277_1(visit172_277_2(request.method == 'GET') || visit173_278_1(request.method == 'HEAD')))))) {
    _$jscoverage['/cacheStrategies.js'].lineData[279]++;
    var responseClone = response.clone();
    _$jscoverage['/cacheStrategies.js'].lineData[280]++;
    persistenceManager.getCache().put(request, response).then(function() {
  _$jscoverage['/cacheStrategies.js'].functionData[37]++;
  _$jscoverage['/cacheStrategies.js'].lineData[281]++;
  resolve(responseClone);
});
  } else {
    _$jscoverage['/cacheStrategies.js'].lineData[284]++;
    resolve(response);
  }
});
  }
  _$jscoverage['/cacheStrategies.js'].lineData[287]++;
  ;
  _$jscoverage['/cacheStrategies.js'].lineData[289]++;
  return {
  'getHttpCacheHeaderStrategy': getHttpCacheHeaderStrategy};
});
