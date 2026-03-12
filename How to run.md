# How to Run

## Terminal 1 — Spring Boot (run from project root)

cd backend && export $(grep -v '^#' .env | xargs) && export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-17.0.18.8-hotspot" && /c/Users/X/AppData/Local/Temp/mvn_ext/apache-maven-3.9.6/bin/mvn spring-boot:run

## Terminal 2 — Next.js dashboard

cd dashboard && node node_modules/next/dist/bin/next dev -p 3002

## Account & Password

`admin@test.com` `AdminPass123!`
`business@test.com` `TestPass123!`
