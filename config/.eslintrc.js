module.exports = {
    "parserOptions": {
        "ecmaVersion": 5
    },
    //"extends": "airbnb/legacy", // use for ESLint5
    "plugins": [
        "react",
    ],
    "env": {
        "jquery": true
    },
    "globals": {
        "oj": true
    },
    "rules": {
        "comma-dangle": "off",
        "no-underscore-dangle": "off", // JET closure complier uses leading underscores to identify private methods
        "vars-on-top": "off", // anti-pattern
        "quote-props": "off", // JET components explictly quote properties to avoid closure-compiler transformations.
        "dot-notation": "off", // related to quote-props
        "func-names": "off",

        "spaced-comment": ["warn", "always", {
            "line": {
                "markers" : ["/"],
                "exceptions" : ["/"],
            },
            "block": {
                "markers" : ["!"],
                "exceptions" : ["*"]
            }
        }],
    }
}
