HOST_PORT=$1
if [ -z $1 ] 
then
    HOST_PORT=443
fi
DETACHED_MODE=$2
docker run -p $HOST_PORT:443 $DETACHED_MODE huedash:latest
