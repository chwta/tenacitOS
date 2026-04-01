import path from 'path';

/**
 * Centralized path configuration.
 * In production (VPS), these default to /root/.vertexos paths.
 * For local development, override via environment variables.
 */
export const VERTEXOS_DIR = process.env.VERTEXOS_DIR || '/root/.vertexos';
export const VERTEXOS_WORKSPACE = process.env.VERTEXOS_WORKSPACE || path.join(VERTEXOS_DIR, 'workspace');
export const VERTEXOS_CONFIG = path.join(VERTEXOS_DIR, 'config.json');
export const VERTEXOS_MEDIA = path.join(VERTEXOS_DIR, 'media');

export const WORKSPACE_IDENTITY = path.join(VERTEXOS_WORKSPACE, 'IDENTITY.md');
export const WORKSPACE_TOOLS = path.join(VERTEXOS_WORKSPACE, 'TOOLS.md');
export const WORKSPACE_MEMORY = path.join(VERTEXOS_WORKSPACE, 'memory');

export const SYSTEM_SKILLS_PATH = '/usr/lib/node_modules/vertexos/skills';
export const WORKSPACE_SKILLS_PATH = path.join(VERTEXOS_DIR, 'workspace-infra', 'skills');

/** Allowed base paths for media/file serving */
export const ALLOWED_MEDIA_PREFIXES = [
  path.join(VERTEXOS_WORKSPACE, '/'),
  path.join(VERTEXOS_MEDIA, '/'),
];
