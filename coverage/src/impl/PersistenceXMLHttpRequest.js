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
if (! _$jscoverage['/impl/PersistenceXMLHttpRequest.js']) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'] = {};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[6] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[7] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[19] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[20] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[23] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[27] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[30] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[34] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[39] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[44] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[48] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[52] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[55] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[58] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[62] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[66] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[69] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[72] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[76] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[80] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[83] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[86] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[91] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[95] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[98] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[101] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[105] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[108] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[111] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[115] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[118] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[121] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[125] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[128] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[131] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[135] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[139] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[143] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[147] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[152] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[154] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[158] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[162] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[166] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[170] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[178] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[179] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[181] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[183] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[184] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[187] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[189] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[190] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[191] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[192] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[193] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[194] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[195] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[196] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[197] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[198] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[199] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[200] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[202] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[204] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[205] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[207] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[210] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[212] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[214] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[218] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[219] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[220] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[221] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[222] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[223] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[229] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[230] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[232] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[233] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[241] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[242] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[243] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[244] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[246] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[248] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[249] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[251] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[252] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[253] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[254] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[255] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[257] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[259] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[266] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[267] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[273] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[274] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[275] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[278] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[280] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[281] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[282] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[286] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[292] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[293] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[295] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[296] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[299] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[300] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[301] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[303] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[305] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[311] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[312] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[313] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[317] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[318] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[319] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[322] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[323] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[324] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[325] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[326] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[327] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[328] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[333] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[334] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[335] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[336] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[337] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[338] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[339] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[341] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[345] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[348] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[349] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[351] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[352] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[355] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[357] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[358] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[359] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[361] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[363] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[364] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[366] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[367] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[369] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[370] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[372] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[373] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[375] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[376] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[377] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[379] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[385] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[386] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[387] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[389] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[390] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[392] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[393] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[394] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[395] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[396] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[397] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[399] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[401] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[402] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[404] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[405] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[406] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[407] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[415] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[418] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[420] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[421] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[423] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[424] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[426] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[427] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[428] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[429] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[431] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[436] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[437] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[438] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[439] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[440] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[441] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[444] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[446] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[448] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[449] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[450] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[451] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[453] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[454] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[457] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[460] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[461] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[462] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[463] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[464] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[466] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[467] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[470] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[473] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[475] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[476] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[478] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[479] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[480] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[481] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[482] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[484] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[485] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[487] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[488] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[489] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[491] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[493] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[495] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[499] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[501] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[502] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[504] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[506] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[511] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[512] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[514] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[515] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[516] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[518] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[520] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[521] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[525] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[529] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[533] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[537] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[539] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[543] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[544] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[547] = 0;
}
if (! _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[0] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[1] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[2] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[3] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[4] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[5] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[6] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[7] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[8] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[9] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[10] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[11] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[12] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[13] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[14] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[15] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[16] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[17] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[18] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[19] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[20] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[21] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[22] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[23] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[24] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[25] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[26] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[27] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[28] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[29] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[30] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[31] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[32] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[33] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[34] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[35] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[36] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[37] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[38] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[39] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[40] = 0;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[41] = 0;
}
if (! _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData = {};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['179'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['179'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['179'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['189'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['189'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['194'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['194'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['200'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['200'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['200'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['201'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['201'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['205'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['205'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['205'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['206'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['206'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['233'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['233'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['242'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['242'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['243'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['243'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['274'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['274'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['281'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['281'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['295'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['295'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['312'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['312'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['318'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['318'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['323'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['323'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['326'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['326'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['327'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['327'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['336'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['336'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['338'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['338'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['351'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['351'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['357'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['357'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['366'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['366'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['366'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['366'][3] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['369'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['369'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['372'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['372'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['375'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['375'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['376'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['376'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['389'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['389'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['389'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['406'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['406'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['415'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['415'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['415'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['416'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['416'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['416'][2] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['417'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['417'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['431'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['431'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['440'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['440'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['446'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['446'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['447'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['447'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['453'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['453'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['466'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['466'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['478'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['478'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['487'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['487'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['491'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['491'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['492'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['492'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['498'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['498'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['499'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['499'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['502'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['502'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['503'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['503'][1] = new BranchData();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['515'] = [];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['515'][1] = new BranchData();
}
_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['515'][1].init(8, 53);
function visit373_515_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['515'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['503'][1].init(10, 42);
function visit372_503_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['503'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['502'][1].init(12, 76);
function visit371_502_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['502'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['499'][1].init(15, 15);
function visit370_499_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['499'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['498'][1].init(15, 20);
function visit369_498_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['498'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['492'][1].init(12, 42);
function visit368_492_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['492'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['491'][1].init(14, 78);
function visit367_491_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['491'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['487'][1].init(12, 20);
function visit366_487_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['487'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['478'][1].init(8, 15);
function visit365_478_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['478'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['466'][1].init(12, 32);
function visit364_466_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['466'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['453'][1].init(12, 32);
function visit363_453_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['453'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['447'][1].init(6, 36);
function visit362_447_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['447'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['446'][1].init(15, 58);
function visit361_446_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['446'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['440'][1].init(12, 32);
function visit360_440_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['440'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['431'][1].init(8, 104);
function visit359_431_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['431'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['417'][1].init(6, 25);
function visit358_417_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['417'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['416'][2].init(6, 23);
function visit357_416_2(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['416'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['416'][1].init(6, 59);
function visit356_416_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['416'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['415'][2].init(8, 22);
function visit355_415_2(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['415'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['415'][1].init(8, 92);
function visit354_415_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['415'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['406'][1].init(22, 20);
function visit353_406_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['406'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['389'][2].init(28, 54);
function visit352_389_2(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['389'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['389'][1].init(7, 75);
function visit351_389_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['389'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['376'][1].init(12, 54);
function visit350_376_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['376'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['375'][1].init(10, 25);
function visit349_375_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['375'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['372'][1].init(8, 20);
function visit348_372_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['372'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['369'][1].init(8, 40);
function visit347_369_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['369'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['366'][3].init(52, 41);
function visit346_366_3(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['366'][3].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['366'][2].init(8, 40);
function visit345_366_2(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['366'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['366'][1].init(8, 85);
function visit344_366_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['366'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['357'][1].init(8, 50);
function visit343_357_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['357'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['351'][1].init(8, 44);
function visit342_351_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['351'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['338'][1].init(10, 29);
function visit341_338_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['338'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['336'][1].init(20, 32);
function visit340_336_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['336'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['327'][1].init(10, 24);
function visit339_327_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['327'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['326'][1].init(16, 18);
function visit338_326_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['326'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['323'][1].init(20, 33);
function visit337_323_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['323'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['318'][1].init(34, 33);
function visit336_318_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['318'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['312'][1].init(8, 28);
function visit335_312_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['312'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['295'][1].init(8, 61);
function visit334_295_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['295'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['281'][1].init(10, 52);
function visit333_281_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['281'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['274'][1].init(8, 61);
function visit332_274_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['274'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['243'][1].init(10, 25);
function visit331_243_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['243'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['242'][1].init(8, 20);
function visit330_242_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['242'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['233'][1].init(36, 9);
function visit329_233_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['233'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['206'][1].init(12, 32);
function visit328_206_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['206'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['205'][2].init(14, 26);
function visit327_205_2(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['205'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['205'][1].init(14, 75);
function visit326_205_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['205'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['201'][1].init(12, 28);
function visit325_201_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['201'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['200'][2].init(14, 26);
function visit324_200_2(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['200'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['200'][1].init(14, 71);
function visit323_200_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['200'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['194'][1].init(12, 44);
function visit322_194_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['194'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['189'][1].init(8, 6);
function visit321_189_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['189'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['179'][2].init(8, 25);
function visit320_179_2(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['179'][2].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['179'][1].init(8, 42);
function visit319_179_1(result) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].branchData['179'][1].ranCondition(result);
  return result;
}_$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[6]++;
define(['../persistenceUtils', './logger'], function(persistenceUtils, logger) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[0]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[7]++;
  'use strict';
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[19]++;
  function PersistenceXMLHttpRequest(browserXMLHttpRequest) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[1]++;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[20]++;
    var self = this;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[23]++;
    Object.defineProperty(this, '_eventListeners', {
  value: [], 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[27]++;
    Object.defineProperty(this, '_browserXMLHttpRequest', {
  value: browserXMLHttpRequest});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[30]++;
    Object.defineProperty(this, '_method', {
  value: null, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[34]++;
    Object.defineProperty(this, 'onreadystatechange', {
  value: null, 
  enumerable: true, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[39]++;
    Object.defineProperty(this, 'ontimeout', {
  value: null, 
  enumerable: true, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[44]++;
    Object.defineProperty(this, '_password', {
  value: null, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[48]++;
    Object.defineProperty(this, '_readyState', {
  value: 0, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[52]++;
    Object.defineProperty(this, 'readyState', {
  enumerable: true, 
  get: function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[2]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[55]++;
  return self._readyState;
}});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[58]++;
    Object.defineProperty(this, '_requestHeaders', {
  value: {}, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[62]++;
    Object.defineProperty(this, '_response', {
  value: '', 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[66]++;
    Object.defineProperty(this, 'response', {
  enumerable: true, 
  get: function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[3]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[69]++;
  return self._response;
}});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[72]++;
    Object.defineProperty(this, '_responseHeaders', {
  value: {}, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[76]++;
    Object.defineProperty(this, '_responseText', {
  value: null, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[80]++;
    Object.defineProperty(this, 'responseText', {
  enumerable: true, 
  get: function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[4]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[83]++;
  return self._responseText;
}});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[86]++;
    Object.defineProperty(this, 'responseType', {
  value: null, 
  enumerable: true, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[91]++;
    Object.defineProperty(this, '_responseURL', {
  value: '', 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[95]++;
    Object.defineProperty(this, 'responseURL', {
  enumerable: true, 
  get: function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[5]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[98]++;
  return self._responseURL;
}});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[101]++;
    Object.defineProperty(this, '_responseXML', {
  value: null, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[105]++;
    Object.defineProperty(this, 'responseXML', {
  enumerable: true, 
  get: function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[6]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[108]++;
  return self._responseXML;
}});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[111]++;
    Object.defineProperty(this, '_status', {
  value: 0, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[115]++;
    Object.defineProperty(this, 'status', {
  enumerable: true, 
  get: function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[7]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[118]++;
  return self._status;
}});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[121]++;
    Object.defineProperty(this, '_statusText', {
  value: '', 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[125]++;
    Object.defineProperty(this, 'statusText', {
  enumerable: true, 
  get: function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[8]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[128]++;
  return self._statusText;
}});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[131]++;
    Object.defineProperty(this, 'timeout', {
  value: 0, 
  enumerable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[135]++;
    Object.defineProperty(this, 'upload', {
  value: null, 
  enumerable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[139]++;
    Object.defineProperty(this, '_url', {
  value: null, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[143]++;
    Object.defineProperty(this, '_username', {
  value: null, 
  writable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[147]++;
    Object.defineProperty(this, 'withCredentials', {
  value: false, 
  enumerable: true, 
  writable: true});
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[152]++;
  ;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[154]++;
  Object.defineProperty(PersistenceXMLHttpRequest, 'UNSENT', {
  value: 0, 
  enumerable: true});
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[158]++;
  Object.defineProperty(PersistenceXMLHttpRequest, 'OPENED', {
  value: 1, 
  enumerable: true});
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[162]++;
  Object.defineProperty(PersistenceXMLHttpRequest, 'HEADERS_RECEIVED', {
  value: 2, 
  enumerable: true});
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[166]++;
  Object.defineProperty(PersistenceXMLHttpRequest, 'LOADING', {
  value: 3, 
  enumerable: true});
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[170]++;
  Object.defineProperty(PersistenceXMLHttpRequest, 'DONE', {
  value: 4, 
  enumerable: true});
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[178]++;
  PersistenceXMLHttpRequest.prototype.open = function(method, url, async, username, password) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[9]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[179]++;
  if (visit319_179_1(visit320_179_2(typeof async == 'boolean') && !async)) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[181]++;
    throw new Error("InvalidAccessError: Failed to execute 'open' on 'XMLHttpRequest': Synchronous requests are disabled on the XHR Adapter");
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[183]++;
  this._method = method;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[184]++;
  this._url = url;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[187]++;
  var isFile = _isFileRequest(url);
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[189]++;
  if (visit321_189_1(isFile)) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[190]++;
    var self = this;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[191]++;
    this._passthroughXHR = new self._browserXMLHttpRequest();
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[192]++;
    this._passthroughXHR.onreadystatechange = function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[10]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[193]++;
  var readyState = self._passthroughXHR.readyState;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[194]++;
  if (visit322_194_1(readyState == PersistenceXMLHttpRequest.DONE)) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[195]++;
    self._status = self._passthroughXHR.status;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[196]++;
    self._statusText = self._passthroughXHR.statusText;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[197]++;
    self._response = self._passthroughXHR.response;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[198]++;
    self._responseHeaders = self._passthroughXHR.responseHeaders;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[199]++;
    self._responseType = self._passthroughXHR.responseType;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[200]++;
    if (visit323_200_1(visit324_200_2(self._responseType == null) || visit325_201_1(self._responseType == 'text'))) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[202]++;
      self._responseText = self._passthroughXHR.responseText;
    }
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[204]++;
    self._responseURL = self._passthroughXHR.responseURL;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[205]++;
    if (visit326_205_1(visit327_205_2(self._responseType == null) || visit328_206_1(self._responseType == 'document'))) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[207]++;
      self._responseXML = self._passthroughXHR.responseXML;
    }
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[210]++;
  _readyStateChange(self, self._passthroughXHR.readyState);
};
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[212]++;
    this._passthroughXHR.open(method, url, async, username, password);
  } else {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[214]++;
    this._passthroughXHR = null;
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[218]++;
  this._username = username;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[219]++;
  this._password = password;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[220]++;
  this._responseText = null;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[221]++;
  this._responseXML = null;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[222]++;
  this._requestHeaders = {};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[223]++;
  _readyStateChange(this, PersistenceXMLHttpRequest.OPENED);
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[229]++;
  PersistenceXMLHttpRequest.prototype.setRequestHeader = function(header, value) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[11]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[230]++;
  _verifyState(this);
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[232]++;
  var oldValue = this._requestHeaders[header];
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[233]++;
  this._requestHeaders[header] = visit329_233_1((oldValue)) ? oldValue += ',' + value : value;
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[241]++;
  PersistenceXMLHttpRequest.prototype.send = function(data) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[12]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[242]++;
  if (visit330_242_1(this._passthroughXHR)) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[243]++;
    if (visit331_243_1(this.responseType != null)) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[244]++;
      this._passthroughXHR.responseType = this.responseType;
    }
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[246]++;
    this._passthroughXHR.send(data);
  } else {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[248]++;
    _verifyState(this);
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[249]++;
    _readyStateChange(this, PersistenceXMLHttpRequest.OPENED);
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[251]++;
    var requestInit = _getRequestInit(this, data);
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[252]++;
    var request = new Request(this._url, requestInit);
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[253]++;
    var self = this;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[254]++;
    fetch(request).then(function(response) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[13]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[255]++;
  _processResponse(self, request, response);
}, function(error) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[14]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[257]++;
  logger.error(error);
});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[259]++;
    this.dispatchEvent(new PersistenceXMLHttpRequestEvent('loadstart', false, false, this));
  }
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[266]++;
  PersistenceXMLHttpRequest.prototype.abort = function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[15]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[267]++;
  logger.log('abort() is not supported by the XHR Adapter');
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[273]++;
  PersistenceXMLHttpRequest.prototype.getResponseHeader = function(header) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[16]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[274]++;
  if (visit332_274_1(this._readyState < PersistenceXMLHttpRequest.HEADERS_RECEIVED)) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[275]++;
    return null;
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[278]++;
  header = header.toLowerCase();
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[280]++;
  for (var responseHeader in this._responseHeaders) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[281]++;
    if (visit333_281_1(responseHeader.toLowerCase() == header.toLowerCase())) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[282]++;
      return this._responseHeaders[responseHeader];
    }
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[286]++;
  return null;
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[292]++;
  PersistenceXMLHttpRequest.prototype.getAllResponseHeaders = function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[17]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[293]++;
  var self = this;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[295]++;
  if (visit334_295_1(this._readyState < PersistenceXMLHttpRequest.HEADERS_RECEIVED)) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[296]++;
    return '';
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[299]++;
  var responseHeaders = '';
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[300]++;
  function appendResponseHeader(responseHeader) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[18]++;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[301]++;
    responseHeaders += responseHeader + ': ' + self._responseHeaders[responseHeader] + '\r\n';
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[303]++;
  Object.keys(this._responseHeaders).forEach(appendResponseHeader);
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[305]++;
  return responseHeaders;
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[311]++;
  PersistenceXMLHttpRequest.prototype.overrideMimeType = function(mimeType) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[19]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[312]++;
  if (visit335_312_1(typeof mimeType === 'string')) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[313]++;
    this._forceMimeType = mimeType.toLowerCase();
  }
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[317]++;
  PersistenceXMLHttpRequest.prototype.addEventListener = function(event, listener) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[20]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[318]++;
  this._eventListeners[event] = visit336_318_1(this._eventListeners[event] || []);
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[319]++;
  this._eventListeners[event].push(listener);
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[322]++;
  PersistenceXMLHttpRequest.prototype.removeEventListener = function(event, listener) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[21]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[323]++;
  var listeners = visit337_323_1(this._eventListeners[event] || []);
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[324]++;
  var i;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[325]++;
  var listenersCount = listeners.length;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[326]++;
  for (i = 0; visit338_326_1(i < listenersCount); i++) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[327]++;
    if (visit339_327_1(listeners[i] == listener)) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[328]++;
      return listeners.splice(i, 1);
    }
  }
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[333]++;
  PersistenceXMLHttpRequest.prototype.dispatchEvent = function(event) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[22]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[334]++;
  var self = this;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[335]++;
  var type = event.type;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[336]++;
  var listeners = visit340_336_1(this._eventListeners[type] || []);
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[337]++;
  listeners.forEach(function(listener) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[23]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[338]++;
  if (visit341_338_1(typeof listener == 'function')) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[339]++;
    listener.call(self, event);
  } else {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[341]++;
    listener.handleEvent(event);
  }
});
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[345]++;
  return !!event.defaultPrevented;
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[348]++;
  function _readyStateChange(self, state) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[24]++;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[349]++;
    self._readyState = state;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[351]++;
    if (visit342_351_1(typeof self.onreadystatechange == 'function')) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[352]++;
      self.onreadystatechange(new PersistenceXMLHttpRequestEvent('readystatechange'));
    }
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[355]++;
    self.dispatchEvent(new PersistenceXMLHttpRequestEvent('readystatechange'));
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[357]++;
    if (visit343_357_1(self._readyState == PersistenceXMLHttpRequest.DONE)) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[358]++;
      self.dispatchEvent(new PersistenceXMLHttpRequestEvent('load', false, false, self));
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[359]++;
      self.dispatchEvent(new PersistenceXMLHttpRequestEvent('loadend', false, false, self));
    }
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[361]++;
  ;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[363]++;
  function _isFileRequest(url) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[25]++;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[364]++;
    var absoluteUrlOrigin = url.toLowerCase();
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[366]++;
    if (visit344_366_1(visit345_366_2(absoluteUrlOrigin.indexOf('http:') === 0) || visit346_366_3(absoluteUrlOrigin.indexOf('https:') === 0))) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[367]++;
      return false;
    }
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[369]++;
    if (visit347_369_1(absoluteUrlOrigin.indexOf('file:') === 0)) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[370]++;
      return true;
    }
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[372]++;
    if (visit348_372_1(URL && URL.prototype)) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[373]++;
      absoluteUrlOrigin = (new URL(url, window.location.href)).origin;
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[375]++;
      if (visit349_375_1(absoluteUrlOrigin != null)) {
        _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[376]++;
        if (visit350_376_1(absoluteUrlOrigin.toLowerCase().indexOf('file:') === 0)) {
          _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[377]++;
          return true;
        } else {
          _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[379]++;
          return false;
        }
      }
    }
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[385]++;
    var anchorElement = document.createElement('a');
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[386]++;
    anchorElement.href = url;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[387]++;
    absoluteUrlOrigin = anchorElement.protocol;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[389]++;
    if (visit351_389_1(absoluteUrlOrigin && visit352_389_2(absoluteUrlOrigin.toLowerCase().indexOf('file:') === 0))) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[390]++;
      return true;
    }
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[392]++;
    return false;
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[393]++;
  ;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[394]++;
  function _getRequestHeaders(self) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[26]++;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[395]++;
    var requestHeaders = new Headers();
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[396]++;
    function appendRequestHeader(requestHeader) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[27]++;
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[397]++;
      requestHeaders.append(requestHeader, self._requestHeaders[requestHeader]);
    }
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[399]++;
    Object.keys(self._requestHeaders).forEach(appendRequestHeader);
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[401]++;
    return requestHeaders;
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[402]++;
  ;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[404]++;
  function _getRequestInit(self, data) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[28]++;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[405]++;
    var requestHeaders = _getRequestHeaders(self);
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[406]++;
    var credentials = visit353_406_1(self.withCredentials) ? 'include' : 'omit';
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[407]++;
    var requestInit = {
  method: self._method, 
  headers: requestHeaders, 
  mode: 'cors', 
  cache: 'default', 
  credentials: credentials};
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[415]++;
    if (visit354_415_1(visit355_415_2(self._method !== 'GET') && visit356_416_1(visit357_416_2(self._method !== 'HEAD') && visit358_417_1(self._method !== 'DELETE')))) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[418]++;
      requestInit.body = data;
    }
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[420]++;
    return requestInit;
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[421]++;
  ;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[423]++;
  function _processResponse(self, request, response) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[29]++;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[424]++;
    _setResponseHeaders(self, response.headers);
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[426]++;
    var contentType = response.headers.get('Content-Type');
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[427]++;
    self._status = response.status;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[428]++;
    self._statusText = response.statusText;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[429]++;
    self._responseURL = request.url;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[431]++;
    if (visit359_431_1(!persistenceUtils._isTextPayload(response.headers) && persistenceUtils.isCachedResponse(response))) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[436]++;
      response.blob().then(function(blobData) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[30]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[437]++;
  self._responseType = 'blob';
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[438]++;
  self._response = blobData;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[439]++;
  _readyStateChange(self, PersistenceXMLHttpRequest.DONE);
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[440]++;
  if (visit360_440_1(typeof self.onload == 'function')) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[441]++;
    self.onload();
  }
}, function(blobErr) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[31]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[444]++;
  logger.error(blobErr);
});
    } else {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[446]++;
      if (visit361_446_1(contentType && visit362_447_1(contentType.indexOf('image/') !== -1))) {
        _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[448]++;
        response.arrayBuffer().then(function(aBuffer) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[32]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[449]++;
  self._responseType = 'arrayBuffer';
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[450]++;
  self._response = aBuffer;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[451]++;
  _readyStateChange(self, PersistenceXMLHttpRequest.DONE);
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[453]++;
  if (visit363_453_1(typeof self.onload == 'function')) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[454]++;
    self.onload();
  }
}, function(arrayBufferError) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[33]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[457]++;
  logger.error('error reading response as arrayBuffer!');
});
      } else {
        _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[460]++;
        response.text().then(function(data) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[34]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[461]++;
  self._responseType = '';
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[462]++;
  self._response = data;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[463]++;
  self._responseText = data;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[464]++;
  _readyStateChange(self, PersistenceXMLHttpRequest.DONE);
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[466]++;
  if (visit364_466_1(typeof self.onload == 'function')) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[467]++;
    self.onload();
  }
}, function(err) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[35]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[470]++;
  logger.error(err);
});
      }
    }
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[473]++;
  ;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[475]++;
  function _setResponseHeaders(self, headers) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[36]++;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[476]++;
    self._responseHeaders = {};
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[478]++;
    if (visit365_478_1(headers.entries)) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[479]++;
      var headerEntriesIter = headers.entries();
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[480]++;
      var headerEntry;
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[481]++;
      var headerName;
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[482]++;
      var headerValue;
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[484]++;
      do {
        _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[485]++;
        headerEntry = headerEntriesIter.next();
        _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[487]++;
        if (visit366_487_1(headerEntry['value'])) {
          _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[488]++;
          headerName = headerEntry['value'][0];
          _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[489]++;
          headerValue = headerEntry['value'][1];
          _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[491]++;
          if (visit367_491_1(self._forceMimeType && visit368_492_1(headerName.toLowerCase() == 'content-type'))) {
            _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[493]++;
            self._responseHeaders[headerName] = self._forceMimeType;
          } else {
            _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[495]++;
            self._responseHeaders[headerName] = headerValue;
          }
        }
      } while (visit369_498_1(!headerEntry['done']));
    } else {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[499]++;
      if (visit370_499_1(headers.forEach)) {
        _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[501]++;
        headers.forEach(function(headerValue, headerName) {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[37]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[502]++;
  if (visit371_502_1(self._forceMimeType && visit372_503_1(headerName.toLowerCase() == 'content-type'))) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[504]++;
    self._responseHeaders[headerName] = self._forceMimeType;
  } else {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[506]++;
    self._responseHeaders[headerName] = headerValue;
  }
});
      }
    }
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[511]++;
    _readyStateChange(self, PersistenceXMLHttpRequest.HEADERS_RECEIVED);
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[512]++;
  ;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[514]++;
  function _verifyState(self) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[38]++;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[515]++;
    if (visit373_515_1(self._readyState !== PersistenceXMLHttpRequest.OPENED)) {
      _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[516]++;
      throw new Error('INVALID_STATE_ERR');
    }
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[518]++;
  ;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[520]++;
  function PersistenceXMLHttpRequestEvent(type, bubbles, cancelable, target) {
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[39]++;
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[521]++;
    Object.defineProperty(this, 'type', {
  value: type, 
  enumerable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[525]++;
    Object.defineProperty(this, 'bubbles', {
  value: bubbles, 
  enumerable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[529]++;
    Object.defineProperty(this, 'cancelable', {
  value: cancelable, 
  enumerable: true});
    _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[533]++;
    Object.defineProperty(this, 'target', {
  value: target, 
  enumerable: true});
  }
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[537]++;
  ;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[539]++;
  PersistenceXMLHttpRequestEvent.prototype.stopPropagation = function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[40]++;
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[543]++;
  PersistenceXMLHttpRequestEvent.prototype.preventDefault = function() {
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].functionData[41]++;
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[544]++;
  this['defaultPrevented'] = true;
};
  _$jscoverage['/impl/PersistenceXMLHttpRequest.js'].lineData[547]++;
  return PersistenceXMLHttpRequest;
});
