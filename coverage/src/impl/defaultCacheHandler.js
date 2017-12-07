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
if (! _$jscoverage['/impl/defaultCacheHandler.js']) {
  _$jscoverage['/impl/defaultCacheHandler.js'] = {};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[6] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[8] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[24] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[25] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[47] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[49] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[51] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[52] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[54] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[57] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[58] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[60] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[61] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[66] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[67] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[90] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[91] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[93] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[94] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[97] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[98] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[99] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[103] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[104] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[106] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[107] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[110] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[113] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[114] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[115] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[121] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[122] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[123] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[124] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[125] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[126] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[128] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[130] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[131] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[133] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[134] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[135] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[137] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[142] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[143] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[144] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[145] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[146] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[147] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[148] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[149] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[157] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[159] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[160] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[161] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[162] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[178] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[179] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[180] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[181] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[182] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[183] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[184] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[185] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[187] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[189] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[190] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[191] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[192] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[193] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[194] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[200] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[214] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[215] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[216] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[222] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[236] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[237] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[238] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[242] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[244] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[277] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[278] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[279] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[280] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[283] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[284] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[285] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[288] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[289] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[291] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[292] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[293] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[295] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[298] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[299] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[305] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[310] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[311] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[314] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[319] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[340] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[341] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[342] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[345] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[346] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[349] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[352] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[353] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[354] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[356] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[359] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[360] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[363] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[364] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[365] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[368] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[369] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[370] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[373] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[374] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[375] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[376] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[377] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[378] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[379] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[382] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[384] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[388] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[403] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[404] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[405] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[406] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[407] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[410] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[411] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[414] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[415] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[419] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[420] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[422] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[423] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[424] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[425] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[427] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[428] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[430] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[435] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[438] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[440] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[441] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[443] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[444] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[446] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[448] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[449] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[452] = 0;
}
if (! _$jscoverage['/impl/defaultCacheHandler.js'].functionData) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[0] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[1] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[2] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[3] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[4] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[5] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[6] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[7] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[8] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[9] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[10] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[11] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[12] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[13] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[14] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[15] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[16] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[17] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[18] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[19] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[20] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[21] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[22] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[23] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[24] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[25] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[26] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[27] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[28] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[29] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[30] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[31] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[32] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[33] = 0;
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[34] = 0;
}
if (! _$jscoverage['/impl/defaultCacheHandler.js'].branchData) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData = {};
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['93'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['93'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['106'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['106'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['125'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['125'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['148'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['148'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['180'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['180'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['182'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['182'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['184'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['184'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['185'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['185'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['191'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['191'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['193'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['193'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['238'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['238'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['279'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['279'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['279'][2] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['284'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['284'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['284'][2] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['292'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['292'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['298'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['298'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['310'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['310'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['341'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['341'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['345'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['345'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['353'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['353'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['360'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['360'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['365'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['365'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['370'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['370'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['375'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['375'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['377'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['377'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['379'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['379'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['379'][2] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['380'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['380'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][2] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][3] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][4] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['423'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['423'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['424'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['424'][1] = new BranchData();
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['440'] = [];
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['440'][1] = new BranchData();
}
_$jscoverage['/impl/defaultCacheHandler.js'].branchData['440'][1].init(10, 23);
function visit409_440_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['440'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['424'][1].init(12, 28);
function visit408_424_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['424'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['423'][1].init(10, 41);
function visit407_423_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['423'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][4].init(49, 37);
function visit406_406_4(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][4].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][3].init(36, 50);
function visit405_406_3(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][2].init(23, 63);
function visit404_406_2(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][1].init(8, 78);
function visit403_406_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['406'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['380'][1].init(12, 77);
function visit402_380_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['380'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['379'][2].init(22, 114);
function visit401_379_2(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['379'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['379'][1].init(12, 124);
function visit400_379_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['379'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['377'][1].init(10, 35);
function visit399_377_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['377'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['375'][1].init(24, 22);
function visit398_375_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['375'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['370'][1].init(11, 13);
function visit397_370_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['370'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['365'][1].init(11, 13);
function visit396_365_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['365'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['360'][1].init(13, 35);
function visit395_360_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['360'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['353'][1].init(8, 12);
function visit394_353_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['353'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['345'][1].init(8, 39);
function visit393_345_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['345'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['341'][1].init(8, 12);
function visit392_341_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['341'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['310'][1].init(8, 13);
function visit391_310_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['310'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['298'][1].init(8, 12);
function visit390_298_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['298'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['292'][1].init(8, 21);
function visit389_292_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['292'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['284'][2].init(19, 34);
function visit388_284_2(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['284'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['284'][1].init(8, 45);
function visit387_284_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['284'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['279'][2].init(19, 34);
function visit386_279_2(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['279'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['279'][1].init(8, 45);
function visit385_279_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['279'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['238'][1].init(10, 44);
function visit384_238_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['238'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['193'][1].init(30, 14);
function visit383_193_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['193'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['191'][1].init(32, 25);
function visit382_191_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['191'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['185'][1].init(14, 17);
function visit381_185_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['185'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['184'][1].init(12, 9);
function visit380_184_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['184'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['182'][1].init(10, 7);
function visit379_182_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['182'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['180'][1].init(8, 8);
function visit378_180_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['180'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['148'][1].init(20, 14);
function visit377_148_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['148'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['125'][1].init(10, 31);
function visit376_125_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['125'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['106'][1].init(8, 9);
function visit375_106_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['106'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].branchData['93'][1].init(8, 9);
function visit374_93_1(result) {
  _$jscoverage['/impl/defaultCacheHandler.js'].branchData['93'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/defaultCacheHandler.js'].lineData[6]++;
define(['../persistenceUtils', '../persistenceStoreManager'], function(persistenceUtils, persistenceStoreManager) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[0]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[8]++;
  'use strict';
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[24]++;
  function DefaultCacheHandler() {
    _$jscoverage['/impl/defaultCacheHandler.js'].functionData[1]++;
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[25]++;
    Object.defineProperty(this, '_endpointToOptionsMap', {
  value: {}, 
  writable: true});
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[47]++;
  DefaultCacheHandler.prototype.constructRequestResponseCacheData = function(request, response) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[2]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[49]++;
  var self = this;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[51]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[3]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[52]++;
  var dataField = {};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[66]++;
  persistenceUtils.requestToJSON(request).then(function(requestJSONData) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[4]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[54]++;
  dataField.requestData = requestJSONData;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[57]++;
  var excludeBody = self._excludeBody(request);
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[58]++;
  return persistenceUtils.responseToJSON(response, {
  excludeBody: excludeBody});
}).then(function(responseJSONData) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[5]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[60]++;
  dataField.responseData = responseJSONData;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[61]++;
  resolve({
  key: self._constructCacheKey(request, response), 
  metadata: self.constructMetadata(request), 
  value: dataField});
}).catch(function(err) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[6]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[67]++;
  reject(err);
});
});
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[90]++;
  DefaultCacheHandler.prototype.constructShreddedData = function(request, response) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[7]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[91]++;
  var shredder = this._getShredder(request);
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[93]++;
  if (visit374_93_1(!shredder)) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[94]++;
    return Promise.resolve();
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[97]++;
  return shredder(response).then(function(shreddedObjArray) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[8]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[98]++;
  var shreddedData = shreddedObjArray.map(_convertShreddedData);
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[99]++;
  return Promise.resolve(shreddedData);
});
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[103]++;
  DefaultCacheHandler.prototype.shredResponse = function(request, response) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[9]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[104]++;
  var shredder = this._getShredder(request);
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[106]++;
  if (visit375_106_1(!shredder)) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[107]++;
    return Promise.resolve();
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[110]++;
  return shredder(response);
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[113]++;
  DefaultCacheHandler.prototype.cacheShreddedData = function(shreddedObjArray) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[10]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[114]++;
  var shreddedData = shreddedObjArray.map(_convertShreddedData);
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[115]++;
  return _updateShreddedDataStore(shreddedData);
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[121]++;
  function _updateShreddedDataStore(shreddedData) {
    _$jscoverage['/impl/defaultCacheHandler.js'].functionData[11]++;
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[122]++;
    var promises = shreddedData.map(function(element) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[12]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[123]++;
  var storeName = Object.keys(element)[0];
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[124]++;
  var storeData = element[storeName];
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[125]++;
  if (visit376_125_1(!storeData || !storeData.length)) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[126]++;
    return Promise.resolve();
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[128]++;
  return _updateShreddedDataForStore(storeName, storeData);
});
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[130]++;
    return Promise.all(promises);
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[131]++;
  ;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[133]++;
  function _updateShreddedDataForStore(storeName, storeData) {
    _$jscoverage['/impl/defaultCacheHandler.js'].functionData[13]++;
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[134]++;
    return persistenceStoreManager.openStore(storeName).then(function(store) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[14]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[135]++;
  return store.upsertAll(storeData);
});
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[137]++;
  ;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[142]++;
  function _convertShreddedData(entry) {
    _$jscoverage['/impl/defaultCacheHandler.js'].functionData[15]++;
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[143]++;
    var storeName = entry.name;
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[144]++;
    var resourceIdentifierValue = entry.resourceIdentifier;
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[145]++;
    var ids = entry.keys;
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[146]++;
    var shreddedDataArray = [];
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[147]++;
    var currentTime = (new Date()).toUTCString();
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[148]++;
    for (var i = 0; visit377_148_1(i < ids.length); i++) {
      _$jscoverage['/impl/defaultCacheHandler.js'].lineData[149]++;
      var data = {
  key: ids[i], 
  metadata: {
  lastUpdated: currentTime, 
  resourceIdentifier: resourceIdentifierValue}, 
  value: entry.data[i]};
      _$jscoverage['/impl/defaultCacheHandler.js'].lineData[157]++;
      shreddedDataArray.push(data);
    }
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[159]++;
    var convertedEntry = {};
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[160]++;
    convertedEntry[storeName] = shreddedDataArray;
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[161]++;
    return convertedEntry;
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[162]++;
  ;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[178]++;
  DefaultCacheHandler.prototype._constructCacheKey = function(request, response) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[16]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[179]++;
  var key = request.url + request.method;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[180]++;
  if (visit378_180_1(response)) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[181]++;
    var headers = response.headers;
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[182]++;
    if (visit379_182_1(headers)) {
      _$jscoverage['/impl/defaultCacheHandler.js'].lineData[183]++;
      var varyValue = headers.get('vary');
      _$jscoverage['/impl/defaultCacheHandler.js'].lineData[184]++;
      if (visit380_184_1(varyValue)) {
        _$jscoverage['/impl/defaultCacheHandler.js'].lineData[185]++;
        if (visit381_185_1(varyValue === '*')) {
          _$jscoverage['/impl/defaultCacheHandler.js'].lineData[187]++;
          key += (new Date()).getTime();
        } else {
          _$jscoverage['/impl/defaultCacheHandler.js'].lineData[189]++;
          var requestHeaders = request.headers;
          _$jscoverage['/impl/defaultCacheHandler.js'].lineData[190]++;
          var varyFields = varyValue.split(',');
          _$jscoverage['/impl/defaultCacheHandler.js'].lineData[191]++;
          for (var index = 0; visit382_191_1(index < varyFields.length); index++) {
            _$jscoverage['/impl/defaultCacheHandler.js'].lineData[192]++;
            var varyField = varyFields[index];
            _$jscoverage['/impl/defaultCacheHandler.js'].lineData[193]++;
            var varyValue = visit383_193_1(requestHeaders) ? requestHeaders.get(varyField) : 'undefined';
            _$jscoverage['/impl/defaultCacheHandler.js'].lineData[194]++;
            key += varyField + '=' + varyValue;
          }
        }
      }
    }
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[200]++;
  return key;
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[214]++;
  DefaultCacheHandler.prototype.constructMetadata = function(request) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[17]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[215]++;
  var currentTime = (new Date()).getTime();
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[216]++;
  var metadata = {
  url: request.url, 
  method: request.method, 
  created: currentTime, 
  lastupdated: currentTime};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[222]++;
  return metadata;
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[236]++;
  DefaultCacheHandler.prototype.constructResponse = function(data) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[18]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[237]++;
  return persistenceUtils.responseFromJSON(data).then(function(response) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[19]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[238]++;
  if (visit384_238_1(!persistenceUtils.isCachedResponse(response))) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[242]++;
    response.headers.set('x-oracle-jscpt-cache-expiration-date', '');
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[244]++;
  return Promise.resolve(response);
});
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[277]++;
  DefaultCacheHandler.prototype.constructSearchCriteria = function(request, options) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[20]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[278]++;
  var ignoreSearch = false;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[279]++;
  if (visit385_279_1(options && visit386_279_2(options.ignoreSearch !== undefined))) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[280]++;
    ignoreSearch = options.ignoreSearch;
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[283]++;
  var ignoreMethod = false;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[284]++;
  if (visit387_284_1(options && visit388_284_2(options.ignoreMethod !== undefined))) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[285]++;
    ignoreMethod = options.ignoreMethod;
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[288]++;
  var selectorField;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[289]++;
  var searchURL;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[291]++;
  var searchStartIndex = request.url.indexOf('?');
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[292]++;
  if (visit389_292_1(searchStartIndex >= 0)) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[293]++;
    searchURL = request.url.substring(0, searchStartIndex);
  } else {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[295]++;
    searchURL = request.url;
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[298]++;
  if (visit390_298_1(ignoreSearch)) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[299]++;
    selectorField = {
  'metadata.url': {
  '$regex': '^' + escapeRegExp(searchURL) + '(\\?|$)'}};
  } else {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[305]++;
    selectorField = {
  'metadata.url': request.url};
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[310]++;
  if (visit391_310_1(!ignoreMethod)) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[311]++;
    selectorField['metadata.method'] = request.method;
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[314]++;
  var searchCriteria = {
  selector: selectorField, 
  sort: [{
  'metadata.created': 'asc'}]};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[319]++;
  return searchCriteria;
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[340]++;
  DefaultCacheHandler.prototype.registerEndpointOptions = function(endpointKey, options) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[21]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[341]++;
  if (visit392_341_1(!endpointKey)) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[342]++;
    throw new Error({
  message: 'a valid endpointKey must be provided.'});
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[345]++;
  if (visit393_345_1(this._endpointToOptionsMap[endpointKey])) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[346]++;
    throw new Error({
  message: 'endpointKey can only be registered once.'});
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[349]++;
  this._endpointToOptionsMap[endpointKey] = options;
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[352]++;
  DefaultCacheHandler.prototype.unregisterEndpointOptions = function(endpointKey) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[22]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[353]++;
  if (visit394_353_1(!endpointKey)) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[354]++;
    throw new Error({
  message: 'a valid endpointKey must be provided.'});
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[356]++;
  delete this._endpointToOptionsMap[endpointKey];
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[359]++;
  DefaultCacheHandler.prototype._excludeBody = function(request) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[23]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[360]++;
  return (visit395_360_1(this._getShredder(request) !== null));
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[363]++;
  DefaultCacheHandler.prototype._getShredder = function(request) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[24]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[364]++;
  var jsonProcessor = this._getJsonProcessor(request);
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[365]++;
  return visit396_365_1(jsonProcessor) ? jsonProcessor.shredder : null;
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[368]++;
  DefaultCacheHandler.prototype._getUnshredder = function(request) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[25]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[369]++;
  var jsonProcessor = this._getJsonProcessor(request);
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[370]++;
  return visit397_370_1(jsonProcessor) ? jsonProcessor.unshredder : null;
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[373]++;
  DefaultCacheHandler.prototype._getJsonProcessor = function(request) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[26]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[374]++;
  var allKeys = Object.keys(this._endpointToOptionsMap);
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[375]++;
  for (var index = 0; visit398_375_1(index < allKeys.length); index++) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[376]++;
    var key = allKeys[index];
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[377]++;
    if (visit399_377_1(request.url === JSON.parse(key).url)) {
      _$jscoverage['/impl/defaultCacheHandler.js'].lineData[378]++;
      var option = this._endpointToOptionsMap[key];
      _$jscoverage['/impl/defaultCacheHandler.js'].lineData[379]++;
      if (visit400_379_1(option && visit401_379_2(option.jsonProcessor && visit402_380_1(option.jsonProcessor.shredder && option.jsonProcessor.unshredder)))) {
        _$jscoverage['/impl/defaultCacheHandler.js'].lineData[382]++;
        return option.jsonProcessor;
      } else {
        _$jscoverage['/impl/defaultCacheHandler.js'].lineData[384]++;
        return null;
      }
    }
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[388]++;
  return null;
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[403]++;
  DefaultCacheHandler.prototype.fillResponseBodyWithShreddedData = function(request, bodyAbstract, response) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[27]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[404]++;
  var unshredder = this._getUnshredder(request);
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[405]++;
  var shredder = this._getShredder(request);
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[406]++;
  if (visit403_406_1(!unshredder || visit404_406_2(!shredder || visit405_406_3(!response || visit406_406_4(!bodyAbstract || !bodyAbstract.length))))) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[407]++;
    return Promise.resolve(response);
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[410]++;
  var promises = bodyAbstract.map(function(element) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[28]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[411]++;
  return _fillStoreValue(element);
});
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[414]++;
  return Promise.all(promises).then(function(results) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[29]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[415]++;
  return unshredder(results, response);
});
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[419]++;
  function _fillStoreValue(storeEntry) {
    _$jscoverage['/impl/defaultCacheHandler.js'].functionData[30]++;
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[420]++;
    var storeName = storeEntry.name;
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[422]++;
    return persistenceStoreManager.openStore(storeName).then(function(store) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[31]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[423]++;
  if (visit407_423_1(storeEntry.keys && storeEntry.keys.length)) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[424]++;
    if (visit408_424_1(storeEntry.keys.length === 1)) {
      _$jscoverage['/impl/defaultCacheHandler.js'].lineData[425]++;
      return store.findByKey(storeEntry.keys[0]);
    } else {
      _$jscoverage['/impl/defaultCacheHandler.js'].lineData[427]++;
      var transformedKeys = storeEntry.keys.map(function(keyValue) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[32]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[428]++;
  return {
  key: keyValue};
});
      _$jscoverage['/impl/defaultCacheHandler.js'].lineData[430]++;
      var findExpression = {
  selector: {
  $or: transformedKeys}};
      _$jscoverage['/impl/defaultCacheHandler.js'].lineData[435]++;
      return store.find(findExpression);
    }
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[438]++;
  return Promise.resolve([]);
}).then(function(results) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[33]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[440]++;
  if (visit409_440_1(!Array.isArray(results))) {
    _$jscoverage['/impl/defaultCacheHandler.js'].lineData[441]++;
    results = [results];
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[443]++;
  storeEntry.data = results;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[444]++;
  return Promise.resolve(storeEntry);
});
  }
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[446]++;
  ;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[448]++;
  var escapeRegExp = function(str) {
  _$jscoverage['/impl/defaultCacheHandler.js'].functionData[34]++;
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[449]++;
  return String(str).replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};
  _$jscoverage['/impl/defaultCacheHandler.js'].lineData[452]++;
  return new DefaultCacheHandler();
});
