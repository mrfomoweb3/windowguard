import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const font = "/System/Library/Fonts/Supplemental/Georgia Bold Italic.ttf";

async function exportLogo(fill, output) {
  await run("magick", [
    "-background", "none",
    "-fill", fill,
    "-font", font,
    "-pointsize", "600",
    "-kerning", "-66",
    "label:WG",
    "-trim", "+repage",
    "-bordercolor", "none",
    "-border", "90x70",
    output,
  ]);
}

await Promise.all([
  exportLogo("#f2f2ef", "brand/windowguard-logo.png"),
  exportLogo("#080909", "brand/windowguard-logo-black.png"),
]);

console.log("Exported transparent WindowGuard logo PNGs.");
