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
if (! _$jscoverage['/impl/pouchDBPersistenceStore.js']) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'] = {};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[6] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[8] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[10] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[11] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[14] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[21] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[22] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[23] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[24] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[26] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[27] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[29] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[30] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[31] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[32] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[38] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[40] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[41] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[42] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[48] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[49] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[50] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[52] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[53] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[55] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[59] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[60] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[62] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[65] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[66] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[68] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[71] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[73] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[74] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[75] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[80] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[83] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[89] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[90] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[93] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[94] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[96] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[98] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[103] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[104] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[105] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[106] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[108] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[111] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[115] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[118] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[120] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[121] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[122] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[130] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[131] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[132] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[134] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[135] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[140] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[141] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[142] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[144] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[145] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[146] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[147] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[149] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[151] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[153] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[157] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[158] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[159] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[161] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[162] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[164] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[168] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[169] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[170] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[172] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[174] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[175] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[176] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[178] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[181] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[182] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[184] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[187] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[188] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[189] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[194] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[195] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[196] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[197] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[199] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[200] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[202] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[204] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[205] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[214] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[216] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[218] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[219] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[222] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[223] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[224] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[226] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[227] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[228] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[230] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[231] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[232] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[233] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[235] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[236] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[237] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[238] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[244] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[245] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[246] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[248] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[250] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[251] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[252] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[253] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[255] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[261] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[262] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[263] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[264] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[266] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[268] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[269] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[270] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[271] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[273] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[279] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[280] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[282] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[283] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[284] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[285] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[287] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[288] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[289] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[291] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[293] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[296] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[297] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[298] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[302] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[304] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[305] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[306] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[308] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[310] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[313] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[314] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[315] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[321] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[322] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[324] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[326] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[327] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[328] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[329] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[330] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[333] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[334] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[335] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[342] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[344] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[348] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[349] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[350] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[356] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[357] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[358] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[364] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[365] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[366] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[367] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[368] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[370] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[373] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[376] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[381] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[382] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[383] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[387] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[388] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[389] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[390] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[391] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[392] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[393] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[394] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[395] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[397] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[401] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[402] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[403] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[404] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[405] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[406] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[408] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[409] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[410] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[417] = 0;
}
if (! _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[0] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[1] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[2] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[3] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[4] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[5] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[6] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[7] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[8] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[9] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[10] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[11] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[12] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[13] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[14] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[15] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[16] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[17] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[18] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[19] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[20] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[21] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[22] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[23] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[24] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[25] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[26] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[27] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[28] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[29] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[30] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[31] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[32] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[33] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[34] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[35] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[36] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[37] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[38] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[39] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[40] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[41] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[42] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[43] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[44] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[45] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[46] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[47] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[48] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[49] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[50] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[51] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[52] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[53] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[54] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[55] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[56] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[57] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[58] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[59] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[60] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[61] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[62] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[63] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[64] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[65] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[66] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[67] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[68] = 0;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[69] = 0;
}
if (! _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData = {};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['22'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['22'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['22'][2] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['26'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['26'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['59'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['59'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['65'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['65'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['65'][2] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['65'][3] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['89'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['89'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['98'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['98'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['104'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['104'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['105'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['105'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['131'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['131'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['135'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['135'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['141'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['141'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['146'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['146'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['158'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['158'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['174'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['174'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['174'][2] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['181'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['181'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['181'][2] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['181'][3] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['199'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['199'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['216'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['216'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['216'][2] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['218'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['218'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['223'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['223'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['232'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['232'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['252'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['252'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['252'][2] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['252'][3] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['270'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['270'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['270'][2] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['270'][3] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['282'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['282'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['287'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['287'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['304'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['304'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['304'][2] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['328'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['328'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['344'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['344'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['349'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['349'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['357'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['357'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['365'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['365'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['367'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['367'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['389'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['389'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['391'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['391'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['391'][2] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['392'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['392'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['394'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['394'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['403'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['403'][1] = new BranchData();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['405'] = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['405'][1] = new BranchData();
}
_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['405'][1].init(16, 15);
function visit469_405_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['405'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['403'][1].init(21, 30);
function visit468_403_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['403'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['394'][1].init(16, 20);
function visit467_394_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['394'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['392'][1].init(15, 64);
function visit466_392_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['392'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['391'][2].init(25, 30);
function visit465_391_2(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['391'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['391'][1].init(12, 43);
function visit464_391_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['391'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['389'][1].init(10, 25);
function visit463_389_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['389'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['367'][1].init(12, 11);
function visit462_367_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['367'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['365'][1].init(8, 23);
function visit461_365_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['365'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['357'][1].init(8, 9);
function visit460_357_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['357'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['349'][1].init(8, 29);
function visit459_349_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['349'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['344'][1].init(29, 20);
function visit458_344_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['344'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['328'][1].init(12, 19);
function visit457_328_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['328'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['304'][2].init(24, 33);
function visit456_304_2(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['304'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['304'][1].init(14, 43);
function visit455_304_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['304'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['287'][1].init(14, 25);
function visit454_287_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['287'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['282'][1].init(8, 16);
function visit453_282_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['282'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['270'][3].init(34, 25);
function visit452_270_3(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['270'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['270'][2].init(12, 18);
function visit451_270_2(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['270'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['270'][1].init(12, 47);
function visit450_270_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['270'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['252'][3].init(34, 25);
function visit449_252_3(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['252'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['252'][2].init(12, 18);
function visit448_252_2(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['252'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['252'][1].init(12, 47);
function visit447_252_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['252'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['232'][1].init(34, 28);
function visit446_232_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['232'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['223'][1].init(8, 12);
function visit445_223_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['223'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['218'][1].init(8, 5);
function visit444_218_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['218'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['216'][2].init(27, 17);
function visit443_216_2(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['216'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['216'][1].init(16, 28);
function visit442_216_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['216'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['199'][1].init(14, 15);
function visit441_199_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['199'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['181'][3].init(38, 29);
function visit440_181_3(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['181'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['181'][2].init(12, 22);
function visit439_181_2(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['181'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['181'][1].init(12, 55);
function visit438_181_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['181'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['174'][2].init(22, 33);
function visit437_174_2(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['174'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['174'][1].init(12, 43);
function visit436_174_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['174'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['158'][1].init(8, 25);
function visit435_158_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['158'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['146'][1].init(12, 32);
function visit434_146_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['146'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['141'][1].init(8, 43);
function visit433_141_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['141'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['135'][1].init(13, 50);
function visit432_135_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['135'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['131'][1].init(8, 26);
function visit431_131_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['131'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['105'][1].init(18, 65);
function visit430_105_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['105'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['104'][1].init(16, 25);
function visit429_104_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['104'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['98'][1].init(12, 21);
function visit428_98_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['98'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['89'][1].init(8, 11);
function visit427_89_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['89'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['65'][3].init(37, 28);
function visit426_65_3(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['65'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['65'][2].init(12, 21);
function visit425_65_2(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['65'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['65'][1].init(12, 53);
function visit424_65_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['65'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['59'][1].init(12, 57);
function visit423_59_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['59'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['26'][1].init(8, 26);
function visit419_26_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['26'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['22'][2].init(21, 26);
function visit416_22_2(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['22'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['22'][1].init(21, 34);
function visit414_22_1(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].branchData['22'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[6]++;
define(["../PersistenceStore", "pouchdb", "pouchfind"], function(PersistenceStore, PouchDB) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[0]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[8]++;
  'use strict';
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[10]++;
  var PouchDBPersistenceStore = function(name) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[1]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[11]++;
  PersistenceStore.call(this, name);
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[14]++;
  PouchDBPersistenceStore.prototype = new PersistenceStore();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[21]++;
  PouchDBPersistenceStore.prototype.Init = function(options) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[2]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[22]++;
  this._version = visit414_22_1((visit416_22_2(options && options.version)) || '0');
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[23]++;
  var dbname = this._name + this._version;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[24]++;
  this._db = new PouchDB(dbname);
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[26]++;
  if (visit419_26_1(!options || !options.index)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[27]++;
    return Promise.resolve();
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[29]++;
    var self = this;
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[30]++;
    var indexArray = options.index;
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[31]++;
    var indexName = self._name + indexArray.toString().replace(",", "").replace(".", "");
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[32]++;
    var indexSyntax = {
  index: {
  fields: indexArray, 
  name: indexName}};
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[38]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[3]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[41]++;
  self._db.createIndex(indexSyntax).then(function() {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[4]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[40]++;
  resolve();
}).catch(function(err) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[5]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[42]++;
  reject(err);
});
});
  }
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[48]++;
  PouchDBPersistenceStore.prototype.upsert = function(key, metadata, value, expectedVersionIdentifier) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[6]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[49]++;
  var self = this;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[50]++;
  var docId = key.toString();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[52]++;
  var attachmentParts = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[53]++;
  this._prepareUpsert(value, attachmentParts);
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[55]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[7]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[74]++;
  self._db.get(docId).then(function(doc) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[8]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[59]++;
  if (visit423_59_1(!_verifyVersionIdentifier(expectedVersionIdentifier, doc))) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[60]++;
    return Promise.reject({
  status: 409});
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[62]++;
    return Promise.resolve(doc);
  }
}).catch(function(geterr) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[9]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[65]++;
  if (visit424_65_1(visit425_65_2(geterr.status === 404) && visit426_65_3(geterr.message === 'missing'))) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[66]++;
    return Promise.resolve();
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[68]++;
    return Promise.reject(geterr);
  }
}).then(function(existingDoc) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[10]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[71]++;
  return self._put(docId, metadata, value, expectedVersionIdentifier, attachmentParts, existingDoc);
}).then(function() {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[11]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[73]++;
  resolve();
}).catch(function(err) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[12]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[75]++;
  reject(err);
});
});
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[80]++;
  PouchDBPersistenceStore.prototype._put = function(docId, metadata, value, expectedVersionIdentifier, attachmentParts, existingDoc) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[13]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[83]++;
  var dbdoc = {
  _id: docId, 
  metadata: metadata, 
  value: value};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[89]++;
  if (visit427_89_1(existingDoc)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[90]++;
    dbdoc._rev = existingDoc._rev;
  }
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[93]++;
  var self = this;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[94]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[14]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[121]++;
  self._db.put(dbdoc).then(function(addeddoc) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[15]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[96]++;
  return Promise.resolve(addeddoc);
}).catch(function(puterr) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[16]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[98]++;
  if (visit428_98_1(puterr.status === 409)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[103]++;
    self._db.get(docId).then(function(conflictDoc) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[17]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[104]++;
  if (visit429_104_1(expectedVersionIdentifier)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[105]++;
    if (visit430_105_1(!_verifyVersionIdentifier(expectedVersionIdentifier, conflictDoc))) {
      _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[106]++;
      return Promise.reject({
  status: 409});
    } else {
      _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[108]++;
      return Promise.resolve(conflictDoc);
    }
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[111]++;
    return Promise.resolve(conflictDoc);
  }
});
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[115]++;
    return Promise.reject(puterr);
  }
}).then(function(finalDoc) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[18]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[118]++;
  return self._addAttachments(finalDoc, attachmentParts);
}).then(function() {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[19]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[120]++;
  resolve();
}).catch(function(err) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[20]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[122]++;
  reject(err);
});
});
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[130]++;
  var _verifyVersionIdentifier = function(expectedVersionIdentifier, currentDocument) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[21]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[131]++;
  if (visit431_131_1(!expectedVersionIdentifier)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[132]++;
    return true;
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[134]++;
    var docVersionIdentifier = currentDocument.metadata.versionIdentifier;
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[135]++;
    return visit432_135_1(docVersionIdentifier === expectedVersionIdentifier);
  }
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[140]++;
  PouchDBPersistenceStore.prototype._addAttachments = function(doc, attachmentParts) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[22]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[141]++;
  if (visit433_141_1(!attachmentParts || !attachmentParts.length)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[142]++;
    return Promise.resolve();
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[144]++;
    var promises = attachmentParts.map(function(attachment) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[23]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[145]++;
  var blob;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[146]++;
  if (visit434_146_1(attachment.value instanceof Blob)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[147]++;
    blob = attachment.value;
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[149]++;
    blob = new Blob([attachment.value]);
  }
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[151]++;
  return this._db.putAttachment(doc.id, attachment.path, doc.rev, blob, 'binary');
}, this);
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[153]++;
    return Promise.all(promises);
  }
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[157]++;
  PouchDBPersistenceStore.prototype.upsertAll = function(values) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[24]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[158]++;
  if (visit435_158_1(!values || !values.length)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[159]++;
    return Promise.resolve();
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[161]++;
    var promises = values.map(function(element) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[25]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[162]++;
  return this.upsert(element.key, element.metadata, element.value, element.expectedVersionIdentifier);
}, this);
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[164]++;
    return Promise.all(promises);
  }
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[168]++;
  PouchDBPersistenceStore.prototype.find = function(findExpression) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[26]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[169]++;
  var self = this;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[170]++;
  var modifiedFind = self._prepareFind(findExpression);
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[172]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[27]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[188]++;
  self._db.find(modifiedFind).then(function(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[28]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[174]++;
  if (visit436_174_1(result && visit437_174_2(result.docs && result.docs.length))) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[175]++;
    var promises = result.docs.map(self._findResultCallback(modifiedFind.fields), self);
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[176]++;
    return Promise.all(promises);
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[178]++;
    return Promise.resolve([]);
  }
}).catch(function(finderr) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[29]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[181]++;
  if (visit438_181_1(visit439_181_2(finderr.status === 404) && visit440_181_3(finderr.message === 'missing'))) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[182]++;
    return Promise.resolve([]);
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[184]++;
    return Promise.reject(finderr);
  }
}).then(function(entries) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[30]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[187]++;
  resolve(entries);
}).catch(function(err) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[31]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[189]++;
  reject(err);
});
});
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[194]++;
  PouchDBPersistenceStore.prototype._findResultCallback = function(useDefaultField) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[32]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[195]++;
  return function(element) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[33]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[196]++;
  var self = this;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[197]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[34]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[204]++;
  self._fixValue(element).then(function(fixedDoc) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[35]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[199]++;
  if (visit441_199_1(useDefaultField)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[200]++;
    resolve(fixedDoc);
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[202]++;
    resolve(fixedDoc.value);
  }
}).catch(function(err) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[36]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[205]++;
  reject(err);
});
});
};
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[214]++;
  PouchDBPersistenceStore.prototype._fixValue = function(doc) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[37]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[216]++;
  var docId = visit442_216_1(doc._id || visit443_216_2(doc.id || doc.key));
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[218]++;
  if (visit444_218_1(docId)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[219]++;
    doc.key = docId;
  }
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[222]++;
  var attachments = doc._attachments;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[223]++;
  if (visit445_223_1(!attachments)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[224]++;
    return Promise.resolve(doc);
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[226]++;
    var self = this;
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[227]++;
    var filename = Object.keys(attachments)[0];
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[228]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[38]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[237]++;
  self._db.getAttachment(docId, filename).then(function(blob) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[39]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[230]++;
  var paths = filename.split('.');
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[231]++;
  var targetValue = doc.value;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[232]++;
  for (var pathIndex = 0; visit446_232_1(pathIndex < paths.length - 1); pathIndex++) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[233]++;
    targetValue = targetValue[paths[pathIndex]];
  }
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[235]++;
  targetValue[paths[paths.length - 1]] = blob;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[236]++;
  resolve(doc);
}).catch(function(err) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[40]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[238]++;
  reject(err);
});
});
  }
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[244]++;
  PouchDBPersistenceStore.prototype.findByKey = function(key) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[41]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[245]++;
  var self = this;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[246]++;
  var docId = key.toString();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[248]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[42]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[251]++;
  self._db.get(docId).then(function(doc) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[43]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[250]++;
  resolve(doc.value);
}).catch(function(err) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[44]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[252]++;
  if (visit447_252_1(visit448_252_2(err.status === 404) && visit449_252_3(err.message === 'missing'))) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[253]++;
    resolve();
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[255]++;
    reject(err);
  }
});
});
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[261]++;
  PouchDBPersistenceStore.prototype.removeByKey = function(key) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[45]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[262]++;
  var self = this;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[263]++;
  var docId = key.toString();
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[264]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[46]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[269]++;
  self._db.get(docId).then(function(doc) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[47]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[266]++;
  return self._db.remove(doc);
}).then(function() {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[48]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[268]++;
  resolve(true);
}).catch(function(err) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[49]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[270]++;
  if (visit450_270_1(visit451_270_2(err.status === 404) && visit452_270_3(err.message === 'missing'))) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[271]++;
    resolve(false);
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[273]++;
    reject(err);
  }
});
});
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[279]++;
  PouchDBPersistenceStore.prototype.delete = function(deleteExpression) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[50]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[280]++;
  var self = this;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[282]++;
  if (visit453_282_1(deleteExpression)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[283]++;
    var modifiedExpression = deleteExpression;
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[284]++;
    modifiedExpression.fields = ['_id', '_rev'];
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[285]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[51]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[297]++;
  self.find(modifiedExpression).then(function(entries) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[52]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[287]++;
  if (visit454_287_1(entries && entries.length)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[288]++;
    var promisesArray = entries.map(function(element) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[53]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[289]++;
  return this._db.remove(element._id, element._rev);
}, self);
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[291]++;
    return Promise.all(promisesArray);
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[293]++;
    resolve();
  }
}).then(function() {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[54]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[296]++;
  resolve();
}).catch(function(err) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[55]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[298]++;
  reject(err);
});
});
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[302]++;
    return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[56]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[314]++;
  self._db.allDocs({
  include_docs: true}).then(function(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[57]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[304]++;
  if (visit455_304_1(result && visit456_304_2(result.rows && result.rows.length))) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[305]++;
    var promises = result.rows.map(function(element) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[58]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[306]++;
  this._db.remove(element.doc);
}, self);
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[308]++;
    return Promise.all(promises);
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[310]++;
    return Promise.resolve();
  }
}).then(function() {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[59]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[313]++;
  resolve();
}).catch(function(err) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[60]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[315]++;
  reject(err);
});
});
  }
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[321]++;
  PouchDBPersistenceStore.prototype.keys = function() {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[61]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[322]++;
  var self = this;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[324]++;
  return new Promise(function(resolve, reject) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[62]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[334]++;
  self._db.allDocs().then(function(result) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[63]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[326]++;
  var rows = result.rows;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[327]++;
  var keysArray = [];
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[328]++;
  if (visit457_328_1(rows && rows.length)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[329]++;
    keysArray = rows.map(function(element) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[64]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[330]++;
  return element.id;
});
  }
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[333]++;
  resolve(keysArray);
}).catch(function(err) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[65]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[335]++;
  reject(err);
});
});
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[342]++;
  PouchDBPersistenceStore.prototype._prepareFind = function(findExpression) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[66]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[344]++;
  var modifiedExpression = visit458_344_1(findExpression || {});
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[348]++;
  var sortFieldsArray = modifiedExpression.sort;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[349]++;
  if (visit459_349_1(sortFieldsArray !== undefined)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[350]++;
    delete modifiedExpression.sort;
  }
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[356]++;
  var selector = modifiedExpression.selector;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[357]++;
  if (visit460_357_1(!selector)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[358]++;
    modifiedExpression.selector = {
  '_id': {
  '$gt': null}};
  }
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[364]++;
  var fields = modifiedExpression.fields;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[365]++;
  if (visit461_365_1(fields && fields.length)) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[366]++;
    var modifiedFields = fields.map(function(x) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[67]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[367]++;
  if (visit462_367_1(x === 'key')) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[368]++;
    return '_id';
  } else {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[370]++;
    return x;
  }
});
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[373]++;
    modifiedExpression.fields = modifiedFields;
  }
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[376]++;
  return modifiedExpression;
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[381]++;
  PouchDBPersistenceStore.prototype._prepareUpsert = function(value, attachmentParts) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[68]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[382]++;
  var path = '';
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[383]++;
  this._inspectValue(path, value, attachmentParts);
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[387]++;
  PouchDBPersistenceStore.prototype._inspectValue = function(path, value, attachmentParts) {
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].functionData[69]++;
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[388]++;
  for (var key in value) {
    _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[389]++;
    if (visit463_389_1(value.hasOwnProperty(key))) {
      _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[390]++;
      var itemValue = value[key];
      _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[391]++;
      if (visit464_391_1(itemValue && visit465_391_2(typeof (itemValue) === 'object'))) {
        _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[392]++;
        if (visit466_392_1((itemValue instanceof Blob) || (itemValue instanceof ArrayBuffer))) {
          _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[393]++;
          var localPath = path;
          _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[394]++;
          if (visit467_394_1(localPath.length > 0)) {
            _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[395]++;
            localPath = localPath + '.';
          }
          _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[397]++;
          var attachment = {
  path: localPath + key, 
  value: itemValue};
          _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[401]++;
          attachmentParts.push(attachment);
          _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[402]++;
          value.key = null;
        } else {
          _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[403]++;
          if (visit468_403_1(itemValue.length === undefined)) {
            _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[404]++;
            var oldPath = path;
            _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[405]++;
            if (visit469_405_1(path.length > 0)) {
              _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[406]++;
              path = path + '.';
            }
            _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[408]++;
            path = path + key;
            _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[409]++;
            this._inspectValue(path, itemValue, attachmentParts);
            _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[410]++;
            path = oldPath;
          }
        }
      }
    }
  }
};
  _$jscoverage['/impl/pouchDBPersistenceStore.js'].lineData[417]++;
  return PouchDBPersistenceStore;
});
