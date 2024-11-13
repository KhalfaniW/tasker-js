
npm run build > ./tmp/build.log 2>&1 & npm run server | tee ./tmp/server.log 2>&1 & wait

wait # Wait for all background processes to finish

# This code will execute after both build and server are done
echo "Build and server completed."
