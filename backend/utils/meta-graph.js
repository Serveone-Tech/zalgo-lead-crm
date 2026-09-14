// Single source of truth for the Meta Graph API version — every Meta
// request in the app (messages, media, templates) builds its URL from
// GRAPH_BASE instead of hardcoding "https://graph.facebook.com/vNN.N" in
// each file, so bumping the API version is a one-line change here instead
// of a grep-and-replace across the codebase.
const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v20.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

module.exports = { GRAPH_API_VERSION, GRAPH_BASE };
