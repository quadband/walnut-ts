import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
    entries: ["src/index", "src/vite-plugin", "src/core/walnut-key"],
    clean: true,
    declaration: "compatible"
})