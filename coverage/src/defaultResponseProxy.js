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
if (! _$jscoverage['/defaultResponseProxy.js']) {
  _$jscoverage['/defaultResponseProxy.js'] = {};
  _$jscoverage['/defaultResponseProxy.js'].lineData = [];
  _$jscoverage['/defaultResponseProxy.js'].lineData[6] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[10] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[20] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[21] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[23] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[24] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[26] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[27] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[29] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[31] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[32] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[34] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[35] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[37] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[38] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[40] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[41] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[43] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[44] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[46] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[47] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[49] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[50] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[52] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[55] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[97] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[98] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[99] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[110] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[111] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[112] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[113] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[115] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[117] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[118] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[119] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[136] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[137] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[138] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[139] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[141] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[142] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[143] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[144] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[146] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[147] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[149] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[150] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[152] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[155] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[156] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[158] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[160] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[163] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[165] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[166] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[167] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[168] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[169] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[170] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[172] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[173] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[179] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[180] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[181] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[182] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[184] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[185] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[186] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[187] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[188] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[189] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[190] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[191] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[192] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[193] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[194] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[195] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[196] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[197] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[199] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[200] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[214] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[215] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[218] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[219] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[220] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[221] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[223] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[225] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[239] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[240] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[243] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[244] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[245] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[247] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[249] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[250] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[251] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[254] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[268] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[269] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[284] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[285] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[300] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[301] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[304] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[305] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[306] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[307] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[310] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[311] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[313] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[316] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[318] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[319] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[321] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[322] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[326] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[328] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[330] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[331] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[336] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[337] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[338] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[339] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[340] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[343] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[344] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[346] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[347] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[348] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[349] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[350] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[351] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[354] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[355] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[359] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[373] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[374] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[389] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[390] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[393] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[394] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[395] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[396] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[399] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[400] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[402] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[405] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[407] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[408] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[410] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[411] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[415] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[417] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[419] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[420] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[421] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[426] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[427] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[428] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[429] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[430] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[431] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[436] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[438] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[440] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[442] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[445] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[446] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[447] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[449] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[450] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[451] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[453] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[454] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[455] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[456] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[457] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[468] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[473] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[475] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[476] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[477] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[481] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[482] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[485] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[486] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[488] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[492] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[494] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[495] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[496] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[497] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[499] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[500] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[501] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[503] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[504] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[506] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[508] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[510] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[511] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[513] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[515] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[516] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[518] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[519] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[520] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[522] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[523] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[527] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[528] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[530] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[533] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[537] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[538] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[540] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[544] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[546] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[547] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[549] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[551] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[553] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[556] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[557] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[558] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[561] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[563] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[564] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[565] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[566] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[567] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[570] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[571] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[573] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[574] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[576] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[577] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[579] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[582] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[583] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[584] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[587] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[589] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[590] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[591] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[592] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[593] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[595] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[597] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[600] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[602] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[603] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[606] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[610] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[611] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[612] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[613] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[616] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[617] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[621] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[624] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[626] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[628] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[629] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[632] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[634] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[635] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[637] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[639] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[640] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[643] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[645] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[646] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[649] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[651] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[652] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[654] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[656] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[657] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[660] = 0;
  _$jscoverage['/defaultResponseProxy.js'].lineData[662] = 0;
}
if (! _$jscoverage['/defaultResponseProxy.js'].functionData) {
  _$jscoverage['/defaultResponseProxy.js'].functionData = [];
  _$jscoverage['/defaultResponseProxy.js'].functionData[0] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[1] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[2] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[3] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[4] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[5] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[6] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[7] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[8] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[9] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[10] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[11] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[12] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[13] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[14] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[15] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[16] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[17] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[18] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[19] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[20] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[21] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[22] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[23] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[24] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[25] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[26] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[27] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[28] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[29] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[30] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[31] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[32] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[33] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[34] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[35] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[36] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[37] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[38] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[39] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[40] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[41] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[42] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[43] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[44] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[45] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[46] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[47] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[48] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[49] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[50] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[51] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[52] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[53] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[54] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[55] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[56] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[57] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[58] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[59] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[60] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[61] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[62] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[63] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[64] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[65] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[66] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[67] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[68] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[69] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[70] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[71] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[72] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[73] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[74] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[75] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[76] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[77] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[78] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[79] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[80] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[81] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[82] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[83] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[84] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[85] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[86] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[87] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[88] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[89] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[90] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[91] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[92] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[93] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[94] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[95] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[96] = 0;
  _$jscoverage['/defaultResponseProxy.js'].functionData[97] = 0;
}
if (! _$jscoverage['/defaultResponseProxy.js'].branchData) {
  _$jscoverage['/defaultResponseProxy.js'].branchData = {};
  _$jscoverage['/defaultResponseProxy.js'].branchData['21'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['21'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['23'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['23'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['26'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['26'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['29'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['29'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['31'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['31'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['34'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['34'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['37'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['37'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['40'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['40'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['43'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['43'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['46'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['46'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['49'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['49'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['146'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['146'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['149'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['149'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['156'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['156'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['184'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['184'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['186'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['186'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['188'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['188'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['190'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['190'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['192'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['192'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['194'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['194'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['196'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['196'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['219'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['219'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['306'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['306'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['310'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['310'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['318'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['318'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['346'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['346'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['395'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['395'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['399'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['399'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['407'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['407'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['440'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['440'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['440'][2] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['445'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['445'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['447'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['447'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['453'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['453'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['481'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['481'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['501'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['501'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['501'][2] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['502'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['502'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['511'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['511'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['520'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['520'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['520'][2] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['521'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['521'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['523'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['523'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['549'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['549'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['576'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['576'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['597'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['597'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['597'][2] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['598'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['598'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['598'][2] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['599'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['599'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['602'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['602'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['634'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['634'][1] = new BranchData();
  _$jscoverage['/defaultResponseProxy.js'].branchData['651'] = [];
  _$jscoverage['/defaultResponseProxy.js'].branchData['651'][1] = new BranchData();
}
_$jscoverage['/defaultResponseProxy.js'].branchData['651'][1].init(14, 24);
function visit73_651_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['651'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['634'][1].init(14, 24);
function visit72_634_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['634'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['602'][1].init(18, 27);
function visit71_602_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['602'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['599'][1].init(14, 25);
function visit70_599_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['599'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['598'][2].init(14, 24);
function visit69_598_2(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['598'][2].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['598'][1].init(14, 68);
function visit68_598_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['598'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['597'][2].init(16, 20);
function visit67_597_2(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['597'][2].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['597'][1].init(16, 107);
function visit66_597_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['597'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['576'][1].init(14, 27);
function visit65_576_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['576'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['549'][1].init(14, 12);
function visit64_549_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['549'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['523'][1].init(16, 10);
function visit63_523_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['523'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['521'][1].init(10, 24);
function visit62_521_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['521'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['520'][2].init(12, 23);
function visit61_520_2(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['520'][2].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['520'][1].init(12, 62);
function visit60_520_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['520'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['511'][1].init(10, 39);
function visit59_511_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['511'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['502'][1].init(8, 25);
function visit58_502_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['502'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['501'][2].init(10, 24);
function visit57_501_2(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['501'][2].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['501'][1].init(10, 62);
function visit56_501_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['501'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['481'][1].init(12, 21);
function visit55_481_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['481'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['453'][1].init(26, 3);
function visit54_453_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['453'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['447'][1].init(20, 16);
function visit53_447_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['447'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['445'][1].init(16, 12);
function visit52_445_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['445'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['440'][2].init(33, 82);
function visit51_440_2(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['440'][2].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['440'][1].init(16, 99);
function visit50_440_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['440'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['407'][1].init(16, 8);
function visit49_407_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['407'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['399'][1].init(16, 11);
function visit48_399_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['399'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['395'][1].init(10, 29);
function visit47_395_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['395'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['346'][1].init(14, 22);
function visit46_346_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['346'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['318'][1].init(16, 8);
function visit45_318_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['318'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['310'][1].init(16, 11);
function visit44_310_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['310'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['306'][1].init(10, 29);
function visit43_306_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['306'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['219'][1].init(10, 30);
function visit42_219_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['219'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['196'][1].init(17, 28);
function visit41_196_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['196'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['194'][1].init(17, 25);
function visit40_194_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['194'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['192'][1].init(17, 27);
function visit39_192_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['192'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['190'][1].init(17, 26);
function visit38_190_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['190'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['188'][1].init(17, 24);
function visit37_188_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['188'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['186'][1].init(17, 24);
function visit36_186_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['186'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['184'][1].init(10, 25);
function visit35_184_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['184'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['156'][1].init(14, 11);
function visit34_156_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['156'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['149'][1].init(14, 11);
function visit33_149_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['149'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['146'][1].init(14, 43);
function visit32_146_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['146'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['49'][1].init(10, 58);
function visit31_49_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['49'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['46'][1].init(10, 55);
function visit30_46_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['46'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['43'][1].init(10, 57);
function visit29_43_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['43'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['40'][1].init(10, 56);
function visit28_40_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['40'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['37'][1].init(10, 54);
function visit27_37_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['37'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['34'][1].init(10, 55);
function visit26_34_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['34'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['31'][1].init(10, 54);
function visit25_31_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['31'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['29'][1].init(39, 36);
function visit24_29_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['29'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['26'][1].init(10, 32);
function visit23_26_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['26'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['23'][1].init(10, 32);
function visit22_23_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['23'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].branchData['21'][1].init(16, 13);
function visit21_21_1(result) {
  _$jscoverage['/defaultResponseProxy.js'].branchData['21'][1].ranCondition(result);
  return result;
}_$jscoverage['/defaultResponseProxy.js'].lineData[6]++;
define(['./persistenceManager', './persistenceUtils', './fetchStrategies', './cacheStrategies', './persistenceStoreManager', './impl/defaultCacheHandler'], function(persistenceManager, persistenceUtils, fetchStrategies, cacheStrategies, persistenceStoreManager, cacheHandler) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[0]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[10]++;
  'use strict';
  _$jscoverage['/defaultResponseProxy.js'].lineData[20]++;
  function DefaultResponseProxy(options) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[1]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[21]++;
    options = visit21_21_1(options || {});
    _$jscoverage['/defaultResponseProxy.js'].lineData[23]++;
    if (visit22_23_1(options['fetchStrategy'] == null)) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[24]++;
      options['fetchStrategy'] = fetchStrategies.getCacheIfOfflineStrategy();
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[26]++;
    if (visit23_26_1(options['cacheStrategy'] == null)) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[27]++;
      options['cacheStrategy'] = cacheStrategies.getHttpCacheHeaderStrategy();
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[29]++;
    options.requestHandlerOverride = visit24_29_1(options.requestHandlerOverride || {});
    _$jscoverage['/defaultResponseProxy.js'].lineData[31]++;
    if (visit25_31_1(options['requestHandlerOverride']['handleGet'] == null)) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[32]++;
      options['requestHandlerOverride']['handleGet'] = this.handleGet;
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[34]++;
    if (visit26_34_1(options['requestHandlerOverride']['handlePost'] == null)) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[35]++;
      options['requestHandlerOverride']['handlePost'] = this.handlePost;
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[37]++;
    if (visit27_37_1(options['requestHandlerOverride']['handlePut'] == null)) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[38]++;
      options['requestHandlerOverride']['handlePut'] = this.handlePut;
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[40]++;
    if (visit28_40_1(options['requestHandlerOverride']['handlePatch'] == null)) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[41]++;
      options['requestHandlerOverride']['handlePatch'] = this.handlePatch;
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[43]++;
    if (visit29_43_1(options['requestHandlerOverride']['handleDelete'] == null)) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[44]++;
      options['requestHandlerOverride']['handleDelete'] = this.handleDelete;
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[46]++;
    if (visit30_46_1(options['requestHandlerOverride']['handleHead'] == null)) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[47]++;
      options['requestHandlerOverride']['handleHead'] = this.handleHead;
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[49]++;
    if (visit31_49_1(options['requestHandlerOverride']['handleOptions'] == null)) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[50]++;
      options['requestHandlerOverride']['handleOptions'] = this.handleOptions;
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[52]++;
    Object.defineProperty(this, '_options', {
  value: options});
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[55]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[97]++;
  function getResponseProxy(options) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[2]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[98]++;
    return new DefaultResponseProxy(options);
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[99]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[110]++;
  DefaultResponseProxy.prototype.getFetchEventListener = function() {
  _$jscoverage['/defaultResponseProxy.js'].functionData[3]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[111]++;
  var self = this;
  _$jscoverage['/defaultResponseProxy.js'].lineData[112]++;
  return function(event) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[4]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[113]++;
  event.respondWith(new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[5]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[118]++;
  self.processRequest(event.request).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[6]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[115]++;
  resolve(response);
}, function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[7]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[117]++;
  reject(err);
}).catch(function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[8]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[119]++;
  reject(err);
});
}));
};
};
  _$jscoverage['/defaultResponseProxy.js'].lineData[136]++;
  DefaultResponseProxy.prototype.processRequest = function(request) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[9]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[137]++;
  var self = this;
  _$jscoverage['/defaultResponseProxy.js'].lineData[138]++;
  var endpointKey = persistenceUtils.buildEndpointKey(request);
  _$jscoverage['/defaultResponseProxy.js'].lineData[139]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[10]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[141]++;
  cacheHandler.registerEndpointOptions(endpointKey, self._options);
  _$jscoverage['/defaultResponseProxy.js'].lineData[142]++;
  var requestHandler = _getRequestHandler(self, request);
  _$jscoverage['/defaultResponseProxy.js'].lineData[143]++;
  var localVars = {};
  _$jscoverage['/defaultResponseProxy.js'].lineData[144]++;
  var requestClone = request.clone();
  _$jscoverage['/defaultResponseProxy.js'].lineData[167]++;
  requestHandler.call(self, request).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[11]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[146]++;
  if (visit32_146_1(persistenceUtils.isCachedResponse(response))) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[147]++;
    localVars.isCachedResponse = true;
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[149]++;
  if (visit33_149_1(response.ok)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[150]++;
    return _applyCacheStrategy(self, request, response);
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[152]++;
    return Promise.resolve(response);
  }
}).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[12]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[155]++;
  localVars.response = response;
  _$jscoverage['/defaultResponseProxy.js'].lineData[156]++;
  if (visit34_156_1(response.ok)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[158]++;
    return _cacheShreddedData(request, response);
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[160]++;
    return Promise.resolve(null);
  }
}).then(function(undoRedoDataArray) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[13]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[163]++;
  return _insertSyncManagerRequest(request, undoRedoDataArray, localVars.isCachedResponse);
}).then(function() {
  _$jscoverage['/defaultResponseProxy.js'].functionData[14]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[165]++;
  cacheHandler.unregisterEndpointOptions(endpointKey);
  _$jscoverage['/defaultResponseProxy.js'].lineData[166]++;
  resolve(localVars.response);
}).catch(function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[15]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[168]++;
  _insertSyncManagerRequest(requestClone, null, true).then(function() {
  _$jscoverage['/defaultResponseProxy.js'].functionData[16]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[169]++;
  cacheHandler.unregisterEndpointOptions(endpointKey);
  _$jscoverage['/defaultResponseProxy.js'].lineData[170]++;
  reject(err);
}, function() {
  _$jscoverage['/defaultResponseProxy.js'].functionData[17]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[172]++;
  cacheHandler.unregisterEndpointOptions(endpointKey);
  _$jscoverage['/defaultResponseProxy.js'].lineData[173]++;
  reject(err);
});
});
});
};
  _$jscoverage['/defaultResponseProxy.js'].lineData[179]++;
  function _getRequestHandler(defaultResponseProxy, request) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[18]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[180]++;
    var self = defaultResponseProxy;
    _$jscoverage['/defaultResponseProxy.js'].lineData[181]++;
    var options = self._options;
    _$jscoverage['/defaultResponseProxy.js'].lineData[182]++;
    var requestHandler = null;
    _$jscoverage['/defaultResponseProxy.js'].lineData[184]++;
    if (visit35_184_1(request.method === 'POST')) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[185]++;
      requestHandler = options['requestHandlerOverride']['handlePost'];
    } else {
      _$jscoverage['/defaultResponseProxy.js'].lineData[186]++;
      if (visit36_186_1(request.method === 'GET')) {
        _$jscoverage['/defaultResponseProxy.js'].lineData[187]++;
        requestHandler = options['requestHandlerOverride']['handleGet'];
      } else {
        _$jscoverage['/defaultResponseProxy.js'].lineData[188]++;
        if (visit37_188_1(request.method === 'PUT')) {
          _$jscoverage['/defaultResponseProxy.js'].lineData[189]++;
          requestHandler = options['requestHandlerOverride']['handlePut'];
        } else {
          _$jscoverage['/defaultResponseProxy.js'].lineData[190]++;
          if (visit38_190_1(request.method === 'PATCH')) {
            _$jscoverage['/defaultResponseProxy.js'].lineData[191]++;
            requestHandler = options['requestHandlerOverride']['handlePatch'];
          } else {
            _$jscoverage['/defaultResponseProxy.js'].lineData[192]++;
            if (visit39_192_1(request.method === 'DELETE')) {
              _$jscoverage['/defaultResponseProxy.js'].lineData[193]++;
              requestHandler = options['requestHandlerOverride']['handleDelete'];
            } else {
              _$jscoverage['/defaultResponseProxy.js'].lineData[194]++;
              if (visit40_194_1(request.method === 'HEAD')) {
                _$jscoverage['/defaultResponseProxy.js'].lineData[195]++;
                requestHandler = options['requestHandlerOverride']['handleHead'];
              } else {
                _$jscoverage['/defaultResponseProxy.js'].lineData[196]++;
                if (visit41_196_1(request.method === 'OPTIONS')) {
                  _$jscoverage['/defaultResponseProxy.js'].lineData[197]++;
                  requestHandler = options['requestHandlerOverride']['handleOptions'];
                }
              }
            }
          }
        }
      }
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[199]++;
    return requestHandler;
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[200]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[214]++;
  DefaultResponseProxy.prototype.handlePost = function(request) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[19]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[215]++;
  return _handleRequestWithErrorIfOffline(request);
};
  _$jscoverage['/defaultResponseProxy.js'].lineData[218]++;
  function _handleRequestWithErrorIfOffline(request) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[20]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[219]++;
    if (visit42_219_1(!persistenceManager.isOnline())) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[220]++;
      var init = {
  'status': 503, 
  'statusText': 'Must provide handlePost override for offline'};
      _$jscoverage['/defaultResponseProxy.js'].lineData[221]++;
      return Promise.resolve(new Response(null, init));
    } else {
      _$jscoverage['/defaultResponseProxy.js'].lineData[223]++;
      return persistenceManager.browserFetch(request);
    }
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[225]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[239]++;
  DefaultResponseProxy.prototype.handleGet = function(request) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[21]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[240]++;
  return _handleGetWithFetchStrategy(this, request);
};
  _$jscoverage['/defaultResponseProxy.js'].lineData[243]++;
  function _handleGetWithFetchStrategy(defaultResponseProxy, request) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[22]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[244]++;
    var self = defaultResponseProxy;
    _$jscoverage['/defaultResponseProxy.js'].lineData[245]++;
    var fetchStrategy = self._options['fetchStrategy'];
    _$jscoverage['/defaultResponseProxy.js'].lineData[247]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[23]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[250]++;
  fetchStrategy(request, self._options).then(function(fetchResponse) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[24]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[249]++;
  resolve(fetchResponse);
}).catch(function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[25]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[251]++;
  reject(err);
});
});
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[254]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[268]++;
  DefaultResponseProxy.prototype.handleHead = function(request) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[26]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[269]++;
  return _handleGetWithFetchStrategy(this, request);
};
  _$jscoverage['/defaultResponseProxy.js'].lineData[284]++;
  DefaultResponseProxy.prototype.handleOptions = function(request) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[27]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[285]++;
  return _handleRequestWithErrorIfOffline(request);
};
  _$jscoverage['/defaultResponseProxy.js'].lineData[300]++;
  DefaultResponseProxy.prototype.handlePut = function(request) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[28]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[301]++;
  return _handlePutRequest(this, request);
};
  _$jscoverage['/defaultResponseProxy.js'].lineData[304]++;
  function _handlePutRequest(defaultResponseProxy, request) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[29]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[305]++;
    var self = defaultResponseProxy;
    _$jscoverage['/defaultResponseProxy.js'].lineData[306]++;
    if (visit43_306_1(persistenceManager.isOnline())) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[307]++;
      return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[30]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[321]++;
  persistenceManager.browserFetch(request.clone()).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[31]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[310]++;
  if (visit44_310_1(response.ok)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[311]++;
    resolve(response);
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[313]++;
    return _handleResponseNotOk(self, request, response, _handleOfflinePutRequest);
  }
}, function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[32]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[316]++;
  return _handleOfflinePutRequest(self, request);
}).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[33]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[318]++;
  if (visit45_318_1(response)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[319]++;
    resolve(response);
  }
}).catch(function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[34]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[322]++;
  reject(err);
});
});
    } else {
      _$jscoverage['/defaultResponseProxy.js'].lineData[326]++;
      return _handleOfflinePutRequest(self, request);
    }
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[328]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[330]++;
  function _handleOfflinePutRequest(defaultResponseProxy, request) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[35]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[331]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[36]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[336]++;
  persistenceUtils.requestToJSON(request).then(function(requestData) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[37]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[337]++;
  requestData.status = 200;
  _$jscoverage['/defaultResponseProxy.js'].lineData[338]++;
  requestData.statusText = 'OK';
  _$jscoverage['/defaultResponseProxy.js'].lineData[339]++;
  requestData.headers['content-type'] = 'application/json';
  _$jscoverage['/defaultResponseProxy.js'].lineData[340]++;
  requestData.headers['x-oracle-jscpt-cache-expiration-date'] = '';
  _$jscoverage['/defaultResponseProxy.js'].lineData[343]++;
  var ifMatch = requestData.headers['if-match'];
  _$jscoverage['/defaultResponseProxy.js'].lineData[344]++;
  var ifNoneMatch = requestData.headers['if-none-match'];
  _$jscoverage['/defaultResponseProxy.js'].lineData[346]++;
  if (visit46_346_1(ifMatch || ifNoneMatch)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[347]++;
    var randomInt = Math.floor(Math.random() * 1000000);
    _$jscoverage['/defaultResponseProxy.js'].lineData[348]++;
    requestData.headers['etag'] = (Date.now() + randomInt).toString();
    _$jscoverage['/defaultResponseProxy.js'].lineData[349]++;
    requestData.headers['x-oracle-jscpt-etag-generated'] = requestData.headers['etag'];
    _$jscoverage['/defaultResponseProxy.js'].lineData[350]++;
    delete requestData.headers['if-match'];
    _$jscoverage['/defaultResponseProxy.js'].lineData[351]++;
    delete requestData.headers['if-none-match'];
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[354]++;
  persistenceUtils.responseFromJSON(requestData).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[38]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[355]++;
  resolve(response);
});
});
});
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[359]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[373]++;
  DefaultResponseProxy.prototype.handlePatch = function(request) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[39]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[374]++;
  return _handleRequestWithErrorIfOffline(request);
};
  _$jscoverage['/defaultResponseProxy.js'].lineData[389]++;
  DefaultResponseProxy.prototype.handleDelete = function(request) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[40]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[390]++;
  return _handleDeleteRequest(this, request);
};
  _$jscoverage['/defaultResponseProxy.js'].lineData[393]++;
  function _handleDeleteRequest(defaultResponseProxy, request) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[41]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[394]++;
    var self = defaultResponseProxy;
    _$jscoverage['/defaultResponseProxy.js'].lineData[395]++;
    if (visit47_395_1(persistenceManager.isOnline())) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[396]++;
      return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[42]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[410]++;
  persistenceManager.browserFetch(request.clone()).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[43]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[399]++;
  if (visit48_399_1(response.ok)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[400]++;
    resolve(response);
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[402]++;
    return _handleResponseNotOk(self, request, response, _handleOfflineDeleteRequest);
  }
}, function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[44]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[405]++;
  return _handleOfflineDeleteRequest(self, request);
}).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[45]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[407]++;
  if (visit49_407_1(response)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[408]++;
    resolve(response);
  }
}).catch(function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[46]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[411]++;
  reject(err);
});
});
    } else {
      _$jscoverage['/defaultResponseProxy.js'].lineData[415]++;
      return _handleOfflineDeleteRequest(self, request);
    }
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[417]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[419]++;
  function _handleOfflineDeleteRequest(defaultResponseProxy, request) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[47]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[420]++;
    var self = defaultResponseProxy;
    _$jscoverage['/defaultResponseProxy.js'].lineData[421]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[48]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[426]++;
  persistenceUtils.requestToJSON(request).then(function(requestData) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[49]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[427]++;
  requestData.status = 200;
  _$jscoverage['/defaultResponseProxy.js'].lineData[428]++;
  requestData.statusText = 'OK';
  _$jscoverage['/defaultResponseProxy.js'].lineData[429]++;
  requestData.headers['content-type'] = 'application/json';
  _$jscoverage['/defaultResponseProxy.js'].lineData[430]++;
  requestData.headers['x-oracle-jscpt-cache-expiration-date'] = '';
  _$jscoverage['/defaultResponseProxy.js'].lineData[431]++;
  persistenceUtils.responseFromJSON(requestData).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[50]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[436]++;
  var key = _getRequestUrlId(request);
  _$jscoverage['/defaultResponseProxy.js'].lineData[438]++;
  var jsonShredder = null;
  _$jscoverage['/defaultResponseProxy.js'].lineData[440]++;
  if (visit50_440_1(self._options && visit51_440_2(self._options.jsonProcessor && self._options.jsonProcessor.shredder))) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[442]++;
    jsonShredder = self._options.jsonProcessor.shredder;
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[445]++;
  if (visit52_445_1(jsonShredder)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[446]++;
    jsonShredder(response).then(function(shreddedObjArray) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[51]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[447]++;
  if (visit53_447_1(shreddedObjArray)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[449]++;
    var storeName = shreddedObjArray[0]['name'];
    _$jscoverage['/defaultResponseProxy.js'].lineData[450]++;
    persistenceStoreManager.openStore(storeName).then(function(store) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[52]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[451]++;
  store.findByKey(key).then(function(row) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[53]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[453]++;
  if (visit54_453_1(row)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[454]++;
    persistenceUtils.responseFromJSON(requestData).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[54]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[455]++;
  persistenceUtils.setResponsePayload(response, row).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[55]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[456]++;
  resolve(response);
  _$jscoverage['/defaultResponseProxy.js'].lineData[457]++;
  return;
});
});
  }
});
});
  }
});
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[468]++;
    resolve(response);
  }
});
});
});
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[473]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[475]++;
  function _handleResponseNotOk(defaultResponseProxy, request, response, offlineHandler) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[56]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[476]++;
    var self = defaultResponseProxy;
    _$jscoverage['/defaultResponseProxy.js'].lineData[477]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[57]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[481]++;
  if (visit55_481_1(response.status < 500)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[482]++;
    resolve(response);
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[485]++;
    offlineHandler(self, request).then(function(response) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[58]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[486]++;
  resolve(response);
}, function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[59]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[488]++;
  reject(err);
});
  }
});
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[492]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[494]++;
  function _getRequestUrlId(request) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[60]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[495]++;
    var urlTokens = request.url.split('/');
    _$jscoverage['/defaultResponseProxy.js'].lineData[496]++;
    return urlTokens[urlTokens.length - 1];
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[497]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[499]++;
  function _applyCacheStrategy(defaultResponseProxy, request, response) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[61]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[500]++;
    var self = defaultResponseProxy;
    _$jscoverage['/defaultResponseProxy.js'].lineData[501]++;
    if (visit56_501_1(visit57_501_2(request.method === 'GET') || visit58_502_1(request.method === 'HEAD'))) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[503]++;
      var cacheStrategy = self._options['cacheStrategy'];
      _$jscoverage['/defaultResponseProxy.js'].lineData[504]++;
      return cacheStrategy(request, response, self._options);
    } else {
      _$jscoverage['/defaultResponseProxy.js'].lineData[506]++;
      return Promise.resolve(response);
    }
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[508]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[510]++;
  function _insertSyncManagerRequest(request, undoRedoDataArray, force) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[62]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[511]++;
    if (visit59_511_1(!persistenceManager.isOnline() || force)) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[513]++;
      return persistenceManager.getSyncManager().insertRequest(request, {
  'undoRedoDataArray': undoRedoDataArray});
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[515]++;
    return Promise.resolve();
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[516]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[518]++;
  function _cacheShreddedData(request, response) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[63]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[519]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[64]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[520]++;
  if (visit60_520_1(visit61_520_2(request.method == 'GET') || visit62_521_1(request.method == 'HEAD'))) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[522]++;
    persistenceManager.getCache().hasMatch(request, {
  ignoreSearch: true}).then(function(matchExist) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[65]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[523]++;
  if (visit63_523_1(matchExist)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[527]++;
    _processShreddedData(request, response).then(function(undoRedoData) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[66]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[528]++;
  resolve(undoRedoData);
}, function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[67]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[530]++;
  reject(err);
});
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[533]++;
    resolve();
  }
});
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[537]++;
    _processShreddedData(request, response).then(function(undoRedoData) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[68]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[538]++;
  resolve(undoRedoData);
}, function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[69]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[540]++;
  reject(err);
});
  }
});
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[544]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[546]++;
  function _processShreddedData(request, response) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[70]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[547]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[71]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[557]++;
  cacheHandler.constructShreddedData(request, response).then(function(shreddedData) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[72]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[549]++;
  if (visit64_549_1(shreddedData)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[551]++;
    return _updateShreddedDataStore(request, shreddedData);
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[553]++;
    return Promise.resolve();
  }
}).then(function(undoRedoData) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[73]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[556]++;
  resolve(undoRedoData);
}).catch(function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[74]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[558]++;
  reject(err);
});
});
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[561]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[563]++;
  function _updateShreddedDataStore(request, shreddedData) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[75]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[564]++;
    var promises = [];
    _$jscoverage['/defaultResponseProxy.js'].lineData[565]++;
    shreddedData.forEach(function(shreddedDataItem) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[76]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[566]++;
  var storename = Object.keys(shreddedDataItem)[0];
  _$jscoverage['/defaultResponseProxy.js'].lineData[567]++;
  promises.push(_updateShreddedDataStoreForItem(request, storename, shreddedDataItem[storename]));
});
    _$jscoverage['/defaultResponseProxy.js'].lineData[570]++;
    return Promise.all(promises);
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[571]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[573]++;
  function _updateShreddedDataStoreForItem(request, storename, shreddedDataItem) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[77]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[574]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[78]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[583]++;
  _getUndoRedoDataForShreddedDataItem(request, storename, shreddedDataItem).then(function(undoRedoArray) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[79]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[576]++;
  if (visit65_576_1(request.method === 'DELETE')) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[577]++;
    return _updateShreddedDataStoreForDeleteRequest(storename, shreddedDataItem, undoRedoArray);
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[579]++;
    return _updateShreddedDataStoreForNonDeleteRequest(storename, shreddedDataItem, undoRedoArray);
  }
}).then(function(undoRedoData) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[80]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[582]++;
  resolve(undoRedoData);
}).catch(function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[81]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[584]++;
  reject(err);
});
});
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[587]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[589]++;
  function _getUndoRedoDataForShreddedDataItem(request, storename, shreddedDataItem) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[82]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[590]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[83]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[591]++;
  var undoRedoArray = [];
  _$jscoverage['/defaultResponseProxy.js'].lineData[592]++;
  var key;
  _$jscoverage['/defaultResponseProxy.js'].lineData[593]++;
  var value;
  _$jscoverage['/defaultResponseProxy.js'].lineData[595]++;
  var undoRedoData = function(i, dataArray) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[84]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[597]++;
  if (visit66_597_1(visit67_597_2(i < dataArray.length) && visit68_598_1(visit69_598_2(request.method !== 'GET') && visit70_599_1(request.method !== 'HEAD')))) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[600]++;
    key = dataArray[i]['key'].toString();
    _$jscoverage['/defaultResponseProxy.js'].lineData[602]++;
    if (visit71_602_1(request.method !== 'DELETE')) {
      _$jscoverage['/defaultResponseProxy.js'].lineData[603]++;
      value = dataArray[i]['value'];
    } else {
      _$jscoverage['/defaultResponseProxy.js'].lineData[606]++;
      value = null;
    }
    _$jscoverage['/defaultResponseProxy.js'].lineData[610]++;
    persistenceStoreManager.openStore(storename).then(function(store) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[85]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[611]++;
  store.findByKey(key).then(function(undoRow) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[86]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[612]++;
  undoRedoArray.push({
  'key': key, 
  'undo': undoRow, 
  'redo': value});
  _$jscoverage['/defaultResponseProxy.js'].lineData[613]++;
  undoRedoData(++i, dataArray);
}, function(error) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[87]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[616]++;
  undoRedoArray.push({
  'key': key, 
  'undo': null, 
  'redo': value});
  _$jscoverage['/defaultResponseProxy.js'].lineData[617]++;
  undoRedoData(++i, dataArray);
});
});
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[621]++;
    resolve(undoRedoArray);
  }
};
  _$jscoverage['/defaultResponseProxy.js'].lineData[624]++;
  undoRedoData(0, shreddedDataItem);
});
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[626]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[628]++;
  function _updateShreddedDataStoreForNonDeleteRequest(storename, shreddedDataItem, undoRedoArray) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[88]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[629]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[89]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[639]++;
  persistenceStoreManager.openStore(storename).then(function(store) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[90]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[632]++;
  return store.upsertAll(shreddedDataItem);
}).then(function() {
  _$jscoverage['/defaultResponseProxy.js'].functionData[91]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[634]++;
  if (visit72_634_1(undoRedoArray.length > 0)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[635]++;
    resolve({
  'storeName': storename, 
  'operation': 'upsert', 
  'undoRedoData': undoRedoArray});
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[637]++;
    resolve();
  }
}).catch(function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[92]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[640]++;
  reject(err);
});
});
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[643]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[645]++;
  function _updateShreddedDataStoreForDeleteRequest(storename, shreddedDataItem, undoRedoArray) {
    _$jscoverage['/defaultResponseProxy.js'].functionData[93]++;
    _$jscoverage['/defaultResponseProxy.js'].lineData[646]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[94]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[656]++;
  persistenceStoreManager.openStore(storename).then(function(store) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[95]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[649]++;
  return store.removeByKey(shreddedDataItem[0]['key']);
}).then(function() {
  _$jscoverage['/defaultResponseProxy.js'].functionData[96]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[651]++;
  if (visit73_651_1(undoRedoArray.length > 0)) {
    _$jscoverage['/defaultResponseProxy.js'].lineData[652]++;
    resolve({
  'storeName': storename, 
  'operation': 'remove', 
  'undoRedoData': undoRedoArray});
  } else {
    _$jscoverage['/defaultResponseProxy.js'].lineData[654]++;
    resolve();
  }
}).catch(function(err) {
  _$jscoverage['/defaultResponseProxy.js'].functionData[97]++;
  _$jscoverage['/defaultResponseProxy.js'].lineData[657]++;
  reject(err);
});
});
  }
  _$jscoverage['/defaultResponseProxy.js'].lineData[660]++;
  ;
  _$jscoverage['/defaultResponseProxy.js'].lineData[662]++;
  return {
  'getResponseProxy': getResponseProxy};
});
