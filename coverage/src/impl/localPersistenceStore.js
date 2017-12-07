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
if (! _$jscoverage['/impl/localPersistenceStore.js']) {
  _$jscoverage['/impl/localPersistenceStore.js'] = {};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData = [];
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[6] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[8] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[10] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[11] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[14] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[16] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[17] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[18] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[21] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[22] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[23] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[24] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[25] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[26] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[27] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[31] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[32] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[33] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[35] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[38] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[39] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[43] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[44] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[49] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[50] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[53] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[54] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[55] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[56] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[57] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[59] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[62] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[63] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[64] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[65] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[66] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[68] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[69] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[70] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[71] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[72] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[73] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[74] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[75] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[76] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[81] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[82] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[83] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[86] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[89] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[91] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[93] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[96] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[111] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[112] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[113] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[114] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[115] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[116] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[118] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[119] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[120] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[121] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[122] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[123] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[125] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[126] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[128] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[131] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[132] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[133] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[134] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[135] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[136] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[138] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[141] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[145] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[146] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[147] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[148] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[149] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[151] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[155] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[156] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[157] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[158] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[159] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[160] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[162] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[166] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[167] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[170] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[171] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[172] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[173] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[174] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[176] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[193] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[194] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[196] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[198] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[199] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[212] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[213] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[214] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[215] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[216] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[217] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[218] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[219] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[220] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[221] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[225] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[226] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[227] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[230] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[232] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[233] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[235] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[236] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[242] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[245] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[246] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[251] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[252] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[256] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[257] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[260] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[273] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[274] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[275] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[276] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[277] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[278] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[279] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[281] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[282] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[283] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[300] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[301] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[302] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[303] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[304] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[306] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[307] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[308] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[309] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[310] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[311] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[312] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[313] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[315] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[317] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[319] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[320] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[321] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[322] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[323] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[324] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[325] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[326] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[327] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[328] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[329] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[330] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[331] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[332] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[333] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[334] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[335] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[336] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[337] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[338] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[339] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[341] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[344] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[347] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[349] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[362] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[363] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[376] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[377] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[390] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[391] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[409] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[410] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[411] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[412] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[413] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[415] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[433] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[434] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[435] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[436] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[438] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[439] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[440] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[441] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[442] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[443] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[444] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[445] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[446] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[447] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[449] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[450] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[452] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[457] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[461] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[462] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[464] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[465] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[466] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[467] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[468] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[469] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[472] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[475] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[476] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[477] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[479] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[480] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[481] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[483] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[486] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[487] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[488] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[503] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[504] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[505] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[506] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[507] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[508] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[510] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[512] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[516] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[517] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[518] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[519] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[520] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[521] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[522] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[525] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[528] = 0;
}
if (! _$jscoverage['/impl/localPersistenceStore.js'].functionData) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData = [];
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[0] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[1] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[2] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[3] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[4] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[5] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[6] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[7] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[8] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[9] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[10] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[11] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[12] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[13] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[14] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[15] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[16] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[17] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[18] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[19] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[20] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[21] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[22] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[23] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[24] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[25] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[26] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[27] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[28] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[29] = 0;
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[30] = 0;
}
if (! _$jscoverage['/impl/localPersistenceStore.js'].branchData) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData = {};
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['17'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['17'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['17'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['24'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['24'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['26'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['26'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['32'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['32'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['55'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['55'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['66'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['66'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['69'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['69'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['72'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['72'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['74'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['74'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['82'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['82'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['91'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['91'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['91'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['92'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['92'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['113'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['113'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['118'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['118'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['120'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['120'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['122'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['122'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['122'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['126'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['126'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['133'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['133'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['135'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['135'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['136'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['136'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['138'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['138'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['148'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['148'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['158'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['158'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['173'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['173'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['194'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['194'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['216'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['216'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['218'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['218'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['219'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['219'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['220'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['220'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['225'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['225'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['232'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['232'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['235'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['235'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['251'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['251'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['256'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['256'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['276'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['276'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['278'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['278'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['302'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['302'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['303'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['303'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['308'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['308'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['310'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['310'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['310'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['310'][3] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['312'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['312'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['312'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['312'][3] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['319'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['319'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['322'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['322'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['323'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['323'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['324'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['324'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['325'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['325'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['326'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['326'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['327'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['327'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['328'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['328'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['329'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['329'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['330'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['330'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['331'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['331'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['332'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['332'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['333'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['333'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['334'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['334'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['336'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['336'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['337'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['337'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['338'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['338'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['339'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['339'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['339'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['339'][3] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['341'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['341'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['341'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['341'][3] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['363'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['363'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['363'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['363'][3] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][3] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][4] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][5] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][6] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][3] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][4] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][5] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][6] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['379'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['379'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['379'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['379'][3] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['391'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['391'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['412'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['412'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['435'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['435'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['439'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['439'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['444'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['444'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['446'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['446'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['446'][2] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['449'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['449'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['464'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['464'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['466'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['466'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['468'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['468'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['479'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['479'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['507'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['507'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['519'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['519'][1] = new BranchData();
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['521'] = [];
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['521'][1] = new BranchData();
}
_$jscoverage['/impl/localPersistenceStore.js'].branchData['521'][1].init(12, 3);
function visit232_521_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['521'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['519'][1].init(26, 25);
function visit231_519_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['519'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['507'][1].init(12, 12);
function visit230_507_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['507'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['479'][1].init(14, 37);
function visit229_479_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['479'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['468'][1].init(14, 3);
function visit228_468_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['468'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['466'][1].init(28, 25);
function visit227_466_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['466'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['464'][1].init(10, 17);
function visit226_464_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['464'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['449'][1].init(16, 30);
function visit225_449_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['449'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['446'][2].init(52, 28);
function visit224_446_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['446'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['446'][1].init(16, 64);
function visit223_446_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['446'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['444'][1].init(34, 24);
function visit222_444_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['444'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['439'][1].init(28, 31);
function visit221_439_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['439'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['435'][1].init(10, 17);
function visit220_435_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['435'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['412'][1].init(26, 20);
function visit219_412_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['412'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['391'][1].init(14, 26);
function visit218_391_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['391'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['379'][3].init(30, 19);
function visit217_379_3(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['379'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['379'][2].init(8, 18);
function visit216_379_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['379'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['379'][1].init(8, 41);
function visit215_379_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['379'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][6].init(47, 15);
function visit214_378_6(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][6].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][5].init(47, 69);
function visit213_378_5(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][5].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][4].init(28, 15);
function visit212_378_4(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][4].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][3].init(28, 88);
function visit211_378_3(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][2].init(8, 16);
function visit210_378_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][1].init(8, 108);
function visit209_378_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['378'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][6].init(52, 16);
function visit208_377_6(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][6].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][5].init(52, 137);
function visit207_377_5(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][5].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][4].init(33, 15);
function visit206_377_4(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][4].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][3].init(33, 156);
function visit205_377_3(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][2].init(14, 15);
function visit204_377_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][1].init(14, 175);
function visit203_377_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['377'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['363'][3].init(34, 15);
function visit202_363_3(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['363'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['363'][2].init(14, 16);
function visit201_363_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['363'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['363'][1].init(14, 35);
function visit200_363_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['363'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['341'][3].init(42, 23);
function visit199_341_3(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['341'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['341'][2].init(20, 18);
function visit198_341_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['341'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['341'][1].init(20, 45);
function visit197_341_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['341'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['339'][3].init(42, 23);
function visit196_339_3(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['339'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['339'][2].init(20, 18);
function visit195_339_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['339'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['339'][1].init(20, 45);
function visit194_339_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['339'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['338'][1].init(14, 5);
function visit193_338_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['338'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['337'][1].init(19, 22);
function visit192_337_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['337'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['336'][1].init(18, 20);
function visit164_336_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['336'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['334'][1].init(19, 21);
function visit162_334_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['334'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['333'][1].init(18, 19);
function visit160_333_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['333'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['332'][1].init(19, 18);
function visit158_332_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['332'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['331'][1].init(18, 19);
function visit156_331_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['331'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['330'][1].init(19, 18);
function visit154_330_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['330'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['329'][1].init(18, 18);
function visit152_329_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['329'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['328'][1].init(19, 19);
function visit151_328_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['328'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['327'][1].init(18, 18);
function visit149_327_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['327'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['326'][1].init(19, 19);
function visit147_326_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['326'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['325'][1].init(18, 17);
function visit145_325_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['325'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['324'][1].init(19, 18);
function visit143_324_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['324'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['323'][1].init(18, 17);
function visit141_323_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['323'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['322'][1].init(12, 18);
function visit139_322_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['322'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['319'][1].init(17, 32);
function visit137_319_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['319'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['312'][3].init(46, 19);
function visit135_312_3(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['312'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['312'][2].init(23, 19);
function visit133_312_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['312'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['312'][1].init(23, 42);
function visit132_312_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['312'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['310'][3].init(38, 18);
function visit131_310_3(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['310'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['310'][2].init(16, 18);
function visit129_310_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['310'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['310'][1].init(16, 40);
function visit127_310_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['310'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['308'][1].init(33, 30);
function visit125_308_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['308'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['303'][1].init(12, 49);
function visit123_303_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['303'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['302'][1].init(10, 31);
function visit121_302_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['302'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['278'][1].init(14, 37);
function visit119_278_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['278'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['276'][1].init(12, 30);
function visit117_276_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['276'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['256'][1].init(17, 26);
function visit115_256_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['256'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['251'][1].init(10, 24);
function visit113_251_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['251'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['235'][1].init(21, 22);
function visit110_235_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['235'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['232'][1].init(23, 27);
function visit108_232_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['232'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['225'][1].init(39, 23);
function visit106_225_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['225'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['220'][1].init(18, 22);
function visit105_220_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['220'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['219'][1].init(16, 26);
function visit104_219_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['219'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['218'][1].init(14, 22);
function visit103_218_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['218'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['216'][1].init(12, 30);
function visit102_216_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['216'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['194'][1].init(10, 9);
function visit101_194_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['194'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['173'][1].init(10, 28);
function visit100_173_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['173'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['158'][1].init(10, 12);
function visit99_158_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['158'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['148'][1].init(10, 12);
function visit98_148_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['148'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['138'][1].init(20, 15);
function visit97_138_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['138'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['136'][1].init(20, 15);
function visit96_136_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['136'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['135'][1].init(21, 7);
function visit95_135_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['135'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['133'][1].init(14, 16);
function visit94_133_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['133'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['126'][1].init(23, 40);
function visit93_126_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['126'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['122'][2].init(25, 17);
function visit92_122_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['122'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['122'][1].init(16, 26);
function visit91_122_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['122'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['120'][1].init(21, 26);
function visit90_120_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['120'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['118'][1].init(14, 26);
function visit89_118_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['118'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['113'][1].init(28, 27);
function visit88_113_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['113'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['92'][1].init(10, 37);
function visit87_92_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['92'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['91'][2].init(23, 68);
function visit86_91_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['91'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['91'][1].init(10, 81);
function visit85_91_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['91'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['82'][1].init(26, 21);
function visit84_82_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['82'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['74'][1].init(14, 48);
function visit83_74_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['74'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['72'][1].init(12, 3);
function visit82_72_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['72'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['69'][1].init(26, 25);
function visit81_69_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['69'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['66'][1].init(27, 20);
function visit80_66_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['66'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['55'][1].init(26, 24);
function visit79_55_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['55'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['32'][1].init(14, 50);
function visit78_32_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['32'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['26'][1].init(12, 55);
function visit77_26_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['26'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['24'][1].init(10, 42);
function visit76_24_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['24'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['17'][2].init(23, 26);
function visit75_17_2(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['17'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].branchData['17'][1].init(23, 34);
function visit74_17_1(result) {
  _$jscoverage['/impl/localPersistenceStore.js'].branchData['17'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/localPersistenceStore.js'].lineData[6]++;
define(["../PersistenceStore"], function(PersistenceStore) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[0]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[8]++;
  'use strict';
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[10]++;
  var LocalPersistenceStore = function(name) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[1]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[11]++;
  PersistenceStore.call(this, name);
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[14]++;
  LocalPersistenceStore.prototype = new PersistenceStore();
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[16]++;
  LocalPersistenceStore.prototype.Init = function(options) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[2]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[17]++;
  this._version = visit74_17_1((visit75_17_2(options && options.version)) || '0');
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[18]++;
  return Promise.resolve();
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[21]++;
  LocalPersistenceStore.prototype.upsert = function(key, metadata, value, expectedVersionIdentifier) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[3]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[22]++;
  var insertKey = this.createRawKey(key);
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[23]++;
  var existingValue = localStorage.getItem(insertKey);
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[24]++;
  if (visit76_24_1(existingValue && expectedVersionIdentifier)) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[25]++;
    var existingVersionIdentifier = JSON.parse(existingValue).metadata.versionIdentifier;
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[26]++;
    if (visit77_26_1(existingVersionIdentifier !== expectedVersionIdentifier)) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[27]++;
      return Promise.reject({
  status: 409});
    } else {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[31]++;
      var newVersionIdentifier = metadata.versionIdentifier;
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[32]++;
      if (visit78_32_1(newVersionIdentifier !== existingVersionIdentifier)) {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[33]++;
        this._insert(insertKey, metadata, value);
      }
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[35]++;
      return Promise.resolve();
    }
  } else {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[38]++;
    this._insert(insertKey, metadata, value);
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[39]++;
    return Promise.resolve();
  }
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[43]++;
  LocalPersistenceStore.prototype._insert = function(key, metadata, value) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[4]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[44]++;
  var insertValue = {
  metadata: metadata, 
  value: value};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[49]++;
  var valueToStore = JSON.stringify(insertValue);
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[50]++;
  localStorage.setItem(key, valueToStore);
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[53]++;
  LocalPersistenceStore.prototype.upsertAll = function(dataArray) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[5]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[54]++;
  var promiseArray = [];
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[55]++;
  for (var index = 0; visit79_55_1(index < dataArray.length); index++) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[56]++;
    var data = dataArray[index];
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[57]++;
    promiseArray.push(this.upsert(data.key, data.metadata, data.value, data.expectedVersionIndentifier));
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[59]++;
  return Promise.all(promiseArray);
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[62]++;
  LocalPersistenceStore.prototype.find = function(findExpression) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[6]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[63]++;
  var self = this;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[64]++;
  var resultSet = [];
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[65]++;
  var unsorted = [];
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[66]++;
  var findExpression = visit80_66_1(findExpression || {});
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[68]++;
  var allRawKeys = Object.keys(localStorage);
  ;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[69]++;
  for (var index = 0; visit81_69_1(index < allRawKeys.length); index++) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[70]++;
    var rawKey = allRawKeys[index];
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[71]++;
    var key = this.extractKey(rawKey);
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[72]++;
    if (visit82_72_1(key)) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[73]++;
      var itemData = JSON.parse(localStorage.getItem(rawKey));
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[74]++;
      if (visit83_74_1(self._satisfy(findExpression.selector, itemData))) {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[75]++;
        itemData.key = key;
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[76]++;
        unsorted.push(itemData);
      }
    }
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[81]++;
  var sorted = this._sort(unsorted, findExpression.sort);
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[82]++;
  for (var index = 0; visit84_82_1(index < sorted.length); index++) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[83]++;
    resultSet.push(self._constructReturnObject(findExpression.fields, sorted[index]));
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[86]++;
  return Promise.resolve(resultSet);
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[89]++;
  LocalPersistenceStore.prototype._sort = function(unsorted, sortCriteria) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[7]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[91]++;
  if (visit85_91_1(!unsorted || visit86_91_2(!unsorted.length || visit87_92_1(!sortCriteria || !sortCriteria.length)))) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[93]++;
    return unsorted;
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[96]++;
  return unsorted.sort(this._sortFunction(sortCriteria, this));
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[111]++;
  LocalPersistenceStore.prototype._sortFunction = function(sortCriteria, thisArg) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[8]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[112]++;
  return function(a, b) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[9]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[113]++;
  for (var index = 0; visit88_113_1(index < sortCriteria.length); index++) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[114]++;
    var sortC = sortCriteria[index];
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[115]++;
    var sortField;
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[116]++;
    var sortAsc = true;
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[118]++;
    if (visit89_118_1(typeof (sortC) === 'string')) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[119]++;
      sortField = sortC;
    } else {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[120]++;
      if (visit90_120_1(typeof (sortC) === 'object')) {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[121]++;
        var keys = Object.keys(sortC);
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[122]++;
        if (visit91_122_1(!keys || visit92_122_2(keys.length !== 1))) {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[123]++;
          throw new Error('invalid sort criteria');
        }
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[125]++;
        sortField = keys[0];
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[126]++;
        sortAsc = (visit93_126_1(sortC[sortField].toLowerCase() === 'asc'));
      } else {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[128]++;
        throw new Error("invalid sort criteria.");
      }
    }
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[131]++;
    var valueA = thisArg._getValue(sortField, a);
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[132]++;
    var valueB = thisArg._getValue(sortField, b);
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[133]++;
    if (visit94_133_1(valueA == valueB)) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[134]++;
      continue;
    } else {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[135]++;
      if (visit95_135_1(sortAsc)) {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[136]++;
        return (visit96_136_1(valueA < valueB) ? -1 : 1);
      } else {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[138]++;
        return (visit97_138_1(valueA < valueB) ? 1 : -1);
      }
    }
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[141]++;
  return 0;
};
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[145]++;
  LocalPersistenceStore.prototype.findByKey = function(key) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[10]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[146]++;
  var insertKey = this.createRawKey(key);
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[147]++;
  var storeageData = localStorage.getItem(insertKey);
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[148]++;
  if (visit98_148_1(storeageData)) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[149]++;
    return Promise.resolve(JSON.parse(storeageData).value);
  } else {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[151]++;
    return Promise.resolve();
  }
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[155]++;
  LocalPersistenceStore.prototype.removeByKey = function(key) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[11]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[156]++;
  var insertKey = this.createRawKey(key);
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[157]++;
  var storeageData = localStorage.getItem(insertKey);
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[158]++;
  if (visit99_158_1(storeageData)) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[159]++;
    localStorage.removeItem(insertKey);
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[160]++;
    return Promise.resolve(true);
  } else {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[162]++;
    return Promise.resolve(false);
  }
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[166]++;
  LocalPersistenceStore.prototype.createRawKey = function(key) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[12]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[167]++;
  return this._name + this._version + key.toString();
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[170]++;
  LocalPersistenceStore.prototype.extractKey = function(rawKey) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[13]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[171]++;
  var prefix = this._name + this._version;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[172]++;
  var prefixLength = prefix.length;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[173]++;
  if (visit100_173_1(rawKey.indexOf(prefix) === 0)) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[174]++;
    return rawKey.slice(prefixLength);
  } else {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[176]++;
    return null;
  }
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[193]++;
  LocalPersistenceStore.prototype._satisfy = function(selector, itemData) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[14]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[194]++;
  if (visit101_194_1(!selector)) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[196]++;
    return true;
  } else {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[198]++;
    var expTree = this._buildExpressionTree(selector);
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[199]++;
    return this._evaluateExpressionTree(expTree, itemData);
  }
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[212]++;
  LocalPersistenceStore.prototype._buildExpressionTree = function(expression) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[15]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[213]++;
  var subTree;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[214]++;
  var itemTreeArray = [];
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[215]++;
  for (var key in expression) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[216]++;
    if (visit102_216_1(expression.hasOwnProperty(key))) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[217]++;
      var value = expression[key];
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[218]++;
      if (visit103_218_1(key.indexOf('$') === 0)) {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[219]++;
        if (visit104_219_1(this._isMultiSelector(key))) {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[220]++;
          if (visit105_220_1(value instanceof Array)) {
            _$jscoverage['/impl/localPersistenceStore.js'].lineData[221]++;
            subTree = {
  operator: key, 
  array: []};
            _$jscoverage['/impl/localPersistenceStore.js'].lineData[225]++;
            for (var subindex = 0; visit106_225_1(subindex < value.length); subindex++) {
              _$jscoverage['/impl/localPersistenceStore.js'].lineData[226]++;
              var itemTree = this._buildExpressionTree(value[subindex]);
              _$jscoverage['/impl/localPersistenceStore.js'].lineData[227]++;
              subTree.array.push(itemTree);
            }
          } else {
            _$jscoverage['/impl/localPersistenceStore.js'].lineData[230]++;
            throw new Error("not a valid expression: " + expression);
          }
        } else {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[232]++;
          if (visit108_232_1(this._isSingleSelector(key))) {
            _$jscoverage['/impl/localPersistenceStore.js'].lineData[233]++;
            throw new Error("not a valid expression: " + expression);
          }
        }
      } else {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[235]++;
        if (visit110_235_1(this._isLiteral(value))) {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[236]++;
          itemTreeArray.push({
  left: key, 
  right: value, 
  operator: '$eq'});
        } else {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[242]++;
          var partialTree = {
  left: key};
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[245]++;
          this._completePartialTree(partialTree, value);
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[246]++;
          itemTreeArray.push(partialTree);
        }
      }
    }
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[251]++;
  if (visit113_251_1(itemTreeArray.length > 1)) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[252]++;
    subTree = {
  operator: '$and', 
  array: itemTreeArray};
  } else {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[256]++;
    if (visit115_256_1(itemTreeArray.length === 1)) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[257]++;
      subTree = itemTreeArray[0];
    }
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[260]++;
  return subTree;
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[273]++;
  LocalPersistenceStore.prototype._completePartialTree = function(partialTree, expression) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[16]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[274]++;
  var found = false;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[275]++;
  for (var key in expression) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[276]++;
    if (visit117_276_1(expression.hasOwnProperty(key))) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[277]++;
      var value = expression[key];
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[278]++;
      if (visit119_278_1(found || !this._isSingleSelector(key))) {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[279]++;
        throw new Error("parsing error " + expression);
      }
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[281]++;
      partialTree.operator = key;
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[282]++;
      partialTree.right = value;
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[283]++;
      found = true;
    }
  }
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[300]++;
  LocalPersistenceStore.prototype._evaluateExpressionTree = function(expTree, itemData) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[17]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[301]++;
  var operator = expTree.operator;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[302]++;
  if (visit121_302_1(this._isMultiSelector(operator))) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[303]++;
    if (visit123_303_1(expTree.left || !(expTree.array instanceof Array))) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[304]++;
      throw new Error("invalid expression tree!" + expTree);
    } else {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[306]++;
      var result;
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[307]++;
      var subTreeArray = expTree.array;
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[308]++;
      for (var subIndex = 0; visit125_308_1(subIndex < subTreeArray.length); subIndex++) {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[309]++;
        var subResult = this._evaluateExpressionTree(subTreeArray[subIndex], itemData);
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[310]++;
        if (visit127_310_1(visit129_310_2(operator === '$or') && visit131_310_3(subResult === true))) {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[311]++;
          return true;
        } else {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[312]++;
          if (visit132_312_1(visit133_312_2(operator === '$and') && visit135_312_3(subResult === false))) {
            _$jscoverage['/impl/localPersistenceStore.js'].lineData[313]++;
            return false;
          }
        }
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[315]++;
        result = subResult;
      }
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[317]++;
      return result;
    }
  } else {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[319]++;
    if (visit137_319_1(this._isSingleSelector(operator))) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[320]++;
      var itemValue = this._getValue(expTree.left, itemData);
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[321]++;
      var value = expTree.right;
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[322]++;
      if (visit139_322_1(operator === '$lt')) {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[323]++;
        return (visit141_323_1(itemValue < value));
      } else {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[324]++;
        if (visit143_324_1(operator === '$gt')) {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[325]++;
          return (visit145_325_1(itemValue > value));
        } else {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[326]++;
          if (visit147_326_1(operator === '$lte')) {
            _$jscoverage['/impl/localPersistenceStore.js'].lineData[327]++;
            return (visit149_327_1(itemValue <= value));
          } else {
            _$jscoverage['/impl/localPersistenceStore.js'].lineData[328]++;
            if (visit151_328_1(operator === '$gte')) {
              _$jscoverage['/impl/localPersistenceStore.js'].lineData[329]++;
              return (visit152_329_1(itemValue >= value));
            } else {
              _$jscoverage['/impl/localPersistenceStore.js'].lineData[330]++;
              if (visit154_330_1(operator === '$eq')) {
                _$jscoverage['/impl/localPersistenceStore.js'].lineData[331]++;
                return (visit156_331_1(itemValue === value));
              } else {
                _$jscoverage['/impl/localPersistenceStore.js'].lineData[332]++;
                if (visit158_332_1(operator === '$ne')) {
                  _$jscoverage['/impl/localPersistenceStore.js'].lineData[333]++;
                  return (visit160_333_1(itemValue !== value));
                } else {
                  _$jscoverage['/impl/localPersistenceStore.js'].lineData[334]++;
                  if (visit162_334_1(operator === '$regex')) {
                    _$jscoverage['/impl/localPersistenceStore.js'].lineData[335]++;
                    var matchResult = itemValue.match(value);
                    _$jscoverage['/impl/localPersistenceStore.js'].lineData[336]++;
                    return (visit164_336_1(matchResult !== null));
                  } else {
                    _$jscoverage['/impl/localPersistenceStore.js'].lineData[337]++;
                    if (visit192_337_1(operator === '$exists')) {
                      _$jscoverage['/impl/localPersistenceStore.js'].lineData[338]++;
                      if (visit193_338_1(value)) {
                        _$jscoverage['/impl/localPersistenceStore.js'].lineData[339]++;
                        return (visit194_339_1(visit195_339_2(itemValue !== null) && visit196_339_3(itemValue !== undefined)));
                      } else {
                        _$jscoverage['/impl/localPersistenceStore.js'].lineData[341]++;
                        return (visit197_341_1(visit198_341_2(itemValue === null) || visit199_341_3(itemValue === undefined)));
                      }
                    } else {
                      _$jscoverage['/impl/localPersistenceStore.js'].lineData[344]++;
                      throw new Error("not a valid expression! " + expTree);
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[347]++;
      throw new Error("not a valid expression!" + expTree);
    }
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[349]++;
  return false;
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[362]++;
  LocalPersistenceStore.prototype._isMultiSelector = function(token) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[18]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[363]++;
  return (visit200_363_1(visit201_363_2(token === '$and') || visit202_363_3(token === '$or')));
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[376]++;
  LocalPersistenceStore.prototype._isSingleSelector = function(token) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[19]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[377]++;
  return (visit203_377_1(visit204_377_2(token === '$lt') || visit205_377_3(visit206_377_4(token === '$gt') || visit207_377_5(visit208_377_6(token === '$lte') || visit209_378_1(visit210_378_2(token === '$gte') || visit211_378_3(visit212_378_4(token === '$eq') || visit213_378_5(visit214_378_6(token === '$ne') || visit215_379_1(visit216_379_2(token === '$regex') || visit217_379_3(token === '$exists')))))))));
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[390]++;
  LocalPersistenceStore.prototype._isLiteral = function(token) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[20]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[391]++;
  return (visit218_391_1(typeof (token) !== 'object'));
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[409]++;
  LocalPersistenceStore.prototype._getValue = function(path, itemValue) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[21]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[410]++;
  var paths = path.split('.');
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[411]++;
  var returnValue = itemValue;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[412]++;
  for (var index = 0; visit219_412_1(index < paths.length); index++) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[413]++;
    returnValue = returnValue[paths[index]];
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[415]++;
  return returnValue;
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[433]++;
  LocalPersistenceStore.prototype._constructReturnObject = function(fieldsExpression, itemData) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[22]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[434]++;
  var returnObject;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[435]++;
  if (visit220_435_1(!fieldsExpression)) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[436]++;
    returnObject = itemData.value;
  } else {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[438]++;
    returnObject = {};
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[439]++;
    for (var index = 0; visit221_439_1(index < fieldsExpression.length); index++) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[440]++;
      var currentObject = returnObject;
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[441]++;
      var currentItemDataValue = itemData;
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[442]++;
      var field = fieldsExpression[index];
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[443]++;
      var paths = field.split('.');
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[444]++;
      for (var pathIndex = 0; visit222_444_1(pathIndex < paths.length); pathIndex++) {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[445]++;
        currentItemDataValue = currentItemDataValue[paths[pathIndex]];
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[446]++;
        if (visit223_446_1(!currentObject[paths[pathIndex]] && visit224_446_2(pathIndex < paths.length - 1))) {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[447]++;
          currentObject[paths[pathIndex]] = {};
        }
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[449]++;
        if (visit225_449_1(pathIndex === paths.length - 1)) {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[450]++;
          currentObject[paths[pathIndex]] = currentItemDataValue;
        } else {
          _$jscoverage['/impl/localPersistenceStore.js'].lineData[452]++;
          currentObject = currentObject[paths[pathIndex]];
        }
      }
    }
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[457]++;
  return returnObject;
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[461]++;
  LocalPersistenceStore.prototype.delete = function(deleteExpression) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[23]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[462]++;
  var self = this;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[464]++;
  if (visit226_464_1(!deleteExpression)) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[465]++;
    var allRawKeys = Object.keys(localStorage);
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[466]++;
    for (var index = 0; visit227_466_1(index < allRawKeys.length); index++) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[467]++;
      var key = this.extractKey(allRawKeys[index]);
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[468]++;
      if (visit228_468_1(key)) {
        _$jscoverage['/impl/localPersistenceStore.js'].lineData[469]++;
        localStorage.removeItem(allRawKeys[index]);
      }
    }
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[472]++;
    return Promise.resolve();
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[475]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[24]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[476]++;
  var modExpression = deleteExpression;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[477]++;
  modExpression.fields = ['key'];
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[487]++;
  self.find(modExpression).then(function(searchResults) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[25]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[479]++;
  if (visit229_479_1(searchResults && searchResults.length)) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[480]++;
    var promises = searchResults.map(self._removeByKeyMapCallback('key'), self);
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[481]++;
    return Promise.all(promises);
  } else {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[483]++;
    return Promise.resolve();
  }
}).then(function() {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[26]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[486]++;
  resolve();
}).catch(function(err) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[27]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[488]++;
  reject(err);
});
});
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[503]++;
  LocalPersistenceStore.prototype._removeByKeyMapCallback = function(propertyName) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[28]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[504]++;
  var self = this;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[505]++;
  return function(element) {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[29]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[506]++;
  var valueToOperate;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[507]++;
  if (visit230_507_1(propertyName)) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[508]++;
    valueToOperate = element[propertyName];
  } else {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[510]++;
    valueToOperate = element;
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[512]++;
  return self.removeByKey(valueToOperate);
};
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[516]++;
  LocalPersistenceStore.prototype.keys = function() {
  _$jscoverage['/impl/localPersistenceStore.js'].functionData[30]++;
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[517]++;
  var allRawKeys = Object.keys(localStorage);
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[518]++;
  var allKeys = [];
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[519]++;
  for (var index = 0; visit231_519_1(index < allRawKeys.length); index++) {
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[520]++;
    var key = this.extractKey(allRawKeys[index]);
    _$jscoverage['/impl/localPersistenceStore.js'].lineData[521]++;
    if (visit232_521_1(key)) {
      _$jscoverage['/impl/localPersistenceStore.js'].lineData[522]++;
      allKeys.push(key);
    }
  }
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[525]++;
  return Promise.resolve(allKeys);
};
  _$jscoverage['/impl/localPersistenceStore.js'].lineData[528]++;
  return LocalPersistenceStore;
});
