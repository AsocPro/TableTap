spacetime generate --lang typescript --out-dir client/src/module_bindings --project-path server

git checkout -p client/src/module_bindings/*.ts

cd server
spacetime publish tabletap --server localhost --delete-data



