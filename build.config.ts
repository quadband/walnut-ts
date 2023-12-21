import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
    entries: ["src/index", "src/vite-plugin", "src/core/walnut-key", "src/bin"],
    clean: true,
    declaration: "compatible"
})