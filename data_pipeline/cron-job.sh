#!/bin/bash
cd /app
mkdir -p logs data_temp # mandatory --> for logs and temp files
/usr/local/bin/python scripts/main.py >> /app/logs/main_pipeline.log 2>&1
