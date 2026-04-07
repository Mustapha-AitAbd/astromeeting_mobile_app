module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // ✅ react-native-dotenv supprimé — on utilise process.env.EXPO_PUBLIC_* directement
  };
};