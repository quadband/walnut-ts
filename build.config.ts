import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
    entries: ["src/index", "src/vite-plugin"],
    clean: true,
    declaration: "compatible"
})