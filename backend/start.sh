#!/bin/bash
# Spring Boot backend startup script
# Loads .env vars, sets JAVA_HOME, and runs Maven
cd "$(dirname "$0")"
set -a
# shellcheck disable=SC1091
source .env
set +a
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-17.0.18.8-hotspot"
exec /c/maven/apache-maven-3.9.6/bin/mvn spring-boot:run
