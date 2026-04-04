/**
 * Remotion entrypoint — registers the root composition tree.
 * Do not import business logic here; keep it pure Remotion registration.
 */
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
