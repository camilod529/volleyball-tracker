import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * Writes CSV text to a cache file and opens the native share sheet on it.
 * Uses expo-file-system's native modules, so this only runs on-device —
 * see src/export/csvBuilder.ts for the console-testable part.
 */
export async function shareCsv(filename: string, csvContent: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(csvContent);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Sharing is not available on this device");
  }
  await Sharing.shareAsync(file.uri, { mimeType: "text/csv", dialogTitle: filename });
}
