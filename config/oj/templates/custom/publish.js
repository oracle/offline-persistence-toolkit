'use strict';

var doop = require('jsdoc/util/doop');
var env = require('jsdoc/env');
var fs = require('jsdoc/fs');
var nodefs = require('fs');
var helper = require('jsdoc/util/templateHelper');
var logger = require('jsdoc/util/logger');
var path = require('jsdoc/path');
var taffy = require('taffydb').taffy;
var template = require('jsdoc/template');
var util = require('util');
var catharsis = require('catharsis');

var htmlsafe = helper.htmlsafe;
var linkto = helper.linkto;
var resolveAuthorLinks = helper.resolveAuthorLinks;
var scopeToPunc = helper.scopeToPunc;
var hasOwnProp = Object.prototype.hasOwnProperty;

var data;
var view;
var searchMetadata = {};
var navMemberIdx = 0;
var all_typedefs;
var outdir = path.normalize(env.opts.destination);

var ALL_VIOLATIONS = {
  MISSING_LINKS: {
    level: "warning",
    message: "%s has a type signature referencing %s %s without a link.",
    enabled: env.opts.violations['MISSING_LINKS']
  },
  TYPEDEF_IN_TYPE: {
    level: "error",
    message: "%s is using TypeDef %s in it's @type definition. This is currently prohibited, please consider using an @ojsignature tag to define complex types.",
    enabled: env.opts.violations['TYPEDEF_IN_TYPE']
  },
  INVALID_ATTRIBUTE_TYPE:{
    level: "error",
    message: "Invalid type for property \"%s\" in component %s. Please %s to fix this issue.",
    enabled: env.opts.violations['INVALID_ATTRIBUTE_TYPE']

  },
  MISSING_OJCOMPONENT_TYPE:{
    level: "error",
    message: "Missing type for property \"%s\" in component %s. Please use the @type tag to specify a type for this property",
    enabled: env.opts.violations['MISSING_OJCOMPONENT_TYPE']
  },
  INVALID_DEFAULT_VALUE: {
    level: "error",
    message: "Invalid default value for property \"%s\" in component %s. Default value for complex object is supported only at leaf levels.",
    enabled: env.opts.violations['INVALID_DEFAULT_VALUE']
  },
  MISSING_CLASS_TYPE:{
    level: "warning",
    message: "Missing type for property \"%s\" in class %s. Please use the @type tag to specify a type for this property",
    enabled: env.opts.violations['MISSING_CLASS_TYPE']
  },
  INVALID_GLOBAL_MEMBER: {
    level: "warning",
    message: "Warning: %s seems to be a private member and will be generated in the Global section of the API Doc Navigator. Consider using the @private and/or @ignore tags to fix this.",
    enabled: env.opts.violations['INVALID_GLOBAL_MEMBER']
  }
};

var COLLECTED_VIOLATIONS = {};
var BUILD_STOP = false;

function find(spec) {
  return helper.find(data, spec);
}

function tutoriallink(tutorial) {
  return helper.toTutorial(tutorial, null, { tag: 'em', classname: 'disabled', prefix: 'Tutorial: ' });
}

function getAncestorLinks(doclet) {
  return helper.getAncestorLinks(data, doclet);
}

function hashToLink(doclet, hash) {
  if (!/^(#.+)/.test(hash)) { return hash; }

  var url = helper.createLink(doclet);

  url = url.replace(/(#.+|$)/, hash);
  return '<a href="' + url + '">' + hash + '</a>';
}

function needsSignature(doclet) {
  var needsSig = false;

  // function and class definitions always get a signature
  if (doclet.kind === 'function' || doclet.kind === 'class') {
    needsSig = true;
  }
  // typedefs that contain functions get a signature, too
  else if (doclet.kind === 'typedef' && doclet.type && doclet.type.names &&
    doclet.type.names.length) {
    for (var i = 0, l = doclet.type.names.length; i < l; i++) {
      if (doclet.type.names[i].toLowerCase() === 'function') {
        needsSig = true;
        break;
      }
    }
  }

  return needsSig;
}

function getSignatureAttributes(item) {
  var attributes = [];

  if (item.optional) {
    attributes.push('opt');
  }

  if (item.nullable === true) {
    attributes.push('nullable');
  }
  else if (item.nullable === false) {
    attributes.push('non-null');
  }

  return attributes;
}

function updateItemName(item) {
  var attributes = getSignatureAttributes(item);
  var itemName = item.name || '';

  if (item.variable) {
    itemName = '&hellip;' + itemName;
  }

  if (attributes && attributes.length) {
    itemName = util.format('%s<span class="signature-attributes">%s</span>', itemName,
      attributes.join(', '));
  }

  return itemName;
}

function addParamAttributes(params) {
  return params.filter(function (param) {
    return param.name && param.name.indexOf('.') === -1;
  }).map(updateItemName);
}

function buildItemTypeStrings(item) {
  var types = [];

  if (item && item.type && item.type.names) {
    //[csaba]:
    // unfortunately in jsdoc 3.4 if the type (or one of the types) was a function (specified with full param type signature and return type)
    // in the type.names array we will only find the type 'function', thus loosing the signature and return part of the function.
    // The solution is to take in that case the parsedType.typeExpression value (this will contain the type as it was specified
    // in the js src file).
    // In this case we will return only this value from this function and not build up an array of distinct types
    //item.type.names.forEach(function(name) { //changed to regular for loop so that we can break out
    var name;
    //tstype key was added by our own custom plugin ojeventHandles.js
    // if @ojsignature was specified with a jsdocOverride property set to true, then we will add the tstype key to the doclet
    //[csaba- bug27372375]:
    // need to pick up the setterType from an ojsignature targeting an accessor
    if (item.tstype && item.tstype.value &&
      (item.tstype.target.toLowerCase() === 'type' || item.tstype.target.toLowerCase() === 'accessor') &&
      item.tstype.jsdocOverride) {
      // if starts with ? or !
      var dstType = item.tstype.target.toLowerCase() === 'type' ? item.tstype.value : item.tstype.value.SetterType;

      if (dstType.charCodeAt(0) === 63 || dstType.charCodeAt(0) === 33) {
        name = dstType.substr(1);
      }
      else {
        name = dstType;
      }

      if (dstType.charCodeAt(0) === 63) {
        item['nullable'] = true;
      }
      else if (dstType.charCodeAt(0) === 33) {
        item['nullable'] = false;
      }

      // try and see if the complex ojsignature type can be parsed by catharsis
      // if not just make sure that it's html safe and return the type unchanged
      // if yes, then the linkto call will generate anchor refs to known entities
      // (like typedefs, classes, interfaces, anything that's an entry in longnameToUrl)
      var parseSuccess = tryTypeParsing(name);

      if (parseSuccess) {
        types = [linkto(name, htmlsafe(name))];
      }
      //couldn't parse the type. Make a best effor to try to resolve any TypeDefs that might be
      //present in the type signature
      else {
        var tdused;
        for (var i = 0; i < all_typedefs.length; i++){
          let td = all_typedefs[i];
          //lets probe if we find something that's worth trying
          if (td.memberof === item.memberof && name.indexOf(td.longname) >= 0){
            let regex = new RegExp("\\b" + td.longname + "\\b");
            if (regex.test(name)){
              tdused = td.longname;
              break;
            }
          }
        }
        //we found a TypeDef that's being used by the type of this member doclet
        //try and see of type parsing can actually deal with it
        if (tdused){
          parseSuccess = tryTypeParsing(tdused);
          if (parseSuccess) {
            // create a link for the TypeDef
            let tdlink = linkto(tdused, htmlsafe(tdused));
            //now replace the TypeDef in the original signature with the link
            types = [name.replace(new RegExp("\\b" + tdused + "\\b"), tdlink)];
          }
          else{
            types = [htmlsafe(name)];
          }
        }
        else{
          types = [htmlsafe(name)];
        }
      }
    }
    else {
      for (var i = 0; i < item.type.names.length; i++) {
        name = item.type.names[i];
        // we check if we need to use the workaround explained above
        if (name === 'function') {
          if (item.type.parsedType && item.type.parsedType.typeExpression) {
            types = [linkto(item.type.parsedType.typeExpression, htmlsafe(item.type.parsedType.typeExpression))];
            break;
          }
        }
        else {
          types.push(linkto(name, htmlsafe(name)));
        }
      };
    }
  }

  return types;
}
// Give it a try and see if the type can be parsed by catharsis.
// we are using this method in the case where we need to apply an ojsignature type over
// the jsdoc @type. In many instances those types cannot be parsed by catharsis so links
// cannot be generated for type elements
function tryTypeParsing(name) {
  var parseSuccess = true;
  try {
    catharsis.parse(name, { jsdoc: true });
  }
  catch (e) {
    parseSuccess = false;
  }

  return parseSuccess;
}

function buildAttribsString(attribs) {
  var attribsString = '';

  if (attribs && attribs.length) {
    attribsString = htmlsafe(util.format('(%s) ', attribs.join(', ')));
  }

  return attribsString;
}

function addNonParamAttributes(items) {
  var types = [];

  items.forEach(function (item) {
    types = types.concat(buildItemTypeStrings(item));
  });

  return types;
}
/*
[csaba]: this is the original but it does not apply the optional class

function addSignatureParams(f) {
    var params = f.params ? addParamAttributes(f.params) : [];

    f.signature = util.format( '%s(%s)', (f.signature || ''), params.join(', ') );
}
*/
// this was copied over from jsdoc 3.2
function addSignatureParams(f) {
  var params = helper.getSignatureParams(f, 'optional');

  f.signature = (f.signature || '') + '(' + params.join(', ') + ')';
}

function augmentInheritedTypes(doclet) {
  if (doclet.inherited) {
    var parent = doclet.inherits;

    if (doclet.params && doclet.params.length) {
      processPropertiesOrParams(doclet.params, parent, true);
    }
    if (doclet.properties && doclet.properties.length) {
      processPropertiesOrParams(doclet.properties, parent, false);
    }
  }
}

function processPropertiesOrParams(arr, parent, isParams) {
  var type;
  var result = find({ longname: parent });
  if (result && result.length) {
    var parentDoclet = result[0];
    for (var i = 0; i < arr.length; i++) {
      type = arr[i].type;
      if (type && !type.parsedType && type.names && type.names.length) {
        for (var j = 0; j < type.names.length; j++) {
          if (type.names[j] === 'function') {
            //console.log('function type in inherited doclet: ', parent);
            var parsedType;
            if (isParams && parentDoclet.params && parentDoclet.params.length) {
              var param = parentDoclet.params[i];
              if (param.type.parsedType) {
                parsedType = param.type.parsedType;
              }
            }
            else if (!isParams && parentDoclet.properties && parentDoclet.properties.length) {
              var property = parentDoclet.properties[i];
              if (property.type.parsedType) {
                parsedType = property.type.parsedType;
              }
            }

            if (parsedType) {
              //console.log('   typeExpression: ', parsedType.typeExpression);
              Object.defineProperty(type, 'parsedType', {
                value: parsedType,
                writable: true,
                enumerable: true,
                configurable: true
              });
              break;
            }
          }
        }
      }
    }
  }
}

function getParsedType(docletId, paramIdx, isParameter) {
  var retVal;
  var result = find({ longname: docletId });
  if (result && result.length) {
    var doclet = result[0];
    if (doclet.params && doclet.params.length) {
      var param = doclet.params[paramIdx];
      if (param.type.parsedType) {
        retVal = param.type.parsedType;
      }
    }
  }

  return retVal;
}

function addSignatureReturns(f) {
  var attribs = [];
  var attribsString = '';
  var returnTypes = [];
  var returnTypesString = '';

  // jam all the return-type attributes into an array. this could create odd results (for example,
  // if there are both nullable and non-nullable return types), but let's assume that most people
  // who use multiple @return tags aren't using Closure Compiler type annotations, and vice-versa.
  if (f.returns) {
    f.returns.forEach(function (item) {
      helper.getAttribs(item).forEach(function (attrib) {
        if (attribs.indexOf(attrib) === -1) {
          attribs.push(attrib);
        }
      });
    });

    attribsString = buildAttribsString(attribs);
  }

  if (f.returns) {
    returnTypes = addNonParamAttributes(f.returns);
  }
  if (returnTypes.length) {
    returnTypesString = util.format(' &rarr; %s{%s}', attribsString, returnTypes.join('|'));
  }

  f.signature = '<span class="signature">' + (f.signature || '') + '</span>' +
    '<span class="type-signature">' + returnTypesString + '</span>';
}

function addSignatureTypes(f) {
  var types = f.type ? buildItemTypeStrings(f) : [];

  f.signature = (f.signature || '') + '<span class="type-signature">' +
    (types.length ? ' :' + types.join('|') : '') + '</span>';
}

function addAttribs(f) {
  var attribs = helper.getAttribs(f);
  var attribsString = buildAttribsString(attribs);

  f.attribs = util.format('<span class="type-signature">%s</span>', attribsString);
}

function shortenPaths(files, commonPrefix) {
  Object.keys(files).forEach(function (file) {
    files[file].shortened = files[file].resolved.replace(commonPrefix, '')
      // always use forward slashes
      .replace(/\\/g, '/');
  });

  return files;
}

function getPathFromDoclet(doclet) {
  if (!doclet.meta) {
    return null;
  }

  return doclet.meta.path && doclet.meta.path !== 'null' ?
    path.join(doclet.meta.path, doclet.meta.filename) :
    doclet.meta.filename;
}

function generate(title, docs, filename, resolveLinks) {
  resolveLinks = resolveLinks === false ? false : true;

  var docData = {
    env: env,
    title: title,
    docs: docs,
    searchMetadata: searchMetadata
  };

  var outpath = path.join(outdir, filename),
    html = view.render('container.tmpl', docData);
  // only caller to pass resolveLinks:false is the one that outputs src files verbatim
  if (resolveLinks) {
    //console.log('Resolving includes for ', docs[0].longname);
    // html = helper.resolveIncludes(html, docs[0]); //replace each {@ojinclude "name":"foo"} with contents of foo fragment
    html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
  }

  fs.writeFileSync(outpath, html, 'utf8');
}

function generateSourceFiles(sourceFiles, encoding) {
  encoding = encoding || 'utf8';
  Object.keys(sourceFiles).forEach(function (file) {
    var source;
    // links are keyed to the shortened path in each doclet's `meta.shortpath` property
    var sourceOutfile = helper.getUniqueFilename(sourceFiles[file].shortened);
    helper.registerLink(sourceFiles[file].shortened, sourceOutfile);

    try {
      source = {
        kind: 'source',
        code: helper.htmlsafe(fs.readFileSync(sourceFiles[file].resolved, encoding))
      };
    }
    catch (e) {
      logger.error('Error while generating source file %s: %s', file, e.message);
    }

    generate('Source: ' + sourceFiles[file].shortened, [source], sourceOutfile,
      false);
  });
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
  var symbols = {};

  // build a lookup table
  doclets.forEach(function (symbol) {
    symbols[symbol.longname] = symbols[symbol.longname] || [];
    symbols[symbol.longname].push(symbol);
  });

  return modules.map(function (module) {
    if (symbols[module.longname]) {
      module.modules = symbols[module.longname]
        // Only show symbols that have a description. Make an exception for classes, because
        // we want to show the constructor-signature heading no matter what.
        .filter(function (symbol) {
          return symbol.description || symbol.kind === 'class';
        })
        .map(function (symbol) {
          symbol = doop(symbol);

          if (symbol.kind === 'class' || symbol.kind === 'function') {
            symbol.name = symbol.name.replace('module:', '(require("') + '"))';
          }

          return symbol;
        });
    }
  });
}

function buildMemberNav(items, itemHeading, itemsSeen, linktoFn) {
  var nav = '';

  if (items.length) {
    var itemsNav = '';

    items.forEach(function (item) {
      if (!hasOwnProp.call(item, 'longname')) {
        itemsNav += '<li>' + linktoFn('', item.name) + '</li>';
      }
      else if (!hasOwnProp.call(itemsSeen, item.longname)) {
        var displayName;
        if (env.conf.templates.default.useLongnameInNav) {
          displayName = item.longname;
        } else {
          displayName = item.name;
        }
        itemsNav += '<li>' + linktoFn(item.longname, displayName.replace(/\b(module|event):/g, '')) + '</li>';

        itemsSeen[item.longname] = true;
      }
    });

    if (itemsNav !== '') {
      nav += '<h3>' + itemHeading + '</h3><ul>' + itemsNav + '</ul>';
    }
  }

  return nav;
}

function linktoTutorial(longName, name) {
  return tutoriallink(name);
}

function linktoExternal(longName, name) {
  return linkto(longName, name.replace(/(^"|"$)/g, ''));
}

/**
 * Create the navigation sidebar.
 * @param {object} members The members that will be used to create the sidebar.
 * @param {array<object>} members.classes
 * @param {array<object>} members.externals
 * @param {array<object>} members.globals
 * @param {array<object>} members.mixins
 * @param {array<object>} members.modules
 * @param {array<object>} members.namespaces
 * @param {array<object>} members.tutorials
 * @param {array<object>} members.events
 * @param {array<object>} members.interfaces
 * @return {string} The HTML for the navigation sidebar.
 */
function buildNav(members) {
  var nav = '<h2><a href="index.html">Home</a></h2>';
  var seen = {};
  var seenTutorials = {};

  nav += buildMemberNav(members.modules, 'Modules', {}, linkto);
  nav += buildMemberNav(members.externals, 'Externals', seen, linktoExternal);
  nav += buildMemberNav(members.classes, 'Classes', seen, linkto);
  nav += buildMemberNav(members.events, 'Events', seen, linkto);
  nav += buildMemberNav(members.namespaces, 'Namespaces', seen, linkto);
  nav += buildMemberNav(members.mixins, 'Mixins', seen, linkto);
  nav += buildMemberNav(members.tutorials, 'Tutorials', seenTutorials, linktoTutorial);
  nav += buildMemberNav(members.interfaces, 'Interfaces', seen, linkto);

  if (members.globals.length) {
    var globalNav = '';

    members.globals.forEach(function (g) {
      if (g.kind !== 'typedef' && !hasOwnProp.call(seen, g.longname)) {
        globalNav += '<li>' + linkto(g.longname, g.name) + '</li>';
      }
      seen[g.longname] = true;
    });

    if (!globalNav) {
      // turn the heading into a link so you can actually get to the global page
      nav += '<h3>' + linkto('global', 'Global') + '</h3>';
    }
    else {
      nav += '<h3>Global</h3><ul>' + globalNav + '</ul>';
    }
  }

  return nav;
}


/**
 * Create the navigation sidebar.
 * @param {object} members The members that will be used to create the sidebar.
 * @param {array<object>} members.classes
 * @param {array<object>} members.externals
 * @param {array<object>} members.globals
 * @param {array<object>} members.mixins
 * @param {array<object>} members.modules
 * @param {array<object>} members.namespaces
 * @param {array<object>} members.tutorials
 * @param {array<object>} members.events
 * @param {array<object>} members.interfaces
 * @return {string} The HTML for the navigation sidebar.
 */
function buildJETNav(members) {
  var index = 0;
  var nav = '<h2 id="navIndex"><a href="index.html">Index</a></h2>';
  var seen = {};
  var components = []; // ojButton, etc.
  var bindingElements = []; //oj-bind-for-each, oj-bind-if, oj-bind-slot, etc
  var abstractComponents = []; // abstract superclasses like baseComponent, editableValue, etc.
  var classes = []; // Model, FooUtils, etc.
  var styling = []; // Non-component Styling doc
  var overviews = []; // document overviews


  var writeLink = function (member, longname, linktext, linktoFn) {
    member.ojId = 'navItem' + index;
    var navItem = '<li id="' + member.ojId + '">' + linktoFn(longname, linktext) + '</li>';
    index++;
    return navItem;
  };

  var processNavigatorMembers = function (items, linktoFn, category) {
    var itemsNav = '';

    if (items.length) {
      items.forEach(function (item) {
        if (!hasOwnProp.call(item, 'longname')) {
          itemsNav += writeLink(item, '', item.name, linktoFn);
        }
        else if (!hasOwnProp.call(seen, item.longname)) {
          var displayName;
          if (env.conf.templates.default.useLongnameInNav) {
            displayName = item.longname;
          }
          else {
            displayName = item.name;
          }

          searchMetadata[item.longname] = { 'ref': item.longname + '.html' };
          searchMetadata[item.longname]['subCategory'] = category;

          itemsNav += writeLink(item, item.longname, displayName.replace(/\b(module|event):/g, ''), linktoFn);
          seen[item.longname] = true;
        }
      });
    }
    return itemsNav;
  };


  var processNavigatorClassMembers = function (items, linktoFn, category) {
    var itemsNav = '';

    if (items.length) {
      items.forEach(function (item) {
        searchMetadata[item.longname] = { 'ref': item.longname + '.html' };
        searchMetadata[item.longname]['subCategory'] = category;
        var previewSuffix = "";
        //[csaba]: make preview more obvious if running a debug version of jsdoc
        //previewSuffix = c.ojpreview ? " (PREVIEW)" : "";
        if (env.opts.debug && item.ojpreview) {
          previewSuffix = " (PREVIEW)";
        }

        itemsNav += writeLink(item, item.longname, (item.ojPageTitle || item.name) + previewSuffix, linktoFn);
      });
    }
    return itemsNav;
  };


  members.classes.forEach(function (c) {
    if (!hasOwnProp.call(seen, c.longname)) {
      //[csaba] if it's marked as ojcomponent then we separate those in the following buckets
      //   1. abstractComponents (virtual) - these are the base components marked as abstract
      //   2. bindingElements - if they are also marked as ojbindingelements
      //   3. "regular" ojcomponents
      // if they are not ojcomponents, then put them into the following buckets
      //   1. styling - all the ojstyling virtual doclets form StylingDoc.js
      //   2. overview - these are generic overview/concept doclets and are marked as such with the ojoverview tag
      //   3. "regular" classes
      (c.ojcomponent ?
        (c.virtual ? abstractComponents : (c.ojbindingelement ? bindingElements : components))
        : (c.ojstylingdoc ? styling : (c.ojoverviewdoc ? overviews : classes))
      ).push(c);
    }
    seen[c.longname] = true;
  });

  // sort these index page navigator elements separately, because they have different requirements. Taffy sorts based on
  // longname, however a sub-set of our components will not have the oj prefix, therefore the order of the displayed items
  // in the html list is not alphabetical.

  if (overviews && overviews.length){
    overviews.sort(function(comp1, comp2){
     if (comp1.ojPageRanking === comp2.ojPageRanking) {
      var display1 = comp1.ojPageTitle;
      var display2 = comp2.ojPageTitle;
      return (display1 < display2) ? -1 : (display1 > display2) ? 1 : 0;
     } else return comp1.ojPageRanking - comp2.ojPageRanking;
    });
  }
  if (classes && classes.length){
    classes.sort(function(comp1, comp2){
      var display1 = comp1.name;
      var display2 = comp2.name;
        return (display1 < display2) ? -1 : (display1 > display2) ? 1 : 0;
    });
  }
  // we have members in this Array that don't use the oj prefix in the longname
  var interfaces = members.interfaces;
  interfaces.sort(function(comp1, comp2){
    var display1 = comp1.name;
    var display2 = comp2.name;
      return (display1 < display2) ? -1 : (display1 > display2) ? 1 : 0;
  });

  var _members = processNavigatorMembers(members.modules, linkto, 'Module');
  if (_members !== '') {
    nav += '<h3>Modules</h3><ul class="subList">' + _members + '</ul>';
  };

  _members = processNavigatorMembers(members.externals, linktoExternal, 'External');
  if (_members !== '') {
    nav += '<h3>Externals</h3><ul class="subList">' + _members + '</ul>';
  };

  _members = processNavigatorClassMembers(overviews, linkto, 'Class');
  if (_members !== '') {
    nav += '<h3 id="navElements">Concepts</h3><ul class="subList">' + _members + '</ul>';
  };

  _members = processNavigatorClassMembers(components, linkto, 'Class');
  if (_members !== '') {
    nav += '<h3 id="navElements">Elements</h3><ul class="subList">' + _members + '</ul>';
  };

  _members = processNavigatorClassMembers(bindingElements, linkto, 'Class');
  if (_members !== '') {
    nav += '<h3>Binding Elements</h3><ul class="subList">' + _members + '</ul>';
  };

  _members = processNavigatorClassMembers(classes, linkto, 'Class');
  if (_members !== '') {
    nav += '<h3>Classes</h3><ul class="subList">' + _members + '</ul>';
  };

  _members = processNavigatorMembers(interfaces, linkto, 'Interface');
  if (_members !== '') {
    nav += '<h3>Interfaces</h3><ul class="subList">' + _members + '</ul>';
  };

  _members = processNavigatorMembers(members.namespaces, linkto, 'Namespace');
  if (_members !== '') {
    nav += '<h3>Namespaces</h3><ul class="subList">' + _members + '</ul>';
  };

  _members = processNavigatorMembers(members.mixins, linkto, 'Mixin');
  if (_members !== '') {
    nav += '<h3>Mixins</h3><ul class="subList">' + _members + '</ul>';
  };

  _members = processNavigatorMembers(members.tutorials, linktoTutorial, 'Tutorial');
  if (_members !== '') {
    nav += '<h3>Tutorials</h3><ul class="subList">' + _members + '</ul>';
  };

  _members = processNavigatorClassMembers(styling, linkto, 'Class');
  if (_members !== '') {
    nav += '<h3>Non-component Styling</h3><ul class="subList">' + _members + '</ul>';
  };



  if (members.globals.length) {
    nav += '<h3 id="navItemGlobal">Global</h3><ul class="subList">';
    members.globals.forEach(function (g) {
      //[csaba] - make sure we warn users if invalid Global members would show up in the generated API Doc
      if (g.longname.startsWith('_') && (g.access === 'protected' || g.access === 'public')) {
        let file = g.meta.filename;
        let arr = file.split('/');
        let module = arr[5];
        let fileName = arr[6];

        COLLECTED_VIOLATIONS['INVALID_GLOBAL_MEMBER'] = COLLECTED_VIOLATIONS['INVALID_GLOBAL_MEMBER'] || {};
        COLLECTED_VIOLATIONS['INVALID_GLOBAL_MEMBER'][module] = COLLECTED_VIOLATIONS['INVALID_GLOBAL_MEMBER'][module] || {};
        COLLECTED_VIOLATIONS['INVALID_GLOBAL_MEMBER'][module][fileName] = COLLECTED_VIOLATIONS['INVALID_GLOBAL_MEMBER'][module][fileName] || [];
        COLLECTED_VIOLATIONS['INVALID_GLOBAL_MEMBER'][module][fileName].push(util.format(ALL_VIOLATIONS['INVALID_GLOBAL_MEMBER'].message, g.name.replace(/^#+/g, '')));
      }
      if (g.kind !== 'typedef' && !hasOwnProp.call(seen, g.longname)) {
        searchMetadata[g.longname] = { 'ref': 'global.html#' + g.longname };
        searchMetadata[g.longname]['subCategory'] = 'Globals';
        nav += writeLink(g, g.longname, g.name, linkto);
      }
      seen[g.longname] = true;
    });

    nav += '</ul>';
  };

  return nav;
}

/**
    @param {TAFFY} taffyData See <http://taffydb.com/>.
    @param {object} opts
    @param {Tutorial} tutorials
 */
exports.publish = function (taffyData, opts, tutorials) {
  data = taffyData;

  var conf = env.conf.templates || {};
  conf.default = conf.default || {};

  var templatePath = path.normalize(opts.template);
  view = new template.Template(path.join(templatePath, 'tmpl'));

  // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
  // doesn't try to hand them out later
  var indexUrl = helper.getUniqueFilename('index');
  // don't call registerLink() on this one! 'index' is also a valid longname

  var globalUrl = helper.getUniqueFilename('global');
  helper.registerLink('global', globalUrl);

  // set up templating
  view.layout = conf.default.layoutFile ?
    path.getResourcePath(path.dirname(conf.default.layoutFile),
      path.basename(conf.default.layoutFile)) :
    'layout.tmpl';

  // set up tutorials for helper
  helper.setTutorials(tutorials);
  data = helper.prune(data);
  data.sort('longname, version, since');
  helper.addEventListeners(data);

  var sourceFiles = {};
  var sourceFilePaths = [];
  data().each(function (doclet) {
    doclet.attribs = '';

    if (doclet.examples) {
      doclet.examples = doclet.examples.map(function (example) {
        var caption, code;

        if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
          caption = RegExp.$1;
          code = RegExp.$3;
        }

        return {
          caption: caption || '',
          code: code || example
        };
      });
    }
    if (doclet.see) {
      doclet.see.forEach(function (seeItem, i) {
        doclet.see[i] = hashToLink(doclet, seeItem);
      });
    }

    // build a list of source files
    var sourcePath;
    if (doclet.meta) {
      sourcePath = getPathFromDoclet(doclet);
      sourceFiles[sourcePath] = {
        resolved: sourcePath,
        shortened: null
      };
      if (sourceFilePaths.indexOf(sourcePath) === -1) {
        sourceFilePaths.push(sourcePath);
      }
    }
  });

  // update outdir if necessary, then create outdir
  var packageInfo = (find({ kind: 'package' }) || [])[0];
  if (packageInfo && packageInfo.name) {
    outdir = path.join(outdir, packageInfo.name, (packageInfo.version || ''));
  }
  fs.mkPath(outdir);

  // copy the template's static files to outdir
  var fromDir = path.join(templatePath, 'static');
  var staticFiles = fs.ls(fromDir, 3);

  staticFiles.forEach(function (fileName) {
    var toDir = fs.toDir(fileName.replace(fromDir, outdir));
    fs.mkPath(toDir);
    var outFile = path.join( toDir, path.basename(fileName) );
    copyFile(fileName, outFile);
    //fs.copyFileSync(fileName, toDir);
  });

  // copy user-specified static files to outdir
  var staticFilePaths;
  var staticFileFilter;
  var staticFileScanner;
  if (conf.default.staticFiles) {
    // The canonical property name is `include`. We accept `paths` for backwards compatibility
    // with a bug in JSDoc 3.2.x.
    staticFilePaths = conf.default.staticFiles.include ||
      conf.default.staticFiles.paths ||
      [];
    staticFileFilter = new (require('jsdoc/src/filter')).Filter(conf.default.staticFiles);
    staticFileScanner = new (require('jsdoc/src/scanner')).Scanner();

    staticFilePaths.forEach(function (filePath) {
      var extraStaticFiles;

      filePath = path.resolve(env.pwd, filePath);
      extraStaticFiles = staticFileScanner.scan([filePath], 10, staticFileFilter);

      extraStaticFiles.forEach(function (fileName) {
        var sourcePath = fs.toDir(filePath);
        var toDir = fs.toDir(fileName.replace(sourcePath, outdir));
        fs.mkPath(toDir);
        var outFile = path.join( toDir, path.basename(fileName) );
        copyFile(fileName, outFile);
        //fs.copyFileSync(fileName, toDir);
      });
    });
  }

  if (sourceFilePaths.length) {
    sourceFiles = shortenPaths(sourceFiles, path.commonPrefix(sourceFilePaths));
  }
  data().each(function (doclet) {
    var url = helper.createLink(doclet);
    helper.registerLink(doclet.longname, url);

    // add a shortened version of the full path
    var docletPath;
    if (doclet.meta) {
      docletPath = getPathFromDoclet(doclet);
      docletPath = sourceFiles[docletPath].shortened;
      if (docletPath) {
        doclet.meta.shortpath = docletPath;
        //[csaba] added filename as well so that existing code that we have today won't break
        doclet.meta.filename = docletPath;
      }
    }
  });

  data().each(function (doclet) {
    var url = helper.longnameToUrl[doclet.longname];

    if (url.indexOf('#') > -1) {
      doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
    }
    else {
      doclet.id = doclet.name;
    }
    //[csaba] - fix an issue where inherited doclets are not "inheriting" the parsedType Object in the parameter or property type (object)
    // The reason is that this key is not enumerable so it's not cloned when jsdoc clones the inherited doclet. We need this object to properly
    // document function types. The proper function signature (as it was defined in the js src) can only be discovered in the type.parsedType.typeExpression
    // property. The "names" array under type only contains "function" as the type of a property or parameter but in this way we are loosing
    // the signature or return type of the function from our documentation.
    augmentInheritedTypes(doclet);

    if (needsSignature(doclet)) {
      addSignatureParams(doclet);
      addSignatureReturns(doclet);
      addAttribs(doclet);

    }
  });

  all_typedefs = find({ kind: "typedef" });
  // do this after the urls have all been generated
  data().each(function (doclet) {
    doclet.ancestors = getAncestorLinks(doclet);

    if (doclet.kind === 'member') {
      addSignatureTypes(doclet);
      addAttribs(doclet);
    }

    if (doclet.kind === 'constant') {
      addSignatureTypes(doclet);
      addAttribs(doclet);
      doclet.kind = 'member';
    }
  });



  var members = helper.getMembers(data);
  members.tutorials = tutorials.children;

  // output pretty-printed source files by default
  var outputSourceFiles = conf.default && conf.default.outputSourceFiles !== false ? true :
    false;

  // add template helpers
  // these functions can be used in template code
  view.find = find;
  view.linkto = linkto;
  view.resolveAuthorLinks = resolveAuthorLinks;
  view.tutoriallink = tutoriallink;
  view.htmlsafe = htmlsafe;
  view.outputSourceFiles = outputSourceFiles;
  view.tryTypeParsing = tryTypeParsing;

  // once for all
  //view.nav = buildNav(members);
  view.nav = buildJETNav(members);
  attachModuleSymbols(find({ longname: { left: 'module:' } }), members.modules);
  //check for jsdoc violations before generating files
  checkViolations(data);
  // generate the pretty-printed source files first so other pages can link to them
  if (outputSourceFiles) {
    generateSourceFiles(sourceFiles, opts.encoding);
  }

  if (members.globals.length) { generate('Global', [{ kind: 'globalobj' }], globalUrl); }

  // index page displays information from package.json and lists files
  var files = find({ kind: 'file' }),
    packages = find({ kind: 'package' });

  generate('Introduction',
    packages.concat(
      [{ kind: 'mainpage', readme: opts.readme, longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Main Page' }]
    ).concat(files),
    indexUrl);

  // set up the lists that we'll use to generate pages
  var classes = taffy(members.classes);
  var modules = taffy(members.modules);
  var namespaces = taffy(members.namespaces);
  var mixins = taffy(members.mixins);
  var externals = taffy(members.externals);
  var interfaces = taffy(members.interfaces);

  Object.keys(helper.longnameToUrl).forEach(function (longname) {
    var myModules = helper.find(modules, { longname: longname });
    if (myModules.length) {
      generate('Module: ' + myModules[0].name, myModules, helper.longnameToUrl[longname]);
    }

    var myClasses = helper.find(classes, { longname: longname });
    if (myClasses.length) {
      // E.g. @ojcomponent and @ojstylingdoc set the prefix to "Component: " and "Styling: ", and
      // @ojstylingdoc sets the title to the version of the title that hasn't had its spaces removed.
      var prefix = myClasses[0].ojoverviewdoc ? "" : myClasses[0].ojPageTitlePrefix || 'Class: ';
      var pageTitle = prefix + (myClasses[0].ojPageTitle || myClasses[0].name);
      generate(pageTitle, myClasses, helper.longnameToUrl[longname]);
    }

    var myNamespaces = helper.find(namespaces, { longname: longname });
    if (myNamespaces.length) {
      generate('Namespace: ' + myNamespaces[0].name, myNamespaces, helper.longnameToUrl[longname]);
    }

    var myMixins = helper.find(mixins, { longname: longname });
    if (myMixins.length) {
      generate('Mixin: ' + myMixins[0].name, myMixins, helper.longnameToUrl[longname]);
    }

    var myExternals = helper.find(externals, { longname: longname });
    if (myExternals.length) {
      generate('External: ' + myExternals[0].name, myExternals, helper.longnameToUrl[longname]);
    }

    var myInterfaces = helper.find(interfaces, { longname: longname });
    if (myInterfaces.length) {
      generate('Interface: ' + myInterfaces[0].name, myInterfaces, helper.longnameToUrl[longname]);
    }
  });
  var searchMdFilePath = path.join(outdir, 'jsDocMd.json');
  fs.writeFileSync(searchMdFilePath, JSON.stringify(searchMetadata), 'utf8');
  // TODO: move the tutorial functions to templateHelper.js
  function generateTutorial(title, tutorial, filename) {
    var tutorialData = {
      title: title,
      header: tutorial.title,
      content: tutorial.parse(),
      children: tutorial.children
    };

    var tutorialPath = path.join(outdir, filename),
      html = view.render('tutorial.tmpl', tutorialData);

    // yes, you can use {@link} in tutorials too!
    html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

    fs.writeFileSync(tutorialPath, html, 'utf8');
  }

  // tutorials can have only one parent so there is no risk for loops
  function saveChildren(node) {
    node.children.forEach(function (child) {
      generateTutorial('Tutorial: ' + child.title, child, helper.tutorialToUrl(child.name));
      saveChildren(child);
    });
  }
  saveChildren(tutorials);
};
/**
 * Checks for typedef usage in jsdoc type tag violation. If typedefs are found in the parsed type of an attribute
 * or function, jsdoc build will fail.
 * @param {TAFFY} data See <http://taffydb.com/>.
 */
function checkViolations(data) {
  //maps container parents to the array of typedefs belonging to the parent
  var containerToTypeDef = {};

  if (all_typedefs && all_typedefs.length) {
    all_typedefs.forEach(function (typedef) {
      let parent = typedef.memberof;
      if (parent) {
        // save the regexp to a key so that we can use it later in our test
        typedef['regexp'] = new RegExp(typedef.longname + "\\b", "g");
        containerToTypeDef[parent] = containerToTypeDef[parent] || [];
        containerToTypeDef[parent].push(typedef);
      }
      else {
        //TODO incorporate this later into the violation object
        //logger.warn("TypeDef %s from file %s does not have a parent", typedef.name, typedef.meta.filename);
      }
    });
  }
  let allDoclets= data().get();
  let processedDefaults = [];
  allDoclets.forEach(function(doclet) {
    if (doclet.kind === 'member' || doclet.kind === 'function') {
      let file = doclet.meta.filename;
      let arr = file.split('/');
      let module = arr[5];
      let fileName = arr[6];
      if (doclet.memberof !== undefined) {
        if (doclet.memberof.indexOf("~") > 0 || doclet.memberof.startsWith("_") || doclet.name.startsWith('_')) {
          //TODO incorporate this later into the violation object
          //logger.warn("IGNORE: %s::%s from %s should be marked with @ignore", doclet.memberof,doclet.name, doclet.meta.filename);
        }
        else {
          // we have a valid parent at this point
          let parent = doclet.memberof;
          //find that parent
          let parentObj = find({ kind: "class", longname: parent });
          if (parentObj && parentObj.length) {
            var isPublicAttribute = doclet.kind === 'member' && doclet.access !== 'protected' && doclet.access !== 'private' &&
                                    !doclet.ojslot && !doclet.ojchild && !doclet.ojfragment && !doclet.ojbindingonly &&
                                    !doclet.ojnodecontext && !doclet.ojsubid;
            if (parentObj.length > 1) {
              //TODO incorporate this later into the violation object
              //logger.error("MORE_THEN_ONE_PARENT: %s has more then one class type parent", doclet.name);
            }
            else if (!parentObj[0].ignore) {
              // finally we have found the parent doclet for this member
              // check for @type for public members - must have a type
              if (isPublicAttribute) {
                //check for the existence of type
                if (!doclet.type) {
                  if (parentObj[0].ojcomponent){
                    COLLECTED_VIOLATIONS['MISSING_OJCOMPONENT_TYPE'] = COLLECTED_VIOLATIONS['MISSING_OJCOMPONENT_TYPE'] || {};
                    COLLECTED_VIOLATIONS['MISSING_OJCOMPONENT_TYPE'][module] = COLLECTED_VIOLATIONS['MISSING_OJCOMPONENT_TYPE'][module] || {};
                    COLLECTED_VIOLATIONS['MISSING_OJCOMPONENT_TYPE'][module][fileName] = COLLECTED_VIOLATIONS['MISSING_OJCOMPONENT_TYPE'][module][fileName] || [];
                    COLLECTED_VIOLATIONS['MISSING_OJCOMPONENT_TYPE'][module][fileName].push(util.format(ALL_VIOLATIONS['MISSING_OJCOMPONENT_TYPE'].message, doclet.name.replace(/^#+/g, ''), parent));
                  }
                  else{
                    COLLECTED_VIOLATIONS['MISSING_CLASS_TYPE'] = COLLECTED_VIOLATIONS['MISSING_CLASS_TYPE'] || {};
                    COLLECTED_VIOLATIONS['MISSING_CLASS_TYPE'][module] = COLLECTED_VIOLATIONS['MISSING_CLASS_TYPE'][module] || {};
                    COLLECTED_VIOLATIONS['MISSING_CLASS_TYPE'][module][fileName] = COLLECTED_VIOLATIONS['MISSING_CLASS_TYPE'][module][fileName] || [];
                    COLLECTED_VIOLATIONS['MISSING_CLASS_TYPE'][module][fileName].push(util.format(ALL_VIOLATIONS['MISSING_CLASS_TYPE'].message, doclet.name.replace(/^#+/g, ''), parent));
                  }
                }
                else{
                  //check if type contains {*}
                  if (doclet.type.names &&  parentObj[0].ojcomponent){
                    var isObject = false;
                    doclet.type.names.forEach(function(name, i){
                      if (name.indexOf('*') >= 0){
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'] = COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'] || {};
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module] = COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module] || {};
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module][fileName] = COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module][fileName] || [];
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module][fileName].push(util.format(ALL_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'].message, doclet.name.replace(/^#+/g, ''), parent, 'change {*} to {any}'));
                      }
                      if (name.indexOf('undefined') >= 0){
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'] = COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'] || {};
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module] = COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module] || {};
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module][fileName] = COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module][fileName] || [];
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module][fileName].push(util.format(ALL_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'].message, doclet.name.replace(/^#+/g, ''), parent, 'remove \"undefined\" from the type'));
                      }
                      if (name.indexOf('String') >= 0){
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'] = COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'] || {};
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module] = COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module] || {};
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module][fileName] = COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module][fileName] || [];
                        COLLECTED_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'][module][fileName].push(util.format(ALL_VIOLATIONS['INVALID_ATTRIBUTE_TYPE'].message, doclet.name.replace(/^#+/g, ''), parent, 'change \"String\" to \"string\"'));
                      }
                      if (name.toLowerCase().indexOf('object') >= 0){
                        isObject = true;
                      }
                    });

                    if(parentObj[0].ojcomponent && isObject && doclet.id !== 'translations'){
                      // @property {String} [prop="value"] description
                      //Support for default values in @property tags: currently jsdoc supports the propname=default notation
                      //in the @property tag *only* if you use to optional notation: [propname=default] (which sort of makes sense).

                      /*
                      commented out because at this time we will not enforce default checking if the sub-properties are defined via @property tags
                      if (doclet.properties && doclet.properties.length){
                        if (doclet.defaultvalue && doclet.defaultvalue !== '{}' && doclet.defaultvalue !== 'null'){
                          COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'] = COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'] || {};
                          COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module] = COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module] || {};
                          COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module][fileName] = COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module][fileName] || [];
                          COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module][fileName].push(util.format(ALL_VIOLATIONS['INVALID_DEFAULT_VALUE'].message, doclet.name.replace(/^#+/g, ''), parent));
                        }
                        doclet.properties.sort(function(a, b){
                          var aid, bid;
                          aid = a.name.replace(/\[\]/, '');
                          bid = b.name.replace(/\[\]/, '');
                          return (aid < bid) ? -1 : (aid > bid) ? 1 : 0;
                        });

                        for (let m = 0; m < doclet.properties.length; m++) {
                          let subpropobj = doclet.properties[m];
                          if (subpropobj.defaultvalue && subpropobj.defaultvalue !== '{}' && doclet.properties[m+1].name.startsWith(subpropobj.name + '.')){
                            COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'] = COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'] || {};
                            COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module] = COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module] || {};
                            COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module][fileName] = COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module][fileName] || [];
                            COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module][fileName].push(util.format(ALL_VIOLATIONS['INVALID_DEFAULT_VALUE'].message, subpropobj.name.replace(/^#+/g, ''), parent));
                          }
                        }
                      }*/
                      if (doclet.id.indexOf('.') < 0) {
                        //check descendants
                        var subpropDoclets = find({ kind: "member", memberof:doclet.memberof, id:{left: doclet.id} });
                        if (subpropDoclets && subpropDoclets.length && subpropDoclets.length > 1){
                          // make sure they are in order
                          subpropDoclets.sort(function(a, b){
                            var aid, bid;
                            aid = a.name.replace(/\[\]/, '');
                            bid = b.name.replace(/\[\]/, '');
                            return (aid < bid) ? -1 : (aid > bid) ? 1 : 0;
                          });
                          // something like oj.ojChart#dnd.drag, oj.ojChart#dnd.drag.groups, oj.ojChart#dnd.drag.groups.dataTypes, etc...
                          for (let v = 0; v < subpropDoclets.length - 1; v++) {
                            let subpropDoclet = subpropDoclets[v];
                            if (subpropDoclet.defaultvalue && subpropDoclet.defaultvalue !== '{}' && subpropDoclet.defaultvalue !== 'null' && subpropDoclets[v+1].id.startsWith(subpropDoclet.id + '.')){
                              COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'] = COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'] || {};
                              COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module] = COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module] || {};
                              COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module][fileName] = COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module][fileName] || [];
                              COLLECTED_VIOLATIONS['INVALID_DEFAULT_VALUE'][module][fileName].push(util.format(ALL_VIOLATIONS['INVALID_DEFAULT_VALUE'].message, subpropDoclet.name.replace(/^#+/g, ''), parent));
                            }
                          };
                        }
                      }
                    }
                  }
                }
              }

              // see if you can find typedefs belonging to this parent
              let typedefs = containerToTypeDef[parent];
              //we have typedefs?
              if (typedefs && typedefs.length) {
                // look for the signature
                let sign = doclet.signature;
                // we should have at this poitn a constructed signature
                if (sign) {
                  let typeExpr;
                  if (doclet.type && doclet.type.parsedType && doclet.type.parsedType.typeExpression) {
                    typeExpr = doclet.type.parsedType.typeExpression;
                  }
                  typedefs.forEach(function (typedef) {
                    let regex = typedef['regexp'];
                    //first check if @type might contain a typedef (this is not supported)
                    if (typeExpr && regex.test(typeExpr)) {
                      COLLECTED_VIOLATIONS['TYPEDEF_IN_TYPE'] = COLLECTED_VIOLATIONS['TYPEDEF_IN_TYPE'] || {};
                      COLLECTED_VIOLATIONS['TYPEDEF_IN_TYPE'][module] = COLLECTED_VIOLATIONS['TYPEDEF_IN_TYPE'][module] || {};
                      COLLECTED_VIOLATIONS['TYPEDEF_IN_TYPE'][module][fileName] = COLLECTED_VIOLATIONS['TYPEDEF_IN_TYPE'][module][fileName] || [];
                      COLLECTED_VIOLATIONS['TYPEDEF_IN_TYPE'][module][fileName].push(util.format(ALL_VIOLATIONS['TYPEDEF_IN_TYPE'].message, doclet.name.replace(/^#+/g, ''), typedef.longname));
                    }
                    if (regex.test(sign)) {
                      // check if signature has a anchor link and typedefs is part of the link
                      if (sign.indexOf(util.format('>%s</a>', typedef.longname)) < 0) {
                        COLLECTED_VIOLATIONS['MISSING_LINKS'] = COLLECTED_VIOLATIONS['MISSING_LINKS'] || {};
                        COLLECTED_VIOLATIONS['MISSING_LINKS'][module] = COLLECTED_VIOLATIONS['MISSING_LINKS'][module] || {};
                        COLLECTED_VIOLATIONS['MISSING_LINKS'][module][fileName] = COLLECTED_VIOLATIONS['MISSING_LINKS'][module][fileName] || [];
                        COLLECTED_VIOLATIONS['MISSING_LINKS'][module][fileName].push(util.format(ALL_VIOLATIONS['MISSING_LINKS'].message, doclet.name.replace(/^#+/g, ''), 'TypeDef', typedef.longname));
                      }
                    }
                  });
                }
                else {
                  //TODO incorporate this later into the violation object
                  //logger.error("NO_SIGNATURE: %s::%s has no type signature", doclet.memberof, doclet.name);
                }
              }
            }
          }
          else {
            // translation objects do not have class kind parent
            if (doclet.meta.filename.indexOf('ojtranslations.js') < 0) {
              //TODO incorporate this later into the violation object
              //logger.warn("NO_CLASS_PARENT: %s from %s does not have a parent", doclet.name, doclet.meta.filename);
            }
          }
        }
      }
      else {
        //TODO incorporate this later into the violation object
        //logger.warn("NO_MEMBEROF: %s has no memberof", doclet.name);
      }
    }
  });

  // send to stdout the violations
  printViolations();
  // make the build fail if we found the TYPEDEF_IN_TYPE violation
  if (BUILD_STOP) {
    logger.error(new Error("JSDOC build failed. Check the log for more information"));
  }
};

//utility function to print the violation object in a consumable format
//the violation messages are grouped by: violation code, module name, file belonging to the module, message
function printViolations() {
  let violations = Object.keys(COLLECTED_VIOLATIONS).sort();
  violations.forEach(function (violation) {
    if (ALL_VIOLATIONS[violation].enabled) {
      let level = ALL_VIOLATIONS[violation].level;
      if (level === 'error') BUILD_STOP = true;
      if (level === env.opts.violationLevel.toLowerCase() || level === 'error') {
        printInColorForLevel(level, violation, 0);
        let moduleObj = COLLECTED_VIOLATIONS[violation];
        let modules = Object.keys(moduleObj).sort();

        modules.forEach(function (module) {
          printInColor(Color.FgGreen, '\\' + module, 2);
          let filesObj = moduleObj[module];
          let files = Object.keys(filesObj).sort();
          files.forEach(function (file) {
            printInColor(Color.FgCyan, ('|-' + file), 3);
            let messages = filesObj[file];
            messages.forEach(function (message) {
              printInColorForLevel(level, message, 6);
            });
          });
        });
      }
    }
  });
};

var Color = {};
Color.Reset = "\x1b[0m";
Color.Bright = "\x1b[1m";
Color.Dim = "\x1b[2m";
Color.Underscore = "\x1b[4m";
Color.Blink = "\x1b[5m";
Color.Reverse = "\x1b[7m";
Color.Hidden = "\x1b[8m";

Color.FgBlack = "\x1b[30m";
Color.FgRed = "\x1b[31m";
Color.FgGreen = "\x1b[32m";
Color.FgYellow = "\x1b[33m";
Color.FgBlue = "\x1b[34m";
Color.FgMagenta = "\x1b[35m";
Color.FgCyan = "\x1b[36m";
Color.FgWhite = "\x1b[37m";

Color.BgBlack = "\x1b[40m";
Color.BgRed = "\x1b[41m";
Color.BgGreen = "\x1b[42m";
Color.BgYellow = "\x1b[43m";
Color.BgBlue = "\x1b[44m";
Color.BgMagenta = "\x1b[45m";
Color.BgCyan = "\x1b[46m";
Color.BgWhite = "\x1b[47m";

function printInColorForLevel(level, text, indent) {
  let color = Color.FgWhite;
  let prefix = (indent == 0 ? "" : level.toLowerCase() + ": " || "");
  if (level.toLowerCase() === 'warning'){
    color = Color.FgYellow;
  }else if (level.toLowerCase() === 'error'){
    color = Color.FgRed;
  }
  if (prefix.length > 0)
    console.log(color + ' '.repeat(indent) + prefix + Color.Reset + Color.FgWhite + '%s' + Color.Reset, text);
  else
    console.log(color + ' '.repeat(indent) + '%s' + Color.Reset, text);
};

function printInColor(color, text, indent) {
  console.log(color + ' '.repeat(indent) + '%s' + Color.Reset, text);
};

/**
 * A copyFileSync alternative to overcome some limitation this method poses when used in Node version 7 and beyond.
 * @param {string} source The source file jsdoc processes
 * @param {string} target The generated file
 */
function copyFile(source, target) {
  var readStream = nodefs.createReadStream(source);
  readStream.on("error", (err) => {
    logger.error('Error while copying source file %s: %s', source, err.message);
  });
  var writeStream = nodefs.createWriteStream(target);
  writeStream.on("error", (err) => {
    logger.error('Error while writing generated file %s: %s', target, err.message);
  });
  writeStream.on("close", (ex) => {});
  readStream.pipe(writeStream);
}




