var path = require("path"),
    mxClient = require("./javascript/src/js/mxClient"),
    SRC_PATH = "./javascript/src",
    DIST_PATH = "./javascript/dist",
    deps;

deps = ["./js/mxClient.js"].concat(mxClient.deps.slice(0));

var findDepsPosition = function (srcpath) {
  var ind = -1;

  deps.forEach(function (dep, i) {
    var fullpath = path.join(SRC_PATH, dep);

    if (fullpath === srcpath) {
      ind = i;
    }
  });

  if (ind === -1) {
    throw new Error("Dependency not found.");
  }

  return ind;
};

module.exports = function (grunt) {
  var umdFiles = [];

  deps.forEach(function (dep) {
    var p = path.join(DIST_PATH, dep);

    umdFiles.push({
      src: [p],
      dest: p
    });
  });

  grunt.initConfig({
    copy: {
      main: {
        files: [{
          expand: true,
          cwd: SRC_PATH,
          src: deps,
          dest: "./javascript/dist"
        }],
        options: {
          process: function (content, srcpath) {
            var dependencyNumber = findDepsPosition(srcpath),
                moduleDefinition = "";

            if (dependencyNumber >= 1) {
              deps.slice(0, dependencyNumber).forEach(function (dep) {
                var relativePath = path.relative(path.dirname(srcpath), path.join(SRC_PATH, dep));

                moduleDefinition += "@import ./" + relativePath + " as " + path.basename(dep, ".js") + "\n";
              });
            }

            moduleDefinition += "@export " + path.basename(srcpath, ".js") + "\n";

            // TODO how to pass these in properly
            moduleDefinition += "mxResourceExtension = '.txt'";

            return moduleDefinition + "\n\n" + content;
          }
        }
      }
    },
    umd_wrapper: {
      options: {
        template: "./umdtemplate"
      },
      main: {
        files: umdFiles
      }
    },
    webpack: {
      examples: {
        entry: "./javascript/examples/webpack/src/anchors.js",
        output: {
          path: "javascript/examples/webpack/dist",
          filename: "anchors.js"
        }
      }
    },
    watch: {
      javascripts: {
        files: "javascript/src/**/*.js",
        tasks: ["umdify"],
        options: {
          interrupt: true
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-umd-wrapper');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.registerTask("umdify", [
    "copy",
    "umd_wrapper"
  ]);
  grunt.registerTask("default", [
    "umdify",
    "webpack"
  ]);
  grunt.registerTask("build", [
    "default"
  ]);
};
