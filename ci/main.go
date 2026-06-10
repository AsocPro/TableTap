// Package main is the Dagger CI pipeline for TableTap.
//
// Available functions:
//
//	build-server  – compile the Rust SpacetimeDB module to WASM
//	build-client  – bundle the TypeScript/Vite client
//	dev           – run SpacetimeDB + client web server for local testing
//
// Quick start:
//
//	cd ci && dagger develop          # generate go.mod / go.sum (first time only)
//	dagger call dev --src .. up --ports 3000:3000 --ports 8080:8080
//	# open http://localhost:8080 in your browser
package main

import (
	"dagger/tabletap-ci/internal/dagger"
	"fmt"
)

// SPACETIME_VERSION is the SpacetimeDB release to download into the dev
// container. Keep in sync with the spacetimedb SDK version in server/Cargo.toml.
const spacetimeVersion = "v1.12.0"

// TabletapCi is the root Dagger module object.
type TabletapCi struct{}

// BuildServer compiles the Rust SpacetimeDB module to a WASM binary.
// Returns the compiled .wasm file, ready for publishing.
//
//	dagger call build-server --src . export --path ./tabletap.wasm
func (m *TabletapCi) BuildServer(
	// Path to the repository root.
	// +defaultPath="."
	src *dagger.Directory,
) *dagger.File {
	return dag.Container().
		// spacetimedb v1.12+ (resolved from ^1.0.0) requires rustc >= 1.90
		From("rust:latest").
		WithMountedDirectory("/src", src.Directory("server")).
		WithWorkdir("/src").
		WithExec([]string{"rustup", "target", "add", "wasm32-unknown-unknown"}).
		WithExec([]string{
			"cargo", "build",
			"--target", "wasm32-unknown-unknown",
			"--release",
		}).
		File("/src/target/wasm32-unknown-unknown/release/tabletap.wasm")
}

// BuildClient bundles the TypeScript/Vite client into a static dist directory.
//
//	dagger call build-client --src . export --path ./dist
func (m *TabletapCi) BuildClient(
	// Path to the repository root.
	// +defaultPath="."
	src *dagger.Directory,
) *dagger.Directory {
	return dag.Container().
		From("oven/bun:1").
		WithMountedDirectory("/app", src.Directory("client")).
		WithWorkdir("/app").
		WithExec([]string{"bun", "install"}).
		WithExec([]string{"bunx", "vite", "build"}).
		Directory("/app/dist")
}

// Dev returns a service that runs:
//   - SpacetimeDB on port 3000 (with the tabletap module already published)
//   - A static HTTP server for the client on port 8080
//
// Tunnel both ports to localhost and open your browser:
//
//	dagger call dev --src . up --ports 3000:3000 --ports 8080:8080
func (m *TabletapCi) Dev(
	// Path to the repository root.
	// +defaultPath="."
	src *dagger.Directory,
) *dagger.Service {
	wasm := m.BuildServer(src)
	dist := m.BuildClient(src)

	// Download URL for the spacetime binaries.
	// The archive contains: spacetimedb-cli (client tool) and spacetimedb-standalone (server).
	downloadURL := fmt.Sprintf(
		"https://github.com/clockworklabs/SpacetimeDB/releases/download/%s/spacetime-x86_64-unknown-linux-gnu.tar.gz",
		spacetimeVersion,
	)

	startupScript := `#!/bin/sh
set -e

echo "[tabletap] generating JWT keys (PKCS#8 EC P-256)..."
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out /tmp/jwt_private.pem
openssl pkey -in /tmp/jwt_private.pem -pubout -out /tmp/jwt_public.pem

echo "[tabletap] starting SpacetimeDB (--in-memory, port 3000)..."
mkdir -p /tmp/stdb
/usr/local/bin/spacetimedb-standalone start \
    --listen-addr 0.0.0.0:3000 \
    --data-dir /tmp/stdb \
    --in-memory \
    --non-interactive \
    --jwt-priv-key-path /tmp/jwt_private.pem \
    --jwt-pub-key-path /tmp/jwt_public.pem &
STDB_PID=$!

echo "[tabletap] waiting for SpacetimeDB..."
attempts=0
until /usr/local/bin/spacetimedb-cli server ping http://localhost:3000 >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    [ "$attempts" -lt 60 ] || { echo "[tabletap] ERROR: SpacetimeDB did not become ready"; exit 1; }
    sleep 1
done
echo "[tabletap] SpacetimeDB ready."

echo "[tabletap] publishing tabletap module..."
/usr/local/bin/spacetimedb-cli publish \
    --bin-path /module.wasm \
    --server http://localhost:3000 \
    --delete-data=always \
    --yes \
    tabletap
echo "[tabletap] module published."

echo "[tabletap] serving client on :8080..."
python3 -m http.server 8080 --directory /client &

printf '\n  SpacetimeDB  ws://localhost:3000\n  Client UI    http://localhost:8080\n\n'
wait $STDB_PID
`

	return dag.Container().
		From("debian:bookworm-slim").
		// Install curl for downloading binaries and python3 for the HTTP server
		WithExec([]string{"apt-get", "update", "-qq"}).
		WithExec([]string{
			"apt-get", "install", "-y", "--no-install-recommends",
			"ca-certificates", "curl", "openssl", "python3",
		}).
		WithExec([]string{"apt-get", "clean"}).
		// Download and install the spacetimedb binaries
		WithExec([]string{"sh", "-c", fmt.Sprintf(
			`curl -fsSL "%s" | tar -xz -C /usr/local/bin/`,
			downloadURL,
		)}).
		WithExec([]string{"chmod", "+x",
			"/usr/local/bin/spacetimedb-cli",
			"/usr/local/bin/spacetimedb-standalone",
		}).
		// Place the pre-built server WASM
		WithFile("/module.wasm", wasm).
		// Place the pre-built client bundle
		WithDirectory("/client", dist).
		// Write and arm the startup script
		WithNewFile("/start.sh", startupScript).
		WithExec([]string{"chmod", "+x", "/start.sh"}).
		WithExposedPort(3000).
		WithExposedPort(8080).
		WithEntrypoint([]string{"/start.sh"}).
		AsService()
}
