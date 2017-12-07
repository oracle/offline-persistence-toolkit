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
if (! _$jscoverage['/impl/PersistenceSyncManager.js']) {
  _$jscoverage['/impl/PersistenceSyncManager.js'] = {};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[6] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[8] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[10] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[11] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[15] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[18] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[21] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[24] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[26] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[27] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[30] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[31] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[32] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[35] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[37] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[41] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[43] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[45] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[47] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[50] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[51] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[52] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[54] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[56] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[57] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[58] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[59] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[62] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[64] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[65] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[66] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[69] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[70] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[72] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[73] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[74] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[75] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[77] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[78] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[80] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[81] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[82] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[83] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[85] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[86] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[89] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[92] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[95] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[98] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[100] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[101] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[106] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[107] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[108] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[109] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[111] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[112] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[114] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[115] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[118] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[120] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[122] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[123] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[124] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[129] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[130] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[133] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[134] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[135] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[136] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[140] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[141] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[142] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[143] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[144] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[146] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[147] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[148] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[149] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[150] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[152] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[153] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[154] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[156] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[157] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[158] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[161] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[164] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[165] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[166] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[167] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[169] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[170] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[171] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[173] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[175] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[176] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[177] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[178] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[181] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[182] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[186] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[188] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[192] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[193] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[194] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[195] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[196] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[198] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[199] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[200] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[201] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[205] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[208] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[211] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[216] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[219] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[221] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[222] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[224] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[229] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[230] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[231] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[233] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[239] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[240] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[242] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[245] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[248] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[249] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[250] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[251] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[252] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[254] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[255] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[256] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[261] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[263] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[264] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[265] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[266] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[269] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[270] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[271] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[272] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[274] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[275] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[276] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[277] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[278] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[279] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[280] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[281] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[283] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[285] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[287] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[290] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[291] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[292] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[293] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[295] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[296] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[300] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[301] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[306] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[307] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[309] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[310] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[311] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[312] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[314] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[317] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[319] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[320] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[321] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[323] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[324] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[326] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[328] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[331] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[332] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[334] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[336] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[339] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[341] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[342] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[344] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[345] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[348] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[351] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[353] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[355] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[356] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[358] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[360] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[361] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[362] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[365] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[367] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[368] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[369] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[370] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[371] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[372] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[373] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[375] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[377] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[378] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[379] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[380] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[381] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[382] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[384] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[388] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[390] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[392] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[393] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[394] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[395] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[396] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[397] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[398] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[399] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[400] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[401] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[402] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[403] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[407] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[410] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[412] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[413] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[414] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[415] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[416] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[417] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[418] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[419] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[420] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[421] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[422] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[423] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[424] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[425] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[427] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[428] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[430] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[431] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[433] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[435] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[436] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[437] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[440] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[442] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[443] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[446] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[448] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[449] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[451] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[453] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[454] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[455] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[458] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[460] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[461] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[464] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[466] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[467] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[468] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[469] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[470] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[472] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[473] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[474] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[475] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[476] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[477] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[479] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[482] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[483] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[484] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[485] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[486] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[488] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[492] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[493] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[498] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[499] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[502] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[503] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[507] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[509] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[510] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[511] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[516] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[519] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[521] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[523] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[524] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[525] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[526] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[527] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[529] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[530] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[531] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[535] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[537] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[538] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[539] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[540] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[541] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[543] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[544] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[548] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[549] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[551] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[552] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[553] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[555] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[556] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[557] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[560] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[562] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[563] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[564] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[566] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[567] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[568] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[570] = 0;
}
if (! _$jscoverage['/impl/PersistenceSyncManager.js'].functionData) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[0] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[1] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[2] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[3] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[4] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[5] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[6] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[7] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[8] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[9] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[10] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[11] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[12] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[13] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[14] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[15] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[16] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[17] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[18] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[19] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[20] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[21] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[22] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[23] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[24] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[25] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[26] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[27] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[28] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[29] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[30] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[31] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[32] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[33] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[34] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[35] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[36] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[37] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[38] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[39] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[40] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[41] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[42] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[43] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[44] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[45] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[46] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[47] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[48] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[49] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[50] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[51] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[52] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[53] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[54] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[55] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[56] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[57] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[58] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[59] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[60] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[61] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[62] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[63] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[64] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[65] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[66] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[67] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[68] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[69] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[70] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[71] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[72] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[73] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[74] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[75] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[76] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[77] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[78] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[79] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[80] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[81] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[82] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[83] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[84] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[85] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[86] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[87] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[88] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[89] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[90] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[91] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[92] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[93] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[94] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[95] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[96] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[97] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[98] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[99] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[100] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[101] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[102] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[103] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[104] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[105] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[106] = 0;
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[107] = 0;
}
if (! _$jscoverage['/impl/PersistenceSyncManager.js'].branchData) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData = {};
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['32'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['32'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['32'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['33'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['33'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['33'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['34'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['34'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['43'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['43'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['77'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['77'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['80'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['80'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['83'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['83'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['83'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['84'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['84'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['141'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['141'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['143'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['143'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['149'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['149'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['153'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['153'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['156'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['156'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['165'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['165'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['169'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['169'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['170'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['170'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['171'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['171'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['181'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['181'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['193'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['193'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['196'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['196'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['196'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['197'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['197'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['219'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['219'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['266'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['266'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['266'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['267'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['267'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['267'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['268'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['268'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['269'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['269'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['271'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['271'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['280'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['280'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['285'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['285'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['286'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['286'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['292'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['292'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['310'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['310'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['311'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['311'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['317'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['317'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['318'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['318'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['323'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['323'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['326'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['326'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['326'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['327'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['327'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['331'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['331'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['334'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['334'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['334'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['335'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['335'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['373'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['373'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['374'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['374'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['399'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['399'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['400'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['400'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['435'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['435'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['453'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['453'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['469'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['469'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['474'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['474'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['479'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['479'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['479'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['480'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['480'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['480'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['484'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['484'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['485'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['485'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['493'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['493'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['493'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['494'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['494'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['494'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['495'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['495'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['507'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['507'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['531'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['531'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['531'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['532'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['532'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['532'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['532'][3] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['533'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['533'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['533'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['533'][3] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['538'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['538'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['540'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['540'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['543'] = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['543'][1] = new BranchData();
}
_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['543'][1].init(14, 25);
function visit318_543_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['543'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['540'][1].init(14, 14);
function visit317_540_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['540'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['538'][1].init(10, 25);
function visit316_538_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['538'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['533'][3].init(27, 27);
function visit315_533_3(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['533'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['533'][2].init(12, 11);
function visit314_533_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['533'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['533'][1].init(12, 42);
function visit313_533_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['533'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['532'][3].init(11, 11);
function visit312_532_3(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['532'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['532'][2].init(11, 45);
function visit311_532_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['532'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['532'][1].init(11, 104);
function visit310_532_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['532'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['531'][2].init(15, 45);
function visit309_531_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['531'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['531'][1].init(15, 166);
function visit308_531_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['531'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['507'][1].init(23, 21);
function visit307_507_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['507'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['495'][1].init(18, 24);
function visit306_495_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['495'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['494'][2].init(18, 26);
function visit305_494_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['494'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['494'][1].init(18, 73);
function visit304_494_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['494'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['493'][2].init(20, 21);
function visit303_493_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['493'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['493'][1].init(20, 117);
function visit302_493_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['493'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['485'][1].init(20, 6);
function visit301_485_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['485'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['484'][1].init(26, 21);
function visit300_484_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['484'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['480'][2].init(15, 21);
function visit299_480_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['480'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['480'][1].init(15, 31);
function visit298_480_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['480'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['479'][2].init(16, 21);
function visit297_479_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['479'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['479'][1].init(16, 74);
function visit296_479_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['479'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['474'][1].init(14, 26);
function visit295_474_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['474'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['469'][1].init(12, 37);
function visit294_469_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['469'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['453'][1].init(14, 25);
function visit293_453_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['453'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['435'][1].init(14, 25);
function visit292_435_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['435'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['400'][1].init(16, 34);
function visit291_400_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['400'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['399'][1].init(22, 16);
function visit290_399_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['399'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['374'][1].init(12, 28);
function visit289_374_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['374'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['373'][1].init(14, 62);
function visit288_373_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['373'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['335'][1].init(12, 24);
function visit287_335_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['335'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['334'][2].init(14, 23);
function visit286_334_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['334'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['334'][1].init(14, 64);
function visit285_334_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['334'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['331'][1].init(20, 26);
function visit284_331_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['331'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['327'][1].init(12, 24);
function visit283_327_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['327'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['326'][2].init(14, 23);
function visit282_326_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['326'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['326'][1].init(14, 64);
function visit281_326_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['326'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['323'][1].init(20, 26);
function visit280_323_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['323'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['318'][1].init(8, 26);
function visit279_318_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['318'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['317'][1].init(10, 54);
function visit278_317_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['317'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['311'][1].init(13, 33);
function visit277_311_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['311'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['310'][1].init(24, 21);
function visit276_310_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['310'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['292'][1].init(18, 17);
function visit275_292_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['292'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['286'][1].init(16, 60);
function visit274_286_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['286'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['285'][1].init(18, 109);
function visit273_285_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['285'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['280'][1].init(15, 44);
function visit272_280_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['280'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['271'][1].init(19, 42);
function visit271_271_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['271'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['269'][1].init(12, 17);
function visit270_269_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['269'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['268'][1].init(8, 56);
function visit269_268_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['268'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['267'][2].init(8, 43);
function visit268_267_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['267'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['267'][1].init(8, 112);
function visit267_267_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['267'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['266'][2].init(10, 19);
function visit266_266_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['266'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['266'][1].init(10, 144);
function visit265_266_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['266'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['219'][1].init(26, 13);
function visit264_219_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['219'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['197'][1].init(34, 24);
function visit263_197_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['197'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['196'][2].init(36, 23);
function visit262_196_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['196'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['196'][1].init(36, 86);
function visit261_196_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['196'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['193'][1].init(32, 36);
function visit260_193_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['193'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['181'][1].init(28, 17);
function visit259_181_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['181'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['171'][1].init(24, 31);
function visit258_171_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['171'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['170'][1].init(22, 29);
function visit257_170_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['170'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['169'][1].init(32, 17);
function visit256_169_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['169'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['165'][1].init(22, 27);
function visit255_165_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['165'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['156'][1].init(18, 19);
function visit254_156_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['156'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['153'][1].init(18, 20);
function visit253_153_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['153'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['149'][1].init(14, 16);
function visit252_149_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['149'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['143'][1].init(10, 13);
function visit251_143_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['143'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['141'][1].init(22, 13);
function visit250_141_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['141'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['84'][1].init(20, 28);
function visit249_84_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['84'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['83'][2].init(22, 28);
function visit248_83_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['83'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['83'][1].init(22, 81);
function visit247_83_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['83'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['80'][1].init(16, 25);
function visit246_80_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['80'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['77'][1].init(14, 15);
function visit245_77_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['77'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['43'][1].init(10, 21);
function visit244_43_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['43'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['34'][1].init(10, 28);
function visit243_34_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['34'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['33'][2].init(10, 34);
function visit242_33_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['33'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['33'][1].init(10, 77);
function visit241_33_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['33'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['32'][2].init(12, 40);
function visit240_32_2(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['32'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].branchData['32'][1].init(12, 132);
function visit239_32_1(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].branchData['32'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceSyncManager.js'].lineData[6]++;
define(['require', '../persistenceUtils', '../persistenceStoreManager', './defaultCacheHandler', './logger'], function(require, persistenceUtils, persistenceStoreManager, cacheHandler, logger) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[0]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[8]++;
  'use strict';
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[10]++;
  function PersistenceSyncManager(isOnline, browserFetch, cache) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[1]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[11]++;
    Object.defineProperty(this, '_eventListeners', {
  value: [], 
  writable: true});
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[15]++;
    Object.defineProperty(this, '_isOnline', {
  value: isOnline});
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[18]++;
    Object.defineProperty(this, '_browserFetch', {
  value: browserFetch});
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[21]++;
    Object.defineProperty(this, '_cache', {
  value: cache});
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[24]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[26]++;
  PersistenceSyncManager.prototype.addEventListener = function(type, listener, scope) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[2]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[27]++;
  this._eventListeners.push({
  type: type.toLowerCase(), 
  listener: listener, 
  scope: scope});
};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[30]++;
  PersistenceSyncManager.prototype.removeEventListener = function(type, listener, scope) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[3]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[31]++;
  this._eventListeners = this._eventListeners.filter(function(eventListener) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[4]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[32]++;
  if (visit239_32_1(visit240_32_2(type.toLowerCase() == eventListener.type) && visit241_33_1(visit242_33_2(listener == eventListener.listener) && visit243_34_1(scope == eventListener.scope)))) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[35]++;
    return false;
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[37]++;
  return true;
});
};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[41]++;
  PersistenceSyncManager.prototype.getSyncLog = function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[5]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[43]++;
  if (visit244_43_1(!this._readingSyncLog)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[45]++;
    this._readingSyncLog = _getSyncLog(this);
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[47]++;
  return this._readingSyncLog;
};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[50]++;
  function _getSyncLog(persistenceSyncManager) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[6]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[51]++;
    var self = persistenceSyncManager;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[52]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[7]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[58]++;
  _findSyncLogRecords().then(function(results) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[8]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[54]++;
  return _generateSyncLog(results);
}).then(function(syncLog) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[9]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[56]++;
  self._readingSyncLog = null;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[57]++;
  resolve(syncLog);
}).catch(function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[10]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[59]++;
  reject(err);
});
});
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[62]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[64]++;
  PersistenceSyncManager.prototype.insertRequest = function(request, options) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[11]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[65]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[12]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[66]++;
  var localVars = {};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[100]++;
  _getSyncLogStorage().then(function(store) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[13]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[69]++;
  localVars.store = store;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[70]++;
  return persistenceUtils.requestToJSON(request, {
  '_noClone': true});
}).then(function(requestData) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[14]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[72]++;
  localVars.requestData = requestData;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[73]++;
  localVars.metadata = cacheHandler.constructMetadata(request);
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[74]++;
  localVars.requestId = localVars.metadata.created.toString();
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[75]++;
  return localVars.store.upsert(localVars.requestId, localVars.metadata, localVars.requestData);
}).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[15]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[77]++;
  if (visit245_77_1(options != null)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[78]++;
    var undoRedoDataArray = options.undoRedoDataArray;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[80]++;
    if (visit246_80_1(undoRedoDataArray != null)) {
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[81]++;
      _getRedoUndoStorage().then(function(redoUndoStore) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[16]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[82]++;
  var storeUndoRedoData = function(i) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[17]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[83]++;
  if (visit247_83_1(visit248_83_2(i < undoRedoDataArray.length) && visit249_84_1(undoRedoDataArray[i] != null))) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[85]++;
    redoUndoStore.upsert(localVars.requestId, localVars.metadata, undoRedoDataArray[i]).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[18]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[86]++;
  storeUndoRedoData(++i);
});
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[89]++;
    resolve();
  }
};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[92]++;
  storeUndoRedoData(0);
});
    } else {
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[95]++;
      resolve();
    }
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[98]++;
    resolve();
  }
}).catch(function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[19]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[101]++;
  reject(err);
});
});
};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[106]++;
  PersistenceSyncManager.prototype.removeRequest = function(requestId) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[20]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[107]++;
  var self = this;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[108]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[21]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[109]++;
  var localVars = {};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[123]++;
  _getSyncLogStorage().then(function(store) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[22]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[111]++;
  localVars.store = store;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[112]++;
  return _getRequestFromSyncLog(self, requestId);
}).then(function(request) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[23]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[114]++;
  localVars.request = request;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[115]++;
  return localVars.store.removeByKey(requestId);
}).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[24]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[118]++;
  return _getRedoUndoStorage();
}).then(function(redoUndoStore) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[25]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[120]++;
  return redoUndoStore.removeByKey(requestId);
}).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[26]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[122]++;
  resolve(localVars.request);
}).catch(function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[27]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[124]++;
  reject(err);
});
});
};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[129]++;
  PersistenceSyncManager.prototype.updateRequest = function(requestId, request) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[28]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[130]++;
  return Promise.all([_getSyncLogStorage(), persistenceUtils.requestToJSON(request)]).then(function(values) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[29]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[133]++;
  var store = values[0];
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[134]++;
  var requestData = values[1];
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[135]++;
  var metadata = cacheHandler.constructMetadata(request);
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[136]++;
  return store.upsert(requestId, metadata, requestData);
});
};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[140]++;
  PersistenceSyncManager.prototype.sync = function(options) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[30]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[141]++;
  this._options = visit250_141_1(options || {});
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[142]++;
  var self = this;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[143]++;
  if (visit251_143_1(this._syncing)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[144]++;
    return Promise.reject('Cannot start sync while sync is in progress');
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[146]++;
  this._syncing = true;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[147]++;
  var syncPromise = new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[31]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[148]++;
  self.getSyncLog().then(function(value) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[32]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[149]++;
  if (visit252_149_1(self._isOnline())) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[150]++;
    var requestId, request, requestClone, statusCode;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[152]++;
    var replayRequestArray = function(requests) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[33]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[153]++;
  if (visit253_153_1(requests.length == 0)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[154]++;
    resolve();
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[156]++;
  if (visit254_156_1(requests.length > 0)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[157]++;
    requestId = requests[0].requestId;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[158]++;
    request = requests[0].request;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[161]++;
    requestClone = request.clone();
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[164]++;
    _dispatchEvent(self, 'beforeSyncRequest', {
  'requestId': requestId, 
  'request': requestClone.clone()}, request.url).then(function(eventResult) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[34]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[165]++;
  if (visit255_165_1(_checkStopSync(eventResult))) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[166]++;
    resolve();
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[167]++;
    return;
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[169]++;
  eventResult = visit256_169_1(eventResult || {});
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[170]++;
  if (visit257_170_1(eventResult.action !== 'skip')) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[171]++;
    if (visit258_171_1(eventResult.action === 'replay')) {
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[173]++;
      request = eventResult.request;
    }
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[175]++;
    requestClone = request.clone();
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[176]++;
    _checkURL(self, request).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[35]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[177]++;
  self._browserFetch(request).then(function(response) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[36]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[178]++;
  statusCode = response.status;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[181]++;
  if (visit259_181_1(statusCode >= 400)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[182]++;
    reject({
  'error': response.statusText, 
  'requestId': requestId, 
  'request': requestClone.clone(), 
  'response': response.clone()});
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[186]++;
    return;
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[188]++;
  persistenceUtils._cloneResponse(response).then(function(responseClone) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[37]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[192]++;
  _dispatchEvent(self, 'syncRequest', {
  'requestId': requestId, 
  'request': requestClone.clone(), 
  'response': responseClone.clone()}, request.url).then(function(dispatchEventResult) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[38]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[193]++;
  if (visit260_193_1(!_checkStopSync(dispatchEventResult))) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[194]++;
    self.removeRequest(requestId).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[39]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[195]++;
  requests.shift();
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[196]++;
  if (visit261_196_1(visit262_196_2(request.method == 'GET') || visit263_197_1(request.method == 'HEAD'))) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[198]++;
    persistenceUtils._cloneResponse(responseClone).then(function(responseClone) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[40]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[199]++;
  self._cache().put(request, responseClone).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[41]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[200]++;
  logger.log("replayed request/response is cached.");
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[201]++;
  replayRequestArray(requests);
});
});
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[205]++;
    replayRequestArray(requests);
  }
}, function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[42]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[208]++;
  reject({
  'error': err, 
  'requestId': requestId, 
  'request': requestClone.clone()});
});
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[211]++;
    resolve();
  }
});
});
}, function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[43]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[216]++;
  reject({
  'error': err, 
  'requestId': requestId, 
  'request': requestClone.clone()});
});
}, function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[44]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[219]++;
  if (visit264_219_1(err === false)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[221]++;
    var init = {
  'status': 504, 
  'statusText': 'Preflight OPTIONS request timed out'};
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[222]++;
    reject({
  'error': 'Preflight OPTIONS request timed out', 
  'requestId': requestId, 
  'request': requestClone.clone(), 
  'response': new Response(null, init)});
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[224]++;
    reject({
  'error': err, 
  'requestId': requestId, 
  'request': requestClone.clone()});
  }
});
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[229]++;
    self.removeRequest(requestId).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[45]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[230]++;
  requests.shift();
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[231]++;
  replayRequestArray(requests);
}, function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[46]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[233]++;
  reject({
  'error': err, 
  'requestId': requestId, 
  'request': requestClone.clone()});
});
  }
});
  }
};
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[239]++;
    value = _reorderSyncLog(value);
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[240]++;
    replayRequestArray(value);
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[242]++;
    resolve();
  }
}, function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[47]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[245]++;
  reject(err);
});
});
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[248]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[48]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[249]++;
  syncPromise.then(function(value) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[49]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[250]++;
  self._syncing = false;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[251]++;
  self._pingedURLs = null;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[252]++;
  resolve(value);
}, function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[50]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[254]++;
  self._syncing = false;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[255]++;
  self._pingedURLs = null;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[256]++;
  reject(err);
});
});
};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[261]++;
  function _checkURL(persistenceSyncManager, request) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[51]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[263]++;
    var self = persistenceSyncManager;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[264]++;
    var preflightOptionsRequestOption = self._options['preflightOptionsRequest'];
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[265]++;
    var preflightOptionsRequestTimeoutOption = self._options['preflightOptionsRequestTimeout'];
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[266]++;
    if (visit265_266_1(visit266_266_2(request.url != null) && visit267_267_1(visit268_267_2(preflightOptionsRequestOption != 'disabled') && visit269_268_1(request.url.match(preflightOptionsRequestOption) != null)))) {
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[269]++;
      if (visit270_269_1(!self._pingedURLs)) {
        _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[270]++;
        self._pingedURLs = [];
      } else {
        _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[271]++;
        if (visit271_271_1(self._pingedURLs.indexOf(request.url) >= 0)) {
          _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[272]++;
          return Promise.resolve(true);
        }
      }
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[274]++;
      self._preflightOptionsRequestId = new Date().getTime();
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[275]++;
      return new Promise(function(preflightOptionsRequestId) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[52]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[276]++;
  return function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[53]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[277]++;
  self._repliedOptionsRequest = false;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[278]++;
  var preflightOptionsRequest = new Request(request.url, {
  method: 'OPTIONS'});
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[279]++;
  var requestTimeout = 60000;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[280]++;
  if (visit272_280_1(preflightOptionsRequestTimeoutOption != null)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[281]++;
    requestTimeout = preflightOptionsRequestTimeoutOption;
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[283]++;
  setTimeout(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[54]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[285]++;
  if (visit273_285_1(!self._repliedOptionsRequest && visit274_286_1(self._preflightOptionsRequestId == preflightOptionsRequestId))) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[287]++;
    reject(false);
  }
}, requestTimeout);
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[290]++;
  self._browserFetch(preflightOptionsRequest).then(function(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[55]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[291]++;
  self._repliedOptionsRequest = true;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[292]++;
  if (visit275_292_1(!self._pingedURLs)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[293]++;
    self._pingedURLs = [];
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[295]++;
  self._pingedURLs.push(request.url);
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[296]++;
  resolve(true);
}, function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[56]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[300]++;
  self._repliedOptionsRequest = true;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[301]++;
  resolve(true);
});
};
}(self._preflightOptionsRequestId));
    }
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[306]++;
    return Promise.resolve(true);
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[307]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[309]++;
  function _checkStopSync(syncEventResult) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[57]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[310]++;
    syncEventResult = visit276_310_1(syncEventResult || {});
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[311]++;
    return visit277_311_1(syncEventResult.action === 'stop');
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[312]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[314]++;
  function _reorderSyncLog(requestObjArray) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[58]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[317]++;
    if (visit278_317_1(requestObjArray && visit279_318_1(requestObjArray.length > 0))) {
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[319]++;
      var reorderedRequestObjArray = [];
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[320]++;
      var i;
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[321]++;
      var request;
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[323]++;
      for (i = 0; visit280_323_1(i < requestObjArray.length); i++) {
        _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[324]++;
        request = requestObjArray[i].request;
        _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[326]++;
        if (visit281_326_1(visit282_326_2(request.method != 'GET') && visit283_327_1(request.method != 'HEAD'))) {
          _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[328]++;
          reorderedRequestObjArray.push(requestObjArray[i]);
        }
      }
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[331]++;
      for (i = 0; visit284_331_1(i < requestObjArray.length); i++) {
        _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[332]++;
        request = requestObjArray[i].request;
        _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[334]++;
        if (visit285_334_1(visit286_334_2(request.method == 'GET') || visit287_335_1(request.method == 'HEAD'))) {
          _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[336]++;
          reorderedRequestObjArray.push(requestObjArray[i]);
        }
      }
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[339]++;
      return reorderedRequestObjArray;
    }
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[341]++;
    return requestObjArray;
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[342]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[344]++;
  function _createSyncLogEntry(requestId, request) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[59]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[345]++;
    return {
  'requestId': requestId, 
  'request': request, 
  'undo': function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[60]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[348]++;
  return _undoLocalStore(requestId);
}, 
  'redo': function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[61]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[351]++;
  return _redoLocalStore(requestId);
}};
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[353]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[355]++;
  function _findSyncLogRecords() {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[62]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[356]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[63]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[361]++;
  _getSyncLogStorage().then(function(store) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[64]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[358]++;
  return store.find(_getSyncLogFindExpression());
}).then(function(results) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[65]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[360]++;
  resolve(results);
}).catch(function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[66]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[362]++;
  reject(err);
});
});
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[365]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[367]++;
  function _generateSyncLog(results) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[67]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[368]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[68]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[369]++;
  var syncLogArray = [];
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[370]++;
  var requestId;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[371]++;
  var requestData;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[372]++;
  var getRequestArray = function(requestDataArray) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[69]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[373]++;
  if (visit288_373_1(!requestDataArray || visit289_374_1(requestDataArray.length == 0))) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[375]++;
    resolve(syncLogArray);
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[377]++;
    requestId = requestDataArray[0].metadata.created.toString();
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[378]++;
    requestData = requestDataArray[0].value;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[379]++;
    persistenceUtils.requestFromJSON(requestData).then(function(request) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[70]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[380]++;
  syncLogArray.push(_createSyncLogEntry(requestId, request));
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[381]++;
  requestDataArray.shift();
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[382]++;
  getRequestArray(requestDataArray);
}, function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[71]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[384]++;
  reject(err);
});
  }
};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[388]++;
  getRequestArray(results);
});
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[390]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[392]++;
  function _getRequestFromSyncLog(persistenceSyncManager, requestId) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[72]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[393]++;
    var self = persistenceSyncManager;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[394]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[73]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[395]++;
  self.getSyncLog().then(function(syncLog) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[74]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[396]++;
  var i;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[397]++;
  var request;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[398]++;
  var syncLogCount = syncLog.length;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[399]++;
  for (i = 0; visit290_399_1(i < syncLogCount); i++) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[400]++;
    if (visit291_400_1(syncLog[i].requestId === requestId)) {
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[401]++;
      request = syncLog[i].request;
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[402]++;
      resolve(request);
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[403]++;
      break;
    }
  }
}, function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[75]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[407]++;
  reject(err);
});
});
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[410]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[412]++;
  function _getSyncLogFindExpression() {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[76]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[413]++;
    var findExpression = {};
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[414]++;
    var fieldsExpression = [];
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[415]++;
    var sortExpression = [];
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[416]++;
    sortExpression.push('metadata.created');
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[417]++;
    findExpression.sort = sortExpression;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[418]++;
    fieldsExpression.push('metadata.created');
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[419]++;
    fieldsExpression.push('value');
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[420]++;
    findExpression.fields = fieldsExpression;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[421]++;
    var selectorExpression = {};
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[422]++;
    var existsExpression = {};
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[423]++;
    existsExpression['$exists'] = true;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[424]++;
    selectorExpression['metadata.created'] = existsExpression;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[425]++;
    findExpression.selector = selectorExpression;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[427]++;
    return findExpression;
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[428]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[430]++;
  function _redoLocalStore(requestId) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[77]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[431]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[78]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[442]++;
  _getRedoUndoStorage().then(function(redoUndoStore) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[79]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[433]++;
  return redoUndoStore.findByKey(requestId);
}).then(function(redoUndoDataArray) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[80]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[435]++;
  if (visit292_435_1(redoUndoDataArray != null)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[436]++;
    _updateLocalStore(redoUndoDataArray, false).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[81]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[437]++;
  resolve(true);
});
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[440]++;
    resolve(false);
  }
}).catch(function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[82]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[443]++;
  reject(err);
});
});
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[446]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[448]++;
  function _undoLocalStore(requestId) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[83]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[449]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[84]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[460]++;
  _getRedoUndoStorage().then(function(redoUndoStore) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[85]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[451]++;
  return redoUndoStore.findByKey(requestId);
}).then(function(redoUndoDataArray) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[86]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[453]++;
  if (visit293_453_1(redoUndoDataArray != null)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[454]++;
    _updateLocalStore(redoUndoDataArray, true).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[87]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[455]++;
  resolve(true);
});
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[458]++;
    resolve(false);
  }
}).catch(function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[88]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[461]++;
  reject(err);
});
});
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[464]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[466]++;
  function _updateLocalStore(redoUndoDataArray, isUndo) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[89]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[467]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[90]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[468]++;
  var j, dataArray = [], operation, storeName, undoRedoData, undoRedoDataCount;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[469]++;
  if (visit294_469_1(!(redoUndoDataArray instanceof Array))) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[470]++;
    redoUndoDataArray = [redoUndoDataArray];
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[472]++;
  var redoUndoDataArrayCount = redoUndoDataArray.length;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[473]++;
  var applyUndoRedoItem = function(i) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[91]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[474]++;
  if (visit295_474_1(i < redoUndoDataArrayCount)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[475]++;
    storeName = redoUndoDataArray[i].storeName;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[476]++;
    operation = redoUndoDataArray[i].operation;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[477]++;
    undoRedoData = redoUndoDataArray[i].undoRedoData;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[479]++;
    if (visit296_479_1(visit297_479_2(operation == 'upsert') || (visit298_480_1(visit299_480_2(operation == 'remove') && isUndo)))) {
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[482]++;
      dataArray = [];
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[483]++;
      undoRedoDataCount = undoRedoData.length;
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[484]++;
      for (j = 0; visit300_484_1(j < undoRedoDataCount); j++) {
        _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[485]++;
        if (visit301_485_1(isUndo)) {
          _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[486]++;
          dataArray.push({
  'key': undoRedoData[j].key, 
  'value': undoRedoData[j].undo});
        } else {
          _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[488]++;
          dataArray.push({
  'key': undoRedoData[j].key, 
  'value': undoRedoData[j].redo});
        }
      }
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[492]++;
      persistenceStoreManager.openStore(storeName).then(function(store) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[92]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[493]++;
  if (visit302_493_1(visit303_493_2(dataArray.length == 1) && visit304_494_1(visit305_494_2(dataArray[0].value == null) && visit306_495_1(dataArray[0].key != null)))) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[498]++;
    store.removeByKey(dataArray[0].key).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[93]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[499]++;
  applyUndoRedoItem(++i);
});
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[502]++;
    store.upsertAll(dataArray).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[94]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[503]++;
  applyUndoRedoItem(++i);
});
  }
});
    } else {
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[507]++;
      if (visit307_507_1(operation == 'remove')) {
        _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[509]++;
        persistenceStoreManager.openStore(storeName).then(function(store) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[95]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[510]++;
  store.removeByKey(undoRedoData[0].key).then(function() {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[96]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[511]++;
  applyUndoRedoItem(++i);
});
});
      }
    }
  } else {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[516]++;
    resolve();
  }
};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[519]++;
  applyUndoRedoItem(0);
});
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[521]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[523]++;
  function _dispatchEvent(persistenceSyncManager, eventType, event, url) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[97]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[524]++;
    var self = persistenceSyncManager;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[525]++;
    var filteredEventListeners = self._eventListeners.filter(_eventFilterFunction(eventType, url));
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[526]++;
    return _callEventListener(event, filteredEventListeners);
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[527]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[529]++;
  function _eventFilterFunction(eventType, url) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[98]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[530]++;
    return function(eventListener) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[99]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[531]++;
  return visit308_531_1(visit309_531_2(eventType.toLowerCase() == eventListener.type) && (visit310_532_1(visit311_532_2(visit312_532_3(url != null) && url.match(eventListener.scope)) || visit313_533_1(visit314_533_2(url == null) || visit315_533_3(eventListener.scope == null)))));
};
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[535]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[537]++;
  function _callEventListener(event, eventListeners) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[100]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[538]++;
    if (visit316_538_1(eventListeners.length > 0)) {
      _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[539]++;
      return eventListeners[0].listener(event).then(function(result) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[101]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[540]++;
  if (visit317_540_1(result != null)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[541]++;
    return Promise.resolve(result);
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[543]++;
  if (visit318_543_1(eventListeners.length > 1)) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[544]++;
    return _callEventListener(eventListeners.slice(1));
  }
});
    }
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[548]++;
    return Promise.resolve(null);
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[549]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[551]++;
  function _getStorage(name) {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[102]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[552]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[103]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[553]++;
  var options = {
  index: ['metadata.created']};
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[556]++;
  persistenceStoreManager.openStore(name, options).then(function(store) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[104]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[555]++;
  resolve(store);
}).catch(function(err) {
  _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[105]++;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[557]++;
  reject(err);
});
});
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[560]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[562]++;
  function _getSyncLogStorage() {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[106]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[563]++;
    return _getStorage('syncLog');
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[564]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[566]++;
  function _getRedoUndoStorage() {
    _$jscoverage['/impl/PersistenceSyncManager.js'].functionData[107]++;
    _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[567]++;
    return _getStorage('redoUndoLog');
  }
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[568]++;
  ;
  _$jscoverage['/impl/PersistenceSyncManager.js'].lineData[570]++;
  return PersistenceSyncManager;
});
