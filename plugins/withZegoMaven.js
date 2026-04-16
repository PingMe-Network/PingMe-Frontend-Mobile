const { withProjectBuildGradle } = require("@expo/config-plugins");

module.exports = function withZegoMaven(config) {
  return withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // Check if the Zego repository is already added to prevent duplicates
    if (!buildGradle.includes("storage.zego.im/maven")) {
      // Find the allprojects/repositories block
      const targetString = "allprojects {\n    repositories {\n";
      const regex = /allprojects\s*{\s*repositories\s*{/;
      
      if (regex.test(buildGradle)) {
        config.modResults.contents = buildGradle.replace(
          regex,
          "allprojects {\n    repositories {\n        maven { url 'https://storage.zego.im/maven' }"
        );
      }
    }
    
    return config;
  });
};
