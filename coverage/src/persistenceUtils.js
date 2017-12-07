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
if (! _$jscoverage['/persistenceUtils.js']) {
  _$jscoverage['/persistenceUtils.js'] = {};
  _$jscoverage['/persistenceUtils.js'].lineData = [];
  _$jscoverage['/persistenceUtils.js'].lineData[6] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[7] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[25] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[26] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[27] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[38] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[39] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[40] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[42] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[44] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[46] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[49] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[51] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[52] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[54] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[56] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[58] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[60] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[72] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[73] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[74] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[76] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[77] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[78] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[79] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[80] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[82] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[83] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[84] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[89] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[92] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[94] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[95] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[96] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[98] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[99] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[100] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[101] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[102] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[103] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[104] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[106] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[107] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[109] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[110] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[111] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[112] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[115] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[117] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[118] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[121] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[123] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[124] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[126] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[128] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[130] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[131] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[132] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[134] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[136] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[137] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[139] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[141] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[144] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[146] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[147] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[148] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[149] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[154] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[156] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[158] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[159] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[161] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[162] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[163] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[168] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[169] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[171] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[172] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[173] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[175] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[176] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[177] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[178] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[179] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[180] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[182] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[183] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[184] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[186] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[187] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[188] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[189] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[193] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[194] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[195] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[196] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[200] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[201] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[203] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[204] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[205] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[206] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[208] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[209] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[210] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[211] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[215] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[231] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[232] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[233] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[235] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[236] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[237] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[238] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[239] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[241] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[243] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[255] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[256] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[257] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[258] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[259] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[261] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[262] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[264] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[265] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[266] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[268] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[269] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[270] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[271] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[272] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[273] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[274] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[275] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[276] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[277] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[279] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[282] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[283] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[285] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[286] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[287] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[288] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[290] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[294] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[295] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[297] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[298] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[299] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[311] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[312] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[313] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[314] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[316] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[317] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[319] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[320] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[321] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[323] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[324] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[325] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[326] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[327] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[329] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[332] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[333] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[346] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[347] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[348] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[350] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[351] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[352] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[354] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[357] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[359] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[361] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[374] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[375] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[376] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[377] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[380] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[381] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[382] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[383] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[384] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[385] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[386] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[387] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[389] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[390] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[391] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[393] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[394] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[395] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[397] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[398] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[404] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[405] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[408] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[409] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[410] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[411] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[413] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[417] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[418] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[419] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[420] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[422] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[424] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[425] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[426] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[427] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[429] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[430] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[433] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[435] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[436] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[438] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[439] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[441] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[442] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[444] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[445] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[448] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[449] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[450] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[451] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[452] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[453] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[454] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[455] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[456] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[457] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[460] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[461] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[478] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[479] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[483] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[484] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[486] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[487] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[488] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[489] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[492] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[494] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[495] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[496] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[497] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[500] = 0;
  _$jscoverage['/persistenceUtils.js'].lineData[502] = 0;
}
if (! _$jscoverage['/persistenceUtils.js'].functionData) {
  _$jscoverage['/persistenceUtils.js'].functionData = [];
  _$jscoverage['/persistenceUtils.js'].functionData[0] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[1] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[2] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[3] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[4] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[5] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[6] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[7] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[8] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[9] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[10] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[11] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[12] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[13] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[14] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[15] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[16] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[17] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[18] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[19] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[20] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[21] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[22] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[23] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[24] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[25] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[26] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[27] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[28] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[29] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[30] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[31] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[32] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[33] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[34] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[35] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[36] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[37] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[38] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[39] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[40] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[41] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[42] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[43] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[44] = 0;
  _$jscoverage['/persistenceUtils.js'].functionData[45] = 0;
}
if (! _$jscoverage['/persistenceUtils.js'].branchData) {
  _$jscoverage['/persistenceUtils.js'].branchData = {};
  _$jscoverage['/persistenceUtils.js'].branchData['46'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['46'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['47'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['47'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['47'][2] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['48'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['48'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['58'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['58'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['59'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['59'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['73'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['73'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['84'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['84'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['84'][2] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['85'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['85'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['86'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['86'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['95'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['95'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['100'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['100'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['109'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['109'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['114'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['114'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['115'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['115'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['130'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['130'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['139'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['139'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['144'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['144'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['154'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['154'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['155'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['155'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['158'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['158'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['172'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['172'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['186'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['186'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['191'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['191'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['205'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['205'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['232'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['232'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['238'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['238'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['268'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['268'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['268'][2] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['270'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['270'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['272'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['272'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['288'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['288'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['288'][2] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['289'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['289'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['289'][2] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['323'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['323'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['325'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['325'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['350'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['350'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['351'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['351'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['376'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['376'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['384'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['384'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['386'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['386'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['390'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['390'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['390'][2] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['390'][3] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['393'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['393'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['394'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['394'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['410'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['410'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['410'][2] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['426'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['426'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['433'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['433'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['435'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['435'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['438'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['438'][1] = new BranchData();
  _$jscoverage['/persistenceUtils.js'].branchData['448'] = [];
  _$jscoverage['/persistenceUtils.js'].branchData['448'][1] = new BranchData();
}
_$jscoverage['/persistenceUtils.js'].branchData['448'][1].init(28, 28);
function visit607_448_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['448'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['438'][1].init(8, 6);
function visit606_438_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['438'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['435'][1].init(17, 30);
function visit605_435_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['435'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['433'][1].init(23, 44);
function visit604_433_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['433'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['426'][1].init(26, 29);
function visit603_426_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['426'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['410'][2].init(25, 33);
function visit602_410_2(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['410'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['410'][1].init(10, 48);
function visit601_410_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['410'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['394'][1].init(18, 43);
function visit600_394_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['394'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['393'][1].init(36, 31);
function visit599_393_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['393'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['390'][3].init(43, 45);
function visit598_390_3(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['390'][3].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['390'][2].init(14, 25);
function visit597_390_2(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['390'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['390'][1].init(14, 74);
function visit596_390_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['390'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['386'][1].init(12, 26);
function visit595_386_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['386'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['384'][1].init(37, 37);
function visit594_384_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['384'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['376'][1].init(8, 18);
function visit593_376_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['376'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['351'][1].init(12, 30);
function visit592_351_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['351'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['350'][1].init(10, 16);
function visit591_350_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['350'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['325'][1].init(15, 24);
function visit590_325_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['325'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['323'][1].init(8, 17);
function visit589_323_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['323'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['289'][2].init(29, 22);
function visit588_289_2(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['289'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['289'][1].init(9, 42);
function visit587_289_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['289'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['288'][2].init(10, 22);
function visit586_288_2(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['288'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['288'][1].init(10, 79);
function visit585_288_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['288'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['272'][1].init(15, 13);
function visit584_272_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['272'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['270'][1].init(15, 16);
function visit583_270_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['270'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['268'][2].init(21, 20);
function visit582_268_2(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['268'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['268'][1].init(8, 33);
function visit581_268_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['268'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['238'][1].init(8, 30);
function visit580_238_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['238'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['232'][1].init(8, 29);
function visit579_232_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['232'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['205'][1].init(30, 20);
function visit578_205_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['205'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['191'][1].init(19, 22);
function visit577_191_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['191'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['186'][1].init(16, 18);
function visit576_186_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['186'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['172'][1].init(8, 39);
function visit575_172_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['172'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['158'][1].init(14, 18);
function visit574_158_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['158'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['155'][1].init(8, 41);
function visit573_155_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['155'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['154'][1].init(8, 83);
function visit572_154_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['154'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['144'][1].init(9, 69);
function visit571_144_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['144'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['139'][1].init(9, 74);
function visit570_139_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['139'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['130'][1].init(8, 5);
function visit569_130_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['130'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['115'][1].init(15, 15);
function visit568_115_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['115'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['114'][1].init(15, 20);
function visit567_114_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['114'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['109'][1].init(12, 20);
function visit566_109_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['109'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['100'][1].init(8, 15);
function visit565_100_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['100'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['95'][1].init(11, 27);
function visit564_95_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['95'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['86'][1].init(8, 29);
function visit563_86_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['86'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['85'][1].init(8, 64);
function visit562_85_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['85'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['84'][2].init(10, 36);
function visit561_84_2(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['84'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['84'][1].init(10, 113);
function visit560_84_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['84'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['73'][1].init(8, 29);
function visit559_73_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['73'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['59'][1].init(12, 40);
function visit558_59_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['59'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['58'][1].init(12, 68);
function visit557_58_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['58'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['48'][1].init(7, 46);
function visit556_48_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['48'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['47'][2].init(7, 35);
function visit555_47_2(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['47'][2].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['47'][1].init(7, 93);
function visit554_47_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['47'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].branchData['46'][1].init(8, 117);
function visit553_46_1(result) {
  _$jscoverage['/persistenceUtils.js'].branchData['46'][1].ranCondition(result);
  return result;
}_$jscoverage['/persistenceUtils.js'].lineData[6]++;
define([], function() {
  _$jscoverage['/persistenceUtils.js'].functionData[0]++;
  _$jscoverage['/persistenceUtils.js'].lineData[7]++;
  'use strict';
  _$jscoverage['/persistenceUtils.js'].lineData[25]++;
  function isCachedResponse(response) {
    _$jscoverage['/persistenceUtils.js'].functionData[1]++;
    _$jscoverage['/persistenceUtils.js'].lineData[26]++;
    return response.headers.has('x-oracle-jscpt-cache-expiration-date');
  }
  _$jscoverage['/persistenceUtils.js'].lineData[27]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[38]++;
  function isGeneratedEtagResponse(response) {
    _$jscoverage['/persistenceUtils.js'].functionData[2]++;
    _$jscoverage['/persistenceUtils.js'].lineData[39]++;
    return response.headers.has('x-oracle-jscpt-etag-generated');
  }
  _$jscoverage['/persistenceUtils.js'].lineData[40]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[42]++;
  function _isTextPayload(headers) {
    _$jscoverage['/persistenceUtils.js'].functionData[3]++;
    _$jscoverage['/persistenceUtils.js'].lineData[44]++;
    var contentType = headers.get('Content-Type');
    _$jscoverage['/persistenceUtils.js'].lineData[46]++;
    if (visit553_46_1(contentType && (visit554_47_1(visit555_47_2(contentType.indexOf('text/') !== -1) || visit556_48_1(contentType.indexOf('application/json') !== -1))))) {
      _$jscoverage['/persistenceUtils.js'].lineData[49]++;
      return true;
    }
    _$jscoverage['/persistenceUtils.js'].lineData[51]++;
    return false;
  }
  _$jscoverage['/persistenceUtils.js'].lineData[52]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[54]++;
  function _isMultipartPayload(headers) {
    _$jscoverage['/persistenceUtils.js'].functionData[4]++;
    _$jscoverage['/persistenceUtils.js'].lineData[56]++;
    var contentType = headers.get('Content-Type');
    _$jscoverage['/persistenceUtils.js'].lineData[58]++;
    return (visit557_58_1(contentType && visit558_59_1(contentType.indexOf('multipart/') !== -1)));
  }
  _$jscoverage['/persistenceUtils.js'].lineData[60]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[72]++;
  function requestToJSON(request, options) {
    _$jscoverage['/persistenceUtils.js'].functionData[5]++;
    _$jscoverage['/persistenceUtils.js'].lineData[73]++;
    if (visit559_73_1(!options || !options._noClone)) {
      _$jscoverage['/persistenceUtils.js'].lineData[74]++;
      request = request.clone();
    }
    _$jscoverage['/persistenceUtils.js'].lineData[76]++;
    var requestObject = {};
    _$jscoverage['/persistenceUtils.js'].lineData[77]++;
    _copyProperties(request, requestObject, ['body', 'headers', 'signal']);
    _$jscoverage['/persistenceUtils.js'].lineData[78]++;
    requestObject['headers'] = _getHeaderValues(request.headers);
    _$jscoverage['/persistenceUtils.js'].lineData[79]++;
    return _copyPayload(request, requestObject);
  }
  _$jscoverage['/persistenceUtils.js'].lineData[80]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[82]++;
  function _copyProperties(sourceObj, targetObj, ignoreProps) {
    _$jscoverage['/persistenceUtils.js'].functionData[6]++;
    _$jscoverage['/persistenceUtils.js'].lineData[83]++;
    for (var k in sourceObj) {
      _$jscoverage['/persistenceUtils.js'].lineData[84]++;
      if (visit560_84_1(visit561_84_2(typeof (sourceObj[k]) !== 'function') && visit562_85_1(!_isPrivateProperty(k) && visit563_86_1(ignoreProps.indexOf(k) === -1)))) {
        _$jscoverage['/persistenceUtils.js'].lineData[89]++;
        targetObj[k] = sourceObj[k];
      }
    }
  }
  _$jscoverage['/persistenceUtils.js'].lineData[92]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[94]++;
  function _isPrivateProperty(property) {
    _$jscoverage['/persistenceUtils.js'].functionData[7]++;
    _$jscoverage['/persistenceUtils.js'].lineData[95]++;
    return visit564_95_1(property.indexOf('_') === 0);
  }
  _$jscoverage['/persistenceUtils.js'].lineData[96]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[98]++;
  function _getHeaderValues(headers) {
    _$jscoverage['/persistenceUtils.js'].functionData[8]++;
    _$jscoverage['/persistenceUtils.js'].lineData[99]++;
    var headersData = {};
    _$jscoverage['/persistenceUtils.js'].lineData[100]++;
    if (visit565_100_1(headers.entries)) {
      _$jscoverage['/persistenceUtils.js'].lineData[101]++;
      var headerEntriesIter = headers.entries();
      _$jscoverage['/persistenceUtils.js'].lineData[102]++;
      var headerEntry;
      _$jscoverage['/persistenceUtils.js'].lineData[103]++;
      var headerName;
      _$jscoverage['/persistenceUtils.js'].lineData[104]++;
      var headerValue;
      _$jscoverage['/persistenceUtils.js'].lineData[106]++;
      do {
        _$jscoverage['/persistenceUtils.js'].lineData[107]++;
        headerEntry = headerEntriesIter.next();
        _$jscoverage['/persistenceUtils.js'].lineData[109]++;
        if (visit566_109_1(headerEntry['value'])) {
          _$jscoverage['/persistenceUtils.js'].lineData[110]++;
          headerName = headerEntry['value'][0];
          _$jscoverage['/persistenceUtils.js'].lineData[111]++;
          headerValue = headerEntry['value'][1];
          _$jscoverage['/persistenceUtils.js'].lineData[112]++;
          headersData[headerName] = headerValue;
        }
      } while (visit567_114_1(!headerEntry['done']));
    } else {
      _$jscoverage['/persistenceUtils.js'].lineData[115]++;
      if (visit568_115_1(headers.forEach)) {
        _$jscoverage['/persistenceUtils.js'].lineData[117]++;
        headers.forEach(function(headerValue, headerName) {
  _$jscoverage['/persistenceUtils.js'].functionData[9]++;
  _$jscoverage['/persistenceUtils.js'].lineData[118]++;
  headersData[headerName] = headerValue;
});
      }
    }
    _$jscoverage['/persistenceUtils.js'].lineData[121]++;
    _addDateHeaderIfNull(headersData);
    _$jscoverage['/persistenceUtils.js'].lineData[123]++;
    return headersData;
  }
  _$jscoverage['/persistenceUtils.js'].lineData[124]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[126]++;
  function _addDateHeaderIfNull(headersData) {
    _$jscoverage['/persistenceUtils.js'].functionData[10]++;
    _$jscoverage['/persistenceUtils.js'].lineData[128]++;
    var date = headersData['date'];
    _$jscoverage['/persistenceUtils.js'].lineData[130]++;
    if (visit569_130_1(!date)) {
      _$jscoverage['/persistenceUtils.js'].lineData[131]++;
      date = (new Date()).toUTCString();
      _$jscoverage['/persistenceUtils.js'].lineData[132]++;
      headersData['date'] = date;
    }
  }
  _$jscoverage['/persistenceUtils.js'].lineData[134]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[136]++;
  function _copyPayload(source, targetObj) {
    _$jscoverage['/persistenceUtils.js'].functionData[11]++;
    _$jscoverage['/persistenceUtils.js'].lineData[137]++;
    targetObj.body = {};
    _$jscoverage['/persistenceUtils.js'].lineData[139]++;
    if (visit570_139_1((source instanceof Request) && _isMultipartPayload(source.headers))) {
      _$jscoverage['/persistenceUtils.js'].lineData[141]++;
      return _copyMultipartPayload(source, targetObj);
    }
    _$jscoverage['/persistenceUtils.js'].lineData[144]++;
    if (visit571_144_1((source instanceof Request) || _isTextPayload(source.headers))) {
      _$jscoverage['/persistenceUtils.js'].lineData[146]++;
      return new Promise(function(resolve, reject) {
  _$jscoverage['/persistenceUtils.js'].functionData[12]++;
  _$jscoverage['/persistenceUtils.js'].lineData[147]++;
  source.text().then(function(text) {
  _$jscoverage['/persistenceUtils.js'].functionData[13]++;
  _$jscoverage['/persistenceUtils.js'].lineData[148]++;
  targetObj.body.text = text;
  _$jscoverage['/persistenceUtils.js'].lineData[149]++;
  resolve(targetObj);
});
});
    }
    _$jscoverage['/persistenceUtils.js'].lineData[154]++;
    if (visit572_154_1(!(source instanceof Request) && visit573_155_1(typeof (source.arrayBuffer) === 'function'))) {
      _$jscoverage['/persistenceUtils.js'].lineData[156]++;
      return new Promise(function(resolve, reject) {
  _$jscoverage['/persistenceUtils.js'].functionData[14]++;
  _$jscoverage['/persistenceUtils.js'].lineData[162]++;
  source.arrayBuffer().then(function(aBuffer) {
  _$jscoverage['/persistenceUtils.js'].functionData[15]++;
  _$jscoverage['/persistenceUtils.js'].lineData[158]++;
  if (visit574_158_1(aBuffer.length > 0)) {
    _$jscoverage['/persistenceUtils.js'].lineData[159]++;
    targetObj.body.arrayBuffer = aBuffer;
  }
  _$jscoverage['/persistenceUtils.js'].lineData[161]++;
  resolve(targetObj);
}).catch(function(abError) {
  _$jscoverage['/persistenceUtils.js'].functionData[16]++;
  _$jscoverage['/persistenceUtils.js'].lineData[163]++;
  reject(abError);
});
});
    }
    _$jscoverage['/persistenceUtils.js'].lineData[168]++;
    return Promise.reject(new Error({
  message: 'payload body type is not supported'}));
  }
  _$jscoverage['/persistenceUtils.js'].lineData[169]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[171]++;
  function _copyMultipartPayload(request, targetObj) {
    _$jscoverage['/persistenceUtils.js'].functionData[17]++;
    _$jscoverage['/persistenceUtils.js'].lineData[172]++;
    if (visit575_172_1(typeof (request.formData) === 'function')) {
      _$jscoverage['/persistenceUtils.js'].lineData[173]++;
      return new Promise(function(resolve, reject) {
  _$jscoverage['/persistenceUtils.js'].functionData[18]++;
  _$jscoverage['/persistenceUtils.js'].lineData[195]++;
  request.formData().then(function(formData) {
  _$jscoverage['/persistenceUtils.js'].functionData[19]++;
  _$jscoverage['/persistenceUtils.js'].lineData[175]++;
  var formDataPairObject = {};
  _$jscoverage['/persistenceUtils.js'].lineData[176]++;
  var formDataIter = formData.entries();
  _$jscoverage['/persistenceUtils.js'].lineData[177]++;
  var formDataEntry;
  _$jscoverage['/persistenceUtils.js'].lineData[178]++;
  var formDataEntryValue;
  _$jscoverage['/persistenceUtils.js'].lineData[179]++;
  var formDataName;
  _$jscoverage['/persistenceUtils.js'].lineData[180]++;
  var formDataValue;
  _$jscoverage['/persistenceUtils.js'].lineData[182]++;
  do {
    _$jscoverage['/persistenceUtils.js'].lineData[183]++;
    formDataEntry = formDataIter.next();
    _$jscoverage['/persistenceUtils.js'].lineData[184]++;
    formDataEntryValue = formDataEntry['value'];
    _$jscoverage['/persistenceUtils.js'].lineData[186]++;
    if (visit576_186_1(formDataEntryValue)) {
      _$jscoverage['/persistenceUtils.js'].lineData[187]++;
      formDataName = formDataEntryValue[0];
      _$jscoverage['/persistenceUtils.js'].lineData[188]++;
      formDataValue = formDataEntryValue[1];
      _$jscoverage['/persistenceUtils.js'].lineData[189]++;
      formDataPairObject[formDataName] = formDataValue;
    }
  } while (visit577_191_1(!formDataEntry['done']));
  _$jscoverage['/persistenceUtils.js'].lineData[193]++;
  targetObj.body.formData = formDataPairObject;
  _$jscoverage['/persistenceUtils.js'].lineData[194]++;
  resolve(targetObj);
}).catch(function(err) {
  _$jscoverage['/persistenceUtils.js'].functionData[20]++;
  _$jscoverage['/persistenceUtils.js'].lineData[196]++;
  reject(err);
});
});
    } else {
      _$jscoverage['/persistenceUtils.js'].lineData[200]++;
      var contentType = request.headers.get('Content-Type');
      _$jscoverage['/persistenceUtils.js'].lineData[201]++;
      return new Promise(function(resolve, reject) {
  _$jscoverage['/persistenceUtils.js'].functionData[21]++;
  _$jscoverage['/persistenceUtils.js'].lineData[210]++;
  request.text().then(function(text) {
  _$jscoverage['/persistenceUtils.js'].functionData[22]++;
  _$jscoverage['/persistenceUtils.js'].lineData[203]++;
  var parts = parseMultipartFormData(text, contentType);
  _$jscoverage['/persistenceUtils.js'].lineData[204]++;
  var formDataPairObject = {};
  _$jscoverage['/persistenceUtils.js'].lineData[205]++;
  for (var index = 0; visit578_205_1(index < parts.length); index++) {
    _$jscoverage['/persistenceUtils.js'].lineData[206]++;
    formDataPairObject[parts[index].headers.name] = parts[index].data;
  }
  _$jscoverage['/persistenceUtils.js'].lineData[208]++;
  targetObj.body.formData = formDataPairObject;
  _$jscoverage['/persistenceUtils.js'].lineData[209]++;
  resolve(targetObj);
}).catch(function(err) {
  _$jscoverage['/persistenceUtils.js'].functionData[23]++;
  _$jscoverage['/persistenceUtils.js'].lineData[211]++;
  reject(err);
});
});
    }
  }
  _$jscoverage['/persistenceUtils.js'].lineData[215]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[231]++;
  function responseToJSON(response, options) {
    _$jscoverage['/persistenceUtils.js'].functionData[24]++;
    _$jscoverage['/persistenceUtils.js'].lineData[232]++;
    if (visit579_232_1(!options || !options._noClone)) {
      _$jscoverage['/persistenceUtils.js'].lineData[233]++;
      response = response.clone();
    }
    _$jscoverage['/persistenceUtils.js'].lineData[235]++;
    var responseObject = {};
    _$jscoverage['/persistenceUtils.js'].lineData[236]++;
    _copyProperties(response, responseObject, ['body', 'headers']);
    _$jscoverage['/persistenceUtils.js'].lineData[237]++;
    responseObject['headers'] = _getHeaderValues(response.headers);
    _$jscoverage['/persistenceUtils.js'].lineData[238]++;
    if (visit580_238_1(options && options.excludeBody)) {
      _$jscoverage['/persistenceUtils.js'].lineData[239]++;
      return Promise.resolve(responseObject);
    } else {
      _$jscoverage['/persistenceUtils.js'].lineData[241]++;
      return _copyPayload(response, responseObject);
    }
  }
  _$jscoverage['/persistenceUtils.js'].lineData[243]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[255]++;
  function requestFromJSON(data) {
    _$jscoverage['/persistenceUtils.js'].functionData[25]++;
    _$jscoverage['/persistenceUtils.js'].lineData[256]++;
    var initFromData = {};
    _$jscoverage['/persistenceUtils.js'].lineData[257]++;
    _copyProperties(data, initFromData, ['headers', 'body', 'signal']);
    _$jscoverage['/persistenceUtils.js'].lineData[258]++;
    var skipContentType = _copyPayloadFromJsonObj(data, initFromData);
    _$jscoverage['/persistenceUtils.js'].lineData[259]++;
    initFromData.headers = _createHeadersFromJsonObj(data, skipContentType);
    _$jscoverage['/persistenceUtils.js'].lineData[261]++;
    return _createRequestFromJsonObj(data, initFromData);
  }
  _$jscoverage['/persistenceUtils.js'].lineData[262]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[264]++;
  function _copyPayloadFromJsonObj(data, targetObj) {
    _$jscoverage['/persistenceUtils.js'].functionData[26]++;
    _$jscoverage['/persistenceUtils.js'].lineData[265]++;
    var skipContentType = false;
    _$jscoverage['/persistenceUtils.js'].lineData[266]++;
    var body = data.body;
    _$jscoverage['/persistenceUtils.js'].lineData[268]++;
    if (visit581_268_1(body.text && visit582_268_2(body.text.length > 0))) {
      _$jscoverage['/persistenceUtils.js'].lineData[269]++;
      targetObj.body = body.text;
    } else {
      _$jscoverage['/persistenceUtils.js'].lineData[270]++;
      if (visit583_270_1(body.arrayBuffer)) {
        _$jscoverage['/persistenceUtils.js'].lineData[271]++;
        targetObj.body = body.arrayBuffer;
      } else {
        _$jscoverage['/persistenceUtils.js'].lineData[272]++;
        if (visit584_272_1(body.formData)) {
          _$jscoverage['/persistenceUtils.js'].lineData[273]++;
          skipContentType = true;
          _$jscoverage['/persistenceUtils.js'].lineData[274]++;
          var formData = new FormData();
          _$jscoverage['/persistenceUtils.js'].lineData[275]++;
          var formPairs = body.formData;
          _$jscoverage['/persistenceUtils.js'].lineData[276]++;
          Object.keys(formPairs).forEach(function(pairkey) {
  _$jscoverage['/persistenceUtils.js'].functionData[27]++;
  _$jscoverage['/persistenceUtils.js'].lineData[277]++;
  formData.append(pairkey, formPairs[pairkey]);
});
          _$jscoverage['/persistenceUtils.js'].lineData[279]++;
          targetObj.body = formData;
        }
      }
    }
    _$jscoverage['/persistenceUtils.js'].lineData[282]++;
    return skipContentType;
  }
  _$jscoverage['/persistenceUtils.js'].lineData[283]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[285]++;
  function _createHeadersFromJsonObj(data, skipContentType) {
    _$jscoverage['/persistenceUtils.js'].functionData[28]++;
    _$jscoverage['/persistenceUtils.js'].lineData[286]++;
    var headers = new Headers();
    _$jscoverage['/persistenceUtils.js'].lineData[287]++;
    Object.keys(data.headers).forEach(function(key) {
  _$jscoverage['/persistenceUtils.js'].functionData[29]++;
  _$jscoverage['/persistenceUtils.js'].lineData[288]++;
  if (visit585_288_1(visit586_288_2(key !== 'content-type') || (visit587_289_1(!skipContentType && visit588_289_2(key === 'content-type'))))) {
    _$jscoverage['/persistenceUtils.js'].lineData[290]++;
    headers.append(key, data.headers[key]);
  }
});
    _$jscoverage['/persistenceUtils.js'].lineData[294]++;
    return headers;
  }
  _$jscoverage['/persistenceUtils.js'].lineData[295]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[297]++;
  function _createRequestFromJsonObj(data, initFromData) {
    _$jscoverage['/persistenceUtils.js'].functionData[30]++;
    _$jscoverage['/persistenceUtils.js'].lineData[298]++;
    return Promise.resolve(new Request(data.url, initFromData));
  }
  _$jscoverage['/persistenceUtils.js'].lineData[299]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[311]++;
  function responseFromJSON(data) {
    _$jscoverage['/persistenceUtils.js'].functionData[31]++;
    _$jscoverage['/persistenceUtils.js'].lineData[312]++;
    var initFromData = {};
    _$jscoverage['/persistenceUtils.js'].lineData[313]++;
    _copyProperties(data, initFromData, ['headers', 'body']);
    _$jscoverage['/persistenceUtils.js'].lineData[314]++;
    initFromData.headers = _createHeadersFromJsonObj(data, false);
    _$jscoverage['/persistenceUtils.js'].lineData[316]++;
    return _createResponseFromJsonObj(data, initFromData);
  }
  _$jscoverage['/persistenceUtils.js'].lineData[317]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[319]++;
  function _createResponseFromJsonObj(data, initFromData) {
    _$jscoverage['/persistenceUtils.js'].functionData[32]++;
    _$jscoverage['/persistenceUtils.js'].lineData[320]++;
    var response;
    _$jscoverage['/persistenceUtils.js'].lineData[321]++;
    var body = data.body;
    _$jscoverage['/persistenceUtils.js'].lineData[323]++;
    if (visit589_323_1(body && body.text)) {
      _$jscoverage['/persistenceUtils.js'].lineData[324]++;
      response = new Response(body.text, initFromData);
    } else {
      _$jscoverage['/persistenceUtils.js'].lineData[325]++;
      if (visit590_325_1(body && body.arrayBuffer)) {
        _$jscoverage['/persistenceUtils.js'].lineData[326]++;
        initFromData.responseType = 'blob';
        _$jscoverage['/persistenceUtils.js'].lineData[327]++;
        response = new Response(body.arrayBuffer, initFromData);
      } else {
        _$jscoverage['/persistenceUtils.js'].lineData[329]++;
        response = new Response(null, initFromData);
      }
    }
    _$jscoverage['/persistenceUtils.js'].lineData[332]++;
    return Promise.resolve(response);
  }
  _$jscoverage['/persistenceUtils.js'].lineData[333]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[346]++;
  function setResponsePayload(response, payload) {
    _$jscoverage['/persistenceUtils.js'].functionData[33]++;
    _$jscoverage['/persistenceUtils.js'].lineData[347]++;
    return responseToJSON(response).then(function(responseObject) {
  _$jscoverage['/persistenceUtils.js'].functionData[34]++;
  _$jscoverage['/persistenceUtils.js'].lineData[348]++;
  var body = responseObject.body;
  _$jscoverage['/persistenceUtils.js'].lineData[350]++;
  if (visit591_350_1(body.arrayBuffer)) {
    _$jscoverage['/persistenceUtils.js'].lineData[351]++;
    if (visit592_351_1(payload instanceof ArrayBuffer)) {
      _$jscoverage['/persistenceUtils.js'].lineData[352]++;
      body.arrayBuffer = payload;
    } else {
      _$jscoverage['/persistenceUtils.js'].lineData[354]++;
      throw new Error({
  message: 'unexpected payload'});
    }
  } else {
    _$jscoverage['/persistenceUtils.js'].lineData[357]++;
    body.text = JSON.stringify(payload);
  }
  _$jscoverage['/persistenceUtils.js'].lineData[359]++;
  return responseFromJSON(responseObject);
});
  }
  _$jscoverage['/persistenceUtils.js'].lineData[361]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[374]++;
  function parseMultipartFormData(origbody, contentType) {
    _$jscoverage['/persistenceUtils.js'].functionData[35]++;
    _$jscoverage['/persistenceUtils.js'].lineData[375]++;
    var contentTypePrased = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    _$jscoverage['/persistenceUtils.js'].lineData[376]++;
    if (visit593_376_1(!contentTypePrased)) {
      _$jscoverage['/persistenceUtils.js'].lineData[377]++;
      throw new Error("not a valid multipart form data value.");
    }
    _$jscoverage['/persistenceUtils.js'].lineData[380]++;
    var parseHeader = function(headerpart) {
  _$jscoverage['/persistenceUtils.js'].functionData[36]++;
  _$jscoverage['/persistenceUtils.js'].lineData[381]++;
  var parsedHeaders = {};
  _$jscoverage['/persistenceUtils.js'].lineData[382]++;
  var headers = {};
  _$jscoverage['/persistenceUtils.js'].lineData[383]++;
  var headerparts = headerpart.split('\r\n');
  _$jscoverage['/persistenceUtils.js'].lineData[384]++;
  for (var hearderpartindex = 0; visit594_384_1(hearderpartindex < headerparts.length); hearderpartindex++) {
    _$jscoverage['/persistenceUtils.js'].lineData[385]++;
    var headersubpart = headerparts[hearderpartindex];
    _$jscoverage['/persistenceUtils.js'].lineData[386]++;
    if (visit595_386_1(headersubpart.length === 0)) {
      _$jscoverage['/persistenceUtils.js'].lineData[387]++;
      continue;
    } else {
      _$jscoverage['/persistenceUtils.js'].lineData[389]++;
      var hearderitems = headersubpart.split(';');
      _$jscoverage['/persistenceUtils.js'].lineData[390]++;
      if (visit596_390_1(visit597_390_2(hearderitems.length === 1) && visit598_390_3(hearderitems[0].indexOf('Content-Type') === 0))) {
        _$jscoverage['/persistenceUtils.js'].lineData[391]++;
        parsedHeaders.contentType = hearderitems[0].split(':')[1].trim();
      } else {
        _$jscoverage['/persistenceUtils.js'].lineData[393]++;
        for (var itemindex = 0; visit599_393_1(itemindex < hearderitems.length); itemindex++) {
          _$jscoverage['/persistenceUtils.js'].lineData[394]++;
          if (visit600_394_1(hearderitems[itemindex].indexOf('=') === -1)) {
            _$jscoverage['/persistenceUtils.js'].lineData[395]++;
            continue;
          } else {
            _$jscoverage['/persistenceUtils.js'].lineData[397]++;
            var itempair = hearderitems[itemindex].split('=');
            _$jscoverage['/persistenceUtils.js'].lineData[398]++;
            headers[itempair[0].trim()] = itempair[1].substring(1, itempair[1].length - 1);
          }
        }
      }
    }
  }
  _$jscoverage['/persistenceUtils.js'].lineData[404]++;
  parsedHeaders.headers = headers;
  _$jscoverage['/persistenceUtils.js'].lineData[405]++;
  return parsedHeaders;
};
    _$jscoverage['/persistenceUtils.js'].lineData[408]++;
    var parseData = function(datapart, contentType) {
  _$jscoverage['/persistenceUtils.js'].functionData[37]++;
  _$jscoverage['/persistenceUtils.js'].lineData[409]++;
  var dataparts = datapart.split('\r\n');
  _$jscoverage['/persistenceUtils.js'].lineData[410]++;
  if (visit601_410_1(contentType && visit602_410_2(contentType.indexOf('image') >= 0))) {
    _$jscoverage['/persistenceUtils.js'].lineData[411]++;
    return textToBlob(dataparts[0], contentType);
  } else {
    _$jscoverage['/persistenceUtils.js'].lineData[413]++;
    return dataparts[0];
  }
};
    _$jscoverage['/persistenceUtils.js'].lineData[417]++;
    var textToBlob = function(text, contentType) {
  _$jscoverage['/persistenceUtils.js'].functionData[38]++;
  _$jscoverage['/persistenceUtils.js'].lineData[418]++;
  var byteCharacters = null;
  _$jscoverage['/persistenceUtils.js'].lineData[419]++;
  try {
    _$jscoverage['/persistenceUtils.js'].lineData[420]++;
    byteCharacters = atob(text);
  }  catch (err) {
  _$jscoverage['/persistenceUtils.js'].lineData[422]++;
  return null;
}
  _$jscoverage['/persistenceUtils.js'].lineData[424]++;
  var arrayBuffer = new ArrayBuffer(byteCharacters.length);
  _$jscoverage['/persistenceUtils.js'].lineData[425]++;
  var bytes = new Uint8Array(arrayBuffer);
  _$jscoverage['/persistenceUtils.js'].lineData[426]++;
  for (var index = 0; visit603_426_1(index < byteCharacters.length); index++) {
    _$jscoverage['/persistenceUtils.js'].lineData[427]++;
    bytes[index] = byteCharacters.charCodeAt(index);
  }
  _$jscoverage['/persistenceUtils.js'].lineData[429]++;
  var blob = new Blob([arrayBuffer], {
  type: contentType});
  _$jscoverage['/persistenceUtils.js'].lineData[430]++;
  return blob;
};
    _$jscoverage['/persistenceUtils.js'].lineData[433]++;
    var boundaryText = visit604_433_1(contentTypePrased[1] || contentTypePrased[2]);
    _$jscoverage['/persistenceUtils.js'].lineData[435]++;
    var isText = visit605_435_1(typeof (origbody) === 'string');
    _$jscoverage['/persistenceUtils.js'].lineData[436]++;
    var bodyText;
    _$jscoverage['/persistenceUtils.js'].lineData[438]++;
    if (visit606_438_1(isText)) {
      _$jscoverage['/persistenceUtils.js'].lineData[439]++;
      bodyText = origbody;
    } else {
      _$jscoverage['/persistenceUtils.js'].lineData[441]++;
      var view = new Uint8Array(origbody);
      _$jscoverage['/persistenceUtils.js'].lineData[442]++;
      bodyText = String.fromCharCode.apply(null, view);
    }
    _$jscoverage['/persistenceUtils.js'].lineData[444]++;
    var parts = bodyText.split(new RegExp(boundaryText));
    _$jscoverage['/persistenceUtils.js'].lineData[445]++;
    var partsPairArray = [];
    _$jscoverage['/persistenceUtils.js'].lineData[448]++;
    for (var partIndex = 1; visit607_448_1(partIndex < parts.length - 1); partIndex++) {
      _$jscoverage['/persistenceUtils.js'].lineData[449]++;
      var partPair = {};
      _$jscoverage['/persistenceUtils.js'].lineData[450]++;
      var part = parts[partIndex];
      _$jscoverage['/persistenceUtils.js'].lineData[451]++;
      var subparts = part.split('\r\n\r\n');
      _$jscoverage['/persistenceUtils.js'].lineData[452]++;
      var headerpart = subparts[0];
      _$jscoverage['/persistenceUtils.js'].lineData[453]++;
      var datapart = subparts[1];
      _$jscoverage['/persistenceUtils.js'].lineData[454]++;
      var parsedHeader = parseHeader(headerpart);
      _$jscoverage['/persistenceUtils.js'].lineData[455]++;
      partPair.headers = parsedHeader.headers;
      _$jscoverage['/persistenceUtils.js'].lineData[456]++;
      partPair.data = parseData(datapart, parsedHeader.contentType);
      _$jscoverage['/persistenceUtils.js'].lineData[457]++;
      partsPairArray.push(partPair);
    }
    _$jscoverage['/persistenceUtils.js'].lineData[460]++;
    return partsPairArray;
  }
  _$jscoverage['/persistenceUtils.js'].lineData[461]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[478]++;
  function buildEndpointKey(request) {
    _$jscoverage['/persistenceUtils.js'].functionData[39]++;
    _$jscoverage['/persistenceUtils.js'].lineData[479]++;
    var endPointKeyObj = {
  url: request.url, 
  id: Math.random().toString(36).replace(/[^a-z]+/g, '')};
    _$jscoverage['/persistenceUtils.js'].lineData[483]++;
    return JSON.stringify(endPointKeyObj);
  }
  _$jscoverage['/persistenceUtils.js'].lineData[484]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[486]++;
  function _cloneRequest(request) {
    _$jscoverage['/persistenceUtils.js'].functionData[40]++;
    _$jscoverage['/persistenceUtils.js'].lineData[487]++;
    return requestToJSON(request, {
  _noClone: true}).then(function(requestJson) {
  _$jscoverage['/persistenceUtils.js'].functionData[41]++;
  _$jscoverage['/persistenceUtils.js'].lineData[488]++;
  return requestFromJSON(requestJson).then(function(requestClone) {
  _$jscoverage['/persistenceUtils.js'].functionData[42]++;
  _$jscoverage['/persistenceUtils.js'].lineData[489]++;
  return requestClone;
});
});
  }
  _$jscoverage['/persistenceUtils.js'].lineData[492]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[494]++;
  function _cloneResponse(response) {
    _$jscoverage['/persistenceUtils.js'].functionData[43]++;
    _$jscoverage['/persistenceUtils.js'].lineData[495]++;
    return responseToJSON(response, {
  _noClone: true}).then(function(responseJson) {
  _$jscoverage['/persistenceUtils.js'].functionData[44]++;
  _$jscoverage['/persistenceUtils.js'].lineData[496]++;
  return responseFromJSON(responseJson).then(function(responseClone) {
  _$jscoverage['/persistenceUtils.js'].functionData[45]++;
  _$jscoverage['/persistenceUtils.js'].lineData[497]++;
  return responseClone;
});
});
  }
  _$jscoverage['/persistenceUtils.js'].lineData[500]++;
  ;
  _$jscoverage['/persistenceUtils.js'].lineData[502]++;
  return {
  requestToJSON: requestToJSON, 
  requestFromJSON: requestFromJSON, 
  responseToJSON: responseToJSON, 
  responseFromJSON: responseFromJSON, 
  setResponsePayload: setResponsePayload, 
  parseMultipartFormData: parseMultipartFormData, 
  isCachedResponse: isCachedResponse, 
  isGeneratedEtagResponse: isGeneratedEtagResponse, 
  _isTextPayload: _isTextPayload, 
  buildEndpointKey: buildEndpointKey, 
  _cloneRequest: _cloneRequest, 
  _cloneResponse: _cloneResponse};
});
