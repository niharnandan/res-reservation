module.exports = {
    // Your existing config...
    extends: [
      // Your existing extends...
      'prettier',
      'plugin:prettier/recommended'
    ],
    plugins: [
      // Your existing plugins...
      'prettier'
    ],
    rules: {
      // Your existing rules...
      'prettier/prettier': 'error'
    }
  };