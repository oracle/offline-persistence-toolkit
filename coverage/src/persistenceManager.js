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
if (! _$jscoverage['/persistenceManager.js']) {
  _$jscoverage['/persistenceManager.js'] = {};
  _$jscoverage['/persistenceManager.js'].lineData = [];
  _$jscoverage['/persistenceManager.js'].lineData[6] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[8] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[15] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[16] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[20] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[24] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[28] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[32] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[36] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[39] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[50] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[51] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[52] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[54] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[66] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[67] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[78] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[79] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[103] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[104] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[106] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[109] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[111] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[128] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[129] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[130] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[131] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[133] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[147] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[148] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[149] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[150] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[152] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[153] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[155] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[156] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[159] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[172] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[173] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[185] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[186] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[201] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[204] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[208] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[212] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[213] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[214] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[215] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[217] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[219] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[222] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[226] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[227] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[230] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[232] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[233] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[236] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[237] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[239] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[241] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[243] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[244] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[245] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[247] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[248] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[249] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[250] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[251] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[252] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[253] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[254] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[255] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[256] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[257] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[259] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[260] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[262] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[263] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[264] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[265] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[267] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[268] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[271] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[273] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[275] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[277] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[283] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[284] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[288] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[289] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[291] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[292] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[294] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[295] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[296] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[297] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[299] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[302] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[304] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[305] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[309] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[314] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[318] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[323] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[324] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[325] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[329] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[331] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[334] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[336] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[337] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[338] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[340] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[341] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[342] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[344] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[345] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[355] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[356] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[360] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[363] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[368] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[390] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[391] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[404] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[405] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[411] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[412] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[413] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[418] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[423] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[427] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[431] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[435] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[439] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[441] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[442] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[443] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[444] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[445] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[447] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[449] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[450] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[451] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[455] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[456] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[457] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[460] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[461] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[462] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[465] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[466] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[468] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[472] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[473] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[475] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[476] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[478] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[480] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[481] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[483] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[485] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[490] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[491] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[493] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[498] = 0;
  _$jscoverage['/persistenceManager.js'].lineData[500] = 0;
}
if (! _$jscoverage['/persistenceManager.js'].functionData) {
  _$jscoverage['/persistenceManager.js'].functionData = [];
  _$jscoverage['/persistenceManager.js'].functionData[0] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[1] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[2] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[3] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[4] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[5] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[6] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[7] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[8] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[9] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[10] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[11] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[12] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[13] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[14] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[15] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[16] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[17] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[18] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[19] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[20] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[21] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[22] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[23] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[24] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[25] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[26] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[27] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[28] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[29] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[30] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[31] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[32] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[33] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[34] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[35] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[36] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[37] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[38] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[39] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[40] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[41] = 0;
  _$jscoverage['/persistenceManager.js'].functionData[42] = 0;
}
if (! _$jscoverage['/persistenceManager.js'].branchData) {
  _$jscoverage['/persistenceManager.js'].branchData = {};
  _$jscoverage['/persistenceManager.js'].branchData['106'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['106'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['107'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['107'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['108'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['108'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['111'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['111'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['111'][2] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['129'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['129'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['152'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['152'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['155'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['155'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['204'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['204'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['230'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['230'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['244'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['244'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['244'][2] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['244'][3] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['254'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['254'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['256'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['256'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['259'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['259'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['262'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['262'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['263'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['263'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['264'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['264'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['265'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['265'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['265'][2] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['275'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['275'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['283'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['283'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['309'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['309'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['310'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['310'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['325'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['325'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['340'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['340'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['443'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['443'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['449'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['449'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['465'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['465'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['473'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['473'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['478'] = [];
  _$jscoverage['/persistenceManager.js'].branchData['478'][1] = new BranchData();
  _$jscoverage['/persistenceManager.js'].branchData['478'][2] = new BranchData();
}
_$jscoverage['/persistenceManager.js'].branchData['478'][2].init(18, 15);
function visit502_478_2(result) {
  _$jscoverage['/persistenceManager.js'].branchData['478'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['478'][1].init(18, 62);
function visit501_478_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['478'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['473'][1].init(16, 20);
function visit500_473_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['473'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['465'][1].init(14, 47);
function visit499_465_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['465'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['449'][1].init(19, 26);
function visit498_449_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['449'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['443'][1].init(12, 22);
function visit497_443_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['443'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['340'][1].init(10, 11);
function visit496_340_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['340'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['325'][1].init(14, 33);
function visit495_325_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['325'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['310'][1].init(8, 64);
function visit494_310_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['310'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['309'][1].init(10, 96);
function visit493_309_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['309'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['283'][1].init(14, 26);
function visit492_283_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['283'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['275'][1].init(20, 21);
function visit491_275_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['275'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['265'][2].init(20, 27);
function visit490_265_2(result) {
  _$jscoverage['/persistenceManager.js'].branchData['265'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['265'][1].init(20, 96);
function visit489_265_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['265'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['264'][1].init(18, 20);
function visit488_264_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['264'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['263'][1].init(16, 52);
function visit487_263_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['263'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['262'][1].init(22, 22);
function visit486_262_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['262'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['259'][1].init(12, 54);
function visit485_259_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['259'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['256'][1].init(18, 21);
function visit484_256_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['256'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['254'][1].init(30, 21);
function visit483_254_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['254'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['244'][3].init(48, 14);
function visit482_244_3(result) {
  _$jscoverage['/persistenceManager.js'].branchData['244'][3].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['244'][2].init(14, 28);
function visit481_244_2(result) {
  _$jscoverage['/persistenceManager.js'].branchData['244'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['244'][1].init(14, 49);
function visit480_244_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['244'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['230'][1].init(10, 65);
function visit479_230_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['230'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['204'][1].init(10, 19);
function visit478_204_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['204'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['155'][1].init(12, 29);
function visit477_155_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['155'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['152'][1].init(18, 21);
function visit476_152_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['152'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['129'][1].init(16, 13);
function visit475_129_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['129'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['111'][2].init(23, 39);
function visit474_111_2(result) {
  _$jscoverage['/persistenceManager.js'].branchData['111'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['111'][1].init(13, 49);
function visit473_111_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['111'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['108'][1].init(8, 52);
function visit472_108_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['108'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['107'][1].init(8, 93);
function visit471_107_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['107'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].branchData['106'][1].init(10, 123);
function visit470_106_1(result) {
  _$jscoverage['/persistenceManager.js'].branchData['106'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceManager.js'].lineData[6]++;
define(['./impl/PersistenceXMLHttpRequest', './impl/PersistenceSyncManager', './impl/offlineCacheManager', './impl/fetch'], function(PersistenceXMLHttpRequest, PersistenceSyncManager, offlineCacheManager) {
  _$jscoverage['/persistenceManager.js'].functionData[0]++;
  _$jscoverage['/persistenceManager.js'].lineData[8]++;
  'use strict';
  _$jscoverage['/persistenceManager.js'].lineData[15]++;
  function PersistenceManager() {
    _$jscoverage['/persistenceManager.js'].functionData[1]++;
    _$jscoverage['/persistenceManager.js'].lineData[16]++;
    Object.defineProperty(this, '_registrations', {
  value: [], 
  writable: true});
    _$jscoverage['/persistenceManager.js'].lineData[20]++;
    Object.defineProperty(this, '_eventListeners', {
  value: [], 
  writable: true});
    _$jscoverage['/persistenceManager.js'].lineData[24]++;
    Object.defineProperty(this, '_forceOffline', {
  value: false, 
  writable: true});
    _$jscoverage['/persistenceManager.js'].lineData[28]++;
    Object.defineProperty(this, '_isOffline', {
  value: false, 
  writable: true});
    _$jscoverage['/persistenceManager.js'].lineData[32]++;
    Object.defineProperty(this, '_cache', {
  value: null, 
  writable: true});
    _$jscoverage['/persistenceManager.js'].lineData[36]++;
    Object.defineProperty(this, '_persistenceSyncManager', {
  value: new PersistenceSyncManager(this.isOnline.bind(this), this.browserFetch.bind(this), this.getCache.bind(this))});
  }
  _$jscoverage['/persistenceManager.js'].lineData[39]++;
  ;
  _$jscoverage['/persistenceManager.js'].lineData[50]++;
  PersistenceManager.prototype.init = function() {
  _$jscoverage['/persistenceManager.js'].functionData[2]++;
  _$jscoverage['/persistenceManager.js'].lineData[51]++;
  _replaceBrowserApis(this);
  _$jscoverage['/persistenceManager.js'].lineData[52]++;
  _addBrowserEventListeners(this);
  _$jscoverage['/persistenceManager.js'].lineData[54]++;
  return _openOfflineCache(this);
};
  _$jscoverage['/persistenceManager.js'].lineData[66]++;
  PersistenceManager.prototype.forceOffline = function(offline) {
  _$jscoverage['/persistenceManager.js'].functionData[3]++;
  _$jscoverage['/persistenceManager.js'].lineData[67]++;
  this._forceOffline = offline;
};
  _$jscoverage['/persistenceManager.js'].lineData[78]++;
  PersistenceManager.prototype.getCache = function() {
  _$jscoverage['/persistenceManager.js'].functionData[4]++;
  _$jscoverage['/persistenceManager.js'].lineData[79]++;
  return this._cache;
};
  _$jscoverage['/persistenceManager.js'].lineData[103]++;
  PersistenceManager.prototype.isOnline = function() {
  _$jscoverage['/persistenceManager.js'].functionData[5]++;
  _$jscoverage['/persistenceManager.js'].lineData[104]++;
  var online = navigator.onLine;
  _$jscoverage['/persistenceManager.js'].lineData[106]++;
  if (visit470_106_1(navigator.network && visit471_107_1(navigator.network.connection && visit472_108_1(navigator.network.connection.type == Connection.NONE)))) {
    _$jscoverage['/persistenceManager.js'].lineData[109]++;
    online = false;
  }
  _$jscoverage['/persistenceManager.js'].lineData[111]++;
  return visit473_111_1(online && visit474_111_2(!this._isOffline && !this._forceOffline));
};
  _$jscoverage['/persistenceManager.js'].lineData[128]++;
  PersistenceManager.prototype.register = function(options) {
  _$jscoverage['/persistenceManager.js'].functionData[6]++;
  _$jscoverage['/persistenceManager.js'].lineData[129]++;
  options = visit475_129_1(options || {});
  _$jscoverage['/persistenceManager.js'].lineData[130]++;
  var registration = new PersistenceRegistration(options['scope'], this);
  _$jscoverage['/persistenceManager.js'].lineData[131]++;
  this._registrations.push(registration);
  _$jscoverage['/persistenceManager.js'].lineData[133]++;
  return Promise.resolve(registration);
};
  _$jscoverage['/persistenceManager.js'].lineData[147]++;
  PersistenceManager.prototype.getRegistration = function(url) {
  _$jscoverage['/persistenceManager.js'].functionData[7]++;
  _$jscoverage['/persistenceManager.js'].lineData[148]++;
  var i;
  _$jscoverage['/persistenceManager.js'].lineData[149]++;
  var registration;
  _$jscoverage['/persistenceManager.js'].lineData[150]++;
  var registrationCount = this._registrations.length;
  _$jscoverage['/persistenceManager.js'].lineData[152]++;
  for (i = 0; visit476_152_1(i < registrationCount); i++) {
    _$jscoverage['/persistenceManager.js'].lineData[153]++;
    registration = this._registrations[i];
    _$jscoverage['/persistenceManager.js'].lineData[155]++;
    if (visit477_155_1(url.match(registration.scope))) {
      _$jscoverage['/persistenceManager.js'].lineData[156]++;
      return Promise.resolve(registration);
    }
  }
  _$jscoverage['/persistenceManager.js'].lineData[159]++;
  return Promise.resolve();
};
  _$jscoverage['/persistenceManager.js'].lineData[172]++;
  PersistenceManager.prototype.getRegistrations = function() {
  _$jscoverage['/persistenceManager.js'].functionData[8]++;
  _$jscoverage['/persistenceManager.js'].lineData[173]++;
  return Promise.resolve(this._registrations.slice());
};
  _$jscoverage['/persistenceManager.js'].lineData[185]++;
  PersistenceManager.prototype.getSyncManager = function() {
  _$jscoverage['/persistenceManager.js'].functionData[9]++;
  _$jscoverage['/persistenceManager.js'].lineData[186]++;
  return this._persistenceSyncManager;
};
  _$jscoverage['/persistenceManager.js'].lineData[201]++;
  PersistenceManager.prototype.browserFetch = function(request) {
  _$jscoverage['/persistenceManager.js'].functionData[10]++;
  _$jscoverage['/persistenceManager.js'].lineData[204]++;
  if (visit478_204_1(_isBrowserContext())) {
    _$jscoverage['/persistenceManager.js'].lineData[208]++;
    Object.defineProperty(this, '_browserFetchRequest', {
  value: request, 
  writable: true});
    _$jscoverage['/persistenceManager.js'].lineData[212]++;
    var self = this;
    _$jscoverage['/persistenceManager.js'].lineData[213]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/persistenceManager.js'].functionData[11]++;
  _$jscoverage['/persistenceManager.js'].lineData[214]++;
  self._browserFetchFunc.call(window, request).then(function(response) {
  _$jscoverage['/persistenceManager.js'].functionData[12]++;
  _$jscoverage['/persistenceManager.js'].lineData[215]++;
  resolve(response);
}, function(error) {
  _$jscoverage['/persistenceManager.js'].functionData[13]++;
  _$jscoverage['/persistenceManager.js'].lineData[217]++;
  reject(error);
});
  _$jscoverage['/persistenceManager.js'].lineData[219]++;
  self._browserFetchRequest = null;
});
  } else {
    _$jscoverage['/persistenceManager.js'].lineData[222]++;
    return fetch(request);
  }
};
  _$jscoverage['/persistenceManager.js'].lineData[226]++;
  function _addBrowserEventListeners(persistenceManager) {
    _$jscoverage['/persistenceManager.js'].functionData[14]++;
    _$jscoverage['/persistenceManager.js'].lineData[227]++;
    var self = persistenceManager;
    _$jscoverage['/persistenceManager.js'].lineData[230]++;
    if (visit479_230_1(_isBrowserContext() && !self._addedBrowserEventListeners)) {
      _$jscoverage['/persistenceManager.js'].lineData[232]++;
      window.addEventListener('offline', function(e) {
  _$jscoverage['/persistenceManager.js'].functionData[15]++;
  _$jscoverage['/persistenceManager.js'].lineData[233]++;
  self._isOffline = true;
}, false);
      _$jscoverage['/persistenceManager.js'].lineData[236]++;
      window.addEventListener('online', function(e) {
  _$jscoverage['/persistenceManager.js'].functionData[16]++;
  _$jscoverage['/persistenceManager.js'].lineData[237]++;
  self._isOffline = false;
}, false);
      _$jscoverage['/persistenceManager.js'].lineData[239]++;
      self._addedBrowserEventListeners = true;
    }
  }
  _$jscoverage['/persistenceManager.js'].lineData[241]++;
  ;
  _$jscoverage['/persistenceManager.js'].lineData[243]++;
  function _isBrowserContext() {
    _$jscoverage['/persistenceManager.js'].functionData[17]++;
    _$jscoverage['/persistenceManager.js'].lineData[244]++;
    return visit480_244_1((visit481_244_2(typeof window != 'undefined')) && (visit482_244_3(window != null)));
  }
  _$jscoverage['/persistenceManager.js'].lineData[245]++;
  ;
  _$jscoverage['/persistenceManager.js'].lineData[247]++;
  function _dispatchEvent(persistenceManager, eventType, event) {
    _$jscoverage['/persistenceManager.js'].functionData[18]++;
    _$jscoverage['/persistenceManager.js'].lineData[248]++;
    var i;
    _$jscoverage['/persistenceManager.js'].lineData[249]++;
    var j;
    _$jscoverage['/persistenceManager.js'].lineData[250]++;
    var returnValue;
    _$jscoverage['/persistenceManager.js'].lineData[251]++;
    var registration;
    _$jscoverage['/persistenceManager.js'].lineData[252]++;
    var respondWithPromise = null;
    _$jscoverage['/persistenceManager.js'].lineData[253]++;
    var registrations = persistenceManager._registrations;
    _$jscoverage['/persistenceManager.js'].lineData[254]++;
    var registrationCount = visit483_254_1(registrations != null) ? registrations.length : 0;
    _$jscoverage['/persistenceManager.js'].lineData[255]++;
    var eventListenerCount;
    _$jscoverage['/persistenceManager.js'].lineData[256]++;
    for (i = 0; visit484_256_1(i < registrationCount); i++) {
      _$jscoverage['/persistenceManager.js'].lineData[257]++;
      registration = registrations[i];
      _$jscoverage['/persistenceManager.js'].lineData[259]++;
      if (visit485_259_1(event.request.url.match(registration['scope']) != null)) {
        _$jscoverage['/persistenceManager.js'].lineData[260]++;
        eventListenerCount = registration._eventListeners.length;
        _$jscoverage['/persistenceManager.js'].lineData[262]++;
        for (j = 0; visit486_262_1(j < eventListenerCount); j++) {
          _$jscoverage['/persistenceManager.js'].lineData[263]++;
          if (visit487_263_1(registration._eventListeners[j]['type'] == eventType)) {
            _$jscoverage['/persistenceManager.js'].lineData[264]++;
            if (visit488_264_1(eventType == 'fetch')) {
              _$jscoverage['/persistenceManager.js'].lineData[265]++;
              if (visit489_265_1(visit490_265_2(respondWithPromise === null) && event._setPromiseCallbacks instanceof Function)) {
                _$jscoverage['/persistenceManager.js'].lineData[267]++;
                respondWithPromise = new Promise(function(resolve, reject) {
  _$jscoverage['/persistenceManager.js'].functionData[19]++;
  _$jscoverage['/persistenceManager.js'].lineData[268]++;
  event._setPromiseCallbacks(resolve, reject);
});
              }
              _$jscoverage['/persistenceManager.js'].lineData[271]++;
              registration._eventListeners[j]['listener'](event);
            } else {
              _$jscoverage['/persistenceManager.js'].lineData[273]++;
              returnValue = registration._eventListeners[j]['listener'](event);
              _$jscoverage['/persistenceManager.js'].lineData[275]++;
              if (visit491_275_1(returnValue === false)) {
                _$jscoverage['/persistenceManager.js'].lineData[277]++;
                return false;
              }
            }
          }
        }
        _$jscoverage['/persistenceManager.js'].lineData[283]++;
        if (visit492_283_1(respondWithPromise != null)) {
          _$jscoverage['/persistenceManager.js'].lineData[284]++;
          return respondWithPromise;
        }
      }
    }
    _$jscoverage['/persistenceManager.js'].lineData[288]++;
    return true;
  }
  _$jscoverage['/persistenceManager.js'].lineData[289]++;
  ;
  _$jscoverage['/persistenceManager.js'].lineData[291]++;
  function _openOfflineCache(persistenceManager) {
    _$jscoverage['/persistenceManager.js'].functionData[20]++;
    _$jscoverage['/persistenceManager.js'].lineData[292]++;
    var self = persistenceManager;
    _$jscoverage['/persistenceManager.js'].lineData[294]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/persistenceManager.js'].functionData[21]++;
  _$jscoverage['/persistenceManager.js'].lineData[295]++;
  offlineCacheManager.open('systemCache').then(function(cache) {
  _$jscoverage['/persistenceManager.js'].functionData[22]++;
  _$jscoverage['/persistenceManager.js'].lineData[296]++;
  self._cache = cache;
  _$jscoverage['/persistenceManager.js'].lineData[297]++;
  resolve();
}, function(error) {
  _$jscoverage['/persistenceManager.js'].functionData[23]++;
  _$jscoverage['/persistenceManager.js'].lineData[299]++;
  reject(error);
});
});
  }
  _$jscoverage['/persistenceManager.js'].lineData[302]++;
  ;
  _$jscoverage['/persistenceManager.js'].lineData[304]++;
  function _replaceBrowserApis(persistenceManager) {
    _$jscoverage['/persistenceManager.js'].functionData[24]++;
    _$jscoverage['/persistenceManager.js'].lineData[305]++;
    var self = persistenceManager;
    _$jscoverage['/persistenceManager.js'].lineData[309]++;
    if (visit493_309_1(_isBrowserContext() && visit494_310_1(!self._browserFetchFunc && !self._browserXMLHttpRequest))) {
      _$jscoverage['/persistenceManager.js'].lineData[314]++;
      Object.defineProperty(self, '_browserFetchFunc', {
  value: window.fetch, 
  writable: false});
      _$jscoverage['/persistenceManager.js'].lineData[318]++;
      Object.defineProperty(self, '_browserXMLHttpRequest', {
  value: window.XMLHttpRequest, 
  writable: false});
      _$jscoverage['/persistenceManager.js'].lineData[323]++;
      window['fetch'] = persistenceFetch(persistenceManager);
      _$jscoverage['/persistenceManager.js'].lineData[324]++;
      window['XMLHttpRequest'] = function() {
  _$jscoverage['/persistenceManager.js'].functionData[25]++;
  _$jscoverage['/persistenceManager.js'].lineData[325]++;
  if (visit495_325_1(self._browserFetchRequest != null)) {
    _$jscoverage['/persistenceManager.js'].lineData[329]++;
    return new self._browserXMLHttpRequest();
  }
  _$jscoverage['/persistenceManager.js'].lineData[331]++;
  return new PersistenceXMLHttpRequest(self._browserXMLHttpRequest);
};
    }
  }
  _$jscoverage['/persistenceManager.js'].lineData[334]++;
  ;
  _$jscoverage['/persistenceManager.js'].lineData[336]++;
  function _unregister(persistenceManager, registration) {
    _$jscoverage['/persistenceManager.js'].functionData[26]++;
    _$jscoverage['/persistenceManager.js'].lineData[337]++;
    var self = persistenceManager;
    _$jscoverage['/persistenceManager.js'].lineData[338]++;
    var regIdx = self._registrations.indexOf(registration);
    _$jscoverage['/persistenceManager.js'].lineData[340]++;
    if (visit496_340_1(regIdx > -1)) {
      _$jscoverage['/persistenceManager.js'].lineData[341]++;
      self._registrations.splice(regIdx, 1);
      _$jscoverage['/persistenceManager.js'].lineData[342]++;
      return true;
    }
    _$jscoverage['/persistenceManager.js'].lineData[344]++;
    return false;
  }
  _$jscoverage['/persistenceManager.js'].lineData[345]++;
  ;
  _$jscoverage['/persistenceManager.js'].lineData[355]++;
  function PersistenceRegistration(scope, persistenceManager) {
    _$jscoverage['/persistenceManager.js'].functionData[27]++;
    _$jscoverage['/persistenceManager.js'].lineData[356]++;
    Object.defineProperty(this, 'scope', {
  value: scope, 
  enumerable: true});
    _$jscoverage['/persistenceManager.js'].lineData[360]++;
    Object.defineProperty(this, '_persistenceManager', {
  value: persistenceManager});
    _$jscoverage['/persistenceManager.js'].lineData[363]++;
    Object.defineProperty(this, '_eventListeners', {
  value: [], 
  writable: true});
  }
  _$jscoverage['/persistenceManager.js'].lineData[368]++;
  ;
  _$jscoverage['/persistenceManager.js'].lineData[390]++;
  PersistenceRegistration.prototype.addEventListener = function(type, listener) {
  _$jscoverage['/persistenceManager.js'].functionData[28]++;
  _$jscoverage['/persistenceManager.js'].lineData[391]++;
  this._eventListeners.push({
  'type': type.toLowerCase(), 
  'listener': listener});
};
  _$jscoverage['/persistenceManager.js'].lineData[404]++;
  PersistenceRegistration.prototype.unregister = function() {
  _$jscoverage['/persistenceManager.js'].functionData[29]++;
  _$jscoverage['/persistenceManager.js'].lineData[405]++;
  return Promise.resolve(_unregister(this._persistenceManager, this));
};
  _$jscoverage['/persistenceManager.js'].lineData[411]++;
  function persistenceFetch(persistenceManager) {
    _$jscoverage['/persistenceManager.js'].functionData[30]++;
    _$jscoverage['/persistenceManager.js'].lineData[412]++;
    function PersistenceFetchEvent(request) {
      _$jscoverage['/persistenceManager.js'].functionData[31]++;
      _$jscoverage['/persistenceManager.js'].lineData[413]++;
      Object.defineProperty(this, 'isReload', {
  value: false, 
  enumerable: true});
      _$jscoverage['/persistenceManager.js'].lineData[418]++;
      Object.defineProperty(this, 'clientId', {
  value: null, 
  enumerable: true});
      _$jscoverage['/persistenceManager.js'].lineData[423]++;
      Object.defineProperty(this, 'client', {
  value: null, 
  enumerable: true});
      _$jscoverage['/persistenceManager.js'].lineData[427]++;
      Object.defineProperty(this, 'request', {
  value: request, 
  enumerable: true});
      _$jscoverage['/persistenceManager.js'].lineData[431]++;
      Object.defineProperty(this, '_resolveCallback', {
  value: null, 
  writable: true});
      _$jscoverage['/persistenceManager.js'].lineData[435]++;
      Object.defineProperty(this, '_rejectCallback', {
  value: null, 
  writable: true});
    }
    _$jscoverage['/persistenceManager.js'].lineData[439]++;
    ;
    _$jscoverage['/persistenceManager.js'].lineData[441]++;
    PersistenceFetchEvent.prototype.respondWith = function(any) {
  _$jscoverage['/persistenceManager.js'].functionData[32]++;
  _$jscoverage['/persistenceManager.js'].lineData[442]++;
  var self = this;
  _$jscoverage['/persistenceManager.js'].lineData[443]++;
  if (visit497_443_1(any instanceof Promise)) {
    _$jscoverage['/persistenceManager.js'].lineData[444]++;
    any.then(function(response) {
  _$jscoverage['/persistenceManager.js'].functionData[33]++;
  _$jscoverage['/persistenceManager.js'].lineData[445]++;
  self._resolveCallback(response);
}, function(err) {
  _$jscoverage['/persistenceManager.js'].functionData[34]++;
  _$jscoverage['/persistenceManager.js'].lineData[447]++;
  self._rejectCallback(err);
});
  } else {
    _$jscoverage['/persistenceManager.js'].lineData[449]++;
    if (visit498_449_1(typeof (any) == 'function')) {
      _$jscoverage['/persistenceManager.js'].lineData[450]++;
      var response = any();
      _$jscoverage['/persistenceManager.js'].lineData[451]++;
      self._resolveCallback(response);
    }
  }
};
    _$jscoverage['/persistenceManager.js'].lineData[455]++;
    PersistenceFetchEvent.prototype._setPromiseCallbacks = function(resolveCallback, rejectCallback) {
  _$jscoverage['/persistenceManager.js'].functionData[35]++;
  _$jscoverage['/persistenceManager.js'].lineData[456]++;
  this._resolveCallback = resolveCallback;
  _$jscoverage['/persistenceManager.js'].lineData[457]++;
  this._rejectCallback = rejectCallback;
};
    _$jscoverage['/persistenceManager.js'].lineData[460]++;
    return function(input, init) {
  _$jscoverage['/persistenceManager.js'].functionData[36]++;
  _$jscoverage['/persistenceManager.js'].lineData[461]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/persistenceManager.js'].functionData[37]++;
  _$jscoverage['/persistenceManager.js'].lineData[462]++;
  var request;
  _$jscoverage['/persistenceManager.js'].lineData[465]++;
  if (visit499_465_1(Request.prototype.isPrototypeOf(input) && !init)) {
    _$jscoverage['/persistenceManager.js'].lineData[466]++;
    request = input;
  } else {
    _$jscoverage['/persistenceManager.js'].lineData[468]++;
    request = new Request(input, init);
  }
  _$jscoverage['/persistenceManager.js'].lineData[472]++;
  persistenceManager.getRegistration(request.url).then(function(registration) {
  _$jscoverage['/persistenceManager.js'].functionData[38]++;
  _$jscoverage['/persistenceManager.js'].lineData[473]++;
  if (visit500_473_1(registration != null)) {
    _$jscoverage['/persistenceManager.js'].lineData[475]++;
    var fetchEvent = new PersistenceFetchEvent(request);
    _$jscoverage['/persistenceManager.js'].lineData[476]++;
    var promise = _dispatchEvent(persistenceManager, 'fetch', fetchEvent);
    _$jscoverage['/persistenceManager.js'].lineData[478]++;
    if (visit501_478_1(visit502_478_2(promise != null) && promise instanceof Promise)) {
      _$jscoverage['/persistenceManager.js'].lineData[480]++;
      promise.then(function(response) {
  _$jscoverage['/persistenceManager.js'].functionData[39]++;
  _$jscoverage['/persistenceManager.js'].lineData[481]++;
  resolve(response);
}, function(err) {
  _$jscoverage['/persistenceManager.js'].functionData[40]++;
  _$jscoverage['/persistenceManager.js'].lineData[483]++;
  reject(err);
});
      _$jscoverage['/persistenceManager.js'].lineData[485]++;
      return;
    }
  }
  _$jscoverage['/persistenceManager.js'].lineData[490]++;
  persistenceManager.browserFetch(request).then(function(response) {
  _$jscoverage['/persistenceManager.js'].functionData[41]++;
  _$jscoverage['/persistenceManager.js'].lineData[491]++;
  resolve(response);
}, function(err) {
  _$jscoverage['/persistenceManager.js'].functionData[42]++;
  _$jscoverage['/persistenceManager.js'].lineData[493]++;
  reject(err);
});
});
});
};
  }
  _$jscoverage['/persistenceManager.js'].lineData[498]++;
  ;
  _$jscoverage['/persistenceManager.js'].lineData[500]++;
  return new PersistenceManager();
});
