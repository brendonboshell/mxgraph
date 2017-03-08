/* globals console */
// This is a rough script that finds the dependency graph in the current code
// and applies a toposort (which will identify any circular depedencies).
var path = require("path"),
    fs = require("fs"),
    toposort = require("toposort"),
    stripComments = require('strip-comments'),
    mxClientContent,
    SRC_PATH = "../javascript/src",
    deps,
    edges;

// Extract the files from mxClient by matching the `mxClient.include` lines.
mxClientContent = fs.readFileSync(
  path.join(__dirname, "../javascript/src/js/mxClient.js"),
  "utf8"
);

deps = mxClientContent.match(/mxClient\.include\([^"']+["'](.*?)["']/gi).map(function (str) {
  return "." + str.match(/mxClient\.include\([^"']+["'](.*?)["']/)[1];
});

// Read each file, strip out comments and find any references to other modules.
edges = deps.map(function (fromDep) {
  var fromFullpath = path.join(SRC_PATH, fromDep),
      fromContents = stripComments(fs.readFileSync(fromFullpath, "utf8")),
      subDeps = [];

  deps.forEach(function (toDep) {
    var toName = path.basename(toDep, ".js");
    if (fromContents.match(new RegExp(toName + "[^A-Za-z0-9]")) !== null && fromDep !== toDep) {
      subDeps.push([fromDep, toDep]);
    }
  });

  return subDeps;
}).reduce(function (memo, val) {
  return memo.concat(val);
});

fs.writeFileSync("results.txt", JSON.stringify(edges, null, 4));

console.log(toposort(edges));
