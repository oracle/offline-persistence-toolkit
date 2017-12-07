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
if (! _$jscoverage['/impl/OfflineCache.js']) {
  _$jscoverage['/impl/OfflineCache.js'] = {};
  _$jscoverage['/impl/OfflineCache.js'].lineData = [];
  _$jscoverage['/impl/OfflineCache.js'].lineData[6] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[7] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[28] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[29] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[30] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[32] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[33] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[36] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[37] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[48] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[49] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[64] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[65] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[66] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[67] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[68] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[69] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[82] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[83] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[84] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[116] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[117] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[119] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[120] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[122] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[123] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[124] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[126] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[127] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[128] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[129] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[131] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[164] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[165] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[167] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[168] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[170] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[171] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[172] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[174] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[175] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[176] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[177] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[178] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[180] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[182] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[195] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[196] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[197] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[198] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[199] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[200] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[204] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[205] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[216] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[217] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[218] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[219] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[220] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[222] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[223] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[227] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[228] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[229] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[230] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[231] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[233] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[235] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[237] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[240] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[241] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[242] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[245] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[246] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[249] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[250] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[251] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[252] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[254] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[255] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[256] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[257] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[259] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[260] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[261] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[262] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[263] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[264] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[267] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[269] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[274] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[275] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[285] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[286] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[287] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[288] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[289] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[290] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[291] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[293] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[295] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[296] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[298] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[300] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[302] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[303] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[304] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[306] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[307] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[309] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[311] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[323] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[324] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[325] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[326] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[327] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[329] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[330] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[331] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[332] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[334] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[338] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[339] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[340] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[343] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[344] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[349] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[350] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[351] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[357] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[358] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[390] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[391] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[393] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[395] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[396] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[397] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[399] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[402] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[403] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[405] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[407] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[408] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[439] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[440] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[442] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[444] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[445] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[447] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[449] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[451] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[452] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[453] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[454] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[456] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[458] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[459] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[465] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[467] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[468] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[469] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[504] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[505] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[506] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[507] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[509] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[511] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[512] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[513] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[514] = 0;
  _$jscoverage['/impl/OfflineCache.js'].lineData[519] = 0;
}
if (! _$jscoverage['/impl/OfflineCache.js'].functionData) {
  _$jscoverage['/impl/OfflineCache.js'].functionData = [];
  _$jscoverage['/impl/OfflineCache.js'].functionData[0] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[1] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[2] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[3] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[4] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[5] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[6] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[7] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[8] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[9] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[10] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[11] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[12] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[13] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[14] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[15] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[16] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[17] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[18] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[19] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[20] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[21] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[22] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[23] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[24] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[25] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[26] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[27] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[28] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[29] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[30] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[31] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[32] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[33] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[34] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[35] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[36] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[37] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[38] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[39] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[40] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[41] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[42] = 0;
  _$jscoverage['/impl/OfflineCache.js'].functionData[43] = 0;
}
if (! _$jscoverage['/impl/OfflineCache.js'].branchData) {
  _$jscoverage['/impl/OfflineCache.js'].branchData = {};
  _$jscoverage['/impl/OfflineCache.js'].branchData['29'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['29'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['32'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['32'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['120'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['120'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['126'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['126'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['168'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['168'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['174'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['174'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['196'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['196'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['197'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['197'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['199'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['199'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['218'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['218'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['230'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['230'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['241'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['241'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['245'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['245'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['254'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['254'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['256'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['256'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['260'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['260'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['264'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['264'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['264'][2] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['265'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['265'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['265'][2] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['266'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['266'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['286'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['286'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['289'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['289'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['303'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['303'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['332'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['332'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['395'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['395'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['402'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['402'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['442'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['442'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['447'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['447'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['451'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['451'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['507'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['507'][1] = new BranchData();
  _$jscoverage['/impl/OfflineCache.js'].branchData['512'] = [];
  _$jscoverage['/impl/OfflineCache.js'].branchData['512'][1] = new BranchData();
}
_$jscoverage['/impl/OfflineCache.js'].branchData['512'][1].init(16, 19);
function visit552_512_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['512'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['507'][1].init(22, 29);
function visit551_507_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['507'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['451'][1].init(14, 29);
function visit533_451_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['451'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['447'][1].init(24, 29);
function visit532_447_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['447'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['442'][1].init(8, 7);
function visit531_442_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['442'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['402'][1].init(12, 23);
function visit530_402_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['402'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['395'][1].init(12, 29);
function visit529_395_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['395'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['332'][1].init(10, 16);
function visit528_332_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['332'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['303'][1].init(8, 47);
function visit527_303_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['303'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['289'][1].init(10, 12);
function visit526_289_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['289'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['286'][1].init(8, 12);
function visit525_286_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['286'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['266'][1].init(13, 55);
function visit524_266_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['266'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['265'][2].init(45, 95);
function visit523_265_2(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['265'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['265'][1].init(13, 127);
function visit522_265_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['265'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['264'][2].init(13, 56);
function visit521_264_2(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['264'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['264'][1].init(13, 203);
function visit520_264_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['264'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['260'][1].init(26, 24);
function visit519_260_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['260'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['256'][1].init(15, 24);
function visit518_256_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['256'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['254'][1].init(8, 10);
function visit517_254_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['254'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['245'][1].init(8, 23);
function visit516_245_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['245'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['241'][1].init(8, 10);
function visit515_241_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['241'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['230'][1].init(10, 12);
function visit514_230_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['230'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['218'][1].init(8, 35);
function visit513_218_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['218'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['199'][1].init(12, 48);
function visit512_199_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['199'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['197'][1].init(26, 27);
function visit511_197_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['197'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['196'][1].init(8, 35);
function visit509_196_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['196'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['174'][1].init(10, 37);
function visit508_174_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['174'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['168'][1].init(22, 29);
function visit507_168_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['168'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['126'][1].init(10, 7);
function visit506_126_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['126'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['120'][1].init(22, 29);
function visit505_120_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['120'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['32'][1].init(8, 17);
function visit504_32_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['32'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].branchData['29'][1].init(8, 5);
function visit503_29_1(result) {
  _$jscoverage['/impl/OfflineCache.js'].branchData['29'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/OfflineCache.js'].lineData[6]++;
define(["./defaultCacheHandler"], function(cacheHandler) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[0]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[7]++;
  'use strict';
  _$jscoverage['/impl/OfflineCache.js'].lineData[28]++;
  function OfflineCache(name, persistencestore) {
    _$jscoverage['/impl/OfflineCache.js'].functionData[1]++;
    _$jscoverage['/impl/OfflineCache.js'].lineData[29]++;
    if (visit503_29_1(!name)) {
      _$jscoverage['/impl/OfflineCache.js'].lineData[30]++;
      throw TypeError("A name must be provided to create an OfflineCache!");
    }
    _$jscoverage['/impl/OfflineCache.js'].lineData[32]++;
    if (visit504_32_1(!persistencestore)) {
      _$jscoverage['/impl/OfflineCache.js'].lineData[33]++;
      throw TypeError("A persistence store must be provided to create an OfflineCache!");
    }
    _$jscoverage['/impl/OfflineCache.js'].lineData[36]++;
    this._name = name;
    _$jscoverage['/impl/OfflineCache.js'].lineData[37]++;
    this._store = persistencestore;
  }
  _$jscoverage['/impl/OfflineCache.js'].lineData[48]++;
  OfflineCache.prototype.getName = function() {
  _$jscoverage['/impl/OfflineCache.js'].functionData[2]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[49]++;
  return this._name;
};
  _$jscoverage['/impl/OfflineCache.js'].lineData[64]++;
  OfflineCache.prototype.add = function(request) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[3]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[65]++;
  var self = this;
  _$jscoverage['/impl/OfflineCache.js'].lineData[66]++;
  return fetch(request).then(function(response) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[4]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[67]++;
  var responseClone = response.clone();
  _$jscoverage['/impl/OfflineCache.js'].lineData[68]++;
  return self.put(request, response).then(function() {
  _$jscoverage['/impl/OfflineCache.js'].functionData[5]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[69]++;
  Promise.resolve(responseClone);
});
});
};
  _$jscoverage['/impl/OfflineCache.js'].lineData[82]++;
  OfflineCache.prototype.addAll = function(requests) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[6]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[83]++;
  var promises = requests.map(this.add, this);
  _$jscoverage['/impl/OfflineCache.js'].lineData[84]++;
  return Promise.all(promises);
};
  _$jscoverage['/impl/OfflineCache.js'].lineData[116]++;
  OfflineCache.prototype.match = function(request, options) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[7]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[117]++;
  var self = this;
  _$jscoverage['/impl/OfflineCache.js'].lineData[119]++;
  var searchCriteria = cacheHandler.constructSearchCriteria(request, options);
  _$jscoverage['/impl/OfflineCache.js'].lineData[120]++;
  var ignoreVary = (visit505_120_1(options && options.ignoreVary));
  _$jscoverage['/impl/OfflineCache.js'].lineData[122]++;
  return self._store.find(searchCriteria).then(function(cacheEntries) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[8]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[123]++;
  var matchEntry = _applyVaryForSingleMatch(ignoreVary, request, cacheEntries);
  _$jscoverage['/impl/OfflineCache.js'].lineData[124]++;
  return _cacheEntryToResponse(matchEntry);
}).then(function(results) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[9]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[126]++;
  if (visit506_126_1(results)) {
    _$jscoverage['/impl/OfflineCache.js'].lineData[127]++;
    var bodyAbstract = results[0];
    _$jscoverage['/impl/OfflineCache.js'].lineData[128]++;
    var response = results[1];
    _$jscoverage['/impl/OfflineCache.js'].lineData[129]++;
    return cacheHandler.fillResponseBodyWithShreddedData(request, bodyAbstract, response);
  } else {
    _$jscoverage['/impl/OfflineCache.js'].lineData[131]++;
    return Promise.resolve();
  }
});
};
  _$jscoverage['/impl/OfflineCache.js'].lineData[164]++;
  OfflineCache.prototype.matchAll = function(request, options) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[10]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[165]++;
  var self = this;
  _$jscoverage['/impl/OfflineCache.js'].lineData[167]++;
  var searchCriteria = cacheHandler.constructSearchCriteria(request, options);
  _$jscoverage['/impl/OfflineCache.js'].lineData[168]++;
  var ignoreVary = (visit507_168_1(options && options.ignoreVary));
  _$jscoverage['/impl/OfflineCache.js'].lineData[170]++;
  return self._store.find(searchCriteria).then(function(cacheEntries) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[11]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[171]++;
  var responseDataArray = _applyVaryForAllMatches(ignoreVary, request, cacheEntries);
  _$jscoverage['/impl/OfflineCache.js'].lineData[172]++;
  return _cacheEntriesToResponses(responseDataArray);
}).then(function(responseArray) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[12]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[174]++;
  if (visit508_174_1(responseArray && responseArray.length)) {
    _$jscoverage['/impl/OfflineCache.js'].lineData[175]++;
    var promises = responseArray.map(function(responseElement) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[13]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[176]++;
  var bodyAbstract = responseElement[0];
  _$jscoverage['/impl/OfflineCache.js'].lineData[177]++;
  var response = responseElement[1];
  _$jscoverage['/impl/OfflineCache.js'].lineData[178]++;
  return cacheHandler.fillResponseBodyWithShreddedData(request, bodyAbstract, response);
});
    _$jscoverage['/impl/OfflineCache.js'].lineData[180]++;
    return Promise.all(promises);
  } else {
    _$jscoverage['/impl/OfflineCache.js'].lineData[182]++;
    return Promise.resolve([]);
  }
});
};
  _$jscoverage['/impl/OfflineCache.js'].lineData[195]++;
  function _applyVaryForSingleMatch(ignoreVary, request, cacheEntries) {
    _$jscoverage['/impl/OfflineCache.js'].functionData[14]++;
    _$jscoverage['/impl/OfflineCache.js'].lineData[196]++;
    if (visit509_196_1(cacheEntries && cacheEntries.length)) {
      _$jscoverage['/impl/OfflineCache.js'].lineData[197]++;
      for (var index = 0; visit511_197_1(index < cacheEntries.length); index++) {
        _$jscoverage['/impl/OfflineCache.js'].lineData[198]++;
        var cacheEntry = cacheEntries[index];
        _$jscoverage['/impl/OfflineCache.js'].lineData[199]++;
        if (visit512_199_1(_applyVaryCheck(ignoreVary, request, cacheEntry))) {
          _$jscoverage['/impl/OfflineCache.js'].lineData[200]++;
          return cacheEntry.responseData;
        }
      }
    }
    _$jscoverage['/impl/OfflineCache.js'].lineData[204]++;
    return null;
  }
  _$jscoverage['/impl/OfflineCache.js'].lineData[205]++;
  ;
  _$jscoverage['/impl/OfflineCache.js'].lineData[216]++;
  function _applyVaryForAllMatches(ignoreVary, request, cacheEntries) {
    _$jscoverage['/impl/OfflineCache.js'].functionData[15]++;
    _$jscoverage['/impl/OfflineCache.js'].lineData[217]++;
    var responseDataArray = [];
    _$jscoverage['/impl/OfflineCache.js'].lineData[218]++;
    if (visit513_218_1(cacheEntries && cacheEntries.length)) {
      _$jscoverage['/impl/OfflineCache.js'].lineData[219]++;
      var filteredArray = cacheEntries.filter(_filterByVary(ignoreVary, request));
      _$jscoverage['/impl/OfflineCache.js'].lineData[220]++;
      responseDataArray = filteredArray.map(function(entry) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[16]++;
  return entry.responseData;
});
    }
    _$jscoverage['/impl/OfflineCache.js'].lineData[222]++;
    return responseDataArray;
  }
  _$jscoverage['/impl/OfflineCache.js'].lineData[223]++;
  ;
  _$jscoverage['/impl/OfflineCache.js'].lineData[227]++;
  function _filterByVary(ignoreVary, request, propertyName) {
    _$jscoverage['/impl/OfflineCache.js'].functionData[17]++;
    _$jscoverage['/impl/OfflineCache.js'].lineData[228]++;
    return function(cacheValue) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[18]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[229]++;
  var propertyValue;
  _$jscoverage['/impl/OfflineCache.js'].lineData[230]++;
  if (visit514_230_1(propertyName)) {
    _$jscoverage['/impl/OfflineCache.js'].lineData[231]++;
    propertyValue = cacheValue[propertyName];
  } else {
    _$jscoverage['/impl/OfflineCache.js'].lineData[233]++;
    propertyValue = cacheValue;
  }
  _$jscoverage['/impl/OfflineCache.js'].lineData[235]++;
  return _applyVaryCheck(ignoreVary, request, propertyValue);
};
  }
  _$jscoverage['/impl/OfflineCache.js'].lineData[237]++;
  ;
  _$jscoverage['/impl/OfflineCache.js'].lineData[240]++;
  function _applyVaryCheck(ignoreVary, request, cacheValue) {
    _$jscoverage['/impl/OfflineCache.js'].functionData[19]++;
    _$jscoverage['/impl/OfflineCache.js'].lineData[241]++;
    if (visit515_241_1(ignoreVary)) {
      _$jscoverage['/impl/OfflineCache.js'].lineData[242]++;
      return true;
    }
    _$jscoverage['/impl/OfflineCache.js'].lineData[245]++;
    if (visit516_245_1(!cacheValue || !request)) {
      _$jscoverage['/impl/OfflineCache.js'].lineData[246]++;
      return false;
    }
    _$jscoverage['/impl/OfflineCache.js'].lineData[249]++;
    var cacheRequestHeaders = cacheValue.requestData.headers;
    _$jscoverage['/impl/OfflineCache.js'].lineData[250]++;
    var cacheResponseHeaders = cacheValue.responseData.headers;
    _$jscoverage['/impl/OfflineCache.js'].lineData[251]++;
    var requestHeaders = request.headers;
    _$jscoverage['/impl/OfflineCache.js'].lineData[252]++;
    var varyValue = cacheResponseHeaders.vary;
    _$jscoverage['/impl/OfflineCache.js'].lineData[254]++;
    if (visit517_254_1(!varyValue)) {
      _$jscoverage['/impl/OfflineCache.js'].lineData[255]++;
      return true;
    } else {
      _$jscoverage['/impl/OfflineCache.js'].lineData[256]++;
      if (visit518_256_1(varyValue.trim() === '*')) {
        _$jscoverage['/impl/OfflineCache.js'].lineData[257]++;
        return false;
      } else {
        _$jscoverage['/impl/OfflineCache.js'].lineData[259]++;
        var varyArray = varyValue.split(',');
        _$jscoverage['/impl/OfflineCache.js'].lineData[260]++;
        for (var index = 0; visit519_260_1(index < varyArray.length); index++) {
          _$jscoverage['/impl/OfflineCache.js'].lineData[261]++;
          var varyHeaderName = varyArray[index].toLowerCase();
          _$jscoverage['/impl/OfflineCache.js'].lineData[262]++;
          var requestVaryHeaderValue = requestHeaders.get(varyHeaderName);
          _$jscoverage['/impl/OfflineCache.js'].lineData[263]++;
          var cachedRequestVaryHeaderValue = cacheRequestHeaders[varyHeaderName];
          _$jscoverage['/impl/OfflineCache.js'].lineData[264]++;
          if (visit520_264_1((visit521_264_2(!cachedRequestVaryHeaderValue && !requestVaryHeaderValue)) || (visit522_265_1(cachedRequestVaryHeaderValue && visit523_265_2(requestVaryHeaderValue && visit524_266_1(cachedRequestVaryHeaderValue === requestVaryHeaderValue)))))) {
            _$jscoverage['/impl/OfflineCache.js'].lineData[267]++;
            continue;
          } else {
            _$jscoverage['/impl/OfflineCache.js'].lineData[269]++;
            return false;
          }
        }
      }
    }
    _$jscoverage['/impl/OfflineCache.js'].lineData[274]++;
    return true;
  }
  _$jscoverage['/impl/OfflineCache.js'].lineData[275]++;
  ;
  _$jscoverage['/impl/OfflineCache.js'].lineData[285]++;
  function _cacheEntryToResponse(responseData) {
    _$jscoverage['/impl/OfflineCache.js'].functionData[20]++;
    _$jscoverage['/impl/OfflineCache.js'].lineData[286]++;
    if (visit525_286_1(responseData)) {
      _$jscoverage['/impl/OfflineCache.js'].lineData[287]++;
      var promises = [];
      _$jscoverage['/impl/OfflineCache.js'].lineData[288]++;
      var bodyAbstract = responseData.bodyAbstract;
      _$jscoverage['/impl/OfflineCache.js'].lineData[289]++;
      if (visit526_289_1(bodyAbstract)) {
        _$jscoverage['/impl/OfflineCache.js'].lineData[290]++;
        promises.push(Promise.resolve(JSON.parse(bodyAbstract)));
        _$jscoverage['/impl/OfflineCache.js'].lineData[291]++;
        delete responseData.bodyAbstract;
      } else {
        _$jscoverage['/impl/OfflineCache.js'].lineData[293]++;
        promises.push(Promise.resolve());
      }
      _$jscoverage['/impl/OfflineCache.js'].lineData[295]++;
      promises.push(cacheHandler.constructResponse(responseData));
      _$jscoverage['/impl/OfflineCache.js'].lineData[296]++;
      return Promise.all(promises);
    } else {
      _$jscoverage['/impl/OfflineCache.js'].lineData[298]++;
      return Promise.resolve();
    }
  }
  _$jscoverage['/impl/OfflineCache.js'].lineData[300]++;
  ;
  _$jscoverage['/impl/OfflineCache.js'].lineData[302]++;
  function _cacheEntriesToResponses(responseDataArray) {
    _$jscoverage['/impl/OfflineCache.js'].functionData[21]++;
    _$jscoverage['/impl/OfflineCache.js'].lineData[303]++;
    if (visit527_303_1(!responseDataArray || !responseDataArray.length)) {
      _$jscoverage['/impl/OfflineCache.js'].lineData[304]++;
      return Promise.resolve();
    } else {
      _$jscoverage['/impl/OfflineCache.js'].lineData[306]++;
      var promisesArray = responseDataArray.map(function(element) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[22]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[307]++;
  return _cacheEntryToResponse(element);
});
      _$jscoverage['/impl/OfflineCache.js'].lineData[309]++;
      return Promise.all(promisesArray);
    }
  }
  _$jscoverage['/impl/OfflineCache.js'].lineData[311]++;
  ;
  _$jscoverage['/impl/OfflineCache.js'].lineData[323]++;
  OfflineCache.prototype.put = function(request, response) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[23]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[324]++;
  var self = this;
  _$jscoverage['/impl/OfflineCache.js'].lineData[325]++;
  var promises = [];
  _$jscoverage['/impl/OfflineCache.js'].lineData[326]++;
  promises.push(cacheHandler.constructRequestResponseCacheData(request, response));
  _$jscoverage['/impl/OfflineCache.js'].lineData[327]++;
  promises.push(cacheHandler.shredResponse(request, response));
  _$jscoverage['/impl/OfflineCache.js'].lineData[329]++;
  return Promise.all(promises).then(function(results) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[24]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[330]++;
  var requestResponsePair = results[0];
  _$jscoverage['/impl/OfflineCache.js'].lineData[331]++;
  var shreddedPayload = results[1];
  _$jscoverage['/impl/OfflineCache.js'].lineData[332]++;
  if (visit528_332_1(!shreddedPayload)) {
    _$jscoverage['/impl/OfflineCache.js'].lineData[334]++;
    return self._store.upsert(requestResponsePair.key, requestResponsePair.metadata, requestResponsePair.value);
  } else {
    _$jscoverage['/impl/OfflineCache.js'].lineData[338]++;
    var storePromises = [];
    _$jscoverage['/impl/OfflineCache.js'].lineData[339]++;
    requestResponsePair.value.responseData.bodyAbstract = _buildBodyAbstract(shreddedPayload);
    _$jscoverage['/impl/OfflineCache.js'].lineData[340]++;
    storePromises.push(self._store.upsert(requestResponsePair.key, requestResponsePair.metadata, requestResponsePair.value));
    _$jscoverage['/impl/OfflineCache.js'].lineData[343]++;
    storePromises.push(cacheHandler.cacheShreddedData(shreddedPayload));
    _$jscoverage['/impl/OfflineCache.js'].lineData[344]++;
    return Promise.all(storePromises);
  }
});
};
  _$jscoverage['/impl/OfflineCache.js'].lineData[349]++;
  function _buildBodyAbstract(shreddedPayload) {
    _$jscoverage['/impl/OfflineCache.js'].functionData[25]++;
    _$jscoverage['/impl/OfflineCache.js'].lineData[350]++;
    var bodyAbstract = shreddedPayload.map(function(element) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[26]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[351]++;
  return {
  name: element.name, 
  keys: element.keys, 
  resourceType: element.resourceType};
});
    _$jscoverage['/impl/OfflineCache.js'].lineData[357]++;
    return JSON.stringify(bodyAbstract);
  }
  _$jscoverage['/impl/OfflineCache.js'].lineData[358]++;
  ;
  _$jscoverage['/impl/OfflineCache.js'].lineData[390]++;
  OfflineCache.prototype.delete = function(request, options) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[27]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[391]++;
  var self = this;
  _$jscoverage['/impl/OfflineCache.js'].lineData[393]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[28]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[407]++;
  self.keys(request, options).then(function(keysArray) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[29]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[395]++;
  if (visit529_395_1(keysArray && keysArray.length)) {
    _$jscoverage['/impl/OfflineCache.js'].lineData[396]++;
    var promisesArray = keysArray.map(self._store.removeByKey, self._store);
    _$jscoverage['/impl/OfflineCache.js'].lineData[397]++;
    return Promise.all(promisesArray);
  } else {
    _$jscoverage['/impl/OfflineCache.js'].lineData[399]++;
    return Promise.resolve(false);
  }
}).then(function(result) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[30]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[402]++;
  if (visit530_402_1(result && result.length)) {
    _$jscoverage['/impl/OfflineCache.js'].lineData[403]++;
    resolve(true);
  } else {
    _$jscoverage['/impl/OfflineCache.js'].lineData[405]++;
    resolve(false);
  }
}).catch(function(error) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[31]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[408]++;
  reject(error);
});
});
};
  _$jscoverage['/impl/OfflineCache.js'].lineData[439]++;
  OfflineCache.prototype.keys = function(request, options) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[32]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[440]++;
  var self = this;
  _$jscoverage['/impl/OfflineCache.js'].lineData[442]++;
  if (visit531_442_1(request)) {
    _$jscoverage['/impl/OfflineCache.js'].lineData[444]++;
    var searchCriteria = cacheHandler.constructSearchCriteria(request, options);
    _$jscoverage['/impl/OfflineCache.js'].lineData[445]++;
    searchCriteria.fields = ['key', 'value'];
    _$jscoverage['/impl/OfflineCache.js'].lineData[447]++;
    var ignoreVary = (visit532_447_1(options && options.ignoreVary));
    _$jscoverage['/impl/OfflineCache.js'].lineData[449]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[33]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[458]++;
  self._store.find(searchCriteria).then(function(dataArray) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[34]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[451]++;
  if (visit533_451_1(dataArray && dataArray.length)) {
    _$jscoverage['/impl/OfflineCache.js'].lineData[452]++;
    var filteredEntries = dataArray.filter(_filterByVary(ignoreVary, request, 'value'));
    _$jscoverage['/impl/OfflineCache.js'].lineData[453]++;
    var keysArray = filteredEntries.map(function(entry) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[35]++;
  return entry.key;
});
    _$jscoverage['/impl/OfflineCache.js'].lineData[454]++;
    resolve(keysArray);
  } else {
    _$jscoverage['/impl/OfflineCache.js'].lineData[456]++;
    resolve([]);
  }
}).catch(function(error) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[36]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[459]++;
  reject(error);
});
});
  } else {
    _$jscoverage['/impl/OfflineCache.js'].lineData[465]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[37]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[468]++;
  self._store.keys().then(function(keysArray) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[38]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[467]++;
  resolve(keysArray);
}).catch(function(err) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[39]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[469]++;
  reject(err);
});
});
  }
};
  _$jscoverage['/impl/OfflineCache.js'].lineData[504]++;
  OfflineCache.prototype.hasMatch = function(request, options) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[40]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[505]++;
  var self = this;
  _$jscoverage['/impl/OfflineCache.js'].lineData[506]++;
  var searchCriteria = cacheHandler.constructSearchCriteria(request, options);
  _$jscoverage['/impl/OfflineCache.js'].lineData[507]++;
  var ignoreVary = (visit551_507_1(options && options.ignoreVary));
  _$jscoverage['/impl/OfflineCache.js'].lineData[509]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[41]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[513]++;
  self._store.find(searchCriteria).then(function(cacheEntries) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[42]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[511]++;
  var matchEntry = _applyVaryForSingleMatch(ignoreVary, request, cacheEntries);
  _$jscoverage['/impl/OfflineCache.js'].lineData[512]++;
  resolve(visit552_512_1(matchEntry !== null));
}).catch(function(error) {
  _$jscoverage['/impl/OfflineCache.js'].functionData[43]++;
  _$jscoverage['/impl/OfflineCache.js'].lineData[514]++;
  reject(error);
});
});
};
  _$jscoverage['/impl/OfflineCache.js'].lineData[519]++;
  return OfflineCache;
});
