#!/bin/bash
service cron start

if [ $# -gt 0 ]; then
    exec "$@"
else
    echo "Starting the cron jobs"
    /app/cron-job.sh
    
    echo "Keeping the container alive during the tasks execution..."
    tail -f /app/logs/*.log
fi
