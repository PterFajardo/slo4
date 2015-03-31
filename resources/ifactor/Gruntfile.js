module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      sass: {
        files: "scss/*.scss",
        tasks: ['sass']
      }
    },
    // SASS task config
    sass: {
      dist: {
        files: [{
          expand: true,
          cwd: 'scss',
          src: '*.scss',
          dest: 'css',
          ext: '.css'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  //grunt.loadNpmTasks('grunt-contrib-jshint');


  // Default task(s).
  grunt.registerTask('default', ['watch']);

};