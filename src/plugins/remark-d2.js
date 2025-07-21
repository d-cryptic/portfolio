import { execSync } from "child_process";
import crypto from "crypto";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { visit } from "unist-util-visit";

export function remarkD2() {
  return (tree) => {
    visit(tree, "code", (node) => {
      if (node.lang === "d2") {
        const hash = crypto.createHash("md5").update(node.value).digest("hex");
        const tempDir = join(process.cwd(), ".d2-temp");
        const tempFile = join(tempDir, `temp-${hash}.d2`);
        const outputFile = join(tempDir, `temp-${hash}.svg`);

        try {
          // Create temp directory if it doesn't exist
          if (!existsSync(tempDir)) {
            execSync(`mkdir -p "${tempDir}"`, { stdio: "pipe" });
          }

          // Write D2 content to temp file
          writeFileSync(tempFile, node.value);

          // Set PATH to include ~/.local/bin where D2 is installed
          const env = { ...process.env };
          env.PATH = `${process.env.HOME}/.local/bin:${env.PATH}`;

          // Run D2 to generate SVG
          execSync(`d2 "${tempFile}" "${outputFile}" --theme=0 --pad=0`, {
            stdio: "pipe",
            env: env,
          });

          // Read the generated SVG
          const svg = readFileSync(outputFile, "utf8");

          // Clean up temp files
          if (existsSync(tempFile)) unlinkSync(tempFile);
          if (existsSync(outputFile)) unlinkSync(outputFile);

          // Replace the code node with HTML containing the SVG
          node.type = "html";
          node.value = `<div class="d2-diagram" data-d2-hash="${hash}">${svg}</div>`;
        } catch (error) {
          console.error("D2 rendering error:", error.message);

          // Clean up temp files on error
          try {
            if (existsSync(tempFile)) unlinkSync(tempFile);
            if (existsSync(outputFile)) unlinkSync(outputFile);
          } catch (cleanupError) {
            // Ignore cleanup errors
          }

          // Replace with error message
          node.type = "html";
          node.value = `<div class="d2-error">
            <strong>D2 Diagram Error:</strong> ${error.message}
            <details>
              <summary>D2 Code</summary>
              <pre><code>${node.value}</code></pre>
            </details>
          </div>`;
        }
      }
    });
  };
}
