// Allows loading module again to test no head element.
declare module '*?no-head' {}

// Type info for dynamic module provided by web test-runner
// plugin.
declare module '*environment.js' {
  const env: {
    percyEnabled: boolean;
  };

  export default env;
}
