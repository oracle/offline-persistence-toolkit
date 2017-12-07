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
if (! _$jscoverage['/queryHandlers.js']) {
  _$jscoverage['/queryHandlers.js'] = {};
  _$jscoverage['/queryHandlers.js'].lineData = [];
  _$jscoverage['/queryHandlers.js'].lineData[6] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[8] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[37] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[38] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[39] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[41] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[42] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[44] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[45] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[46] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[47] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[49] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[52] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[54] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[57] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[58] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[59] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[60] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[61] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[63] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[64] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[66] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[67] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[68] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[70] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[71] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[72] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[73] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[74] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[75] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[80] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[82] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[83] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[85] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[86] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[87] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[90] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[92] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[93] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[94] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[96] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[97] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[98] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[100] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[101] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[102] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[103] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[104] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[105] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[108] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[117] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[119] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[121] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[122] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[127] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[129] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[131] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[134] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[135] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[136] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[138] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[141] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[142] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[143] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[144] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[145] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[147] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[149] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[153] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[155] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[157] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[159] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[161] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[165] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[167] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[170] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[171] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[172] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[177] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[179] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[180] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[181] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[183] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[184] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[185] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[186] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[187] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[189] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[190] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[192] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[194] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[195] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[196] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[201] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[202] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[207] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[209] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[210] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[211] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[212] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[213] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[214] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[215] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[216] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[221] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[222] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[223] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[230] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[233] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[236] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[237] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[241] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[243] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[244] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[246] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[247] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[248] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[249] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[250] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[251] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[252] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[254] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[255] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[256] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[260] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[261] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[264] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[265] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[278] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[279] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[280] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[285] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[286] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[288] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[289] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[291] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[292] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[293] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[296] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[298] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[301] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[303] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[305] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[306] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[308] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[310] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[311] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[313] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[316] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[318] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[321] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[322] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[323] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[325] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[326] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[328] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[329] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[330] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[332] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[335] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[340] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[341] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[344] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[345] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[347] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[350] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[351] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[353] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[354] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[356] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[357] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[358] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[359] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[360] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[361] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[362] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[364] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[365] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[366] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[367] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[369] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[370] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[372] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[373] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[377] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[380] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[381] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[385] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[386] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[388] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[389] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[390] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[392] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[393] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[394] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[395] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[397] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[398] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[400] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[401] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[402] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[403] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[404] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[406] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[407] = 0;
  _$jscoverage['/queryHandlers.js'].lineData[409] = 0;
}
if (! _$jscoverage['/queryHandlers.js'].functionData) {
  _$jscoverage['/queryHandlers.js'].functionData = [];
  _$jscoverage['/queryHandlers.js'].functionData[0] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[1] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[2] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[3] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[4] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[5] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[6] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[7] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[8] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[9] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[10] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[11] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[12] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[13] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[14] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[15] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[16] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[17] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[18] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[19] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[20] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[21] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[22] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[23] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[24] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[25] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[26] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[27] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[28] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[29] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[30] = 0;
  _$jscoverage['/queryHandlers.js'].functionData[31] = 0;
}
if (! _$jscoverage['/queryHandlers.js'].branchData) {
  _$jscoverage['/queryHandlers.js'].branchData = {};
  _$jscoverage['/queryHandlers.js'].branchData['38'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['38'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['42'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['42'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['42'][2] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['43'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['43'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['49'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['49'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['66'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['66'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['70'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['70'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['72'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['72'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['74'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['74'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['78'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['78'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['85'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['85'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['90'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['90'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['90'][2] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['91'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['91'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['93'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['93'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['98'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['98'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['98'][2] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['99'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['99'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['102'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['102'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['129'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['129'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['135'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['135'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['142'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['142'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['144'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['144'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['145'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['145'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['146'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['146'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['147'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['147'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['157'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['157'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['158'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['158'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['159'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['159'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['181'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['181'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['181'][2] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['182'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['182'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['185'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['185'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['186'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['186'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['189'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['189'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['207'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['207'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['207'][2] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['210'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['210'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['215'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['215'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['246'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['246'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['251'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['251'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['254'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['254'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['260'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['260'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['280'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['280'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['280'][2] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['281'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['281'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['291'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['291'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['296'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['296'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['296'][2] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['297'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['297'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['308'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['308'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['309'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['309'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['313'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['313'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['328'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['328'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['332'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['332'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['333'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['333'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['338'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['338'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['340'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['340'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['351'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['351'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['353'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['353'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['356'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['356'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['364'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['364'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['381'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['381'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['394'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['394'][1] = new BranchData();
  _$jscoverage['/queryHandlers.js'].branchData['402'] = [];
  _$jscoverage['/queryHandlers.js'].branchData['402'][1] = new BranchData();
}
_$jscoverage['/queryHandlers.js'].branchData['402'][1].init(10, 20);
function visit672_402_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['402'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['394'][1].init(10, 20);
function visit671_394_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['394'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['381'][1].init(26, 19);
function visit670_381_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['381'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['364'][1].init(14, 10);
function visit669_364_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['364'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['356'][1].init(16, 11);
function visit668_356_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['356'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['353'][1].init(12, 23);
function visit667_353_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['353'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['351'][1].init(10, 13);
function visit666_351_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['351'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['340'][1].init(12, 37);
function visit665_340_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['340'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['338'][1].init(17, 24);
function visit664_338_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['338'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['333'][1].init(14, 45);
function visit663_333_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['333'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['332'][1].init(16, 80);
function visit662_332_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['332'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['328'][1].init(14, 32);
function visit661_328_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['328'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['313'][1].init(12, 38);
function visit660_313_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['313'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['309'][1].init(8, 20);
function visit659_309_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['309'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['308'][1].init(10, 42);
function visit658_308_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['308'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['297'][1].init(12, 18);
function visit657_297_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['297'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['296'][2].init(14, 16);
function visit656_296_2(result) {
  _$jscoverage['/queryHandlers.js'].branchData['296'][2].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['296'][1].init(14, 51);
function visit655_296_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['296'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['291'][1].init(14, 32);
function visit654_291_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['291'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['281'][1].init(10, 24);
function visit653_281_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['281'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['280'][2].init(12, 23);
function visit652_280_2(result) {
  _$jscoverage['/queryHandlers.js'].branchData['280'][2].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['280'][1].init(12, 62);
function visit651_280_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['280'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['260'][1].init(12, 37);
function visit650_260_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['260'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['254'][1].init(14, 8);
function visit649_254_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['254'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['251'][1].init(20, 24);
function visit648_251_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['251'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['246'][1].init(10, 5);
function visit647_246_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['246'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['215'][1].init(28, 8);
function visit646_215_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['215'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['210'][1].init(20, 13);
function visit645_210_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['210'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['207'][2].init(36, 31);
function visit644_207_2(result) {
  _$jscoverage['/queryHandlers.js'].branchData['207'][2].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['207'][1].init(25, 42);
function visit643_207_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['207'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['189'][1].init(32, 6);
function visit642_189_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['189'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['186'][1].init(32, 5);
function visit641_186_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['186'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['185'][1].init(30, 25);
function visit640_185_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['185'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['182'][1].init(24, 18);
function visit639_182_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['182'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['181'][2].init(26, 15);
function visit638_181_2(result) {
  _$jscoverage['/queryHandlers.js'].branchData['181'][2].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['181'][1].init(26, 62);
function visit637_181_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['181'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['159'][1].init(24, 23);
function visit636_159_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['159'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['158'][1].init(23, 9);
function visit635_158_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['158'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['157'][1].init(22, 39);
function visit634_157_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['157'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['147'][1].init(24, 23);
function visit633_147_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['147'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['146'][1].init(23, 10);
function visit632_146_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['146'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['145'][1].init(22, 41);
function visit631_145_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['145'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['144'][1].init(20, 7);
function visit630_144_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['144'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['142'][1].init(18, 8);
function visit629_142_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['142'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['135'][1].init(18, 2);
function visit628_135_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['135'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['129'][1].init(16, 8);
function visit627_129_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['129'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['102'][1].init(24, 18);
function visit626_102_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['102'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['99'][1].init(18, 18);
function visit625_99_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['99'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['98'][2].init(20, 15);
function visit624_98_2(result) {
  _$jscoverage['/queryHandlers.js'].branchData['98'][2].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['98'][1].init(20, 56);
function visit623_98_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['98'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['93'][1].init(18, 9);
function visit622_93_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['93'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['91'][1].init(12, 18);
function visit621_91_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['91'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['90'][2].init(14, 16);
function visit620_90_2(result) {
  _$jscoverage['/queryHandlers.js'].branchData['90'][2].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['90'][1].init(14, 51);
function visit619_90_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['90'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['85'][1].init(14, 32);
function visit618_85_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['85'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['78'][1].init(19, 24);
function visit617_78_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['78'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['74'][1].init(25, 26);
function visit616_74_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['74'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['72'][1].init(25, 25);
function visit615_72_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['72'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['70'][1].init(18, 21);
function visit614_70_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['70'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['66'][1].init(16, 32);
function visit613_66_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['66'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['49'][1].init(14, 38);
function visit612_49_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['49'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['43'][1].init(10, 24);
function visit611_43_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['43'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['42'][2].init(12, 23);
function visit610_42_2(result) {
  _$jscoverage['/queryHandlers.js'].branchData['42'][2].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['42'][1].init(12, 62);
function visit609_42_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['42'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].branchData['38'][1].init(23, 111);
function visit608_38_1(result) {
  _$jscoverage['/queryHandlers.js'].branchData['38'][1].ranCondition(result);
  return result;
}_$jscoverage['/queryHandlers.js'].lineData[6]++;
define(['./persistenceManager', './persistenceStoreManager', './persistenceUtils'], function(persistenceManager, persistenceStoreManager, persistenceUtils) {
  _$jscoverage['/queryHandlers.js'].functionData[0]++;
  _$jscoverage['/queryHandlers.js'].lineData[8]++;
  'use strict';
  _$jscoverage['/queryHandlers.js'].lineData[37]++;
  function getOracleRestQueryHandler(storeName, createQueryExp) {
    _$jscoverage['/queryHandlers.js'].functionData[1]++;
    _$jscoverage['/queryHandlers.js'].lineData[38]++;
    createQueryExp = visit608_38_1(createQueryExp || function(urlParams) {
  _$jscoverage['/queryHandlers.js'].functionData[2]++;
  _$jscoverage['/queryHandlers.js'].lineData[39]++;
  return _createQueryFromAdfBcParams(urlParams, null);
});
    _$jscoverage['/queryHandlers.js'].lineData[41]++;
    return function(request, options) {
  _$jscoverage['/queryHandlers.js'].functionData[3]++;
  _$jscoverage['/queryHandlers.js'].lineData[42]++;
  if (visit609_42_1(visit610_42_2(request.method == 'GET') || visit611_43_1(request.method == 'HEAD'))) {
    _$jscoverage['/queryHandlers.js'].lineData[44]++;
    var urlParams = request.url.split('?');
    _$jscoverage['/queryHandlers.js'].lineData[45]++;
    var findQuery = {};
    _$jscoverage['/queryHandlers.js'].lineData[46]++;
    var queryParams;
    _$jscoverage['/queryHandlers.js'].lineData[47]++;
    var queryParamsIter;
    _$jscoverage['/queryHandlers.js'].lineData[49]++;
    if (visit612_49_1(typeof URLSearchParams === 'undefined')) {
      _$jscoverage['/queryHandlers.js'].lineData[52]++;
      queryParamsIter = _parseURLSearchParams(urlParams[1]);
    } else {
      _$jscoverage['/queryHandlers.js'].lineData[54]++;
      queryParamsIter = (new URLSearchParams(urlParams[1])).entries();
    }
    _$jscoverage['/queryHandlers.js'].lineData[57]++;
    var queryParamEntry;
    _$jscoverage['/queryHandlers.js'].lineData[58]++;
    var queryParamName;
    _$jscoverage['/queryHandlers.js'].lineData[59]++;
    var queryParamValue;
    _$jscoverage['/queryHandlers.js'].lineData[60]++;
    var limit;
    _$jscoverage['/queryHandlers.js'].lineData[61]++;
    var offset;
    _$jscoverage['/queryHandlers.js'].lineData[63]++;
    do {
      _$jscoverage['/queryHandlers.js'].lineData[64]++;
      queryParamEntry = queryParamsIter.next();
      _$jscoverage['/queryHandlers.js'].lineData[66]++;
      if (visit613_66_1(queryParamEntry['value'] != null)) {
        _$jscoverage['/queryHandlers.js'].lineData[67]++;
        queryParamName = queryParamEntry['value'][0];
        _$jscoverage['/queryHandlers.js'].lineData[68]++;
        queryParamValue = queryParamEntry['value'][1];
        _$jscoverage['/queryHandlers.js'].lineData[70]++;
        if (visit614_70_1(queryParamName == 'q')) {
          _$jscoverage['/queryHandlers.js'].lineData[71]++;
          queryParams = queryParamValue;
        } else {
          _$jscoverage['/queryHandlers.js'].lineData[72]++;
          if (visit615_72_1(queryParamName == 'limit')) {
            _$jscoverage['/queryHandlers.js'].lineData[73]++;
            limit = queryParamValue;
          } else {
            _$jscoverage['/queryHandlers.js'].lineData[74]++;
            if (visit616_74_1(queryParamName == 'offset')) {
              _$jscoverage['/queryHandlers.js'].lineData[75]++;
              offset = queryParamValue;
            }
          }
        }
      }
    } while (visit617_78_1(!queryParamEntry['done']));
    _$jscoverage['/queryHandlers.js'].lineData[80]++;
    var findQuery = createQueryExp(queryParams);
    _$jscoverage['/queryHandlers.js'].lineData[82]++;
    var shredder;
    _$jscoverage['/queryHandlers.js'].lineData[83]++;
    var unshredder;
    _$jscoverage['/queryHandlers.js'].lineData[85]++;
    if (visit618_85_1(options['jsonProcessor'] != null)) {
      _$jscoverage['/queryHandlers.js'].lineData[86]++;
      shredder = options['jsonProcessor']['shredder'];
      _$jscoverage['/queryHandlers.js'].lineData[87]++;
      unshredder = options['jsonProcessor']['unshredder'];
    }
    _$jscoverage['/queryHandlers.js'].lineData[90]++;
    if (visit619_90_1(visit620_90_2(shredder != null) && visit621_91_1(unshredder != null))) {
      _$jscoverage['/queryHandlers.js'].lineData[92]++;
      return _processQuery(request, storeName, findQuery, shredder, unshredder, offset, limit).then(function(response) {
  _$jscoverage['/queryHandlers.js'].functionData[4]++;
  _$jscoverage['/queryHandlers.js'].lineData[93]++;
  if (visit622_93_1(!response)) {
    _$jscoverage['/queryHandlers.js'].lineData[94]++;
    return Promise.resolve();
  }
  _$jscoverage['/queryHandlers.js'].lineData[96]++;
  var responseClone = response.clone();
  _$jscoverage['/queryHandlers.js'].lineData[97]++;
  return responseClone.text().then(function(payload) {
  _$jscoverage['/queryHandlers.js'].functionData[5]++;
  _$jscoverage['/queryHandlers.js'].lineData[98]++;
  if (visit623_98_1(visit624_98_2(payload != null) && visit625_99_1(payload.length > 0))) {
    _$jscoverage['/queryHandlers.js'].lineData[100]++;
    try {
      _$jscoverage['/queryHandlers.js'].lineData[101]++;
      var payloadJson = JSON.parse(payload);
      _$jscoverage['/queryHandlers.js'].lineData[102]++;
      if (visit626_102_1(!payloadJson.links)) {
        _$jscoverage['/queryHandlers.js'].lineData[103]++;
        payloadJson.links = [{
  rel: 'self', 
  href: request.url}];
        _$jscoverage['/queryHandlers.js'].lineData[104]++;
        return persistenceUtils.setResponsePayload(response, payloadJson).then(function(response) {
  _$jscoverage['/queryHandlers.js'].functionData[6]++;
  _$jscoverage['/queryHandlers.js'].lineData[105]++;
  return Promise.resolve(response);
});
      } else {
        _$jscoverage['/queryHandlers.js'].lineData[108]++;
        return Promise.resolve(response);
      }
    }    catch (err) {
}
  }
});
});
    }
  }
  _$jscoverage['/queryHandlers.js'].lineData[117]++;
  return Promise.resolve();
};
  }
  _$jscoverage['/queryHandlers.js'].lineData[119]++;
  ;
  _$jscoverage['/queryHandlers.js'].lineData[121]++;
  function _processQuery(request, storeName, findQuery, shredder, unshredder, offset, limit) {
    _$jscoverage['/queryHandlers.js'].functionData[7]++;
    _$jscoverage['/queryHandlers.js'].lineData[122]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/queryHandlers.js'].functionData[8]++;
  _$jscoverage['/queryHandlers.js'].lineData[127]++;
  persistenceManager.getCache().hasMatch(request, {
  ignoreSearch: true}).then(function(hasMatch) {
  _$jscoverage['/queryHandlers.js'].functionData[9]++;
  _$jscoverage['/queryHandlers.js'].lineData[236]++;
  persistenceStoreManager.openStore(storeName).then(function(store) {
  _$jscoverage['/queryHandlers.js'].functionData[10]++;
  _$jscoverage['/queryHandlers.js'].lineData[129]++;
  if (visit627_129_1(hasMatch)) {
    _$jscoverage['/queryHandlers.js'].lineData[131]++;
    return store.find(findQuery);
  } else {
    _$jscoverage['/queryHandlers.js'].lineData[134]++;
    var id = _getRequestUrlId(request);
    _$jscoverage['/queryHandlers.js'].lineData[135]++;
    if (visit628_135_1(id)) {
      _$jscoverage['/queryHandlers.js'].lineData[136]++;
      return store.findByKey(id);
    }
    _$jscoverage['/queryHandlers.js'].lineData[138]++;
    return Promise.resolve([]);
  }
}).then(function(results) {
  _$jscoverage['/queryHandlers.js'].functionData[11]++;
  _$jscoverage['/queryHandlers.js'].lineData[141]++;
  persistenceManager.getCache().match(request, {
  ignoreSearch: true}).then(function(response) {
  _$jscoverage['/queryHandlers.js'].functionData[12]++;
  _$jscoverage['/queryHandlers.js'].lineData[142]++;
  if (visit629_142_1(response)) {
    _$jscoverage['/queryHandlers.js'].lineData[143]++;
    var hasMore = false;
    _$jscoverage['/queryHandlers.js'].lineData[144]++;
    if (visit630_144_1(results)) {
      _$jscoverage['/queryHandlers.js'].lineData[145]++;
      if (visit631_145_1(offset && visit632_146_1(offset > 0))) {
        _$jscoverage['/queryHandlers.js'].lineData[147]++;
        if (visit633_147_1(offset < results.length)) {
          _$jscoverage['/queryHandlers.js'].lineData[149]++;
          hasMore = true;
        } else {
          _$jscoverage['/queryHandlers.js'].lineData[153]++;
          hasMore = false;
        }
        _$jscoverage['/queryHandlers.js'].lineData[155]++;
        results = results.slice(offset, results.length);
      }
      _$jscoverage['/queryHandlers.js'].lineData[157]++;
      if (visit634_157_1(limit && visit635_158_1(limit > 0))) {
        _$jscoverage['/queryHandlers.js'].lineData[159]++;
        if (visit636_159_1(limit <= results.length)) {
          _$jscoverage['/queryHandlers.js'].lineData[161]++;
          hasMore = true;
        } else {
          _$jscoverage['/queryHandlers.js'].lineData[165]++;
          hasMore = false;
        }
        _$jscoverage['/queryHandlers.js'].lineData[167]++;
        results = results.slice(0, limit);
      }
    }
    _$jscoverage['/queryHandlers.js'].lineData[170]++;
    shredder(response).then(function(dataArray) {
  _$jscoverage['/queryHandlers.js'].functionData[13]++;
  _$jscoverage['/queryHandlers.js'].lineData[171]++;
  var resourceType = dataArray[0].resourceType;
  _$jscoverage['/queryHandlers.js'].lineData[172]++;
  var transformedResults = {
  name: storeName, 
  data: results, 
  resourceType: resourceType};
  _$jscoverage['/queryHandlers.js'].lineData[177]++;
  unshredder([transformedResults], response).then(function(response) {
  _$jscoverage['/queryHandlers.js'].functionData[14]++;
  _$jscoverage['/queryHandlers.js'].lineData[179]++;
  var responseClone = response.clone();
  _$jscoverage['/queryHandlers.js'].lineData[180]++;
  responseClone.text().then(function(payload) {
  _$jscoverage['/queryHandlers.js'].functionData[15]++;
  _$jscoverage['/queryHandlers.js'].lineData[181]++;
  if (visit637_181_1(visit638_181_2(payload != null) && visit639_182_1(payload.length > 0))) {
    _$jscoverage['/queryHandlers.js'].lineData[183]++;
    try {
      _$jscoverage['/queryHandlers.js'].lineData[184]++;
      var payloadJson = JSON.parse(payload);
      _$jscoverage['/queryHandlers.js'].lineData[185]++;
      if (visit640_185_1(payloadJson.items != null)) {
        _$jscoverage['/queryHandlers.js'].lineData[186]++;
        if (visit641_186_1(limit)) {
          _$jscoverage['/queryHandlers.js'].lineData[187]++;
          payloadJson.limit = parseInt(limit, 10);
        }
        _$jscoverage['/queryHandlers.js'].lineData[189]++;
        if (visit642_189_1(offset)) {
          _$jscoverage['/queryHandlers.js'].lineData[190]++;
          payloadJson.offset = parseInt(offset, 10);
        }
        _$jscoverage['/queryHandlers.js'].lineData[192]++;
        payloadJson.hasMore = hasMore;
      }
      _$jscoverage['/queryHandlers.js'].lineData[194]++;
      persistenceUtils.setResponsePayload(response, payloadJson).then(function(response) {
  _$jscoverage['/queryHandlers.js'].functionData[16]++;
  _$jscoverage['/queryHandlers.js'].lineData[195]++;
  resolve(response);
  _$jscoverage['/queryHandlers.js'].lineData[196]++;
  return;
});
    }    catch (err) {
}
  } else {
    _$jscoverage['/queryHandlers.js'].lineData[201]++;
    resolve(response);
    _$jscoverage['/queryHandlers.js'].lineData[202]++;
    return;
  }
});
});
});
  } else {
    _$jscoverage['/queryHandlers.js'].lineData[207]++;
    if (visit643_207_1(results && visit644_207_2(Object.keys(results).length > 0))) {
      _$jscoverage['/queryHandlers.js'].lineData[209]++;
      var collectionUrl = _getRequestCollectionUrl(request);
      _$jscoverage['/queryHandlers.js'].lineData[210]++;
      if (visit645_210_1(collectionUrl)) {
        _$jscoverage['/queryHandlers.js'].lineData[211]++;
        persistenceUtils.requestToJSON(request).then(function(requestObj) {
  _$jscoverage['/queryHandlers.js'].functionData[17]++;
  _$jscoverage['/queryHandlers.js'].lineData[212]++;
  requestObj.url = collectionUrl;
  _$jscoverage['/queryHandlers.js'].lineData[213]++;
  persistenceUtils.requestFromJSON(requestObj).then(function(collectionRequest) {
  _$jscoverage['/queryHandlers.js'].functionData[18]++;
  _$jscoverage['/queryHandlers.js'].lineData[214]++;
  persistenceManager.getCache().match(collectionRequest, {
  ignoreSearch: true}).then(function(response) {
  _$jscoverage['/queryHandlers.js'].functionData[19]++;
  _$jscoverage['/queryHandlers.js'].lineData[215]++;
  if (visit646_215_1(response)) {
    _$jscoverage['/queryHandlers.js'].lineData[216]++;
    var transformedResults = {
  name: storeName, 
  data: [results], 
  resourceType: 'single'};
    _$jscoverage['/queryHandlers.js'].lineData[221]++;
    unshredder([transformedResults], response).then(function(response) {
  _$jscoverage['/queryHandlers.js'].functionData[20]++;
  _$jscoverage['/queryHandlers.js'].lineData[222]++;
  resolve(response);
  _$jscoverage['/queryHandlers.js'].lineData[223]++;
  return;
});
  }
});
});
});
      } else {
        _$jscoverage['/queryHandlers.js'].lineData[230]++;
        resolve();
      }
    } else {
      _$jscoverage['/queryHandlers.js'].lineData[233]++;
      resolve();
    }
  }
});
}).catch(function(err) {
  _$jscoverage['/queryHandlers.js'].functionData[21]++;
  _$jscoverage['/queryHandlers.js'].lineData[237]++;
  reject(err);
});
});
});
  }
  _$jscoverage['/queryHandlers.js'].lineData[241]++;
  ;
  _$jscoverage['/queryHandlers.js'].lineData[243]++;
  function _createQueryFromAdfBcParams(value) {
    _$jscoverage['/queryHandlers.js'].functionData[22]++;
    _$jscoverage['/queryHandlers.js'].lineData[244]++;
    var findQuery = {};
    _$jscoverage['/queryHandlers.js'].lineData[246]++;
    if (visit647_246_1(value)) {
      _$jscoverage['/queryHandlers.js'].lineData[247]++;
      var queryExpArray = value.split(';');
      _$jscoverage['/queryHandlers.js'].lineData[248]++;
      var i;
      _$jscoverage['/queryHandlers.js'].lineData[249]++;
      var queryKey;
      _$jscoverage['/queryHandlers.js'].lineData[250]++;
      var selectorQuery = {};
      _$jscoverage['/queryHandlers.js'].lineData[251]++;
      for (i = 0; visit648_251_1(i < queryExpArray.length); i++) {
        _$jscoverage['/queryHandlers.js'].lineData[252]++;
        queryKey = queryExpArray[i].split('=')[0];
        _$jscoverage['/queryHandlers.js'].lineData[254]++;
        if (visit649_254_1(queryKey)) {
          _$jscoverage['/queryHandlers.js'].lineData[255]++;
          var queryVal = queryExpArray[i].split('=')[1].replace(/^"|'(.*)'|"$/, '$1');
          _$jscoverage['/queryHandlers.js'].lineData[256]++;
          selectorQuery["value." + queryKey] = queryVal;
        }
      }
      _$jscoverage['/queryHandlers.js'].lineData[260]++;
      if (visit650_260_1(Object.keys(selectorQuery).length > 0)) {
        _$jscoverage['/queryHandlers.js'].lineData[261]++;
        findQuery.selector = selectorQuery;
      }
    }
    _$jscoverage['/queryHandlers.js'].lineData[264]++;
    return findQuery;
  }
  _$jscoverage['/queryHandlers.js'].lineData[265]++;
  ;
  _$jscoverage['/queryHandlers.js'].lineData[278]++;
  function getSimpleQueryHandler(storeName, ignoreUrlParams) {
    _$jscoverage['/queryHandlers.js'].functionData[23]++;
    _$jscoverage['/queryHandlers.js'].lineData[279]++;
    return function(request, options) {
  _$jscoverage['/queryHandlers.js'].functionData[24]++;
  _$jscoverage['/queryHandlers.js'].lineData[280]++;
  if (visit651_280_1(visit652_280_2(request.method == 'GET') || visit653_281_1(request.method == 'HEAD'))) {
    _$jscoverage['/queryHandlers.js'].lineData[285]++;
    var urlParams = request.url.split('?');
    _$jscoverage['/queryHandlers.js'].lineData[286]++;
    var findQuery = _createQueryFromUrlParams(urlParams, ignoreUrlParams);
    _$jscoverage['/queryHandlers.js'].lineData[288]++;
    var shredder;
    _$jscoverage['/queryHandlers.js'].lineData[289]++;
    var unshredder;
    _$jscoverage['/queryHandlers.js'].lineData[291]++;
    if (visit654_291_1(options['jsonProcessor'] != null)) {
      _$jscoverage['/queryHandlers.js'].lineData[292]++;
      shredder = options['jsonProcessor']['shredder'];
      _$jscoverage['/queryHandlers.js'].lineData[293]++;
      unshredder = options['jsonProcessor']['unshredder'];
    }
    _$jscoverage['/queryHandlers.js'].lineData[296]++;
    if (visit655_296_1(visit656_296_2(shredder != null) && visit657_297_1(unshredder != null))) {
      _$jscoverage['/queryHandlers.js'].lineData[298]++;
      return _processQuery(request, storeName, findQuery, shredder, unshredder);
    }
  }
  _$jscoverage['/queryHandlers.js'].lineData[301]++;
  return Promise.resolve();
};
  }
  _$jscoverage['/queryHandlers.js'].lineData[303]++;
  ;
  _$jscoverage['/queryHandlers.js'].lineData[305]++;
  function _createQueryFromUrlParams(urlParams, ignoreUrlParams) {
    _$jscoverage['/queryHandlers.js'].functionData[25]++;
    _$jscoverage['/queryHandlers.js'].lineData[306]++;
    var findQuery = {};
    _$jscoverage['/queryHandlers.js'].lineData[308]++;
    if (visit658_308_1(urlParams && visit659_309_1(urlParams.length > 1))) {
      _$jscoverage['/queryHandlers.js'].lineData[310]++;
      var selectorQuery = {};
      _$jscoverage['/queryHandlers.js'].lineData[311]++;
      var queryParamsIter;
      _$jscoverage['/queryHandlers.js'].lineData[313]++;
      if (visit660_313_1(typeof URLSearchParams === 'undefined')) {
        _$jscoverage['/queryHandlers.js'].lineData[316]++;
        queryParamsIter = _parseURLSearchParams(urlParams[1]);
      } else {
        _$jscoverage['/queryHandlers.js'].lineData[318]++;
        queryParamsIter = (new URLSearchParams(urlParams[1])).entries();
      }
      _$jscoverage['/queryHandlers.js'].lineData[321]++;
      var queryParamEntry;
      _$jscoverage['/queryHandlers.js'].lineData[322]++;
      var queryParamName;
      _$jscoverage['/queryHandlers.js'].lineData[323]++;
      var queryParamValue;
      _$jscoverage['/queryHandlers.js'].lineData[325]++;
      do {
        _$jscoverage['/queryHandlers.js'].lineData[326]++;
        queryParamEntry = queryParamsIter.next();
        _$jscoverage['/queryHandlers.js'].lineData[328]++;
        if (visit661_328_1(queryParamEntry['value'] != null)) {
          _$jscoverage['/queryHandlers.js'].lineData[329]++;
          queryParamName = queryParamEntry['value'][0];
          _$jscoverage['/queryHandlers.js'].lineData[330]++;
          queryParamValue = queryParamEntry['value'][1];
          _$jscoverage['/queryHandlers.js'].lineData[332]++;
          if (visit662_332_1(!ignoreUrlParams || visit663_333_1(ignoreUrlParams.indexOf(queryParamName) == -1))) {
            _$jscoverage['/queryHandlers.js'].lineData[335]++;
            selectorQuery["value." + queryParamName] = queryParamValue;
          }
        }
      } while (visit664_338_1(!queryParamEntry['done']));
      _$jscoverage['/queryHandlers.js'].lineData[340]++;
      if (visit665_340_1(Object.keys(selectorQuery).length > 0)) {
        _$jscoverage['/queryHandlers.js'].lineData[341]++;
        findQuery.selector = selectorQuery;
      }
    }
    _$jscoverage['/queryHandlers.js'].lineData[344]++;
    return findQuery;
  }
  _$jscoverage['/queryHandlers.js'].lineData[345]++;
  ;
  _$jscoverage['/queryHandlers.js'].lineData[347]++;
  function _parseURLSearchParams(query) {
    _$jscoverage['/queryHandlers.js'].functionData[26]++;
    _$jscoverage['/queryHandlers.js'].lineData[350]++;
    var params = [];
    _$jscoverage['/queryHandlers.js'].lineData[351]++;
    if (visit666_351_1(query != null)) {
      _$jscoverage['/queryHandlers.js'].lineData[353]++;
      if (visit667_353_1(query.charAt(0) === '?')) {
        _$jscoverage['/queryHandlers.js'].lineData[354]++;
        query = query.slice(1);
      }
      _$jscoverage['/queryHandlers.js'].lineData[356]++;
      query = visit668_356_1(query || '');
      _$jscoverage['/queryHandlers.js'].lineData[357]++;
      var paramPairs = query.split('&');
      _$jscoverage['/queryHandlers.js'].lineData[358]++;
      var paramName;
      _$jscoverage['/queryHandlers.js'].lineData[359]++;
      var paramValue;
      _$jscoverage['/queryHandlers.js'].lineData[360]++;
      var index;
      _$jscoverage['/queryHandlers.js'].lineData[361]++;
      params = paramPairs.map(function(paramPair) {
  _$jscoverage['/queryHandlers.js'].functionData[27]++;
  _$jscoverage['/queryHandlers.js'].lineData[362]++;
  index = paramPair.indexOf('=');
  _$jscoverage['/queryHandlers.js'].lineData[364]++;
  if (visit669_364_1(index > -1)) {
    _$jscoverage['/queryHandlers.js'].lineData[365]++;
    paramName = paramPair.slice(0, index);
    _$jscoverage['/queryHandlers.js'].lineData[366]++;
    paramValue = paramPair.slice(index + 1);
    _$jscoverage['/queryHandlers.js'].lineData[367]++;
    paramValue = _cleanURIValue(paramValue);
  } else {
    _$jscoverage['/queryHandlers.js'].lineData[369]++;
    paramName = paramPair;
    _$jscoverage['/queryHandlers.js'].lineData[370]++;
    paramValue = '';
  }
  _$jscoverage['/queryHandlers.js'].lineData[372]++;
  paramName = _cleanURIValue(paramName);
  _$jscoverage['/queryHandlers.js'].lineData[373]++;
  return [paramName, paramValue];
});
    }
    _$jscoverage['/queryHandlers.js'].lineData[377]++;
    var iterator = {
  next: function() {
  _$jscoverage['/queryHandlers.js'].functionData[28]++;
  _$jscoverage['/queryHandlers.js'].lineData[380]++;
  var value = params.shift();
  _$jscoverage['/queryHandlers.js'].lineData[381]++;
  return {
  done: visit670_381_1(value === undefined), 
  value: value};
}};
    _$jscoverage['/queryHandlers.js'].lineData[385]++;
    return iterator;
  }
  _$jscoverage['/queryHandlers.js'].lineData[386]++;
  ;
  _$jscoverage['/queryHandlers.js'].lineData[388]++;
  function _cleanURIValue(value) {
    _$jscoverage['/queryHandlers.js'].functionData[29]++;
    _$jscoverage['/queryHandlers.js'].lineData[389]++;
    return decodeURIComponent(value.replace(/\+/g, ' '));
  }
  _$jscoverage['/queryHandlers.js'].lineData[390]++;
  ;
  _$jscoverage['/queryHandlers.js'].lineData[392]++;
  function _getRequestUrlId(request) {
    _$jscoverage['/queryHandlers.js'].functionData[30]++;
    _$jscoverage['/queryHandlers.js'].lineData[393]++;
    var urlTokens = request.url.split('/');
    _$jscoverage['/queryHandlers.js'].lineData[394]++;
    if (visit671_394_1(urlTokens.length > 1)) {
      _$jscoverage['/queryHandlers.js'].lineData[395]++;
      return urlTokens[urlTokens.length - 1];
    }
    _$jscoverage['/queryHandlers.js'].lineData[397]++;
    return null;
  }
  _$jscoverage['/queryHandlers.js'].lineData[398]++;
  ;
  _$jscoverage['/queryHandlers.js'].lineData[400]++;
  function _getRequestCollectionUrl(request) {
    _$jscoverage['/queryHandlers.js'].functionData[31]++;
    _$jscoverage['/queryHandlers.js'].lineData[401]++;
    var urlTokens = request.url.split('/');
    _$jscoverage['/queryHandlers.js'].lineData[402]++;
    if (visit672_402_1(urlTokens.length > 1)) {
      _$jscoverage['/queryHandlers.js'].lineData[403]++;
      var id = _getRequestUrlId(request);
      _$jscoverage['/queryHandlers.js'].lineData[404]++;
      return request.url.substring(0, request.url.length - id.length - 1);
    }
    _$jscoverage['/queryHandlers.js'].lineData[406]++;
    return null;
  }
  _$jscoverage['/queryHandlers.js'].lineData[407]++;
  ;
  _$jscoverage['/queryHandlers.js'].lineData[409]++;
  return {
  'getSimpleQueryHandler': getSimpleQueryHandler, 
  'getOracleRestQueryHandler': getOracleRestQueryHandler};
});
