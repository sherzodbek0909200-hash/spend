
// Augment the existing NodeJS namespace to include the API_KEY environment variable.
// This prevents conflicts with existing global 'process' declarations from Node.js types.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
