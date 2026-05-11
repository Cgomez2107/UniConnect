export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests", "<rootDir>/services"],
  testMatch: ["**/*.spec.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        module: "esnext",
        moduleResolution: "node",
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
