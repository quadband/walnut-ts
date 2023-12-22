import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
    entries: ["src/index", "src/vite-plugin", "src/core/walnut-key", "src/bin", "src/jsx"],
    clean: true,
    declaration: "compatible"
})