module.exports = function(grunt) {

  var files = [
    'drupal.api.js/bin/drupal.api.js',
    'src/allplayers.date.js',
    'src/allplayers.event.js',
    'src/allplayers.group.js',
    'src/allplayers.location.js',
    'src/allplayers.product.js',
    'src/allplayers.calendar.js',
    'lib/treeselect/bin/jquery.treeselect.js',
    'lib/group_select/js/group_select.js',
    'lib/group_finder/js/group_finder.js'
  ];

  var lintFiles = [
    'src/allplayers.date.js',
    'src/allplayers.event.js',
    'src/allplayers.group.js',
    'src/allplayers.location.js',
    'src/allplayers.product.js',
    'src/allplayers.calendar.js',
    'src/allplayers.app.server.js',
    'src/allplayers.app.client.js',
    'src/allplayers.embed.js',
    'src/allplayers.embed.server.js',
    'src/allplayers.embed.client.js',
    'lib/group_select/js/group_select.js',
    'lib/group_finder/js/group_finder.js'
  ];

  var docFiles = [
    'drupal.api.js/src/drupal.api.js',
    'drupal.api.js/src/drupal.system.js',
    'drupal.api.js/src/drupal.entity.js',
    'drupal.api.js/src/drupal.node.js',
    'drupal.api.js/src/drupal.user.js',
    'src/allplayers.date.js',
    'src/allplayers.event.js',
    'src/allplayers.group.js',
    'src/allplayers.location.js',
    'src/allplayers.product.js',
    'src/allplayers.calendar.js'
  ];

  var embedServerFiles = [
    'lib/seamless.js/build/seamless.child.js',
    'src/allplayers.base64.js',
    'src/allplayers.embed.js',
    'src/allplayers.embed.server.js'
  ];

  var embedClientFiles = [
    'lib/seamless.js/build/seamless.parent.js',
    'src/allplayers.base64.js',
    'src/allplayers.embed.js',
    'src/allplayers.embed.client.js'
  ];

  var appServerFiles = [
    'lib/seamless.js/build/seamless.parent.js',
    'src/allplayers.base64.js',
    'src/allplayers.app.js',
    'src/allplayers.app.server.js'
  ];

  var appClientFiles = [
    'lib/seamless.js/build/seamless.child.js',
    'src/allplayers.base64.js',
    'src/allplayers.app.js',
    'src/allplayers.app.client.js'
  ];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['Gruntfile.js'].concat(lintFiles)
    },
    concat: {
      options: {
        separator: '',
      },
      build: {
        files: {
          'bin/allplayers.js': files,
          'bin/allplayers.embed.client.js': embedClientFiles,
          'bin/allplayers.embed.server.js': embedServerFiles,
          'bin/allplayers.app.client.js': appClientFiles,
          'bin/allplayers.app.server.js': appServerFiles,
        }
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files: {
          'bin/allplayers.compressed.js': files,
          'bin/allplayers.min.js': files,
          'bin/allplayers.embed.client.min.js': embedClientFiles,
          'bin/allplayers.embed.server.min.js': embedServerFiles,
          'bin/allplayers.app.client.min.js': appClientFiles,
          'bin/allplayers.app.server.min.js': appServerFiles,
          'bin/allplayers.loader.js': ['src/allplayers.loader.js']
        }
      }
    },
    jsdoc : {
      dist : {
        src: docFiles,
        options: {
          destination: 'doc'
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'jsdoc']);
};
